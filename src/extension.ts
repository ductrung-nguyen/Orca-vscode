import * as vscode from 'vscode';
import * as fs from 'fs';
import { OrcaRunner } from './orcaRunner';

let orcaRunner: OrcaRunner;

export function activate(context: vscode.ExtensionContext) {
    console.log('VS-ORCA extension is now active!');

    // Initialize the ORCA runner
    orcaRunner = new OrcaRunner();

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
        const binaryPath = config.get<string>('orca.binaryPath', '');
        if (!binaryPath || binaryPath === '/opt/orca/orca') {
            const response = await vscode.window.showWarningMessage(
                'ORCA binary path is not configured. Would you like to set it now?',
                'Open Settings', 'Cancel'
            );
            
            if (response === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'orca.binaryPath');
            }
            return;
        }

        // Verify binary exists
        if (!fs.existsSync(binaryPath)) {
            vscode.window.showErrorMessage(`ORCA binary not found at: ${binaryPath}. Please check your settings.`);
            return;
        }

        // Run the ORCA job
        await orcaRunner.runJob(document.fileName);
    });

    // Register command: Kill ORCA Job
    const killCommand = vscode.commands.registerCommand('vs-orca.killJob', () => {
        orcaRunner.killJob();
    });

    context.subscriptions.push(runCommand, killCommand);
}

export function deactivate() {
    if (orcaRunner) {
        orcaRunner.dispose();
    }
}
