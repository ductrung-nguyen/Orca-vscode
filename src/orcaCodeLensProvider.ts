import * as vscode from 'vscode';

// Track running state globally - will be updated by orcaRunner
let runningInputFile: string | null = null;

/**
 * Set the currently running input file path
 * Call with null when no job is running
 */
export function setRunningFile(filePath: string | null): void {
    runningInputFile = filePath;
    // Trigger CodeLens refresh
    OrcaCodeLensProvider.refresh();
}

/**
 * Check if a specific file is currently running
 */
export function isFileRunning(filePath: string): boolean {
    return runningInputFile === filePath;
}

/**
 * Check if any ORCA job is currently running
 */
export function isAnyJobRunning(): boolean {
    return runningInputFile !== null;
}

/**
 * CodeLens provider for ORCA input files (.inp)
 * Provides "Run ORCA" action at the top of the file, similar to test runners
 */
export class OrcaCodeLensProvider implements vscode.CodeLensProvider {
    private static _instance: OrcaCodeLensProvider | null = null;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        OrcaCodeLensProvider._instance = this;
        // Refresh CodeLenses when configuration changes
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    /**
     * Trigger a refresh of all CodeLenses
     */
    public static refresh(): void {
        if (OrcaCodeLensProvider._instance) {
            OrcaCodeLensProvider._instance._onDidChangeCodeLenses.fire();
        }
    }

    provideCodeLenses(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const codeLenses: vscode.CodeLens[] = [];

        // Only provide CodeLens for .inp files or orca language
        if (!document.fileName.endsWith('.inp') && document.languageId !== 'orca') {
            return codeLenses;
        }

        // Add CodeLens at the top of the file (line 0)
        const topOfDocument = new vscode.Range(0, 0, 0, 0);
        const isThisFileRunning = isFileRunning(document.fileName);
        const isAnyRunning = isAnyJobRunning();
        
        if (isThisFileRunning) {
            // This file is running - show "Running..." and "Kill Job"
            const runningCodeLens = new vscode.CodeLens(topOfDocument, {
                title: '$(loading~spin) Running...',
                tooltip: 'ORCA calculation in progress',
                command: ''
            });
            codeLenses.push(runningCodeLens);
            
            const killCodeLens = new vscode.CodeLens(topOfDocument, {
                title: '$(debug-stop) Kill Job',
                tooltip: 'Stop the running ORCA job',
                command: 'vs-orca.killJob'
            });
            codeLenses.push(killCodeLens);
        } else if (isAnyRunning) {
            // Another file is running - show disabled Run and option to kill
            const runCodeLens = new vscode.CodeLens(topOfDocument, {
                title: '$(play) Run ORCA',
                tooltip: 'Another ORCA job is running. Click to kill it and run this file.',
                command: 'vs-orca.runJob'
            });
            codeLenses.push(runCodeLens);
        } else {
            // No job running - show Run ORCA
            const runCodeLens = new vscode.CodeLens(topOfDocument, {
                title: '$(play) Run ORCA',
                tooltip: 'Run this ORCA input file (F5)',
                command: 'vs-orca.runJob'
            });
            codeLenses.push(runCodeLens);
        }

        return codeLenses;
    }

    resolveCodeLens(codeLens: vscode.CodeLens, _token: vscode.CancellationToken): vscode.CodeLens {
        return codeLens;
    }
}
