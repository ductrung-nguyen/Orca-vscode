# TASK-017: Wizard Webview Panel Setup

**Phase**: Phase 3 - Installation Wizard UI  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 3-4 hours  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Create the webview panel infrastructure for the ORCA installation wizard, including panel lifecycle management, message passing protocol, and singleton pattern to ensure only one wizard instance exists at a time.

---

## Dependencies

**Blocked By**:

- TASK-001 (Project Structure Setup)

**Blocks**:

- TASK-018 (Wizard HTML Template)
- TASK-019 (Wizard Step Navigation)
- TASK-020 (License Acknowledgment Step)
- TASK-021 (Detection Step Integration)
- TASK-022 (Installation Instructions Step)
- TASK-023 (Path Configuration Step)
- TASK-024 (Validation Step)

---

## Objectives

1. Create webview panel with proper VS Code integration
2. Implement message passing between extension and webview
3. Enforce singleton pattern (only one wizard at a time)
4. Handle panel lifecycle (open, close, dispose)
5. Set up secure content loading with CSP

---

## Technical Specifications

### Class Interface

**Location**: `src/installation/wizard/wizardPanel.ts`

```typescript
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { OrcaDetector } from "../detector";
import { OrcaValidator } from "../validator";
import { WizardState } from "../types";

/**
 * Message types sent from extension to webview
 */
export enum MessageToWebview {
  Initialize = "initialize",
  DetectionResults = "detectionResults",
  ValidationResults = "validationResults",
  RestoreState = "restoreState",
  Error = "error",
}

/**
 * Message types sent from webview to extension
 */
export enum MessageFromWebview {
  Ready = "ready",
  StartDetection = "startDetection",
  ValidatePath = "validatePath",
  SaveState = "saveState",
  Complete = "complete",
  Cancel = "cancel",
  OpenExternal = "openExternal",
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

  /**
   * Create or show the wizard panel
   */
  public static createOrShow(context: vscode.ExtensionContext): void {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

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
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "src", "installation", "wizard"))],
      }
    );

    WizardPanel.currentPanel = new WizardPanel(panel, context);
  }

  /**
   * Private constructor (use createOrShow)
   */
  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.context = context;
    this.detector = new OrcaDetector();
    this.validator = new OrcaValidator(context);

    // Set the webview's initial html content
    this.panel.webview.html = this.getHtmlContent();

    // Set icon
    this.panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, "images", "icon.png"));

    // Listen for panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage((message) => this.handleWebviewMessage(message), null, this.disposables);

    // Update content when view state changes
    this.panel.onDidChangeViewState(
      (e) => {
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
    switch (message.type) {
      case MessageFromWebview.Ready:
        // Webview is ready, send initial state
        await this.restoreState();
        break;

      case MessageFromWebview.StartDetection:
        await this.runDetection();
        break;

      case MessageFromWebview.ValidatePath:
        await this.validatePath(message.payload.path);
        break;

      case MessageFromWebview.SaveState:
        await this.saveState(message.payload);
        break;

      case MessageFromWebview.Complete:
        await this.handleComplete(message.payload);
        break;

      case MessageFromWebview.Cancel:
        this.panel.dispose();
        break;

      case MessageFromWebview.OpenExternal:
        vscode.env.openExternal(vscode.Uri.parse(message.payload.url));
        break;

      default:
        console.warn("Unknown message type:", message.type);
    }
  }

  /**
   * Run ORCA detection and send results to webview
   */
  private async runDetection(): Promise<void> {
    try {
      const installations = await this.detector.detectInstallations();

      this.postMessage({
        type: MessageToWebview.DetectionResults,
        payload: { installations },
      });
    } catch (error) {
      this.postMessage({
        type: MessageToWebview.Error,
        payload: {
          message: "Detection failed",
          error: (error as Error).message,
        },
      });
    }
  }

  /**
   * Validate a binary path and send results to webview
   */
  private async validatePath(binaryPath: string): Promise<void> {
    try {
      const result = await this.validator.validateInstallation(binaryPath);

      this.postMessage({
        type: MessageToWebview.ValidationResults,
        payload: result,
      });
    } catch (error) {
      this.postMessage({
        type: MessageToWebview.Error,
        payload: {
          message: "Validation failed",
          error: (error as Error).message,
        },
      });
    }
  }

  /**
   * Save wizard state to globalState
   */
  private async saveState(state: WizardState): Promise<void> {
    state.timestamp = Date.now();
    await this.context.globalState.update("orca.wizardState", state);
  }

  /**
   * Restore wizard state from globalState
   */
  private async restoreState(): Promise<void> {
    const savedState = this.context.globalState.get<WizardState>("orca.wizardState");

    if (savedState) {
      // Check if state is expired (7 days)
      const age = Date.now() - savedState.timestamp;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (age < sevenDays) {
        this.postMessage({
          type: MessageToWebview.RestoreState,
          payload: savedState,
        });
        return;
      }
    }

    // No valid saved state, send fresh initialization
    this.postMessage({
      type: MessageToWebview.Initialize,
      payload: {},
    });
  }

  /**
   * Handle wizard completion
   */
  private async handleComplete(payload: any): Promise<void> {
    const { selectedPath } = payload;

    // Update configuration
    const config = vscode.workspace.getConfiguration("orca");
    await config.update("binaryPath", selectedPath, true);
    await config.update("installationWizardCompleted", true, true);
    await config.update("licenseAcknowledged", true, true);

    // Clear wizard state
    await this.context.globalState.update("orca.wizardState", undefined);

    // Show success message
    vscode.window
      .showInformationMessage("✅ ORCA installation configured successfully!", "Run Test Job")
      .then((selection) => {
        if (selection === "Run Test Job") {
          vscode.commands.executeCommand("vs-orca.validateOrca");
        }
      });

    // Close wizard
    this.panel.dispose();
  }

  /**
   * Post message to webview
   */
  private postMessage(message: Message): void {
    this.panel.webview.postMessage(message);
  }

  /**
   * Get HTML content for webview
   */
  private getHtmlContent(): string {
    const htmlPath = path.join(this.context.extensionPath, "src", "installation", "wizard", "wizard.html");

    // Read HTML file
    let html = fs.readFileSync(htmlPath, "utf-8");

    // Replace resource URIs with webview URIs
    const scriptUri = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(path.dirname(htmlPath), "wizard.js")));

    const styleUri = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(path.dirname(htmlPath), "wizard.css")));

    html = html
      .replace("{{scriptUri}}", scriptUri.toString())
      .replace("{{styleUri}}", styleUri.toString())
      .replace("{{cspSource}}", this.panel.webview.cspSource);

    return html;
  }

  /**
   * Dispose of the panel
   */
  private dispose(): void {
    WizardPanel.currentPanel = undefined;

    // Dispose of the panel
    this.panel.dispose();

    // Dispose of all disposables
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
```

