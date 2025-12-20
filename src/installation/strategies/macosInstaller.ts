/**
 * macOS installation strategy
 */

import { spawn } from 'child_process';
import * as os from 'os';
import { BaseInstallationStrategy } from './base';
import { InstallationStep, InstallationMethod, Prerequisite, Platform } from '../types';

export class MacOSInstaller extends BaseInstallationStrategy {
    platform = Platform.MacOS;
    private isAppleSilicon: boolean;
    
    constructor() {
        super();
        this.isAppleSilicon = os.arch() === 'arm64';
    }
    
    getSupportedMethods(): InstallationMethod[] {
        return [InstallationMethod.Conda, InstallationMethod.Manual];
    }
    
    getRecommendedMethod(): InstallationMethod {
        return InstallationMethod.Conda;
    }
    
    getInstallationSteps(method: InstallationMethod): InstallationStep[] {
        const steps: InstallationStep[] = [this.getLicenseAcknowledgment()];
        
        switch (method) {
            case InstallationMethod.Conda:
                steps.push(...this.getCondaSteps());
                break;
                
            case InstallationMethod.Manual:
                steps.push(...this.getManualSteps());
                break;
        }
        
        steps.push(this.getPathConfigurationStep());
        steps.push(this.getGatekeeperWorkaroundStep());
        
        return steps;
    }
    
    async checkPrerequisites(): Promise<Prerequisite[]> {
        const prerequisites: Prerequisite[] = [];
        
        // Check for Homebrew (useful but not required)
        prerequisites.push({
            name: 'Homebrew',
            checkCommand: 'brew --version',
            installCommand: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
            isMet: await this.commandExists('brew')
        });
        
        // Check for Xcode Command Line Tools
        const hasXcode = await this.checkXcodeTools();
        prerequisites.push({
            name: 'Xcode Command Line Tools',
            checkCommand: 'xcode-select -p',
            installCommand: 'xcode-select --install',
            isMet: hasXcode
        });
        
        // Check for OpenMPI (optional)
        prerequisites.push({
            name: 'OpenMPI',
            checkCommand: 'mpirun --version',
            installCommand: 'brew install open-mpi',
            isMet: await this.commandExists('mpirun')
        });
        
        return prerequisites;
    }
    
    private async checkXcodeTools(): Promise<boolean> {
        return new Promise((resolve) => {
            const process = spawn('xcode-select', ['-p'], { shell: false });
            
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
    
    private getManualSteps(): InstallationStep[] {
        const archNote = this.isAppleSilicon 
            ? '**Note**: You are running Apple Silicon (M1/M2/M3). Make sure to download the ARM64 version if available, or use Rosetta 2 for x86_64 binaries.'
            : '**Note**: You are running Intel architecture. Download the x86_64 version.';
        
        return [
            {
                title: 'System Architecture',
                description: archNote,
                isRequired: true
            },
            {
                title: 'Download ORCA',
                description: 'Download the latest ORCA release for macOS from the official forum (requires registration):',
                links: [
                    { text: 'ORCA Forum Downloads', url: 'https://orcaforum.kofo.mpg.de/' }
                ],
                isRequired: true
            },
            {
                title: 'Extract Archive',
                description: 'Extract the downloaded archive to your preferred location:',
                commands: [
                    '# Example for ORCA 5.0.4',
                    'tar -xvf orca_5_0_4_macos_x86-64.tar.xz',
                    'sudo mv orca_5_0_4_macos_x86-64 /usr/local/orca',
                    '# Or install to your home directory:',
                    'mv orca_5_0_4_macos_x86-64 ~/orca'
                ],
                isRequired: true
            },
            {
                title: 'Set Permissions',
                description: 'Make the ORCA binary executable:',
                commands: [
                    'chmod +x /usr/local/orca/orca',
                    '# Or if installed to home directory:',
                    'chmod +x ~/orca/orca'
                ],
                isRequired: true
            }
        ];
    }
    
    private getPathConfigurationStep(): InstallationStep {
        const shell = process.env.SHELL?.includes('zsh') ? 'zsh' : 'bash';
        const rcFile = shell === 'zsh' ? '~/.zshrc' : '~/.bash_profile';
        
        return {
            title: 'Configure PATH (Optional)',
            description: `Add ORCA to your PATH for easier access. Your default shell is ${shell}:`,
            commands: [
                `# Add to ${rcFile}:`,
                `echo "export PATH=/usr/local/orca:$PATH" >> ${rcFile}`,
                `source ${rcFile}`,
                '',
                '# Verify:',
                'which orca'
            ],
            isRequired: false
        };
    }
    
    private getGatekeeperWorkaroundStep(): InstallationStep {
        return {
            title: 'macOS Gatekeeper Workaround',
            description: `If macOS prevents ORCA from running due to security restrictions:`,
            commands: [
                '# Remove quarantine attribute:',
                'xattr -dr com.apple.quarantine /usr/local/orca',
                '',
                '# Or allow in System Preferences:',
                '# System Preferences → Security & Privacy → General',
                '# Click "Allow Anyway" when the warning appears'
            ],
            isRequired: false
        };
    }
}
