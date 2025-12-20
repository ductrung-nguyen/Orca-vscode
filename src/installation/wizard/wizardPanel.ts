/**
 * ORCA Installation Wizard Webview Panel
 * Manages the interactive installation wizard UI
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { OrcaDetector } from '../detector';
import { OrcaValidator } from '../validator';
import { WizardState, Platform, InstallationMethod } from '../types';
import { LinuxInstaller } from '../strategies/linuxInstaller';
import { MacOSInstaller } from '../strategies/macosInstaller';
import { WindowsInstaller } from '../strategies/windowsInstaller';

/**
 * Message types sent from extension to webview
 */
export enum MessageToWebview {
    Initialize = 'initialize',
    DetectionResults = 'detectionResults',
    ValidationResults = 'validationResults',
    InstallationSteps = 'installationSteps',
    RestoreState = 'restoreState',
    Error = 'error'
}

/**
 * Message types sent from webview to extension
 */
export enum MessageFromWebview {
    Ready = 'ready',
    StartDetection = 'startDetection',
    ValidatePath = 'validatePath',
    GetInstallationSteps = 'getInstallationSteps',
    SaveConfiguration = 'saveConfiguration',
    SaveState = 'saveState',
    Complete = 'complete',
    Cancel = 'cancel',
    OpenExternal = 'openExternal',
    BrowseForBinary = 'browseForBinary'
}

/**
 * Message payload interface
 */
interface Message {
    type: string;
    payload?: any;
}

/**
 * Manages the ORCA installation wizard webview panel
 */
export class WizardPanel {
    /** Singleton instance */
    private static currentPanel: WizardPanel | undefined;
    
    /** VS Code webview panel */
    private readonly panel: vscode.WebviewPanel;
    
    /** Extension context */
    private readonly context: vscode.ExtensionContext;
    
    /** Detector instance */
    private readonly detector: OrcaDetector;
    
    /** Validator instance */
    private readonly validator: OrcaValidator;
    
    /** Disposables for cleanup */
    private disposables: vscode.Disposable[] = [];
    
    /** Current platform */
    private readonly platform: Platform;
    
