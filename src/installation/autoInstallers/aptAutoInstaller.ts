/**
 * Apt Auto-Installer for ORCA
 * Implements automated ORCA installation via apt (Debian/Ubuntu Linux)
 * Handles sudo prompts via integrated terminal
 */

import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import { BaseAutoInstaller } from './baseAutoInstaller';
import { Platform, AutoInstallResult, ProgressCallback } from '../types';
import { InstallationErrorHandler } from '../installationError';

export class AptAutoInstaller extends BaseAutoInstaller {
    private terminal: vscode.Terminal | null = null;
    
    constructor() {
        super(os.platform() as Platform);
    }
    
    /**
     * Check if sudo is required (apt always requires sudo)
     */
    requiresSudo(): boolean {
        return true;
    }
    
    /**
     * Check if apt is available
     */
    async canInstall(): Promise<boolean> {
        // Check if Linux
        if (os.platform() !== 'linux') {
            return false;
        }
        
        // Check if apt is available
        return this.commandExists('apt');
    }
    
    /**
     * Get estimated installation time in seconds
     */
    getEstimatedTime(): number {
        return 600; // 10 minutes (apt can be slower due to package compilation)
    }
    
    /**
     * Install ORCA via apt with sudo handling
     */
    async install(onProgress?: ProgressCallback): Promise<AutoInstallResult> {
        const startTime = Date.now();
        
        try {
            // Check if apt is available
            if (!await this.canInstall()) {
                throw new Error('apt is not available on this system');
            }
            
            // Report start
            onProgress?.(0, 'Starting apt installation...');
            
            // Check if orca is available in repositories
            onProgress?.(5, 'Searching for ORCA package...');
            const isAvailable = await this.checkPackageAvailability();
            
            if (!isAvailable) {
                throw new Error(
                    'ORCA is not available in your apt repositories. ' +
                    'You may need to add a PPA or install manually from ORCA forum.'
                );
            }
            
            // For apt, we need sudo privileges
            // Use integrated terminal for interactive sudo prompt
            onProgress?.(10, 'Opening terminal for sudo authentication...');
            
            const binaryPath = await this.installViaTerminal(onProgress);
            
            if (!binaryPath) {
                throw new Error('Installation completed but ORCA binary not found');
            }
            
            // Get version
            const versionResult = await this.executeCommand(binaryPath, ['--version']);
            const version = versionResult.stdout.trim() || 'unknown';
            
            onProgress?.(100, 'Installation complete!');
            
            const duration = Math.floor((Date.now() - startTime) / 1000);
            
            return {
                success: true,
                binaryPath,
                version,
                duration
            };
            
        } catch (error) {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            const installError = InstallationErrorHandler.parseError(error, 'sudo apt install orca');
            
            return {
                success: false,
                error: installError.message,
                duration
            };
        } finally {
            // Clean up terminal
            if (this.terminal) {
                // Don't dispose immediately, give user chance to see output
                setTimeout(() => {
                    this.terminal?.dispose();
                    this.terminal = null;
                }, 5000);
            }
        }
    }
    
    /**
     * Check if ORCA package is available in apt repositories
     */
    private async checkPackageAvailability(): Promise<boolean> {
        try {
            const result = await this.executeCommand('apt-cache', ['search', 'orca']);
            // Look for ORCA quantum chemistry (not GNOME Orca screen reader)
            const output = result.stdout.toLowerCase();
            return output.includes('orca') && 
                   (output.includes('quantum') || 
                    output.includes('chemistry'));
        } catch {
            return false;
        }
    }
    
    /**
     * Install via integrated terminal (handles sudo interactively)
     */
    private async installViaTerminal(onProgress?: ProgressCallback): Promise<string | null> {
        return new Promise((resolve, reject) => {
            // Create terminal
            this.terminal = vscode.window.createTerminal({
                name: 'ORCA Installation',
                hideFromUser: false
            });
            
            this.terminal.show();
            
            // Update repositories first
            onProgress?.(15, 'Updating package lists (requires sudo)...');
            this.terminal.sendText('sudo apt update');
            
            // Wait for update to complete (user must enter password)
            setTimeout(() => {
                // Install ORCA
                onProgress?.(40, 'Installing ORCA (requires sudo)...');
                this.terminal?.sendText('sudo apt install -y orca');
                
                // Monitor installation progress
                let checkCount = 0;
                const maxChecks = 120; // 10 minutes max
                
                const checkInterval = setInterval(async () => {
                    checkCount++;
                    
                    // Update progress
                    const progress = 40 + Math.floor((checkCount / maxChecks) * 50);
                    onProgress?.(progress, 'Installing packages...');
                    
                    // Check if installation completed
                    const binaryPath = await this.findBinaryPath();
                    if (binaryPath) {
                        clearInterval(checkInterval);
                        onProgress?.(90, 'Verifying installation...');
                        resolve(binaryPath);
                        return;
                    }
                    
                    // Timeout
                    if (checkCount >= maxChecks) {
                        clearInterval(checkInterval);
                        reject(new Error('Installation timed out after 10 minutes'));
                    }
                }, 5000); // Check every 5 seconds
                
            }, 10000); // Wait 10 seconds for sudo authentication
        });
    }
    
    /**
     * Alternative: Non-interactive installation (requires passwordless sudo)
     * This is kept as a fallback but not recommended for security reasons
     */
    private async installNonInteractive(onProgress?: ProgressCallback): Promise<string | null> {
        try {
            // Update apt cache
            onProgress?.(10, 'Updating package lists...');
            const updateResult = await this.executeCommand('sudo', ['apt', 'update']);
            if (updateResult.exitCode !== 0) {
                throw new Error('Failed to update package lists');
            }
            
            // Install ORCA
            onProgress?.(30, 'Installing ORCA...');
            const installResult = await this.executeCommand('sudo', ['apt', 'install', '-y', 'orca']);
            if (installResult.exitCode !== 0) {
                throw new Error(installResult.stderr || 'Installation failed');
            }
            
            onProgress?.(80, 'Installation complete, locating binary...');
            
            // Find binary
            const binaryPath = await this.findBinaryPath();
            return binaryPath;
            
        } catch (error) {
            throw new Error(`Non-interactive installation failed: ${(error as Error).message}`);
        }
    }
    
    /**
     * Find ORCA binary path after installation
     */
    private async findBinaryPath(): Promise<string | null> {
        try {
            // Try to find orca via which
            const result = await this.executeCommand('which', ['orca']);
            if (result.exitCode === 0) {
                const path = result.stdout.trim();
                if (path && fs.existsSync(path)) {
                    return path;
                }
            }
            
            // Check common Linux locations
            const linuxPaths = [
                '/usr/bin/orca',
                '/usr/local/bin/orca',
                '/opt/orca/orca'
            ];
            
            for (const path of linuxPaths) {
                if (fs.existsSync(path)) {
                    return path;
                }
            }
            
            return null;
        } catch {
            return null;
        }
    }
    

    
    /**
     * Check if ORCA is already installed via apt
     */
    async isInstalled(): Promise<boolean> {
        try {
            const result = await this.executeCommand('dpkg', ['-l', 'orca']);
            return result.exitCode === 0 && result.stdout.includes('ii  orca');
        } catch {
            return false;
        }
    }
}
