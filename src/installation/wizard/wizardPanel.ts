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
    payload?: Record<string, unknown> | { path?: string; url?: string; method?: InstallationMethod } | undefined;
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
            _e => {
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
                    if (message.payload && typeof message.payload === 'object' && 'path' in message.payload) {
                        await this.handleValidation(message.payload.path as string);
                    }
                    break;
                    
                case MessageFromWebview.GetInstallationSteps:
                    if (message.payload && typeof message.payload === 'object' && 'method' in message.payload) {
                        await this.handleGetInstallationSteps(message.payload.method as InstallationMethod);
                    }
                    break;
                    
                case MessageFromWebview.SaveConfiguration:
                    if (message.payload && typeof message.payload === 'object' && 'path' in message.payload) {
                        await this.handleSaveConfiguration(message.payload.path as string);
                    }
                    break;
                    
                case MessageFromWebview.SaveState:
                    if (message.payload) {
                        await this.handleSaveState(message.payload as WizardState);
                    }
                    break;
                    
                case MessageFromWebview.Complete:
                    await this.handleComplete();
                    break;
                    
                case MessageFromWebview.Cancel:
                    this.dispose();
                    break;
                    
                case MessageFromWebview.OpenExternal:
                    if (message.payload && typeof message.payload === 'object' && 'url' in message.payload) {
                        await vscode.env.openExternal(vscode.Uri.parse(message.payload.url as string));
                    }
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
    private sendMessage(message: { type: string; payload?: unknown }): void {
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
        .copy-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            padding: 4px 8px;
            font-size: 12px;
            margin-left: 10px;
        }
        .copy-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        input[type="text"] {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
        }
        input[type="checkbox"], input[type="radio"] {
            margin-right: 8px;
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
            
            <div class="step" id="step-1">
                <h2>License Acknowledgment</h2>
                <p>ORCA is available free of charge for academic use only.</p>
                <div class="warning">
                    <p><strong>Important:</strong> By proceeding, you acknowledge that:</p>
                    <ul>
                        <li>ORCA is free for academic use at academic institutions</li>
                        <li>Commercial use requires a separate license</li>
                        <li>You must register on the ORCA forum to download</li>
                        <li>You agree to cite ORCA in publications</li>
                    </ul>
                </div>
                <label style="display: block; margin-top: 20px;">
                    <input type="checkbox" id="license-agree" onchange="updateLicenseButton()">
                    I acknowledge and accept these terms
                </label>
            </div>
            
            <div class="step" id="step-2">
                <h2>Detection Results</h2>
                <p>Scanning your system for existing ORCA <strong>computational chemistry</strong> installations...</p>
                <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">
                    Note: We're looking for ORCA quantum chemistry software from the Max Planck Institute, 
                    not GNOME Orca screen reader or other programs named "orca".
                </p>
                <div id="detection-results">
                    <button id="start-detection-btn">Start Detection</button>
                    <button id="skip-detection-btn" style="margin-left: 10px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">Skip Detection (I know the path)</button>
                    <div id="detection-output" style="margin-top: 20px;"></div>
                </div>
            </div>
            
            <div class="step" id="step-3">
                <h2>Installation Method</h2>
                <p>Select your installation method:</p>
                <div id="installation-methods">
                    <label style="display: block; margin: 10px 0;">
                        <input type="radio" name="install-method" value="conda" checked>
                        Conda (Recommended) - Easiest installation with dependency management
                    </label>
                    <label style="display: block; margin: 10px 0;">
                        <input type="radio" name="install-method" value="manual">
                        Manual Installation - Download from ORCA forum
                    </label>
                </div>
            </div>
            
            <div class="step" id="step-4">
                <h2>Installation Instructions</h2>
                <div id="installation-instructions">
                    <p>Follow these steps to install ORCA:</p>
                    <div id="steps-container"></div>
                </div>
            </div>
            
            <div class="step" id="step-5">
                <h2>Path Configuration</h2>
                <p>Provide the path to your ORCA binary:</p>
                <div style="margin: 20px 0;">
                    <input type="text" id="binary-path" placeholder="/path/to/orca" style="width: 70%; padding: 8px;">
                    <button id="browse-btn" style="margin-left: 10px;">Browse</button>
                </div>
                <button id="validate-btn">Validate Path</button>
                <div id="validation-output" style="margin-top: 20px;"></div>
            </div>
            
            <div class="step" id="step-6">
                <h2>Completion</h2>
                <div id="completion-message">
                    <div class="success">
                        <p><strong>✓ Setup Complete!</strong></p>
                        <p>ORCA has been successfully configured for VS-ORCA.</p>
                    </div>
                    <p><strong>Next steps:</strong></p>
                    <ul>
                        <li>Open an ORCA input file (.inp)</li>
                        <li>Press F5 to run a calculation</li>
                        <li>View results in the ORCA output panel</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="navigation">
            <button id="back-btn" disabled>Back</button>
            <button id="next-btn">Next</button>
        </div>
    </div>
    
    <script nonce="${nonce}">
        (function() {
            console.log('[ORCA Wizard] Script starting...');
            
            const vscode = acquireVsCodeApi();
            let currentStep = 0;
            let detectionResults = [];
            let validationResult = null;
            
            // Wait for DOM to be ready
            document.addEventListener('DOMContentLoaded', initWizard);
            
            // Also try immediately in case DOMContentLoaded already fired
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                initWizard();
            }
            
            function initWizard() {
                console.log('[ORCA Wizard] Initializing wizard...');
                
                // Setup event listeners
                const nextBtn = document.getElementById('next-btn');
                const backBtn = document.getElementById('back-btn');
                const licenseCheckbox = document.getElementById('license-agree');
                const startDetectionBtn = document.getElementById('start-detection-btn');
                const browseBtn = document.getElementById('browse-btn');
                const validateBtn = document.getElementById('validate-btn');
                
                if (nextBtn) {
                    console.log('[ORCA Wizard] Next button found, adding listener');
                    nextBtn.addEventListener('click', function(e) {
                        console.log('[ORCA Wizard] Next button clicked!');
                        handleNextClick();
                    });
                } else {
                    console.error('[ORCA Wizard] Next button NOT found!');
                }
                
                if (backBtn) {
                    backBtn.addEventListener('click', function() {
                        console.log('[ORCA Wizard] Back button clicked');
                        previousStep();
                    });
                }
                
                if (licenseCheckbox) {
                    licenseCheckbox.addEventListener('change', updateLicenseButton);
                }
                
                if (startDetectionBtn) {
                    startDetectionBtn.addEventListener('click', startDetection);
                }
                
                const skipDetectionBtn = document.getElementById('skip-detection-btn');
                if (skipDetectionBtn) {
                    skipDetectionBtn.addEventListener('click', skipDetection);
                }
                
                if (browseBtn) {
                    browseBtn.addEventListener('click', browseBinary);
                }
                
                if (validateBtn) {
                    validateBtn.addEventListener('click', validatePath);
                }
                
                console.log('[ORCA Wizard] Wizard initialized successfully');
                
                // Notify extension that webview is ready
                vscode.postMessage({ type: 'ready' });
            }
            
            function handleNextClick() {
                console.log('[ORCA Wizard] handleNextClick called, currentStep:', currentStep);
                const steps = document.querySelectorAll('.step');
                console.log('[ORCA Wizard] Total steps:', steps.length);
                if (currentStep === steps.length - 1) {
                    console.log('[ORCA Wizard] On last step, calling finish');
                    finish();
                } else {
                    console.log('[ORCA Wizard] Calling nextStep');
                    nextStep();
                }
            }
            
            function nextStep() {
                console.log('[ORCA Wizard] nextStep called from step:', currentStep);
                // Validate step before moving
                if (!validateCurrentStep()) {
                    console.log('[ORCA Wizard] Validation failed, staying on step:', currentStep);
                    return;
                }
                
                // Special flow: after installation instructions (step 4), go back to detection (step 2)
                if (currentStep === 4) {
                    console.log('[ORCA Wizard] After installation instructions, going to detection');
                    currentStep = 2;
                } else {
                    currentStep++;
                }
                console.log('[ORCA Wizard] Moving to step:', currentStep);
                updateStep();
                
                // Trigger actions for specific steps
                if (currentStep === 2) {
                    // Auto-start detection on step 2
                    console.log('[ORCA Wizard] Auto-starting detection');
                    setTimeout(startDetection, 500);
                } else if (currentStep === 4) {
                    // Load installation instructions on step 4
                    console.log('[ORCA Wizard] Loading installation instructions');
                    loadInstallationInstructions();
                }
                
                vscode.postMessage({ type: 'saveState', payload: { currentStep } });
            }
            
            function previousStep() {
                console.log('[ORCA Wizard] previousStep called');
                currentStep--;
                updateStep();
            }
            
            function validateCurrentStep() {
                console.log('[ORCA Wizard] Validating step:', currentStep);
                if (currentStep === 1) {
                    // License step
                    const agree = document.getElementById('license-agree');
                    if (agree && !agree.checked) {
                        alert('Please accept the license terms to continue');
                        return false;
                    }
                } else if (currentStep === 5) {
                    // Path configuration step
                    if (!validationResult || !validationResult.success) {
                        alert('Please validate the ORCA binary path first');
                        return false;
                    }
                }
                return true;
            }
            
            function updateStep() {
                console.log('[ORCA Wizard] updateStep called for step:', currentStep);
                const steps = document.querySelectorAll('.step');
                steps.forEach((step, index) => {
                    step.classList.toggle('active', index === currentStep);
                });
                
                const backBtn = document.getElementById('back-btn');
                const nextBtn = document.getElementById('next-btn');
                
                if (backBtn) backBtn.disabled = currentStep === 0;
                
                if (nextBtn) {
                    // Set button text based on current step
                    if (currentStep === steps.length - 1) {
                        nextBtn.textContent = 'Finish';
                    } else if (currentStep === 4) {
                        // Installation instructions step
                        nextBtn.textContent = "I've Installed ORCA";
                    } else {
                        nextBtn.textContent = 'Next';
                    }
                    
                    // Update button state based on current step
                    if (currentStep === 1) {
                        // License step - disable until checkbox is checked
                        const agree = document.getElementById('license-agree');
                        nextBtn.disabled = agree ? !agree.checked : false;
                    } else {
                        nextBtn.disabled = false;
                    }
                }
                
                const progress = ((currentStep + 1) / steps.length) * 100;
                const progressBar = document.getElementById('progress');
                if (progressBar) progressBar.style.width = progress + '%';
            }
            
            function updateLicenseButton() {
                const agree = document.getElementById('license-agree');
                const nextBtn = document.getElementById('next-btn');
                if (agree && nextBtn) {
                    nextBtn.disabled = !agree.checked;
                }
            }
            
            function startDetection() {
                console.log('[ORCA Wizard] Starting detection...');
                const output = document.getElementById('detection-output');
                if (output) output.innerHTML = '<p>Scanning system...</p>';
                vscode.postMessage({ type: 'startDetection' });
            }
            
            function skipDetection() {
                console.log('[ORCA Wizard] Skipping detection, going directly to path configuration');
                // Jump directly to path configuration step (step 5)
                currentStep = 5;
                updateStep();
                vscode.postMessage({ type: 'saveState', payload: { currentStep } });
            }
            
            function loadInstallationInstructions() {
                const methodRadio = document.querySelector('input[name="install-method"]:checked');
                const method = methodRadio ? methodRadio.value : 'conda';
                console.log('[ORCA Wizard] Loading instructions for method:', method);
                vscode.postMessage({ type: 'getInstallationSteps', payload: { method } });
            }
            
            function validatePath() {
                const pathInput = document.getElementById('binary-path');
                const path = pathInput ? pathInput.value.trim() : '';
                if (!path) {
                    alert('Please enter a path to the ORCA binary');
                    return;
                }
                
                console.log('[ORCA Wizard] Validating path:', path);
                const output = document.getElementById('validation-output');
                if (output) output.innerHTML = '<p>Validating...</p>';
                vscode.postMessage({ type: 'validatePath', payload: { path } });
            }
            
            function browseBinary() {
                console.log('[ORCA Wizard] Browse for binary clicked');
                vscode.postMessage({ type: 'browseForBinary' });
            }
            
            function finish() {
                console.log('[ORCA Wizard] Finish called, validationResult:', validationResult);
                if (validationResult && validationResult.success) {
                    const pathInput = document.getElementById('binary-path');
                    const path = pathInput ? pathInput.value.trim() : '';
                    vscode.postMessage({ type: 'saveConfiguration', payload: { path } });
                    vscode.postMessage({ type: 'complete' });
                } else {
                alert('Please complete validation before finishing');
                }
            }
            
            // Handle messages from extension
            window.addEventListener('message', function(event) {
                const message = event.data;
                console.log('[ORCA Wizard] Received message:', message.type);
                
                switch (message.type) {
                    case 'initialize':
                        console.log('[ORCA Wizard] Initialized for platform:', message.payload.platform);
                        break;
                        
                    case 'detectionResults':
                        handleDetectionResults(message.payload.installations);
                        break;
                        
                    case 'validationResults':
                        handleValidationResults(message.payload);
                        break;
                        
                    case 'installationSteps':
                        handleInstallationSteps(message.payload);
                        break;
                        
                    case 'binaryPathSelected':
                        const pathInput = document.getElementById('binary-path');
                        if (pathInput) pathInput.value = message.payload.path;
                        break;
                        
                    case 'restoreState':
                        if (message.payload.currentStep !== undefined) {
                            currentStep = message.payload.currentStep;
                            updateStep();
                        }
                        break;
                        
                    case 'error':
                        alert('Error: ' + message.payload.message);
                        break;
                }
            });
            
            function handleDetectionResults(installations) {
                console.log('[ORCA Wizard] Handling detection results:', installations);
                detectionResults = installations;
                const output = document.getElementById('detection-output');
                
                if (!output) return;
                
                // Find valid installations
                const validInstallations = installations.filter(function(inst) { return inst.isValid; });
                
                if (installations.length === 0) {
                    output.innerHTML = '<div class="warning"><p>No ORCA installations found.</p></div>' +
                        '<div style="margin-top: 15px;">' +
                        '<button id="specify-path-btn">Specify Path Manually</button>' +
                        '<button id="show-install-btn" style="margin-left: 10px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">Show Installation Instructions</button>' +
                        '</div>';
                    
                    // Add event listeners
                    const specifyPathBtn = document.getElementById('specify-path-btn');
                    if (specifyPathBtn) {
                        specifyPathBtn.addEventListener('click', function() {
                            currentStep = 5;
                            updateStep();
                        });
                    }
                    const showInstallBtn = document.getElementById('show-install-btn');
                    if (showInstallBtn) {
                        showInstallBtn.addEventListener('click', function() {
                            currentStep = 3;
                            updateStep();
                        });
                    }
                } else if (validInstallations.length === 0) {
                    // Found installations but none are valid
                    let html = '<div class="warning"><p>Found ' + installations.length + ' installation(s), but none are valid ORCA computational chemistry installations:</p></div>';
                    html += '<ul>';
                    installations.forEach(function(inst) {
                        html += '<li><code>' + inst.path + '</code>';
                        if (inst.validationError) {
                            html += '<br><span style="font-size: 0.9em; color: var(--vscode-errorForeground);">' + inst.validationError + '</span>';
                        }
                        html += '</li>';
                    });
                    html += '</ul>';
                    html += '<div style="margin-top: 15px;">' +
                        '<button id="specify-path-btn">Specify Path Manually</button>' +
                        '<button id="show-install-btn" style="margin-left: 10px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">Show Installation Instructions</button>' +
                        '</div>';
                    output.innerHTML = html;
                    
                    // Add event listeners
                    const specifyPathBtn = document.getElementById('specify-path-btn');
                    if (specifyPathBtn) {
                        specifyPathBtn.addEventListener('click', function() {
                            currentStep = 5;
                            updateStep();
                        });
                    }
                    const showInstallBtn = document.getElementById('show-install-btn');
                    if (showInstallBtn) {
                        showInstallBtn.addEventListener('click', function() {
                            currentStep = 3;
                            updateStep();
                        });
                    }
                } else {
                    let html = '<div class="success"><p>Found ' + validInstallations.length + ' valid ORCA installation(s):</p></div><ul>';
                    validInstallations.forEach(function(inst) {
                        html += '<li><strong>Version ' + inst.version + '</strong> at <code>' + inst.path + '</code> ✓</li>';
                    });
                    html += '</ul>';
                    html += '<div style="margin-top: 15px;">' +
                        '<button id="use-detected-btn">Use First Valid Installation</button>' +
                        '<button id="specify-other-btn" style="margin-left: 10px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">Specify Different Path</button>' +
                        '</div>';
                    output.innerHTML = html;
                    
                    // Add event listener to the new button
                    const useDetectedBtn = document.getElementById('use-detected-btn');
                    console.log('[ORCA Wizard] Use detected button found:', !!useDetectedBtn);
                    if (useDetectedBtn) {
                        useDetectedBtn.addEventListener('click', function() {
                            console.log('[ORCA Wizard] Use First Valid Installation clicked!');
                            useDetectedInstallation();
                        });
                    }
                    
                    const specifyOtherBtn = document.getElementById('specify-other-btn');
                    if (specifyOtherBtn) {
                        specifyOtherBtn.addEventListener('click', function() {
                            currentStep = 5;
                            updateStep();
                        });
                    }
                }
            }
            
            function useDetectedInstallation() {
                console.log('[ORCA Wizard] Using detected installation, detectionResults:', detectionResults);
                // First try to find a valid one, otherwise use first available
                let selected = detectionResults.find(function(inst) { return inst.isValid; });
                if (!selected && detectionResults.length > 0) {
                    console.log('[ORCA Wizard] No valid installation, using first available');
                    selected = detectionResults[0];
                }
                if (selected) {
                    console.log('[ORCA Wizard] Selected installation:', selected.path);
                    const pathInput = document.getElementById('binary-path');
                    if (pathInput) pathInput.value = selected.path;
                    // Jump to path configuration step
                    currentStep = 5;
                    updateStep();
                } else {
                    console.log('[ORCA Wizard] No installation to use');
                    alert('No installation found to use');
                }
            }
            
            function handleValidationResults(result) {
                console.log('[ORCA Wizard] Handling validation results:', result);
                validationResult = result;
                const output = document.getElementById('validation-output');
                
                if (!output) return;
                
                if (result.success) {
                    const details = result.installationDetails;
                    output.innerHTML = '<div class="success"><p><strong>✓ Validation Successful</strong></p>' +
                        '<p>Version: ' + details.version + '</p>' +
                        '<p>Architecture: ' + details.architecture + '</p></div>';
                } else {
                    output.innerHTML = '<div class="warning"><p><strong>✗ Validation Failed</strong></p>' +
                        '<p>' + result.errors.join('</p><p>') + '</p></div>';
                }
            }
            
            function handleInstallationSteps(data) {
                console.log('[ORCA Wizard] Handling installation steps');
                const container = document.getElementById('steps-container');
                if (!container) return;
                
                let html = '';
                
                data.steps.forEach(function(step, index) {
                    html += '<div style="margin: 20px 0; padding: 15px; border: 1px solid var(--vscode-panel-border);">';
                    html += '<h3>' + (index + 1) + '. ' + step.title + '</h3>';
                    html += '<p>' + step.description + '</p>';
                    
                    if (step.commands && step.commands.length > 0) {
                        step.commands.forEach(function(cmd) {
                            html += '<div class="code-block">' + cmd;
                            html += '<button class="copy-button" data-cmd="' + cmd.replace(/"/g, '&quot;') + '">Copy</button>';
                            html += '</div>';
                        });
                    }
                    
                    if (step.links && step.links.length > 0) {
                        html += '<p><strong>Links:</strong></p><ul>';
                        step.links.forEach(function(link) {
                            html += '<li><a href="#" class="external-link" data-url="' + link.url + '">' + 
                                link.text + '</a></li>';
                        });
                        html += '</ul>';
                    }
                    
                    html += '</div>';
                });
                
                container.innerHTML = html;
                
                // Add event listeners to copy buttons
                container.querySelectorAll('.copy-button').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        const cmd = this.getAttribute('data-cmd');
                        copyToClipboard(cmd, this);
                    });
                });
                
                // Add event listeners to external links
                container.querySelectorAll('.external-link').forEach(function(link) {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        openExternal(this.getAttribute('data-url'));
                    });
                });
            }
            
            function copyToClipboard(text, btn) {
                navigator.clipboard.writeText(text).then(function() {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(function() {
                        btn.textContent = originalText;
                    }, 2000);
                });
            }
            
            function openExternal(url) {
                vscode.postMessage({ type: 'openExternal', payload: { url: url } });
            }
            
        })();
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