---

## Implementation Steps

### Step 1: Create Basic Panel Structure (45 min)

- Create wizardPanel.ts file
- Implement static createOrShow method
- Implement singleton pattern
- Add basic constructor

### Step 2: Implement Message Passing (60 min)

- Define message enums and interfaces
- Implement handleWebviewMessage()
- Implement postMessage()
- Add message routing logic

### Step 3: Integrate Detector and Validator (45 min)

- Create detector and validator instances
- Implement runDetection()
- Implement validatePath()
- Handle errors appropriately

### Step 4: Implement State Persistence (45 min)

- Implement saveState()
- Implement restoreState()
- Add state expiration logic (7 days)
- Handle state clearing on completion

### Step 5: Implement Panel Lifecycle (30 min)

- Handle panel disposal
- Clean up disposables
- Handle view state changes
- Add icon

### Step 6: Implement HTML Loading (45 min)

- Create getHtmlContent()
- Handle resource URI conversion
- Set up CSP (Content Security Policy)
- Handle file reading errors

### Step 7: Testing and Polish (30 min)

- Test panel open/close
- Test message passing
- Test state persistence
- Add error handling

---

## Acceptance Criteria

- [ ] Wizard opens as webview panel
- [ ] Only one wizard instance allowed (singleton)
- [ ] Message passing works bidirectionally
- [ ] State persists across VS Code restarts
- [ ] Panel properly disposed on close
- [ ] No memory leaks (all disposables cleaned up)
- [ ] CSP configured correctly (no console errors)
- [ ] Panel retains content when hidden
- [ ] External links open in browser
- [ ] All public methods have JSDoc comments

