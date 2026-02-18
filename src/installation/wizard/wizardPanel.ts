/**
 * ORCA Installation Wizard Webview Panel
 * Manages the interactive installation wizard UI
 */

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { OrcaDetector } from "../detector";
import { OrcaValidator } from "../validator";
import { WizardState, Platform, InstallationMethod } from "../types";
import { LinuxInstaller } from "../strategies/linuxInstaller";
import { MacOSInstaller } from "../strategies/macosInstaller";
import { WindowsInstaller } from "../strategies/windowsInstaller";

/**
 * Message types sent from extension to webview
 */
export enum MessageToWebview {
  Initialize = "initialize",
  DetectionResults = "detectionResults",
  ValidationResults = "validationResults",
  InstallationSteps = "installationSteps",
  RestoreState = "restoreState",
  Error = "error",
  ProgressUpdate = "progressUpdate",
  OutputLine = "outputLine",
  InstallationError = "installationError",
  InstallationComplete = "installationComplete",
}

/**
 * Message types sent from webview to extension
 */
export enum MessageFromWebview {
  Ready = "ready",
  StartDetection = "startDetection",
  ValidatePath = "validatePath",
  GetInstallationSteps = "getInstallationSteps",
  SaveConfiguration = "saveConfiguration",
  SaveState = "saveState",
  Complete = "complete",
  Cancel = "cancel",
  OpenExternal = "openExternal",
  BrowseForBinary = "browseForBinary",
  OpenSettings = "openSettings",
  RunTestJob = "runTestJob",
  // Note: Automated installation via package managers is no longer supported
  // to avoid user confusion (no package manager provides ORCA correctly).
  // These message types are kept for backwards compatibility but are no-ops:
  StartAutomatedInstallation = "startAutomatedInstallation",
  CancelInstallation = "cancelInstallation",
  RetryInstallation = "retryInstallation",
}

/**
 * Message payload interface
 */
