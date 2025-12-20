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
        
        // 3. Check Conda environments EARLY (before PATH to avoid system orca conflicts)
        const condaInstallations = await this.checkCondaEnvironments();
        for (const installation of condaInstallations) {
            if (!this.isDuplicate(installations, installation)) {
                installations.push(installation);
            }
        }
        
        // 4. Check standard directories (skip known false positives)
        const standardInstallations = await this.checkStandardDirectories();
        for (const installation of standardInstallations) {
            if (!this.isDuplicate(installations, installation)) {
                installations.push(installation);
            }
        }
        
        // 5. Check PATH last (may contain GNOME Orca or other false positives)
        const pathInstallations = await this.checkPathVariable();
        for (const installation of pathInstallations) {
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
     * Check if a file is likely the GNOME Orca screen reader (without executing it)
     * This prevents triggering the screen reader during detection
     */
    private isLikelyScreenReader(binaryPath: string): boolean {
        // Known screen reader locations
        if (binaryPath === '/usr/bin/orca' || binaryPath === '/usr/local/bin/orca') {
            // Check if it's a Python script (GNOME Orca) vs binary (ORCA chemistry)
            try {
                const content = fs.readFileSync(binaryPath, 'utf-8').slice(0, 1000);
                // GNOME Orca starts with #!/usr/bin/python and imports gnome/orca modules
                if (content.includes('python') && 
                    (content.includes('import orca') || 
                     content.includes('from orca') || 
                     content.includes('screen reader') ||
                     content.includes('GNOME') ||
                     content.includes('pyatspi'))) {
                    return true;
                }
            } catch {
                // If we can't read it as text, it's likely a binary - proceed with caution
            }
        }
        return false;
    }

    /**
     * Get ORCA version by running bare command
     */
    private async getVersion(binaryPath: string): Promise<string> {
        // First, check if this is the wrong orca (GNOME screen reader) - don't run it!
        if (this.isLikelyScreenReader(binaryPath)) {
            throw new Error('This appears to be GNOME Orca screen reader, not ORCA computational chemistry software');
        }
        
        return new Promise((resolve, reject) => {
            const process = spawn(binaryPath, [], { shell: false });
            let stderr = '';
            let stdout = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
                // If we see the version banner, kill the process early
                if (stderr.includes('Program Version') || stderr.includes('ORCA')) {
                    process.kill('SIGTERM');
                }
            });
            
            // Send EOF to stdin to make programs that wait for input exit
            process.stdin.end();
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                reject(new Error('Version check timeout - this may not be ORCA computational chemistry software'));
            }, 5000);
            
            process.on('close', () => {
                clearTimeout(timeout);
                
                const combined = stderr + stdout;
                
                // Parse version from stderr banner
                const versionMatch = combined.match(/Program Version (\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    resolve(versionMatch[1]);
                } else {
                    // Try alternative version patterns
                    const altMatch = combined.match(/Version\s+(\d+\.\d+\.\d+)/i);
                    if (altMatch) {
                        resolve(altMatch[1]);
                    } else {
                        reject(new Error('Not ORCA computational chemistry software (no version banner found)'));
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
                        // Skip paths that are likely the GNOME screen reader
                        if (this.isLikelyScreenReader(binPath)) {
                            console.log(`Skipping ${binPath} - appears to be GNOME Orca screen reader`);
                            continue;
                        }
                        
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
                    '/usr/local/bin/orca',
                    // Note: /usr/bin/orca is intentionally excluded as it's usually GNOME Orca screen reader
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
        const installations: OrcaInstallation[] = [];
        
        // First, try to get all conda binary paths
        const condaPaths = await this.getCondaBinaryPaths();
        
        for (const binPath of condaPaths) {
            const installation = await this.validateBinary(binPath);
            if (installation) {
                installation.detectionSource = 'conda';
                installations.push(installation);
            }
        }
        
        return installations;
    }
    
    /**
     * Get possible Conda binary paths
     */
    private async getCondaBinaryPaths(): Promise<string[]> {
        const paths: string[] = [];
        
        // 1. Check CONDA_PREFIX (current active environment)
        const condaPrefix = process.env.CONDA_PREFIX;
        if (condaPrefix) {
            const currentEnvOrca = path.join(condaPrefix, 'bin', 'orca');
            if (fs.existsSync(currentEnvOrca)) {
                paths.push(currentEnvOrca);
            }
        }
        
        // 2. Check conda base and all environments
        try {
            const condaInfo = await this.getCondaInfo();
            if (condaInfo.condaBase) {
                // Check base environment
                const baseOrca = path.join(condaInfo.condaBase, 'bin', 'orca');
                if (fs.existsSync(baseOrca) && !paths.includes(baseOrca)) {
                    paths.push(baseOrca);
                }
            }
            
            // Check all environments
            for (const envPath of condaInfo.envPaths) {
                const envOrca = path.join(envPath, 'bin', 'orca');
                if (fs.existsSync(envOrca) && !paths.includes(envOrca)) {
                    paths.push(envOrca);
                }
            }
        } catch {
            // Conda not available or error getting info
        }
        
        // 3. Check common Conda locations as fallback
        const homeDir = os.homedir();
        const commonCondaPaths = [
            path.join(homeDir, 'miniconda3', 'bin', 'orca'),
            path.join(homeDir, 'anaconda3', 'bin', 'orca'),
            path.join(homeDir, 'miniforge3', 'bin', 'orca'),
            path.join(homeDir, 'mambaforge', 'bin', 'orca'),
            path.join(homeDir, '.conda', 'bin', 'orca'),
            '/opt/conda/bin/orca',
            '/opt/miniconda3/bin/orca',
            '/opt/anaconda3/bin/orca'
        ];
        
        for (const p of commonCondaPaths) {
            if (fs.existsSync(p) && !paths.includes(p)) {
                paths.push(p);
            }
        }
        
        return paths;
    }
    
    /**
     * Get Conda info (base path and environment paths)
     */
    private async getCondaInfo(): Promise<{ condaBase: string | null; envPaths: string[] }> {
        return new Promise((resolve) => {
            const process = spawn('conda', ['info', '--json'], { shell: true });
            let stdout = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve({ condaBase: null, envPaths: [] });
            }, 5000);
            
            process.on('close', (code) => {
                clearTimeout(timeout);
                
                if (code === 0 && stdout.trim()) {
                    try {
                        const info = JSON.parse(stdout);
                        resolve({
                            condaBase: info.root_prefix || info.conda_prefix || null,
                            envPaths: info.envs || []
                        });
                    } catch {
                        resolve({ condaBase: null, envPaths: [] });
                    }
                } else {
                    resolve({ condaBase: null, envPaths: [] });
                }
            });
            
            process.on('error', () => {
                clearTimeout(timeout);
                resolve({ condaBase: null, envPaths: [] });
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
