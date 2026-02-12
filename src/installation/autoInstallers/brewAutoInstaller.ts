/**
 * Homebrew Auto-Installer for ORCA
 * Implements automated ORCA installation via Homebrew (macOS)
 */

import * as os from 'os';
import * as fs from 'fs';
import { BaseAutoInstaller } from './baseAutoInstaller';
import { Platform, AutoInstallResult, ProgressCallback } from '../types';
import { InstallationErrorHandler } from '../installationError';

export class BrewAutoInstaller extends BaseAutoInstaller {
    constructor() {
        super(os.platform() as Platform);
    }

    /**
     * Check if sudo is required (Homebrew typically doesn't need sudo)
     */
    requiresSudo(): boolean {
        return false;
    }
    
    /**
     * Check if Homebrew is available
     */
    async canInstall(): Promise<boolean> {
        // Check if macOS
        if (os.platform() !== 'darwin') {
            return false;
        }
        
        // Check if brew is in PATH
        return this.commandExists('brew');
    }
    
    /**
     * Get estimated installation time in seconds
     */
    getEstimatedTime(): number {
        return 300; // 5 minutes (Homebrew installs pre-compiled binaries, usually faster than Conda)
    }
    
    /**
     * Install ORCA via Homebrew
     */
    async install(onProgress?: ProgressCallback): Promise<AutoInstallResult> {
        const startTime = Date.now();
        
        try {
            // Check if Homebrew is available
            if (!await this.canInstall()) {
                throw new Error('Homebrew is not available on this system');
            }
            
            // Report start
            onProgress?.(0, 'Starting Homebrew installation...');
            
            // Check if orca/orca tap exists (community formula)
            // Note: ORCA may not be in official Homebrew core, might need custom tap
            onProgress?.(5, 'Checking Homebrew repositories...');
            
            // Update Homebrew
            onProgress?.(10, 'Updating Homebrew...');
            const updateResult = await this.executeCommand('brew', ['update']);
            if (updateResult.exitCode !== 0) {
                throw new Error('Failed to update Homebrew');
            }
            
            // Install ORCA
            onProgress?.(30, 'Installing ORCA (this may take several minutes)...');
            const installResult = await this.executeCommand('brew', ['install', 'orca', '--force']);
            if (installResult.exitCode !== 0) {
                throw new Error(installResult.stderr || 'Installation failed');
            }
            
            onProgress?.(80, 'Installation complete, locating binary...');
            
            // Verify installation
            onProgress?.(90, 'Verifying installation...');
            const binaryPath = await this.findBinaryPath();
            
            if (!binaryPath) {
                throw new Error('ORCA installation completed but binary not found');
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
            const installError = InstallationErrorHandler.parseError(error, 'brew install orca');
            
            return {
                success: false,
                error: installError.message,
                duration
            };
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
            
            // Check common Homebrew locations
            const brewPaths = [
                '/opt/homebrew/bin/orca',  // Apple Silicon
                '/usr/local/bin/orca',      // Intel Mac
                '/opt/homebrew/opt/orca/bin/orca',
                '/usr/local/opt/orca/bin/orca'
            ];
            
            for (const path of brewPaths) {
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
     * Check if ORCA is already installed via Homebrew
     */
    async isInstalled(): Promise<boolean> {
        try {
            const result = await this.executeCommand('brew', ['list', 'orca']);
            return result.exitCode === 0 && result.stdout.includes('orca');
        } catch {
            return false;
        }
    }
}