interface Message {
  type: string;
  payload?:
    | Record<string, unknown>
    | { path?: string; url?: string; method?: InstallationMethod }
    | undefined;
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
      "orcaInstallationWizard",
      "ORCA Installation Wizard",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(
            path.join(context.extensionPath, "src", "installation", "wizard"),
          ),
        ],
      },
    );

    WizardPanel.currentPanel = new WizardPanel(panel, context);
  }

  /**
   * Private constructor (use createOrShow)
   */
  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
  ) {
    this.panel = panel;
    this.context = context;
    this.detector = new OrcaDetector();
    this.validator = new OrcaValidator(context);
    this.platform = os.platform() as Platform;

    // Set the webview's initial html content
    this.panel.webview.html = this.getHtmlContent();

    // Set icon
    const iconPath = path.join(context.extensionPath, "images", "icon.png");
    if (fs.existsSync(iconPath)) {
      this.panel.iconPath = vscode.Uri.file(iconPath);
    }

    // Listen for panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleWebviewMessage(message),
      null,
      this.disposables,
    );

    // Update content when view state changes
    this.panel.onDidChangeViewState(
      (_e) => {
        if (this.panel.visible) {
          // Panel became visible
          this.restoreState();
        }
      },
      null,
      this.disposables,
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
          if (
            message.payload &&
            typeof message.payload === "object" &&
            "path" in message.payload
          ) {
            await this.handleValidation(message.payload.path as string);
          }
          break;

        case MessageFromWebview.GetInstallationSteps:
          if (
            message.payload &&
            typeof message.payload === "object" &&
            "method" in message.payload
          ) {
            await this.handleGetInstallationSteps(
              message.payload.method as InstallationMethod,
            );
          }
          break;

        case MessageFromWebview.SaveConfiguration:
          if (
            message.payload &&
            typeof message.payload === "object" &&
            "path" in message.payload
          ) {
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
          if (
            message.payload &&
            typeof message.payload === "object" &&
            "url" in message.payload
          ) {
            await vscode.env.openExternal(
              vscode.Uri.parse(message.payload.url as string),
            );
          }
          break;

        case MessageFromWebview.BrowseForBinary:
          await this.handleBrowseForBinary();
          break;

        case MessageFromWebview.StartAutomatedInstallation:
          if (
            message.payload &&
            typeof message.payload === "object" &&
            "method" in message.payload
          ) {
            await this.handleStartAutomatedInstallation(
              message.payload.method as InstallationMethod,
            );
          }
          break;

        case MessageFromWebview.CancelInstallation:
          await this.handleCancelInstallation();
          break;

        case MessageFromWebview.RetryInstallation:
          if (
            message.payload &&
            typeof message.payload === "object" &&
            "method" in message.payload
          ) {
            await this.handleStartAutomatedInstallation(
              message.payload.method as InstallationMethod,
            );
          }
          break;

        case MessageFromWebview.OpenSettings:
          await this.handleOpenSettings();
          break;

        case MessageFromWebview.RunTestJob:
          await this.handleRunTestJob();
          break;
      }
    } catch (error) {
      this.sendMessage({
        type: MessageToWebview.Error,
        payload: { message: (error as Error).message },
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
      payload: { installations },
    });
  }

  /**
   * Handle validation
   */
  private async handleValidation(binaryPath: string): Promise<void> {
    const result = await this.validator.validateInstallation(binaryPath);

    this.sendMessage({
      type: MessageToWebview.ValidationResults,
      payload: result,
    });
  }

  /**
   * Handle get installation steps
   */
  private async handleGetInstallationSteps(
    method: InstallationMethod,
  ): Promise<void> {
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
        throw new Error("Unsupported platform");
    }

    const steps = installer.getInstallationSteps(method);
    const prerequisites = await installer.checkPrerequisites();

    this.sendMessage({
      type: MessageToWebview.InstallationSteps,
      payload: { steps, prerequisites },
    });
  }

  /**
   * Handle save configuration
   */
  private async handleSaveConfiguration(binaryPath: string): Promise<void> {
    const config = vscode.workspace.getConfiguration("orca");
    await config.update(
      "binaryPath",
      binaryPath,
      vscode.ConfigurationTarget.Global,
    );

    vscode.window.showInformationMessage(
      `ORCA binary path configured: ${binaryPath}`,
    );
  }

  /**
   * Handle save state
   */
  private async handleSaveState(state: WizardState): Promise<void> {
    await this.context.globalState.update("orcaWizardState", {
      ...state,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle completion
   */
  private async handleComplete(): Promise<void> {
    // Mark wizard as completed
    const config = vscode.workspace.getConfiguration("orca");
    await config.update(
      "installationWizardCompleted",
      true,
      vscode.ConfigurationTarget.Global,
    );

    // Clear saved state
    await this.context.globalState.update("orcaWizardState", undefined);

    vscode.window.showInformationMessage(
      "ORCA installation wizard completed successfully!",
    );

    this.dispose();
  }

  /**
   * Handle browse for binary
   */
  private async handleBrowseForBinary(): Promise<void> {
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Select ORCA Binary",
      filters:
        this.platform === Platform.Windows ? { Executables: ["exe"] } : {},
    };

    const fileUri = await vscode.window.showOpenDialog(options);

    if (fileUri && fileUri[0]) {
      const binaryPath = fileUri[0].fsPath;

      // Send the selected path back to webview
      this.sendMessage({
        type: "binaryPathSelected",
        payload: { path: binaryPath },
      });
    }
  }

  /**
   * Handle automated installation start
   * @deprecated Automated installation not available - ORCA requires manual download
   */
  private async handleStartAutomatedInstallation(
    _method: InstallationMethod,
  ): Promise<void> {
    // Redirect to manual installation
    this.sendMessage({
      type: MessageToWebview.InstallationError,
      payload: {
        error: {
          message: "Please download ORCA from the ORCA Forum",
          remediation: [
            "1. Register at https://orcaforum.kofo.mpg.de",
            "2. Download ORCA after account approval",
            "3. Run the installer",
            "4. Return here to configure the path",
          ],
          canRetry: false,
          details: "ORCA is free for academic use.",
        },
      },
    });
  }

  /**
   * Installation cancellation tracker
   */
  private installationCancelled: boolean = false;

  /**
   * Handle installation cancellation
   *
   * TODO: This currently only sets a flag but doesn't terminate the running install process.
   * To properly implement: Use AbortController/cancellation token pattern and keep a reference
   * to the active ChildProcess so it can be killed and cleaned up on cancel.
   */
  private async handleCancelInstallation(): Promise<void> {
    this.installationCancelled = true;
    vscode.window.showWarningMessage("Installation cancelled by user");
    // The installer should check this flag and stop gracefully
  }

  /**
   * Handle open settings
   */
  private async handleOpenSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "orca",
    );
  }

  /**
   * Handle run test job
   */
  private async handleRunTestJob(): Promise<void> {
    // Create a simple test input file
    const testInput = `# Simple ORCA Test Job
! HF def2-SVP

* xyz 0 1
  H 0 0 0
  H 0 0 0.74
*
`;

    // Create new untitled document
    const doc = await vscode.workspace.openTextDocument({
      content: testInput,
      language: "orca",
    });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(
      "Test job created. Press F5 to run ORCA calculation.",
    );
  }

  /**
   * Restore wizard state from storage
   */
  private async restoreState(): Promise<void> {
    const savedState =
      this.context.globalState.get<WizardState>("orcaWizardState");

    if (savedState) {
      // Check if state is expired (7 days)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (savedState.timestamp < sevenDaysAgo) {
        // State expired, clear it
        await this.context.globalState.update("orcaWizardState", undefined);
        this.sendMessage({
          type: MessageToWebview.Initialize,
          payload: { platform: this.platform },
        });
      } else {
        // Restore state
        this.sendMessage({
          type: MessageToWebview.RestoreState,
          payload: savedState,
        });
      }
    } else {
      // No saved state, initialize fresh
      this.sendMessage({
        type: MessageToWebview.Initialize,
        payload: { platform: this.platform },
      });
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
    const htmlPath = path.join(
      this.context.extensionPath,
      "src",
      "installation",
      "wizard",
      "wizard.html",
    );

    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, "utf-8");

      // Replace placeholders with webview URIs
      const scriptUri = this.panel.webview.asWebviewUri(
        vscode.Uri.file(
          path.join(
            this.context.extensionPath,
            "src",
            "installation",
            "wizard",
            "wizard.js",
          ),
        ),
      );

      html = html.replace("{{scriptUri}}", scriptUri.toString());

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
                <h2>Welcome to ORCA Installation</h2>
                <p>This wizard will help you install and configure <strong>ORCA computational chemistry software</strong>.</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: var(--vscode-textCodeBlock-background); border-radius: 3px;">
                    <p><strong>📚 About ORCA:</strong></p>
                    <p style="margin: 10px 0; font-size: 0.95em;">ORCA is a powerful computational chemistry program used by researchers worldwide. It's <strong>free for academic use</strong>.</p>
                    <p style="margin: 10px 0; font-size: 0.9em; color: var(--vscode-descriptionForeground);">• Developed by the Max Planck Institute<br>• Used for quantum chemistry calculations<br>• Requires registration on ORCA Forum to download</p>
                </div>
                
                <p><strong>What you'll do in this wizard:</strong></p>
                <ul>
                    <li>Check if ORCA is already installed (optional)</li>
                    <li>Download ORCA from the official website</li>
                    <li>Install ORCA on your computer</li>
                    <li>Configure VS Code to use ORCA</li>
                </ul>
                
                <div style="margin-top: 20px; padding: 10px; background-color: var(--vscode-textCodeBlock-background); border-radius: 3px;">
                    <p style="font-size: 0.9em; margin: 0;">⏱️ <strong>Time needed:</strong> 10-15 minutes (plus account approval time)</p>
                </div>
            </div>
            
            <div class="step" id="step-1">
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
            
            <div class="step" id="step-2">
                <h2>📥 Download and Install ORCA</h2>
                <p style="font-size: 1.05em; margin-bottom: 20px;">Follow these steps carefully. Don't worry if you're new to this - we'll guide you through everything!</p>
                
                <!-- Step 1: Register -->
                <div style="margin: 20px 0; padding: 20px; background-color: var(--vscode-textCodeBlock-background); border-radius: 5px; border-left: 4px solid var(--vscode-button-background);">
                    <h3 style="margin-top: 0;">🔐 Step 1: Create an ORCA Forum Account</h3>
                    <p style="margin: 10px 0;"><strong>Why?</strong> You need an account to download ORCA. It's free!</p>
                    
                    <ol style="line-height: 1.8;">
                        <li><strong>Click the button below</strong> to open the ORCA Forum website<br>
                            <button class="external-link-btn" data-url="https://orcaforum.kofo.mpg.de" style="margin: 10px 0;">🌐 Open ORCA Forum</button>
                        </li>
                        <li>Click <strong>"Register"</strong> (usually at the top right of the page)</li>
                        <li>Fill in the registration form:
                            <ul style="font-size: 0.9em; color: var(--vscode-descriptionForeground); line-height: 1.6;">
                                <li>Use your <strong>academic email</strong> if possible (e.g., .edu, .ac.uk)</li>
                                <li>Choose a username and password</li>
                                <li>Select your institution/affiliation</li>
                            </ul>
                        </li>
                        <li><strong>Submit and wait for approval</strong> (can take a few hours to 24 hours)</li>
                        <li>Check your email for approval notification</li>
                    </ol>
                    
                    <div style="margin-top: 15px; padding: 10px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                        <p style="margin: 0; font-size: 0.9em;">💡 <strong>Tip:</strong> Complete the next steps while waiting for account approval!</p>
                    </div>
                </div>
                
                <!-- Step 2: Download -->
                <div style="margin: 20px 0; padding: 20px; background-color: var(--vscode-textCodeBlock-background); border-radius: 5px; border-left: 4px solid var(--vscode-button-background);">
                    <h3 style="margin-top: 0;">⬇️ Step 2: Download ORCA</h3>
                    <p style="margin: 10px 0;"><strong>After your account is approved</strong>, follow these steps:</p>
                    
                    <ol style="line-height: 1.8;">
                        <li><strong>Log in</strong> to the ORCA Forum with your new account</li>
                        <li><strong>Click the button below</strong> to go to the Downloads section<br>
                            <button class="external-link-btn" data-url="https://orcaforum.kofo.mpg.de/app.php/dlext/" style="margin: 10px 0;">📦 Go to Downloads</button>
                        </li>
                        <li><strong>Find the right version</strong> for your computer:
                            <ul style="font-size: 0.9em; color: var(--vscode-descriptionForeground); line-height: 1.6;">
                                <li><strong>Windows:</strong> Look for "orca_6_X_X_windows.zip" or similar</li>
                                <li><strong>macOS:</strong> Look for "orca_6_X_X_macos.tar.xz" or similar</li>
                                <li><strong>Linux:</strong> Look for "orca_6_X_X_linux.tar.xz" or similar</li>
                            </ul>
                        </li>
                        <li><strong>Click the download link</strong> and save the file to your Downloads folder</li>
                        <li><strong>Wait for download to complete</strong> (file is large, ~1-2 GB)</li>
                    </ol>
                </div>
                
                <!-- Step 3: Install -->
                <div style="margin: 20px 0; padding: 20px; background-color: var(--vscode-textCodeBlock-background); border-radius: 5px; border-left: 4px solid var(--vscode-button-background);">
                    <h3 style="margin-top: 0;">🔧 Step 3: Install ORCA</h3>
                    <p style="margin: 10px 0;">Installation differs by operating system. <strong>Choose your system below:</strong></p>
                    
                    <!-- Windows Instructions -->
                    <details style="margin: 15px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                        <summary style="cursor: pointer; font-weight: bold; font-size: 1.05em;">🪟 Windows Installation</summary>
                        <div style="margin-top: 15px;">
                            <ol style="line-height: 1.8;">
                                <li><strong>Extract the zip file:</strong>
                                    <ul style="font-size: 0.9em; line-height: 1.6;">
                                        <li>Right-click the downloaded zip file</li>
                                        <li>Select "Extract All..."</li>
                                        <li>Choose a location (recommended: <code>C:\\orca</code>)</li>
                                        <li>Click "Extract"</li>
                                    </ul>
                                </li>
                                <li><strong>The ORCA program is now at:</strong>
                                    <div class="code-block" style="margin: 10px 0;">C:\\orca\\orca.exe</div>
                                    <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">📝 Write this down - you'll need it in the next step!</p>
                                </li>
                                <li><strong>(Optional) Add to System PATH:</strong>
                                    <ul style="font-size: 0.9em; line-height: 1.6;">
                                        <li>Press <kbd>Win + X</kbd> and select "System"</li>
                                        <li>Click "Advanced system settings"</li>
                                        <li>Click "Environment Variables"</li>
                                        <li>Under "System variables", find and select "Path"</li>
                                        <li>Click "Edit" → "New"</li>
                                        <li>Add: <code>C:\\orca</code></li>
                                        <li>Click "OK" on all dialogs</li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                    </details>
                    
                    <!-- macOS Instructions -->
                    <details style="margin: 15px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                        <summary style="cursor: pointer; font-weight: bold; font-size: 1.05em;">🍎 macOS Installation</summary>
                        <div style="margin-top: 15px;">
                            <ol style="line-height: 1.8;">
                                <li><strong>Extract the archive:</strong>
                                    <ul style="font-size: 0.9em; line-height: 1.6;">
                                        <li>Double-click the downloaded .tar.xz file (or .dmg if available)</li>
                                        <li>It will extract automatically</li>
                                    </ul>
                                </li>
                                <li><strong>Move ORCA to Applications folder:</strong>
                                    <p style="font-size: 0.9em; margin: 10px 0;">Open Terminal (Applications → Utilities → Terminal) and run these commands:</p>
                                    <div class="code-block" style="margin: 10px 0;">cd ~/Downloads
