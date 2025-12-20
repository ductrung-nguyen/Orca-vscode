/**
 * ORCA installation detector
 * Scans system for ORCA installations across all OSes
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { OrcaInstallation, Platform } from './types';

export class OrcaDetector {
    private platform: Platform;
    
    constructor() {
        this.platform = os.platform() as Platform;
    }
    
    /**
     * Scan system for ORCA installations
     * @returns Array of detected installations, sorted by priority
     */
    async detectInstallations(): Promise<OrcaInstallation[]> {
        const installations: OrcaInstallation[] = [];
        
        // 1. Check user-configured path first (highest priority)
        const configuredPath = this.getConfiguredPath();
        if (configuredPath) {
            const installation = await this.validateBinary(configuredPath);
            if (installation) {
                installation.detectionSource = 'user-config';
                installations.push(installation);
            }
        }
        
        // 2. Check environment variables
        const envPaths = this.getEnvironmentPaths();
        for (const envPath of envPaths) {
            const installation = await this.validateBinary(envPath);
            if (installation && !this.isDuplicate(installations, installation)) {
                installation.detectionSource = 'environment-variable';
                installations.push(installation);
            }
        }
        
        // 3. Check PATH
        const pathInstallations = await this.checkPathVariable();
        for (const installation of pathInstallations) {
            if (!this.isDuplicate(installations, installation)) {
                installations.push(installation);
            }
        }
        
        // 4. Check standard directories
        const standardInstallations = await this.checkStandardDirectories();
        for (const installation of standardInstallations) {
            if (!this.isDuplicate(installations, installation)) {
                installations.push(installation);
            }
        }
        
        // 5. Check Conda environments
        const condaInstallations = await this.checkCondaEnvironments();
        for (const installation of condaInstallations) {
            if (!this.isDuplicate(installations, installation)) {
                installations.push(installation);
            }
        }
        
        // Sort by priority: valid > version (latest first) > path
        return this.sortInstallations(installations);
    }
    
    /**
     * Validate a specific ORCA binary path
     * @param binaryPath Absolute path to orca executable
     */
    async validateBinary(binaryPath: string): Promise<OrcaInstallation | null> {
        try {
            // Check if file exists
            if (!fs.existsSync(binaryPath)) {
                return null;
            }
            
            // Check if executable (Unix only)
            if (this.platform !== Platform.Windows) {
                try {
                    await fs.promises.access(binaryPath, fs.constants.X_OK);
                } catch {
                    return null;
                }
            }
            
            // Try to get version
            const version = await this.getVersion(binaryPath);
            
            return {
                path: binaryPath,
                version,
                isValid: true,
                detectionSource: 'unknown'
            };
        } catch (error) {
            return {
                path: binaryPath,
                version: 'unknown',
                isValid: false,
                validationError: (error as Error).message,
                detectionSource: 'unknown'
            };
        }
    }
    
    /**
     * Get ORCA version by running bare command
     */
    private async getVersion(binaryPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const process = spawn(binaryPath, [], { shell: false });
            let stderr = '';
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                reject(new Error('Version check timeout (5 seconds)'));
            }, 5000);
            
            process.on('close', () => {
                clearTimeout(timeout);
                
                // Parse version from stderr banner
                const versionMatch = stderr.match(/Program Version (\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    resolve(versionMatch[1]);
                } else {
                    // Try alternative version patterns
                    const altMatch = stderr.match(/Version\s+(\d+\.\d+\.\d+)/i);
                    if (altMatch) {
                        resolve(altMatch[1]);
                    } else {
                        reject(new Error('Could not parse ORCA version from output'));
                    }
                }
            });
            
            process.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    
    /**
     * Get configured binary path from settings
     */
    private getConfiguredPath(): string | undefined {
        const config = vscode.workspace.getConfiguration('orca');
        const binaryPath = config.get<string>('binaryPath');
        
        // Ignore default placeholder paths
        if (binaryPath && 
            binaryPath !== '/opt/orca/orca' && 
            binaryPath !== 'orca' &&
            binaryPath.trim() !== '') {
            return binaryPath;
        }
        
        return undefined;
    }
    
    /**
     * Get paths from environment variables
     */
    private getEnvironmentPaths(): string[] {
        const paths: string[] = [];
        
        // Check ORCA-specific environment variables
        const orcaPath = process.env.ORCA_PATH;
        const orcaHome = process.env.ORCA_HOME;
        
        if (orcaPath) {
            paths.push(path.join(orcaPath, 'orca'));
        }
        
        if (orcaHome) {
            paths.push(path.join(orcaHome, 'orca'));
            paths.push(path.join(orcaHome, 'bin', 'orca'));
        }
        
        return paths.filter(p => fs.existsSync(p));
    }
    
    /**
     * Search PATH environment variable for orca
     */
    private async checkPathVariable(): Promise<OrcaInstallation[]> {
        return new Promise((resolve) => {
            const command = this.platform === Platform.Windows ? 'where' : 'which';
            const process = spawn(command, ['orca'], { shell: true });
            let stdout = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve([]);
            }, 2000);
            
            process.on('close', async (code) => {
                clearTimeout(timeout);
                
                if (code === 0 && stdout.trim()) {
                    const paths = stdout.trim().split('\n').map(p => p.trim());
                    const installations: OrcaInstallation[] = [];
                    
                    for (const binPath of paths) {
                        const installation = await this.validateBinary(binPath);
                        if (installation) {
                            installation.detectionSource = 'PATH';
                            installations.push(installation);
                        }
                    }
                    
                    resolve(installations);
                } else {
                    resolve([]);
                }
            });
            
            process.on('error', () => {
                clearTimeout(timeout);
                resolve([]);
            });
        });
    }
    
    /**
     * Check OS-specific standard installation directories
     */
    private async checkStandardDirectories(): Promise<OrcaInstallation[]> {
        const dirs = this.getStandardDirectories();
        const installations: OrcaInstallation[] = [];
        
        for (const dir of dirs) {
            if (fs.existsSync(dir)) {
                const installation = await this.validateBinary(dir);
                if (installation) {
                    installation.detectionSource = 'standard-directory';
                    installations.push(installation);
                }
            }
        }
        
        return installations;
    }
    
    /**
     * Get standard directories based on OS
     */
    private getStandardDirectories(): string[] {
        const homeDir = os.homedir();
        
        switch (this.platform) {
            case Platform.Linux:
                return [
                    '/opt/orca/orca',
                    '/usr/local/orca/orca',
                    '/usr/bin/orca',
                    path.join(homeDir, 'orca', 'orca'),
                    path.join(homeDir, '.local', 'bin', 'orca'),
                    path.join(homeDir, 'bin', 'orca')
                ];
                
            case Platform.MacOS:
                return [
                    '/usr/local/bin/orca',
                    '/opt/homebrew/bin/orca',
                    path.join(homeDir, 'Applications', 'orca', 'orca'),
                    path.join(homeDir, 'orca', 'orca'),
                    '/Applications/orca/orca'
                ];
                
            case Platform.Windows:
                return [
                    'C:\\Program Files\\ORCA\\orca.exe',
                    'C:\\orca\\orca.exe',
                    path.join(homeDir, 'orca', 'orca.exe'),
                    path.join(homeDir, 'AppData', 'Local', 'orca', 'orca.exe')
                ];
                
            default:
                return [];
        }
    }
    
    /**
     * Check Conda environments for ORCA
     */
    private async checkCondaEnvironments(): Promise<OrcaInstallation[]> {
        return new Promise((resolve) => {
            // Check if conda is available
            const process = spawn('conda', ['list', 'orca'], { shell: true });
            let stdout = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve([]);
            }, 5000);
            
            process.on('close', async (code) => {
                clearTimeout(timeout);
                
                if (code === 0 && stdout.includes('orca')) {
                    // ORCA found in conda, try to locate binary
                    const condaPaths = await this.getCondaBinaryPaths();
                    const installations: OrcaInstallation[] = [];
                    
                    for (const binPath of condaPaths) {
                        const installation = await this.validateBinary(binPath);
                        if (installation) {
                            installation.detectionSource = 'conda';
                            installations.push(installation);
                        }
                    }
                    
                    resolve(installations);
                } else {
                    resolve([]);
                }
            });
            
            process.on('error', () => {
                clearTimeout(timeout);
                resolve([]);
            });
        });
    }
    
    /**
     * Get possible Conda binary paths
     */
    private async getCondaBinaryPaths(): Promise<string[]> {
        return new Promise((resolve) => {
            const process = spawn('conda', ['info', '--base'], { shell: true });
            let stdout = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve([]);
            }, 3000);
            
            process.on('close', (code) => {
                clearTimeout(timeout);
                
                if (code === 0 && stdout.trim()) {
                    const condaBase = stdout.trim();
                    const paths = [
                        path.join(condaBase, 'bin', 'orca'),
                        path.join(condaBase, 'envs', 'base', 'bin', 'orca')
                    ];
                    resolve(paths.filter(p => fs.existsSync(p)));
                } else {
                    resolve([]);
                }
            });
            
            process.on('error', () => {
                clearTimeout(timeout);
                resolve([]);
            });
        });
    }
    
    /**
     * Check if installation is a duplicate
     */
    private isDuplicate(installations: OrcaInstallation[], newInstall: OrcaInstallation): boolean {
        return installations.some(inst => {
            // Resolve to real path to handle symlinks
            try {
                const realPath1 = fs.realpathSync(inst.path);
                const realPath2 = fs.realpathSync(newInstall.path);
                return realPath1 === realPath2;
            } catch {
                return inst.path === newInstall.path;
            }
        });
    }
    
    /**
     * Sort installations by priority
     */
    private sortInstallations(installations: OrcaInstallation[]): OrcaInstallation[] {
        return installations.sort((a, b) => {
            // Valid installations first
            if (a.isValid !== b.isValid) {
                return a.isValid ? -1 : 1;
            }
            
            // Then by version (latest first)
            if (a.version !== b.version && a.version !== 'unknown' && b.version !== 'unknown') {
                return this.compareVersions(b.version, a.version);
            }
            
            // Finally by detection source priority
            const sourcePriority: {[key: string]: number} = {
                'user-config': 0,
                'environment-variable': 1,
                'PATH': 2,
                'conda': 3,
                'standard-directory': 4,
                'unknown': 5
            };
            
            const aPriority = sourcePriority[a.detectionSource || 'unknown'];
            const bPriority = sourcePriority[b.detectionSource || 'unknown'];
            
            return aPriority - bPriority;
        });
    }
    
    /**
     * Compare version strings (returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2)
     */
    private compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 !== part2) {
                return part1 > part2 ? 1 : -1;
            }
        }
        
        return 0;
    }
}
