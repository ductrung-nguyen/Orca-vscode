import * as vscode from 'vscode';
import * as fs from 'fs';
import { OrcaRunner } from './orcaRunner';
import { WizardPanel } from './installation/wizard/wizardPanel';
import { OrcaDetector } from './installation/detector';
import { OrcaValidator } from './installation/validator';

let orcaRunner: OrcaRunner;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('VS-ORCA extension is now active!');

    // Initialize the ORCA runner
    orcaRunner = new OrcaRunner();
    
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'vs-orca.detectOrca';
    context.subscriptions.push(statusBarItem);
    
    // Run health check on startup if configured
    performStartupHealthCheck(context);

    // Register command: Run ORCA Job
    const runCommand = vscode.commands.registerCommand('vs-orca.runJob', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found. Please open an ORCA input file (.inp)');
            return;
        }

        const document = editor.document;
        
        // Check if the file is an ORCA input file
        if (!document.fileName.endsWith('.inp') && document.languageId !== 'orca') {
            vscode.window.showWarningMessage('This does not appear to be an ORCA input file. Expected .inp extension.');
            return;
        }

        // Auto-save if configured
        const config = vscode.workspace.getConfiguration('orca');
        const autoSave = config.get<boolean>('autoSaveBeforeRun', true);
        
        if (autoSave && document.isDirty) {
            await document.save();
        } else if (document.isDirty) {
            const response = await vscode.window.showWarningMessage(
                'The file has unsaved changes. Save before running?',
                'Yes', 'No', 'Cancel'
            );
            
            if (response === 'Yes') {
                await document.save();
            } else if (response === 'Cancel') {
                return;
            }
        }

        // Verify the file exists on disk
        if (!fs.existsSync(document.fileName)) {
            vscode.window.showErrorMessage('Please save the file before running ORCA');
            return;
        }

        // Check if ORCA binary is configured
        const binaryPath = config.get<string>('binaryPath', '');
        if (!binaryPath || binaryPath === '/opt/orca/orca' || binaryPath === 'orca') {
            const response = await vscode.window.showWarningMessage(
                'ORCA binary path is not configured. Would you like to run the setup wizard?',
                'Setup Wizard', 'Detect Installations', 'Open Settings', 'Cancel'
            );
            
            if (response === 'Setup Wizard') {
                vscode.commands.executeCommand('vs-orca.setupOrca');
                return;
            } else if (response === 'Detect Installations') {
                vscode.commands.executeCommand('vs-orca.detectOrca');
                return;
            } else if (response === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'orca.binaryPath');
                return;
            } else {
                return;
            }
        }

        // Verify binary exists
        if (!fs.existsSync(binaryPath)) {
            const response = await vscode.window.showErrorMessage(
                `ORCA binary not found at: ${binaryPath}`,
                'Run Setup Wizard', 'Detect Installations', 'Open Settings'
            );
            
            if (response === 'Run Setup Wizard') {
                vscode.commands.executeCommand('vs-orca.setupOrca');
            } else if (response === 'Detect Installations') {
                vscode.commands.executeCommand('vs-orca.detectOrca');
            } else if (response === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'orca.binaryPath');
            }
            return;
        }

        // Run the ORCA job
        await orcaRunner.runJob(document.fileName);
    });

    // Register command: Kill ORCA Job
    const killCommand = vscode.commands.registerCommand('vs-orca.killJob', () => {
        orcaRunner.killJob();
    });
    
    // Register command: Setup ORCA (Installation Wizard)
    const setupCommand = vscode.commands.registerCommand('vs-orca.setupOrca', () => {
        WizardPanel.createOrShow(context);
    });
    
    // Register command: Detect ORCA Installations
    const detectCommand = vscode.commands.registerCommand('vs-orca.detectOrca', async () => {
        const detector = new OrcaDetector();
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Detecting ORCA installations...",
            cancellable: false
        }, async () => {
            const installations = await detector.detectInstallations();
            
            if (installations.length === 0) {
                const response = await vscode.window.showWarningMessage(
                    'No ORCA installations found on this system.',
                    'Run Setup Wizard', 'OK'
                );
                
                if (response === 'Run Setup Wizard') {
                    WizardPanel.createOrShow(context);
                }
            } else {
                const items = installations.map(inst => ({
                    label: `ORCA ${inst.version}`,
                    description: inst.path,
                    detail: `Source: ${inst.detectionSource}${inst.isValid ? ' ✓' : ' ✗'}`,
                    installation: inst
                }));
                
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select an ORCA installation to configure'
                });
                
                if (selected) {
                    const config = vscode.workspace.getConfiguration('orca');
                    await config.update('binaryPath', selected.installation.path, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`ORCA binary path set to: ${selected.installation.path}`);
                    updateStatusBar(selected.installation.version);
                }
            }
        });
    });
    
    // Register command: Validate ORCA Installation
    const validateCommand = vscode.commands.registerCommand('vs-orca.validateOrca', async () => {
        const config = vscode.workspace.getConfiguration('orca');
        const binaryPath = config.get<string>('binaryPath', '');
        
        if (!binaryPath || binaryPath === '/opt/orca/orca' || binaryPath === 'orca') {
            vscode.window.showWarningMessage('No ORCA binary configured. Please configure a path first.');
            return;
        }
        
        const validator = new OrcaValidator(context);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Validating ORCA installation...",
            cancellable: false
        }, async () => {
            const result = await validator.validateInstallation(binaryPath);
            
            if (result.success) {
                const details = result.installationDetails;
                vscode.window.showInformationMessage(
                    `✓ ORCA ${details?.version} validated successfully (${details?.architecture})`
                );
            } else {
                const errors = result.errors.join('\n');
                const response = await vscode.window.showErrorMessage(
                    `ORCA validation failed:\n${errors}`,
                    'Run Setup Wizard', 'OK'
                );
                
                if (response === 'Run Setup Wizard') {
                    WizardPanel.createOrShow(context);
                }
            }
        });
    });
    
    // Register command: Health Check
    const healthCommand = vscode.commands.registerCommand('vs-orca.checkOrcaHealth', async () => {
        const config = vscode.workspace.getConfiguration('orca');
        const binaryPath = config.get<string>('binaryPath', '');
        
        if (!binaryPath || binaryPath === '/opt/orca/orca' || binaryPath === 'orca') {
            vscode.window.showWarningMessage('No ORCA binary configured.');
            return;
        }
        
        const validator = new OrcaValidator(context);
        const result = await validator.quickValidate(binaryPath);
        
        if (result.success) {
            vscode.window.showInformationMessage(`✓ ORCA ${result.installationDetails?.version} is healthy`);
        } else {
            vscode.window.showWarningMessage(`ORCA health check failed: ${result.errors.join(', ')}`);
        }
    });

    context.subscriptions.push(
        runCommand, 
        killCommand, 
        setupCommand, 
        detectCommand, 
        validateCommand,
        healthCommand
    );
}

async function performStartupHealthCheck(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('orca');
    const autoDetect = config.get<boolean>('autoDetectOnStartup', false);
    
    if (!autoDetect) {
        return;
    }
    
    const binaryPath = config.get<string>('binaryPath', '');
    
    if (binaryPath && binaryPath !== '/opt/orca/orca' && binaryPath !== 'orca') {
        // Check if configured binary still exists
        if (!fs.existsSync(binaryPath)) {
            const response = await vscode.window.showWarningMessage(
                'Configured ORCA binary not found. Run setup wizard?',
                'Setup', 'Ignore'
            );
            
            if (response === 'Setup') {
                vscode.commands.executeCommand('vs-orca.setupOrca');
            }
        } else {
            // Quick validation
            const validator = new OrcaValidator(context);
            const result = await validator.quickValidate(binaryPath);
            
            if (result.success && result.installationDetails) {
                updateStatusBar(result.installationDetails.version);
            }
        }
    }
}

function updateStatusBar(version: string): void {
    statusBarItem.text = `$(check) ORCA ${version}`;
    statusBarItem.tooltip = 'Click to detect other ORCA installations';
    statusBarItem.show();
}

export function deactivate() {
    if (orcaRunner) {
        orcaRunner.dispose();
    }
}