sudo mv orca_6* /Applications/orca
cd /Applications/orca</div>
                                    <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">💡 You'll need to enter your Mac password when prompted</p>
                                </li>
                                <li><strong>Make ORCA executable:</strong>
                                    <div class="code-block" style="margin: 10px 0;">sudo chmod +x /Applications/orca/orca</div>
                                </li>
                                <li><strong>The ORCA program is now at:</strong>
                                    <div class="code-block" style="margin: 10px 0;">/Applications/orca/orca</div>
                                    <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">📝 Write this down - you'll need it in the next step!</p>
                                </li>
                            </ol>
                        </div>
                    </details>
                    
                    <!-- Linux Instructions -->
                    <details style="margin: 15px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                        <summary style="cursor: pointer; font-weight: bold; font-size: 1.05em;">🐧 Linux Installation</summary>
                        <div style="margin-top: 15px;">
                            <ol style="line-height: 1.8;">
                                <li><strong>Extract the archive:</strong>
                                    <p style="font-size: 0.9em; margin: 10px 0;">Open Terminal and run:</p>
                                    <div class="code-block" style="margin: 10px 0;">cd ~/Downloads
tar -xf orca_6*.tar.xz</div>
                                </li>
                                <li><strong>Move ORCA to /opt:</strong>
                                    <div class="code-block" style="margin: 10px 0;">sudo mv orca_6* /opt/orca</div>
                                    <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">💡 You may need to enter your password</p>
                                </li>
                                <li><strong>Make ORCA executable:</strong>
                                    <div class="code-block" style="margin: 10px 0;">sudo chmod +x /opt/orca/orca</div>
                                </li>
                                <li><strong>(Optional) Add to PATH:</strong>
                                    <p style="font-size: 0.9em; margin: 10px 0;">Add this line to your ~/.bashrc or ~/.zshrc:</p>
                                    <div class="code-block" style="margin: 10px 0;">export PATH="/opt/orca:$PATH"</div>
                                    <p style="font-size: 0.9em;">Then run: <code>source ~/.bashrc</code> (or <code>source ~/.zshrc</code>)</p>
                                </li>
                                <li><strong>The ORCA program is now at:</strong>
                                    <div class="code-block" style="margin: 10px 0;">/opt/orca/orca</div>
                                    <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">📝 Write this down - you'll need it in the next step!</p>
                                </li>
                            </ol>
                        </div>
                    </details>
                </div>
                
                <!-- Step 4: Verify -->
                <div style="margin: 20px 0; padding: 20px; background-color: var(--vscode-textCodeBlock-background); border-radius: 5px; border-left: 4px solid var(--vscode-testing-iconPassed);">
                    <h3 style="margin-top: 0;">✅ Step 4: Verify Installation (Optional but Recommended)</h3>
                    <p style="margin: 10px 0;">Let's make sure ORCA is installed correctly!</p>
                    
                    <ol style="line-height: 1.8;">
                        <li><strong>Open Terminal/Command Prompt:</strong>
                            <ul style="font-size: 0.9em; line-height: 1.6;">
                                <li><strong>Windows:</strong> Press <kbd>Win + R</kbd>, type <code>cmd</code>, press Enter</li>
                                <li><strong>macOS:</strong> Applications → Utilities → Terminal</li>
                                <li><strong>Linux:</strong> Use your terminal emulator</li>
                            </ul>
                        </li>
                        <li><strong>Navigate to ORCA directory:</strong>
                            <div class="code-block" style="margin: 10px 0;"># Windows:
