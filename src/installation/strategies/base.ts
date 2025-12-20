/**
 * Base installation strategy interface and utilities
 */

import { InstallationStep, InstallationMethod, Prerequisite, Platform } from '../types';
import { spawn } from 'child_process';

/**
 * Installation strategy interface
 */
export interface IInstallationStrategy {
    /** Platform this strategy is for */
    platform: Platform;
    
    /** Get installation steps for a specific method */
    getInstallationSteps(method: InstallationMethod): InstallationStep[];
    
    /** Check prerequisites for installation */
    checkPrerequisites(): Promise<Prerequisite[]>;
    
    /** Get supported installation methods for this platform */
    getSupportedMethods(): InstallationMethod[];
    
    /** Get recommended installation method */
    getRecommendedMethod(): InstallationMethod;
}

/**
 * Abstract base class for installation strategies
 */
export abstract class BaseInstallationStrategy implements IInstallationStrategy {
    abstract platform: Platform;
    
    abstract getInstallationSteps(method: InstallationMethod): InstallationStep[];
    abstract checkPrerequisites(): Promise<Prerequisite[]>;
    abstract getSupportedMethods(): InstallationMethod[];
    abstract getRecommendedMethod(): InstallationMethod;
    
    /**
     * Common utility: Check if a command exists
     */
    protected async commandExists(command: string): Promise<boolean> {
        return new Promise((resolve) => {
            const checkCmd = this.platform === Platform.Windows ? 'where' : 'which';
            const process = spawn(checkCmd, [command], { shell: true });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                resolve(false);
            }, 2000);
            
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
    
    /**
     * Common utility: Get Conda installation steps
     */
    protected getCondaSteps(): InstallationStep[] {
        return [
            {
                title: 'Install Conda (if not present)',
                description: 'Conda is a package manager that simplifies ORCA installation and dependency management.',
                links: [
                    { text: 'Download Miniconda', url: 'https://docs.conda.io/en/latest/miniconda.html' },
                    { text: 'Download Anaconda', url: 'https://www.anaconda.com/download' }
                ],
                isRequired: true
            },
            {
                title: 'Install ORCA via Conda',
                description: 'Run the following command to install ORCA from conda-forge:',
                commands: ['conda install -c conda-forge orca'],
                isRequired: true
            },
            {
                title: 'Verify Installation',
                description: 'Verify that ORCA was installed successfully:',
                commands: ['conda list orca', 'which orca'],
                isRequired: true
            }
        ];
    }
    
    /**
     * Common utility: Get license acknowledgment text
     */
    protected getLicenseAcknowledgment(): InstallationStep {
        return {
            title: 'License Acknowledgment',
            description: `ORCA is available free of charge for academic use only. You must:
• Be affiliated with an academic institution
• Register on the ORCA forum to download
• Cite ORCA in publications using the software

Commercial use requires a separate license.`,
            links: [
                { text: 'ORCA Forum Registration', url: 'https://orcaforum.kofo.mpg.de/' },
                { text: 'ORCA Citation Information', url: 'https://www.faccts.de/docs/orca/6.0/manual/contents/detailed/refs.html' }
            ],
            isRequired: true
        };
    }
}