---

## Message Protocol

### Extension → Webview

| Message Type        | Payload            | Description             |
| ------------------- | ------------------ | ----------------------- |
| `initialize`        | `{}`               | Fresh wizard start      |
| `restoreState`      | `WizardState`      | Resume from saved state |
| `detectionResults`  | `{installations}`  | Detection completed     |
| `validationResults` | `ValidationResult` | Validation completed    |
| `error`             | `{message, error}` | Error occurred          |

### Webview → Extension

| Message Type     | Payload          | Description              |
| ---------------- | ---------------- | ------------------------ |
| `ready`          | -                | Webview loaded and ready |
| `startDetection` | -                | Request to run detection |
| `validatePath`   | `{path}`         | Request to validate path |
| `saveState`      | `WizardState`    | Save wizard state        |
| `complete`       | `{selectedPath}` | Wizard completed         |
| `cancel`         | -                | User cancelled wizard    |
| `openExternal`   | `{url}`          | Open URL in browser      |

---

## Testing

### Unit Tests

Not applicable (webview integration requires manual testing)

### Manual Testing Checklist

- [ ] Open wizard via command palette
- [ ] Verify only one wizard opens at a time
- [ ] Send message from webview to extension
- [ ] Receive message from extension in webview
- [ ] Close and reopen wizard (state should persist)
- [ ] Wait 7+ days and reopen (state should be fresh)
- [ ] Complete wizard and verify configuration saved
- [ ] Close VS Code and reopen (test state persistence)
- [ ] Test external link opening

---

## Security Considerations

### Content Security Policy

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'none'; 
               img-src ${cspSource} https:; 
               script-src ${cspSource}; 
               style-src ${cspSource} 'unsafe-inline';"
/>
```

### Resource Loading

- Only load resources from `localResourceRoots`
- Use `webview.asWebviewUri()` for all resources
- Never load remote content directly

### Message Validation

- Always validate message types
- Validate message payloads before processing
- Never execute arbitrary code from webview

---

## Performance Considerations

- **Retain Context**: Use `retainContextWhenHidden: true` to keep state
- **Lazy Loading**: Load detector/validator only when needed
- **State Size**: Keep WizardState minimal (<1KB)
- **Message Throttling**: Debounce rapid messages if needed

---

## Deliverables

- [ ] Complete `src/installation/wizard/wizardPanel.ts` implementation
- [ ] Message passing protocol implemented
- [ ] State persistence working
- [ ] Singleton pattern enforced
- [ ] Proper disposal and cleanup
- [ ] JSDoc comments for all public methods
- [ ] Git commit: `feat: implement wizard webview panel (TASK-017)`

---

## Integration Points

### With Extension.ts

```typescript
// extension.ts
import { WizardPanel } from "./installation/wizard/wizardPanel";

const setupCommand = vscode.commands.registerCommand("vs-orca.setupOrca", () => {
  WizardPanel.createOrShow(context);
});

context.subscriptions.push(setupCommand);
```

### With package.json

```json
{
  "commands": [
    {
      "command": "vs-orca.setupOrca",
      "title": "Setup ORCA Installation",
      "category": "ORCA"
    }
  ]
}
```

---

## Notes

- Webview must be created before setting HTML content
- Always use webview.asWebviewUri() for resources
- CSP errors will appear in webview console
- Test state persistence thoroughly

---

## References

- PRD Section 3.2: Wizard Architecture
- PRD Section 3.6: State Persistence (FR-6)
- VS Code Webview API: https://code.visualstudio.com/api/extension-guides/webview
- VS Code Webview Sample: https://github.com/microsoft/vscode-extension-samples/tree/main/webview-sample

---

**Created**: December 20, 2025  
**Last Updated**: December 20, 2025