cd C:\\orca

# macOS:
cd /Applications/orca

# Linux:
cd /opt/orca</div>
                        </li>
                        <li><strong>Create a test input file and run ORCA:</strong>
                            <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground); margin: 6px 0 4px 0;">
                                ORCA requires an input file to run. Create a minimal test file to verify installation:
                            </p>
                            <div class="code-block" style="margin: 10px 0;"># Windows (PowerShell):
@'
! HF def2-SVP
* xyz 0 1
O 0.0 0.0 0.0
*
'@ | Out-File -Encoding ascii version_check.inp

orca.exe version_check.inp

# macOS/Linux:
cat << 'EOF' > version_check.inp
! HF def2-SVP
* xyz 0 1
O 0.0 0.0 0.0
*
EOF

./orca version_check.inp</div>
                        </li>
                        <li><strong>You should see output containing:</strong>
                            <div class="code-block" style="margin: 10px 0; color: var(--vscode-testing-iconPassed);">Program Version 6.0.0</div>
                            <p style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">If you see this, ORCA is installed correctly! 🎉</p>
                        </li>
                    </ol>
                </div>
                
                <div class="success" style="margin-top: 20px;">
                    <p style="margin: 0;"><strong>✨ Ready for the next step!</strong></p>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">Once ORCA is installed, click "Next" to configure VS Code to use it.</p>
                </div>
            </div>
            
            <div class="step" id="step-3">
                <h2>🎯 Configure VS Code to Use ORCA</h2>
                <p>Now we need to tell VS Code where to find the ORCA program you just installed.</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: var(--vscode-textCodeBlock-background); border-radius: 3px;">
                    <p style="margin: 0 0 10px 0;"><strong>📂 What path should you enter?</strong></p>
                    <p style="margin: 5px 0; font-size: 0.9em;">Enter the <strong>full path</strong> to the ORCA executable file:</p>
                    <ul style="font-size: 0.9em; line-height: 1.8; color: var(--vscode-descriptionForeground);">
                        <li><strong>Windows:</strong> <code>C:\\orca\\orca.exe</code></li>
                        <li><strong>macOS:</strong> <code>/Applications/orca/orca</code></li>
                        <li><strong>Linux:</strong> <code>/opt/orca/orca</code></li>
                    </ul>
                    <p style="margin: 10px 0 0 0; font-size: 0.85em; color: var(--vscode-descriptionForeground);">💡 If you installed ORCA in a different location, use that path instead.</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <label for="binary-path" style="display: block; margin-bottom: 8px; font-weight: bold;">ORCA Executable Path:</label>
                    <input type="text" id="binary-path" placeholder="Enter the full path to orca executable" style="width: 70%; padding: 10px; font-family: var(--vscode-editor-font-family);">
                    <button id="browse-btn" style="margin-left: 10px; padding: 10px 16px;">📁 Browse...</button>
                </div>
                
                <button id="validate-btn" style="padding: 10px 20px; font-size: 1em;">✓ Validate and Test Path</button>
                
                <div id="validation-output" style="margin-top: 20px;"></div>
                
                <div style="margin-top: 30px; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                    <p style="margin: 0; font-size: 0.9em;"><strong>Need help?</strong></p>
                    <ul style="font-size: 0.85em; line-height: 1.8; color: var(--vscode-descriptionForeground);">
                        <li>Click "Browse" to search for the orca file on your computer</li>
                        <li>After entering the path, click "Validate and Test Path" to make sure it works</li>
                        <li>If validation fails, double-check the path or reinstall ORCA</li>
                    </ul>
                </div>
            </div>
            
            <div class="step" id="step-4">
                <h2>🎉 Installation Complete!</h2>
                <div id="completion-message">
                    <div class="success">
                        <p style="font-size: 1.2em; margin: 0;"><strong>✓ Success!</strong></p>
                        <p style="margin: 5px 0 0 0;">ORCA is now installed and configured. You're ready to run quantum chemistry calculations!</p>
                    </div>
                    <div id="install-details" style="margin: 20px 0; padding: 15px; background-color: var(--vscode-textCodeBlock-background); border-radius: 3px;">
                        <p><strong>Installation Details:</strong></p>
                        <ul style="list-style: none; padding-left: 0; margin-top: 10px;">
                            <li id="install-version" style="margin: 5px 0;">📦 Version: <span style="font-family: var(--vscode-editor-font-family);">--</span></li>
                            <li id="install-path" style="margin: 5px 0;">📁 Location: <span style="font-family: var(--vscode-editor-font-family);">--</span></li>
                            <li id="install-time" style="margin: 5px 0;">⏱️ Installation Time: <span>--</span></li>
                            <li id="install-method" style="margin: 5px 0;">🔧 Method: <span>--</span></li>
                        </ul>
                    </div>
                    <div style="margin: 20px 0; padding: 20px; background-color: var(--vscode-textCodeBlock-background); border-radius: 5px;">
                        <p style="margin: 0 0 15px 0;"><strong>🚀 What's Next? Here's how to use ORCA:</strong></p>
                        
                        <div style="margin: 15px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">1. Create your first ORCA input file</p>
                            <p style="margin: 0; font-size: 0.9em;">Click "Run Test Job" below to create a simple example, or create your own .inp file</p>
                        </div>
                        
                        <div style="margin: 15px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">2. Run a calculation</p>
                            <p style="margin: 0; font-size: 0.9em;">Open an .inp file and press <kbd style="background-color: var(--vscode-keybindingLabel-background); color: var(--vscode-keybindingLabel-foreground); padding: 2px 6px; border-radius: 3px;">F5</kbd> or right-click and select "Run ORCA"</p>
                        </div>
                        
                        <div style="margin: 15px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">3. View your results</p>
                            <p style="margin: 0; font-size: 0.9em;">Results appear in the ORCA Output panel. Look for the .out file with the same name as your input</p>
                        </div>
                        
                        <div style="margin: 15px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">4. Explore features</p>
                            <p style="margin: 0; font-size: 0.9em;">Press <kbd style="background-color: var(--vscode-keybindingLabel-background); color: var(--vscode-keybindingLabel-foreground); padding: 2px 6px; border-radius: 3px;">Ctrl+Shift+P</kbd> (Windows/Linux) or <kbd style="background-color: var(--vscode-keybindingLabel-background); color: var(--vscode-keybindingLabel-foreground); padding: 2px 6px; border-radius: 3px;">Cmd+Shift+P</kbd> (Mac) to see all ORCA commands</p>
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0; padding: 15px; background-color: var(--vscode-editor-background); border-radius: 3px; border-left: 3px solid var(--vscode-button-background);">
                        <p style="margin: 0 0 8px 0; font-size: 0.9em;"><strong>📚 Need more help?</strong></p>
                        <p style="margin: 0; font-size: 0.85em; color: var(--vscode-descriptionForeground);">• Check the ORCA documentation: <a href="#" class="external-link" data-url="https://www.faccts.de/docs/orca/6.0/manual/">ORCA Manual</a><br>
                        • Join the ORCA Forum for community support<br>
                        • Use code snippets: Type "orca" in a .inp file for templates</p>
                    </div>
                    <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button id="view-settings-btn" style="background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">⚙️ View Settings</button>
                        <button id="run-test-job-btn" style="background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">🧪 Run Test Job</button>
                        <button id="close-wizard-btn">✓ Close Wizard</button>
                    </div>
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
                const skipDetectionBtn = document.getElementById('skip-detection-btn');
                const browseBtn = document.getElementById('browse-btn');
                const validateBtn = document.getElementById('validate-btn');
                const viewSettingsBtn = document.getElementById('view-settings-btn');
                const runTestJobBtn = document.getElementById('run-test-job-btn');
                const closeWizardBtn = document.getElementById('close-wizard-btn');
                
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
                
                if (skipDetectionBtn) {
                    skipDetectionBtn.addEventListener('click', skipDetection);
                }
                
                if (browseBtn) {
                    browseBtn.addEventListener('click', browseBinary);
                }
                
                if (validateBtn) {
                    validateBtn.addEventListener('click', validatePath);
                }
                
                if (viewSettingsBtn) {
                    viewSettingsBtn.addEventListener('click', function() {
                        vscode.postMessage({ type: 'openSettings' });
                    });
                }
                
                if (runTestJobBtn) {
                    runTestJobBtn.addEventListener('click', function() {
                        vscode.postMessage({ type: 'runTestJob' });
                    });
                }
                
                if (closeWizardBtn) {
                    closeWizardBtn.addEventListener('click', function() {
                        vscode.postMessage({ type: 'complete' });
                    });
                }
                
                // Add event listeners to external links
                document.querySelectorAll('.external-link').forEach(function(link) {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        var url = this.getAttribute('data-url');
                        if (typeof url === 'string' && url.trim() !== '') {
                            openExternal(url);
                        }
                    });
                });
                
                // Add event listeners to external link buttons
                document.querySelectorAll('.external-link-btn').forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        var url = this.getAttribute('data-url');
                        if (typeof url === 'string' && url.trim() !== '') {
                            openExternal(url);
                        }
                    });
                });
                
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
                
                currentStep++;
                
                console.log('[ORCA Wizard] Moving to step:', currentStep);
                updateStep();
                
                // Trigger actions for specific steps
                if (currentStep === 1) {
                    // Auto-start detection on step 1 (detection step)
                    console.log('[ORCA Wizard] Auto-starting detection');
                    setTimeout(startDetection, 500);
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
                if (currentStep === 3) {
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
                    } else {
                        nextBtn.textContent = 'Next';
                    }
                    nextBtn.disabled = false;
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
                console.log('[ORCA Wizard] Skipping detection, going directly to download instructions');
                // Jump to download instructions (step 2)
                currentStep = 2;
                updateStep();
                vscode.postMessage({ type: 'saveState', payload: { currentStep } });
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
                        '<button id="show-install-btn" style="background-color: var(--vscode-button-background); color: var(--vscode-button-foreground);">📥 Show Installation Instructions</button>' +
                        '<button id="specify-path-btn" style="margin-left: 10px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">I Already Installed It</button>' +
                        '</div>';
                    output.innerHTML = html;
                    
                    // Add event listeners
                    const showInstallBtn = document.getElementById('show-install-btn');
                    if (showInstallBtn) {
                        showInstallBtn.addEventListener('click', function() {
                            currentStep = 2;
                            updateStep();
                        });
                    }
                    const specifyPathBtn = document.getElementById('specify-path-btn');
                    if (specifyPathBtn) {
                        specifyPathBtn.addEventListener('click', function() {
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
                    currentStep = 3;
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
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
