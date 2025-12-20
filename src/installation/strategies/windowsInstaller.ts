/**
 * Windows installation strategy
 */

import { BaseInstallationStrategy } from './base';
import { InstallationStep, InstallationMethod, Prerequisite, Platform } from '../types';
import { spawn } from 'child_process';

export class WindowsInstaller extends BaseInstallationStrategy {
    platform = Platform.Windows;
    
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
        
        return steps;
    }
    
    async checkPrerequisites(): Promise<Prerequisite[]> {
        const prerequisites: Prerequisite[] = [];
        
        // Check for Visual C++ Redistributable
        const hasVCRedist = await this.checkVCRedistributable();
        prerequisites.push({
            name: 'Visual C++ Redistributable',
            checkCommand: 'reg query "HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64"',
            installCommand: 'Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe',
            isMet: hasVCRedist
        });
        
        // Check for WSL2 (alternative)
        prerequisites.push({
            name: 'WSL2 (Alternative)',
            checkCommand: 'wsl --status',
            installCommand: 'wsl --install',
            isMet: await this.commandExists('wsl')
        });
        
        return prerequisites;
    }
    
    private async checkVCRedistributable(): Promise<boolean> {
        return new Promise((resolve) => {
            const process = spawn('reg', [
                'query',
                'HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64',
                '/v',
                'Installed'
            ], { shell: true });
            
            const timeout = setTimeout(() => {
                process.kill();
                resolve(false);
            }, 3000);
            
            process.on('close', (code: number) => {
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
        return [
            {
                title: 'Install Visual C++ Redistributable',
                description: 'ORCA requires Visual C++ Redistributable. Download and install if not already present:',
                links: [
                    { text: 'Download VC++ Redistributable', url: 'https://aka.ms/vs/17/release/vc_redist.x64.exe' }
                ],
                isRequired: true
            },
            {
                title: 'Download ORCA',
                description: 'Download the latest ORCA release for Windows from the official forum (requires registration):',
                links: [
                    { text: 'ORCA Forum Downloads', url: 'https://orcaforum.kofo.mpg.de/' }
                ],
                isRequired: true
            },
            {
                title: 'Extract Archive',
                description: 'Extract the downloaded ZIP file to your preferred location:',
                commands: [
                    '# Example locations:',
                    'C:\\Program Files\\ORCA',
                    'C:\\orca',
                    '%USERPROFILE%\\orca'
                ],
                isRequired: true
            },
            {
                title: 'Verify Executable',
                description: 'Ensure orca.exe is present in the extracted directory:',
                commands: [
                    '# Check for orca.exe',
                    'dir "C:\\Program Files\\ORCA\\orca.exe"'
                ],
                isRequired: true
            }
        ];
    }
    
    private getPathConfigurationStep(): InstallationStep {
        return {
            title: 'Configure PATH (Optional)',
            description: 'Add ORCA to your system PATH for easier access:',
            commands: [
                '# Option 1: Using GUI',
                '# 1. Open System Properties → Advanced → Environment Variables',
                '# 2. Under "System variables", select "Path" and click "Edit"',
                '# 3. Click "New" and add: C:\\Program Files\\ORCA',
                '# 4. Click OK to save',
                '',
                '# Option 2: Using PowerShell (Run as Administrator):',
                '[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\\Program Files\\ORCA", "Machine")',
                '',
                '# Option 3: Using Command Prompt (Run as Administrator):',
                'setx /M PATH "%PATH%;C:\\Program Files\\ORCA"',
                '',
                '# Verify (open new terminal):',
                'where orca'
            ],
            isRequired: false
        };
    }
    
    getWSL2AlternativeSteps(): InstallationStep[] {
        return [
            {
                title: 'WSL2 Alternative (Recommended for Advanced Users)',
                description: 'For better performance and Unix compatibility, consider using WSL2:',
                isRequired: false
            },
            {
                title: 'Install WSL2',
                description: 'Install Windows Subsystem for Linux 2 if not already present:',
                commands: [
                    '# In PowerShell (Run as Administrator):',
                    'wsl --install',
                    '',
                    '# Or install specific distribution:',
                    'wsl --install -d Ubuntu-22.04'
                ],
                links: [
                    { text: 'WSL2 Installation Guide', url: 'https://learn.microsoft.com/en-us/windows/wsl/install' }
                ],
                isRequired: true
            },
            {
                title: 'Install ORCA in WSL2',
                description: 'Once WSL2 is set up, follow the Linux installation instructions inside your WSL2 terminal.',
                isRequired: true
            }
        ];
    }
}
