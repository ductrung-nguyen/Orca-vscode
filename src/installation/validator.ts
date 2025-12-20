/**
 * ORCA installation validator
 * Performs comprehensive validation of ORCA installations
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import { ValidationResult, Platform } from './types';

export class OrcaValidator {
    private context: vscode.ExtensionContext;
    private platform: Platform;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.platform = os.platform() as Platform;
    }
    
    /**
     * Comprehensive installation health check
     * @param binaryPath Absolute path to ORCA binary
     * @returns Detailed validation results
     */
    async validateInstallation(binaryPath: string): Promise<ValidationResult> {
        const result: ValidationResult = {
            success: false,
            errors: [],
            warnings: []
        };
        
        // 1. Check binary exists and is executable
        if (!await this.checkBinaryExists(binaryPath)) {
            result.errors.push(`ORCA binary not found at: ${binaryPath}`);
            return result;
        }
        
        if (!await this.checkBinaryExecutable(binaryPath)) {
            result.errors.push(`ORCA binary is not executable: ${binaryPath}`);
            if (this.platform !== Platform.Windows) {
                result.errors.push(`Try running: chmod +x ${binaryPath}`);
            }
            return result;
        }
        
        // 2. Get version information
        let version: string;
        try {
            version = await this.getVersion(binaryPath);
        } catch (error) {
            result.errors.push(`Failed to get ORCA version: ${(error as Error).message}`);
            return result;
        }
        
        // 3. Check dependencies (non-blocking)
        const dependencies = await this.checkDependencies(binaryPath);
        const missingDeps = Object.entries(dependencies)
            .filter(([_, isMet]) => !isMet)
            .map(([name, _]) => name);
        
        if (missingDeps.length > 0) {
            result.warnings.push(`Missing optional dependencies: ${missingDeps.join(', ')}`);
            result.warnings.push('ORCA may still work but with limited functionality');
        }
        
        // 4. Run test job (most comprehensive check)
        let testJobPassed = false;
        let testJobOutput = '';
        
        try {
            const testResult = await this.runTestJob(binaryPath);
            testJobPassed = testResult.success;
            testJobOutput = testResult.output;
            
            if (!testJobPassed) {
                result.errors.push('Test job execution failed');
                result.errors.push('Output: ' + testResult.output.substring(0, 500));
            }
        } catch (error) {
            result.errors.push(`Test job execution error: ${(error as Error).message}`);
        }
        
        // 5. Build final result
        result.success = result.errors.length === 0 && testJobPassed;
        
        if (result.success) {
            result.installationDetails = {
                version,
                architecture: os.arch(),
                dependencies,
                testJobPassed,
                testJobOutput: testJobOutput.substring(0, 1000) // Truncate
            };
        }
        
        return result;
    }
    
    /**
     * Quick validation (no test job)
     */
    async quickValidate(binaryPath: string): Promise<ValidationResult> {
        const result: ValidationResult = {
            success: false,
            errors: [],
            warnings: []
        };
        
        if (!await this.checkBinaryExists(binaryPath)) {
            result.errors.push(`ORCA binary not found at: ${binaryPath}`);
            return result;
        }
        
        if (!await this.checkBinaryExecutable(binaryPath)) {
            result.errors.push(`ORCA binary is not executable: ${binaryPath}`);
            return result;
        }
        
        try {
            const version = await this.getVersion(binaryPath);
            result.success = true;
            result.installationDetails = {
                version,
                architecture: os.arch(),
                dependencies: {},
                testJobPassed: false
            };
        } catch (error) {
            result.errors.push(`Failed to get ORCA version: ${(error as Error).message}`);
        }
        
        return result;
    }
    
    /**
     * Check if binary file exists
     */
    private async checkBinaryExists(binaryPath: string): Promise<boolean> {
        try {
            await fs.promises.access(binaryPath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Check if binary is executable
     */
    private async checkBinaryExecutable(binaryPath: string): Promise<boolean> {
        if (this.platform === Platform.Windows) {
            // On Windows, just check if file exists
            return this.checkBinaryExists(binaryPath);
        }
        
        try {
            await fs.promises.access(binaryPath, fs.constants.X_OK);
            return true;
        } catch {
            return false;
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
                    reject(new Error('Could not parse ORCA version from output'));
                }
            });
            
            process.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    
    /**
     * Run minimal test job to verify functionality
     */
    private async runTestJob(binaryPath: string): Promise<{success: boolean, output: string}> {
        // Create test directory in extension storage
        const testDir = path.join(this.context.globalStorageUri.fsPath, 'test-jobs');
        await fs.promises.mkdir(testDir, { recursive: true });
        
        // Create minimal test input file (single point energy of hydrogen atom)
        const testInputPath = path.join(testDir, 'test.inp');
        const testInput = `# Minimal test job for validation
! HF STO-3G

* xyz 0 1
H 0.0 0.0 0.0
*
`;
        
        await fs.promises.writeFile(testInputPath, testInput);
        
        return new Promise((resolve) => {
            const process = spawn(binaryPath, [testInputPath], {
                cwd: testDir,
                shell: false
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            // Timeout after 30 seconds
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve({
                    success: false,
                    output: 'Test job timeout (30 seconds)'
                });
            }, 30000);
            
            process.on('close', async (_code) => {
                clearTimeout(timeout);
                
                // Clean up test files
                try {
                    await fs.promises.rm(testDir, { recursive: true, force: true });
                } catch {
                    // Ignore cleanup errors
                }
                
                const output = stdout + stderr;
                
                // Check for successful execution markers
                const success = output.includes('ORCA TERMINATED NORMALLY') || 
                               output.includes('HURRAY');
                
                resolve({
                    success,
                    output
                });
            });
            
            process.on('error', async (error) => {
                clearTimeout(timeout);
                
                // Clean up
                try {
                    await fs.promises.rm(testDir, { recursive: true, force: true });
                } catch {
                    // Ignore cleanup errors
                }
                
                resolve({
                    success: false,
                    output: `Process error: ${error.message}`
                });
            });
        });
    }
    
    /**
     * Check for optional dependencies
     */
    private async checkDependencies(_binaryPath: string): Promise<{[key: string]: boolean}> {
        const dependencies: {[key: string]: boolean} = {};
        
        // Check for common dependencies based on platform
        if (this.platform !== Platform.Windows) {
            // Check for OpenMPI
            dependencies['openmpi'] = await this.checkCommand('mpirun --version');
            
            // Check for common libraries (Linux only)
            if (this.platform === Platform.Linux) {
                dependencies['libstdc++'] = await this.checkLibrary('libstdc++.so.6');
                dependencies['libgomp'] = await this.checkLibrary('libgomp.so.1');
            }
        }
        
        return dependencies;
    }
    
    /**
     * Check if a command exists
     */
    private async checkCommand(command: string): Promise<boolean> {
        return new Promise((resolve) => {
            const process = spawn(command, { shell: true });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve(false);
            }, 2000);
            
            process.on('close', (code) => {
                clearTimeout(timeout);
                resolve(code === 0);
            });
            
            process.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }
    
    /**
     * Check if a library exists (Linux only)
     */
    private async checkLibrary(libName: string): Promise<boolean> {
        if (this.platform !== Platform.Linux) {
            return false;
        }
        
        return new Promise((resolve) => {
            const process = spawn('ldconfig', ['-p'], { shell: true });
            let stdout = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve(false);
            }, 2000);
            
            process.on('close', () => {
                clearTimeout(timeout);
                resolve(stdout.includes(libName));
            });
            
            process.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }
}
