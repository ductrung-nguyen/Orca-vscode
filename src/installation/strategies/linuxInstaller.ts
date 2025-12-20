/**
 * Linux installation strategy
 */

import * as fs from 'fs';
import { BaseInstallationStrategy } from './base';
import { InstallationStep, InstallationMethod, Prerequisite, Platform } from '../types';

export class LinuxInstaller extends BaseInstallationStrategy {
    platform = Platform.Linux;
    private distro: string = 'unknown';
    
    constructor() {
        super();
        this.detectDistro();
    }
    
    getSupportedMethods(): InstallationMethod[] {
        return [InstallationMethod.Conda, InstallationMethod.Manual, InstallationMethod.PackageManager];
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
                
            case InstallationMethod.PackageManager:
                steps.push(...this.getPackageManagerSteps());
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
        
        // Check for C++ compiler
        prerequisites.push({
            name: 'GCC/G++ Compiler',
            checkCommand: 'g++ --version',
            installCommand: this.getGccInstallCommand(),
            isMet: await this.commandExists('g++')
        });
        
        // Check for OpenMPI (optional but recommended)
        prerequisites.push({
            name: 'OpenMPI',
            checkCommand: 'mpirun --version',
            installCommand: this.getOpenMpiInstallCommand(),
            isMet: await this.commandExists('mpirun')
        });
        
        // Check for Python (for some ORCA utilities)
        prerequisites.push({
            name: 'Python 3',
            checkCommand: 'python3 --version',
            installCommand: this.getPythonInstallCommand(),
            isMet: await this.commandExists('python3')
        });
        
        return prerequisites;
    }
    
    private detectDistro(): void {
        try {
            const osRelease = fs.readFileSync('/etc/os-release', 'utf-8');
            
            if (osRelease.includes('Ubuntu') || osRelease.includes('Debian')) {
                this.distro = 'debian';
            } else if (osRelease.includes('Fedora') || osRelease.includes('CentOS') || osRelease.includes('Red Hat')) {
                this.distro = 'fedora';
            } else if (osRelease.includes('Arch')) {
                this.distro = 'arch';
            } else if (osRelease.includes('openSUSE')) {
                this.distro = 'suse';
            }
        } catch {
            this.distro = 'unknown';
        }
    }
    
    private getPackageManagerSteps(): InstallationStep[] {
        if (this.distro === 'arch') {
            return [
                {
                    title: 'Install from AUR (Arch Linux only)',
                    description: 'ORCA is available in the Arch User Repository (AUR):',
                    commands: [
                        'yay -S orca',
                        '# Or using another AUR helper:',
                        'paru -S orca'
                    ],
                    links: [
                        { text: 'AUR Package: orca', url: 'https://aur.archlinux.org/packages/orca' }
                    ],
                    isRequired: true
                }
            ];
        }
        
        return [
            {
                title: 'Package Manager Installation Not Available',
                description: `ORCA is not available in the official package repositories for ${this.distro}. 
Please use Conda (recommended) or manual installation instead.`,
                isRequired: false
            }
        ];
    }
    
    private getManualSteps(): InstallationStep[] {
        return [
            {
                title: 'Download ORCA',
                description: 'Download the latest ORCA release for Linux from the official forum (requires registration):',
                links: [
                    { text: 'ORCA Forum Downloads', url: 'https://orcaforum.kofo.mpg.de/' }
                ],
                isRequired: true
            },
            {
                title: 'Extract Archive',
                description: 'Extract the downloaded tarball to your preferred location:',
                commands: [
                    '# Example for ORCA 5.0.4',
                    'tar -xvf orca_5_0_4_linux_x86-64_shared_openmpi411.tar.xz',
                    'sudo mv orca_5_0_4_linux_x86-64_shared_openmpi411 /opt/orca',
                    '# Or install to your home directory:',
                    'mv orca_5_0_4_linux_x86-64_shared_openmpi411 ~/orca'
                ],
                isRequired: true
            },
            {
                title: 'Set Permissions',
                description: 'Make the ORCA binary executable:',
                commands: [
                    'chmod +x /opt/orca/orca',
                    '# Or if installed to home directory:',
                    'chmod +x ~/orca/orca'
                ],
                isRequired: true
            }
        ];
    }
    
    private getPathConfigurationStep(): InstallationStep {
        return {
            title: 'Configure PATH (Optional)',
            description: `Add ORCA to your PATH for easier access. Choose the commands appropriate for your shell:`,
            commands: [
                '# For bash (add to ~/.bashrc):',
                'echo "export PATH=/opt/orca:$PATH" >> ~/.bashrc',
                'source ~/.bashrc',
                '',
                '# For zsh (add to ~/.zshrc):',
                'echo "export PATH=/opt/orca:$PATH" >> ~/.zshrc',
                'source ~/.zshrc',
                '',
                '# Verify:',
                'which orca'
            ],
            isRequired: false
        };
    }
    
    private getGccInstallCommand(): string {
        switch (this.distro) {
            case 'debian':
                return 'sudo apt-get install build-essential';
            case 'fedora':
                return 'sudo dnf groupinstall "Development Tools"';
            case 'arch':
                return 'sudo pacman -S base-devel';
            case 'suse':
                return 'sudo zypper install -t pattern devel_basis';
            default:
                return 'Install GCC using your distribution\'s package manager';
        }
    }
    
    private getOpenMpiInstallCommand(): string {
        switch (this.distro) {
            case 'debian':
                return 'sudo apt-get install openmpi-bin libopenmpi-dev';
            case 'fedora':
                return 'sudo dnf install openmpi openmpi-devel';
            case 'arch':
                return 'sudo pacman -S openmpi';
            case 'suse':
                return 'sudo zypper install openmpi openmpi-devel';
            default:
                return 'Install OpenMPI using your distribution\'s package manager';
        }
    }
    
    private getPythonInstallCommand(): string {
        switch (this.distro) {
            case 'debian':
                return 'sudo apt-get install python3 python3-pip';
            case 'fedora':
                return 'sudo dnf install python3 python3-pip';
            case 'arch':
                return 'sudo pacman -S python python-pip';
            case 'suse':
                return 'sudo zypper install python3 python3-pip';
            default:
                return 'Install Python 3 using your distribution\'s package manager';
        }
    }
}