    /**
     * Create or show the wizard panel
     */
    public static createOrShow(context: vscode.ExtensionContext): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        
        // If we already have a panel, show it
        if (WizardPanel.currentPanel) {
            WizardPanel.currentPanel.panel.reveal(column);
            return;
        }
        
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'orcaInstallationWizard',
            'ORCA Installation Wizard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'src', 'installation', 'wizard'))
                ]
            }
        );
        
        WizardPanel.currentPanel = new WizardPanel(panel, context);
    }
    
    /**
     * Private constructor (use createOrShow)
     */
    private constructor(
        panel: vscode.WebviewPanel,
        context: vscode.ExtensionContext
    ) {
        this.panel = panel;
        this.context = context;
        this.detector = new OrcaDetector();
        this.validator = new OrcaValidator(context);
        this.platform = os.platform() as Platform;
        
        // Set the webview's initial html content
        this.panel.webview.html = this.getHtmlContent();
        
        // Set icon
        const iconPath = path.join(context.extensionPath, 'images', 'icon.png');
        if (fs.existsSync(iconPath)) {
            this.panel.iconPath = vscode.Uri.file(iconPath);
        }
        
        // Listen for panel disposal
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            message => this.handleWebviewMessage(message),
            null,
            this.disposables
        );
        
        // Update content when view state changes
        this.panel.onDidChangeViewState(
            e => {
                if (this.panel.visible) {
                    // Panel became visible
                    this.restoreState();
                }
            },
            null,
            this.disposables
        );
    }
    
    /**
     * Handle messages from webview
     */
    private async handleWebviewMessage(message: Message): Promise<void> {
        try {
            switch (message.type) {
                case MessageFromWebview.Ready:
                    await this.handleReady();
                    break;
                    
                case MessageFromWebview.StartDetection:
                    await this.handleDetection();
                    break;
                    
                case MessageFromWebview.ValidatePath:
                    await this.handleValidation(message.payload.path);
                    break;
                    
                case MessageFromWebview.GetInstallationSteps:
                    await this.handleGetInstallationSteps(message.payload.method);
                    break;
                    
                case MessageFromWebview.SaveConfiguration:
                    await this.handleSaveConfiguration(message.payload.path);
                    break;
                    
                case MessageFromWebview.SaveState:
                    await this.handleSaveState(message.payload);
                    break;
                    
                case MessageFromWebview.Complete:
                    await this.handleComplete();
                    break;
                    
                case MessageFromWebview.Cancel:
                    this.dispose();
                    break;
                    
                case MessageFromWebview.OpenExternal:
                    await vscode.env.openExternal(vscode.Uri.parse(message.payload.url));
                    break;
                    
                case MessageFromWebview.BrowseForBinary:
                    await this.handleBrowseForBinary();
                    break;
            }
        } catch (error) {
            this.sendMessage({
                type: MessageToWebview.Error,
                payload: { message: (error as Error).message }
            });
        }
    }
    
    /**
     * Handle ready message
     */
    private async handleReady(): Promise<void> {
        await this.restoreState();
    }
    
    /**
     * Handle detection
     */
    private async handleDetection(): Promise<void> {
        const installations = await this.detector.detectInstallations();
        
        this.sendMessage({
            type: MessageToWebview.DetectionResults,
            payload: { installations }
        });
    }
    
    /**
     * Handle validation
     */
    private async handleValidation(binaryPath: string): Promise<void> {
        const result = await this.validator.validateInstallation(binaryPath);
        
        this.sendMessage({
            type: MessageToWebview.ValidationResults,
            payload: result
        });
    }
    
    /**
     * Handle get installation steps
     */
    private async handleGetInstallationSteps(method: InstallationMethod): Promise<void> {
        let installer;
        
        switch (this.platform) {
            case Platform.Linux:
                installer = new LinuxInstaller();
                break;
            case Platform.MacOS:
                installer = new MacOSInstaller();
                break;
            case Platform.Windows:
                installer = new WindowsInstaller();
                break;
            default:
                throw new Error('Unsupported platform');
        }
        
        const steps = installer.getInstallationSteps(method);
        const prerequisites = await installer.checkPrerequisites();
        
        this.sendMessage({
            type: MessageToWebview.InstallationSteps,
            payload: { steps, prerequisites }
        });
    }
    
    /**
     * Handle save configuration
     */
    private async handleSaveConfiguration(binaryPath: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('orca');
        await config.update('binaryPath', binaryPath, vscode.ConfigurationTarget.Global);
        
        vscode.window.showInformationMessage(`ORCA binary path configured: ${binaryPath}`);
    }
    
    /**
     * Handle save state
     */
    private async handleSaveState(state: WizardState): Promise<void> {
        await this.context.globalState.update('orcaWizardState', {
            ...state,
            timestamp: Date.now()
        });
    }
    
    /**
     * Handle completion
     */
    private async handleComplete(): Promise<void> {
        // Mark wizard as completed
        const config = vscode.workspace.getConfiguration('orca');
        await config.update('installationWizardCompleted', true, vscode.ConfigurationTarget.Global);
        
        // Clear saved state
        await this.context.globalState.update('orcaWizardState', undefined);
        
        vscode.window.showInformationMessage('ORCA installation wizard completed successfully!');
        
        this.dispose();
    }
    
    /**
     * Handle browse for binary
     */
    private async handleBrowseForBinary(): Promise<void> {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Select ORCA Binary',
            filters: this.platform === Platform.Windows
                ? { 'Executables': ['exe'] }
                : {}
        };
        
        const fileUri = await vscode.window.showOpenDialog(options);
        
        if (fileUri && fileUri[0]) {
            const binaryPath = fileUri[0].fsPath;
            
            // Send the selected path back to webview
            this.sendMessage({
                type: 'binaryPathSelected',
                payload: { path: binaryPath }
            });
        }
    }
    
    /**
     * Restore wizard state from storage
     */
    private async restoreState(): Promise<void> {
        const savedState = this.context.globalState.get<WizardState>('orcaWizardState');
        
        if (savedState) {
            // Check if state is expired (7 days)
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (savedState.timestamp < sevenDaysAgo) {
                // State expired, clear it
                await this.context.globalState.update('orcaWizardState', undefined);
                this.sendMessage({ type: MessageToWebview.Initialize, payload: { platform: this.platform } });
            } else {
                // Restore state
                this.sendMessage({
                    type: MessageToWebview.RestoreState,
                    payload: savedState
                });
            }
        } else {
            // No saved state, initialize fresh
            this.sendMessage({ type: MessageToWebview.Initialize, payload: { platform: this.platform } });
        }
    }
    
    /**
     * Send message to webview
     */
    private sendMessage(message: any): void {
        this.panel.webview.postMessage(message);
    }
    
    /**
     * Get HTML content for webview
     */
    private getHtmlContent(): string {
        // Try to load from external HTML file first
        const htmlPath = path.join(this.context.extensionPath, 'src', 'installation', 'wizard', 'wizard.html');
        
        if (fs.existsSync(htmlPath)) {
            let html = fs.readFileSync(htmlPath, 'utf-8');
            
            // Replace placeholders with webview URIs
            const scriptUri = this.panel.webview.asWebviewUri(
                vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'installation', 'wizard', 'wizard.js'))
            );
            
            html = html.replace('{{scriptUri}}', scriptUri.toString());
            
            return html;
        }
        
        // Fallback to inline HTML
        return this.getInlineHtml();
    }
    
    /**
     * Get inline HTML (fallback)
     */
    private getInlineHtml(): string {
        const nonce = this.getNonce();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>ORCA Installation Wizard</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .wizard-container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        .step {
            display: none;
        }
        .step.active {
            display: block;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            margin: 5px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .progress-bar {
            width: 100%;
            height: 4px;
            background-color: var(--vscode-progressBar-background);
            margin: 20px 0;
        }
        .progress-bar-fill {
            height: 100%;
            background-color: var(--vscode-progressBar-foreground);
            transition: width 0.3s ease;
        }
        .code-block {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            white-space: pre-wrap;
            margin: 10px 0;
        }
        .warning {
            color: var(--vscode-editorWarning-foreground);
            padding: 10px;
            border-left: 3px solid var(--vscode-editorWarning-foreground);
            margin: 10px 0;
        }
        .success {
            color: var(--vscode-testing-iconPassed);
            padding: 10px;
            border-left: 3px solid var(--vscode-testing-iconPassed);
            margin: 10px 0;
        }
        .navigation {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="wizard-container">
        <h1>ORCA Installation Wizard</h1>
        
        <div class="progress-bar">
            <div class="progress-bar-fill" id="progress" style="width: 14%;"></div>
        </div>
        
        <div id="wizard-content">
            <div class="step active" id="step-0">
                <h2>Welcome</h2>
                <p>This wizard will guide you through the process of installing and configuring ORCA computational chemistry software.</p>
                <p><strong>What this wizard does:</strong></p>
                <ul>
                    <li>Detects existing ORCA installations on your system</li>
                    <li>Provides step-by-step installation instructions</li>
                    <li>Validates your installation</li>
                    <li>Configures VS-ORCA to use your ORCA installation</li>
                </ul>
            </div>
        </div>
        
        <div class="navigation">
            <button id="back-btn" onclick="previousStep()" disabled>Back</button>
            <button id="next-btn" onclick="nextStep()">Next</button>
        </div>
    </div>
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let currentStep = 0;
        
        function nextStep() {
            currentStep++;
            updateStep();
            vscode.postMessage({ type: 'saveState', payload: { currentStep } });
        }
        
        function previousStep() {
            currentStep--;
            updateStep();
        }
        
        function updateStep() {
            const steps = document.querySelectorAll('.step');
            steps.forEach((step, index) => {
                step.classList.toggle('active', index === currentStep);
            });
            
            document.getElementById('back-btn').disabled = currentStep === 0;
            document.getElementById('next-btn').textContent = 
                currentStep === steps.length - 1 ? 'Finish' : 'Next';
            
            const progress = ((currentStep + 1) / steps.length) * 100;
            document.getElementById('progress').style.width = progress + '%';
        }
        
        // Notify extension that webview is ready
        vscode.postMessage({ type: 'ready' });
    </script>
</body>
</html>`;
    }
    
    /**
     * Generate nonce for CSP
     */
    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    
    /**
     * Dispose of the panel
     */
    public dispose(): void {
        WizardPanel.currentPanel = undefined;
        
        this.panel.dispose();
        
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
