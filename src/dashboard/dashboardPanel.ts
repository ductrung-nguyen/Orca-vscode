import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseOrcaOutputEnhanced, ParsedResults } from '../outputParser';
import { readFileWithEncoding } from '../utils/fileEncoding';

/**
 * Manages the results dashboard webview panel
 * Loads Vue3 + PrimeVue app from webview-ui/dist
 */
export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _outputFilePath: string;
    private _fileWatcher: vscode.FileSystemWatcher | undefined;

    /**
     * Create or show the dashboard panel
     */
    public static createOrShow(extensionUri: vscode.Uri, outputFilePath: string) {
        const column = vscode.ViewColumn.Two;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            DashboardPanel.currentPanel.updateOutputFile(outputFilePath);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'orcaDashboard',
            'ORCA Results',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')
                ],
                retainContextWhenHidden: true
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, outputFilePath);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, outputFilePath: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._outputFilePath = outputFilePath;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from Vue app
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'copyToClipboard':
                        this._copyToClipboard(message.text);
                        break;
                    case 'refresh':
                        this._update();
                        break;
                    case 'openOutputFile':
                        this._openOutputFile();
                        break;
                    case 'goToLine':
                        this._goToLine(message.lineNumber);
                        break;
                }
            },
            null,
            this._disposables
        );

        this._panel.onDidChangeViewState(
            e => {
                if (e.webviewPanel.visible) {
                    this._panel.webview.postMessage({ type: 'themeChanged' });
                }
            },
            null,
            this._disposables
        );

        this._setupFileWatcher();
    }

    public updateOutputFile(outputFilePath: string) {
        this._outputFilePath = outputFilePath;
        this._panel.title = `ORCA Results - ${path.basename(outputFilePath)}`;
        
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }
        this._setupFileWatcher();
        this._update();
    }

    private _setupFileWatcher() {
        const pattern = new vscode.RelativePattern(
            path.dirname(this._outputFilePath),
            path.basename(this._outputFilePath)
        );

        this._fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        this._fileWatcher.onDidChange(() => {
            setTimeout(() => this._sendDataUpdate(), 500);
        }, null, this._disposables);

        this._disposables.push(this._fileWatcher);
    }

    private async _copyToClipboard(data: string) {
        await vscode.env.clipboard.writeText(data);
        vscode.window.showInformationMessage('Results copied to clipboard');
    }

    private async _openOutputFile() {
        try {
            const document = await vscode.workspace.openTextDocument(this._outputFilePath);
            await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open output file: ${error}`);
        }
    }

    private async _goToLine(lineNumber: number) {
        try {
            const document = await vscode.workspace.openTextDocument(this._outputFilePath);
            const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
            
            const line = Math.max(0, lineNumber - 1);
            const position = new vscode.Position(line, 0);
            
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to navigate to line: ${error}`);
        }
    }

    private _parseResults(): ParsedResults | null {
        try {
            if (fs.existsSync(this._outputFilePath)) {
                const content = readFileWithEncoding(this._outputFilePath);
                const parsed = parseOrcaOutputEnhanced(content);
                
                // Add file information that the parser doesn't include
                return {
                    ...parsed,
                    fileName: path.basename(this._outputFilePath),
                    filePath: this._outputFilePath
                };
            }
        } catch (error) {
            console.error('Error parsing ORCA output:', error);
        }
        return null;
    }

    private _sendDataUpdate() {
        const results = this._parseResults();
        if (results) {
            this._panel.webview.postMessage({ type: 'updateData', data: results });
        }
    }

    private _update() {
        const webview = this._panel.webview;
        const results = this._parseResults();
        this._panel.webview.html = this._getHtmlForWebview(webview, results);
    }

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private _getHtmlForWebview(webview: vscode.Webview, results: ParsedResults | null): string {
        const nonce = this._getNonce();

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist', 'index.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist', 'index.css')
        );

        const initialData = results ? JSON.stringify(results) : 'null';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} data:; img-src ${webview.cspSource} data:;">
    <link href="${styleUri}" rel="stylesheet">
    <title>ORCA Results Dashboard</title>
</head>
<body>
    <div id="app"></div>
    <script nonce="${nonce}">
        window.initialData = ${initialData};
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
