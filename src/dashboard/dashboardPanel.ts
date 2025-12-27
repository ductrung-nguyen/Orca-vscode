import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseOrcaOutputEnhanced, ParsedResults, TocEntry } from '../outputParser';
import { readFileWithEncoding } from '../utils/fileEncoding';

/**
 * Manages the results dashboard webview panel
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

        // If we already have a panel, show it
        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            DashboardPanel.currentPanel.updateOutputFile(outputFilePath);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            'orcaDashboard',
            'ORCA Results',
            column,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, outputFilePath);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, outputFilePath: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._outputFilePath = outputFilePath;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'copyToClipboard':
                        this._copyToClipboard(message.data);
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

        // Listen for visibility changes and tell webview to restore scroll
        this._panel.onDidChangeViewState(
            e => {
                if (e.webviewPanel.visible) {
                    // Webview became visible - tell it to restore scroll position
                    this._panel.webview.postMessage({ command: 'restoreScroll' });
                }
            },
            null,
            this._disposables
        );

        // Watch for file changes
        this._setupFileWatcher();
    }

    /**
     * Update the displayed output file
     */
    public updateOutputFile(outputFilePath: string) {
        this._outputFilePath = outputFilePath;
        this._panel.title = `ORCA Results - ${path.basename(outputFilePath)}`;
        
        // Re-setup file watcher
        if (this._fileWatcher) {
            this._fileWatcher.dispose();
        }
        this._setupFileWatcher();
        
        this._update();
    }

    /**
     * Setup file system watcher for live updates
     */
    private _setupFileWatcher() {
        const pattern = new vscode.RelativePattern(
            path.dirname(this._outputFilePath),
            path.basename(this._outputFilePath)
        );

        this._fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

        this._fileWatcher.onDidChange(() => {
            // Debounce updates
            setTimeout(() => this._update(), 500);
        }, null, this._disposables);

        this._disposables.push(this._fileWatcher);
    }

    /**
     * Copy data to clipboard
     */
    private async _copyToClipboard(data: string) {
        await vscode.env.clipboard.writeText(data);
        vscode.window.showInformationMessage('Results copied to clipboard');
    }

    /**
     * Open the output file in the editor
     */
    private async _openOutputFile() {
        try {
            const document = await vscode.workspace.openTextDocument(this._outputFilePath);
            await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open output file: ${error}`);
        }
    }

    /**
     * Open the output file at a specific line number
     */
    private async _goToLine(lineNumber: number) {
        try {
            const document = await vscode.workspace.openTextDocument(this._outputFilePath);
            const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
            
            // Convert to 0-indexed line number and create position
            const line = Math.max(0, lineNumber - 1);
            const position = new vscode.Position(line, 0);
            
            // Set cursor position and reveal the line
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to navigate to line: ${error}`);
        }
    }

    /**
     * Update the webview content
     */
    private _update() {
        const webview = this._panel.webview;

        // Read and parse the output file
        let results: ParsedResults | null = null;
        let errorMessage: string | null = null;

        try {
            if (fs.existsSync(this._outputFilePath)) {
                const content = readFileWithEncoding(this._outputFilePath);
                results = parseOrcaOutputEnhanced(content);
            } else {
                errorMessage = 'Output file not found';
            }
        } catch (error) {
            errorMessage = `Error reading output file: ${error}`;
        }

        this._panel.webview.html = this._getHtmlForWebview(webview, results, errorMessage);
    }

    /**
     * Generate HTML content for the webview
     */
    private _getHtmlForWebview(webview: vscode.Webview, results: ParsedResults | null, error: string | null): string {
        if (error) {
            return this._getErrorHtml(error);
        }

        if (!results) {
            return this._getLoadingHtml();
        }

        const resultsJson = JSON.stringify(results, null, 2);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ORCA Results Dashboard</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 0;
            margin: 0;
            line-height: 1.6;
        }
        
        /* Dashboard container with TOC sidebar */
        .dashboard-container {
            display: flex;
            flex-direction: row;
            min-height: 100vh;
        }
        
        /* TOC Sidebar styles */
        .toc-sidebar {
            width: 220px;
            min-width: 180px;
            max-width: 280px;
            border-right: 1px solid var(--vscode-panel-border);
            padding: 12px;
            position: sticky;
            top: 0;
            max-height: 100vh;
            overflow-y: auto;
            flex-shrink: 0;
            background-color: var(--vscode-sideBar-background);
        }
        
        .toc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-weight: bold;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .toc-toggle {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 4px 8px;
            font-size: 14px;
            border-radius: 4px;
        }
        
        .toc-toggle:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .toc-entry {
            padding: 6px 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            border-radius: 4px;
            margin: 2px 0;
            font-size: 13px;
        }
        
        .toc-entry:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .toc-entry.success {
            color: var(--vscode-testing-iconPassed);
        }
        
        .toc-entry.warning {
            color: var(--vscode-editorWarning-foreground);
        }
        
        .toc-entry.error {
            color: var(--vscode-testing-iconFailed);
        }
        
        .toc-icon {
            margin-right: 8px;
            flex-shrink: 0;
        }
        
        .toc-title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .toc-collapsed .toc-entries {
            display: none;
        }
        
        .toc-empty {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 8px;
        }
        
        /* Main content area */
        .main-content {
            flex: 1;
            min-width: 0;
            padding: 20px;
        }
        
        h1, h2, h3 {
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
            margin-top: 24px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .status.success {
            background-color: var(--vscode-testing-iconPassed);
            color: var(--vscode-editor-background);
        }
        
        .status.failed {
            background-color: var(--vscode-testing-iconFailed);
            color: var(--vscode-editor-background);
        }
        
        .status.warning {
            background-color: var(--vscode-testing-iconQueued);
            color: var(--vscode-editor-background);
        }
        
        .metric {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 12px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 4px solid var(--vscode-activityBarBadge-background);
        }
        
        .metric-label {
            font-weight: bold;
            color: var(--vscode-textPreformat-foreground);
            margin-bottom: 4px;
        }
        
        .metric-value {
            font-size: 18px;
            font-family: var(--vscode-editor-font-family);
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin: 16px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            background-color: var(--vscode-editor-background);
        }
        
        th, td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid var(--vscode-panel-border);
        }
        
        th {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
        }
        
        .imaginary {
            color: var(--vscode-testing-iconFailed);
            font-weight: bold;
        }
        
        .message {
            padding: 8px 12px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 4px solid;
        }
        
        .message.warning {
            border-left-color: var(--vscode-testing-iconQueued);
            background-color: var(--vscode-inputValidation-warningBackground);
        }
        
        .message.error {
            border-left-color: var(--vscode-testing-iconFailed);
            background-color: var(--vscode-inputValidation-errorBackground);
        }
        
        .line-link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
        }
        
        .line-link:hover {
            color: var(--vscode-textLink-activeForeground);
            text-decoration: underline;
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 8px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .empty {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .json-export {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .button-group {
            display: flex;
            justify-content: flex-start;
            gap: 12px;
            margin-top: 16px;
        }
        
        .button-icon {
            margin-right: 6px;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        ${this._generateTocSidebar(results.tocEntries)}
        <div class="main-content">
            <div class="header">
                <h1>ORCA Results Dashboard</h1>
                <div class="button-group">
                    <button onclick="openOutputFile()"><span class="button-icon">📄</span>Open Output File</button>
                    <button onclick="exportResults()"><span class="button-icon">📋</span>Copy JSON</button>
                    <button onclick="refresh()"><span class="button-icon">🔄</span>Refresh</button>
                </div>
            </div>
            
            ${this._generateSummarySection(results)}
            ${this._generateEnergySection(results)}
            ${this._generateScfSection(results)}
            ${this._generateOptimizationSection(results)}
            ${this._generateFrequencySection(results)}
            ${this._generateDiagnosticsSection(results)}
            ${this._generateTimingSection(results)}
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        const results = ${resultsJson};
        
        function openOutputFile() {
            vscode.postMessage({ command: 'openOutputFile' });
        }
        
        function refresh() {
            vscode.postMessage({ command: 'refresh' });
        }
        
        function exportResults() {
            const jsonString = JSON.stringify(results, null, 2);
            vscode.postMessage({ command: 'copyToClipboard', data: jsonString });
        }
        
        function goToLine(lineNumber) {
            // Save scroll position before navigating
            saveScrollPosition();
            vscode.postMessage({ command: 'goToLine', lineNumber: lineNumber });
        }
        
        // TOC navigation function
        function navigateToLine(lineNumber) {
            // Save scroll position before navigation
            saveScrollPosition();
            
            // Send message to extension to navigate
            vscode.postMessage({
                command: 'goToLine',
                lineNumber: lineNumber
            });
        }
        
        // TOC toggle function
        function toggleToc() {
            const sidebar = document.getElementById('tocSidebar');
            const icon = document.getElementById('tocToggleIcon');
            
            if (sidebar) {
                sidebar.classList.toggle('toc-collapsed');
                if (icon) {
                    icon.textContent = sidebar.classList.contains('toc-collapsed') ? '+' : '−';
                }
                
                // Save collapse state
                const state = vscode.getState() || {};
                state.tocCollapsed = sidebar.classList.contains('toc-collapsed');
                vscode.setState(state);
            }
        }
        
        // Restore TOC collapse state on load
        function restoreTocState() {
            const state = vscode.getState();
            if (state && state.tocCollapsed) {
                const sidebar = document.getElementById('tocSidebar');
                const icon = document.getElementById('tocToggleIcon');
                if (sidebar) {
                    sidebar.classList.add('toc-collapsed');
                    if (icon) {
                        icon.textContent = '+';
                    }
                }
            }
        }
        
        // Scroll position management
        function saveScrollPosition() {
            const state = vscode.getState() || {};
            state.scrollTop = window.scrollY;
            vscode.setState(state);
        }
        
        function restoreScrollPosition() {
            const state = vscode.getState();
            if (state && state.scrollTop !== undefined && state.scrollTop > 0) {
                // Use multiple attempts with delays to ensure scroll works
                const targetScroll = state.scrollTop;
                
                // Immediate attempt
                window.scrollTo(0, targetScroll);
                
                // Delayed attempts for reliability
                requestAnimationFrame(() => {
                    window.scrollTo(0, targetScroll);
                });
                
                setTimeout(() => {
                    window.scrollTo(0, targetScroll);
                }, 50);
                
                setTimeout(() => {
                    window.scrollTo(0, targetScroll);
                }, 150);
            }
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'restoreScroll') {
                restoreScrollPosition();
            }
        });
        
        // Restore scroll position and TOC state on various events
        document.addEventListener('DOMContentLoaded', () => {
            restoreScrollPosition();
            restoreTocState();
        });
        window.addEventListener('load', () => {
            restoreScrollPosition();
            restoreTocState();
        });
        
        // Restore when page becomes visible (e.g., when switching back to webview)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                restoreScrollPosition();
            }
        });
        
        // Also restore on focus (backup mechanism)
        window.addEventListener('focus', restoreScrollPosition);
        
        // Save scroll position periodically
        window.addEventListener('scroll', () => {
            clearTimeout(window.scrollSaveTimeout);
            window.scrollSaveTimeout = setTimeout(saveScrollPosition, 100);
        });
        
        // Toggle warnings collapsible section
        function toggleWarnings() {
            const content = document.getElementById('warningsContent');
            const icon = document.getElementById('warningsToggleIcon');
            if (content && icon) {
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.textContent = '▼';
                } else {
                    content.style.display = 'none';
                    icon.textContent = '▶';
                }
            }
        }
    </script>
</body>
</html>`;
    }

    /**
     * Generate TOC sidebar HTML from TocEntry array
     */
    private _generateTocSidebar(entries: TocEntry[]): string {
        if (entries.length === 0) {
            return `
            <div class="toc-sidebar" id="tocSidebar">
                <div class="toc-header">
                    <span>Table of Contents</span>
                </div>
                <div class="toc-empty">No sections found</div>
            </div>
            `;
        }

        const entriesHtml = entries.map(entry => {
            const statusClass = entry.status ? ` ${entry.status}` : '';
            return `
                <div class="toc-entry${statusClass}" 
                     onclick="navigateToLine(${entry.lineNumber})" 
                     title="Line ${entry.lineNumber}">
                    <span class="toc-icon">${entry.icon || ''}</span>
                    <span class="toc-title">${this._escapeHtml(entry.title)}</span>
                </div>
            `;
        }).join('');

        return `
        <div class="toc-sidebar" id="tocSidebar">
            <div class="toc-header">
                <span>Table of Contents</span>
                <button class="toc-toggle" onclick="toggleToc()" title="Toggle TOC">
                    <span id="tocToggleIcon">−</span>
                </button>
            </div>
            <div class="toc-entries" id="tocEntries">
                ${entriesHtml}
            </div>
        </div>
        `;
    }

    private _generateSummarySection(results: ParsedResults): string {
        // Job status display
        let jobStatusClass: string;
        let jobStatusText: string;
        switch (results.jobStatus) {
            case 'finished':
                jobStatusClass = 'success';
                jobStatusText = '✓ Finished';
                break;
            case 'died':
                jobStatusClass = 'failed';
                jobStatusText = '✗ Died';
                break;
            case 'running':
                jobStatusClass = 'warning';
                jobStatusText = '⏳ Running';
                break;
            case 'killed':
                jobStatusClass = 'warning';
                jobStatusText = '⚠ Killed';
                break;
            default:
                jobStatusClass = 'warning';
                jobStatusText = '? Unknown';
        }

        // Total optimization steps (N/A if no geometry optimization)
        const totalOptSteps = results.geometrySteps.length > 0 
            ? results.geometrySteps.length.toString() 
            : 'N/A';

        return `
    <section>
        <h2>Summary</h2>
        <div class="grid">
            <div class="metric">
                <div class="metric-label">Job Status</div>
                <div class="metric-value"><span class="status ${jobStatusClass}">${jobStatusText}</span></div>
            </div>
            <div class="metric">
                <div class="metric-label">Final Energy</div>
                <div class="metric-value">${results.finalEnergy !== null ? results.finalEnergy.toFixed(8) + ' Eh' : 'N/A'}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Total Opt Steps</div>
                <div class="metric-value">${totalOptSteps}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Warnings</div>
                <div class="metric-value">${results.warnings.length}</div>
            </div>
        </div>
    </section>`;
    }

    private _generateEnergySection(results: ParsedResults): string {
        if (results.finalEnergy === null) {
            return '';
        }

        return `
    <section>
        <h2>Energy</h2>
        <div class="metric">
            <div class="metric-label">Final Single Point Energy</div>
            <div class="metric-value">${results.finalEnergy.toFixed(10)} Hartree</div>
        </div>
        ${results.zeroPointEnergy !== null ? `
        <div class="metric">
            <div class="metric-label">Zero Point Energy</div>
            <div class="metric-value">${results.zeroPointEnergy.toFixed(6)} Hartree</div>
        </div>` : ''}
    </section>`;
    }

    private _generateScfSection(results: ParsedResults): string {
        if (results.scfIterations.length === 0) {
            return '';
        }

        const lastIteration = results.scfIterations[results.scfIterations.length - 1];
        const rows = results.scfIterations.slice(-10).map(iter => `
            <tr>
                <td>${iter.iteration}</td>
                <td>${iter.energy.toFixed(8)}</td>
                <td>${iter.deltaE.toExponential(4)}</td>
                <td>${iter.maxDensityChange.toExponential(4)}</td>
                <td>${iter.rmsDensityChange.toExponential(4)}</td>
            </tr>
        `).join('');

        return `
    <section>
        <h2>SCF Convergence</h2>
        <div class="metric">
            <div class="metric-label">Total Iterations</div>
            <div class="metric-value">${results.scfIterations.length}</div>
        </div>
        <h3>Last 10 Iterations</h3>
        <table>
            <thead>
                <tr>
                    <th>Iter</th>
                    <th>Energy (Eh)</th>
                    <th>ΔE</th>
                    <th>Max DP</th>
                    <th>RMS DP</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </section>`;
    }

    private _generateOptimizationSection(results: ParsedResults): string {
        if (results.geometrySteps.length === 0) {
            return '';
        }

        const rows = results.geometrySteps.map(step => {
            const deltaEDisplay = step.deltaEnergy !== undefined 
                ? step.deltaEnergy.toExponential(1) 
                : '-';
            const rmsGradDisplay = step.rmsGradient !== undefined 
                ? step.rmsGradient.toExponential(1) 
                : 'N/A';
            return `
            <tr>
                <td>${step.stepNumber}</td>
                <td>${step.energy !== undefined ? step.energy.toFixed(8) : 'N/A'}</td>
                <td>${deltaEDisplay}</td>
                <td>${rmsGradDisplay}</td>
            </tr>
        `;
        }).join('');

        return `
    <section>
        <h2>Geometry Optimization</h2>
        <div class="metric">
            <div class="metric-label">Status</div>
            <div class="metric-value"><span class="status ${results.optimizationConverged ? 'success' : 'warning'}">
                ${results.optimizationConverged ? '✓ Converged' : '⚠ Not Converged'}
            </span></div>
        </div>
        <div class="metric">
            <div class="metric-label">Total Steps</div>
            <div class="metric-value">${results.geometrySteps.length}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Step</th>
                    <th>Energy (Eh)</th>
                    <th>Delta E</th>
                    <th>RMS Gradient</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </section>`;
    }

    private _generateFrequencySection(results: ParsedResults): string {
        if (results.frequencies.length === 0) {
            return '';
        }

        const rows = results.frequencies.map(freq => `
            <tr>
                <td>${freq.modeNumber}</td>
                <td class="${freq.isImaginary ? 'imaginary' : ''}">${freq.frequency.toFixed(2)}</td>
                <td>${freq.intensity.toFixed(3)}</td>
                <td>${freq.isImaginary ? '⚠ Imaginary' : ''}</td>
            </tr>
        `).join('');

        return `
    <section>
        <h2>Vibrational Frequencies</h2>
        <div class="grid">
            <div class="metric">
                <div class="metric-label">Total Modes</div>
                <div class="metric-value">${results.frequencies.length}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Imaginary Frequencies</div>
                <div class="metric-value ${results.imaginaryFreqCount > 0 ? 'imaginary' : ''}">
                    ${results.imaginaryFreqCount}
                </div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Mode</th>
                    <th>Frequency (cm⁻¹)</th>
                    <th>Intensity</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </section>`;
    }

    private _generateDiagnosticsSection(results: ParsedResults): string {
        // Only show diagnostics if there are warnings (T7: removed errors section)
        if (results.warnings.length === 0) {
            return '';
        }

        const warningItems = results.warnings.map(w => `
            <div class="message warning">
                <strong>Warning:</strong> ${this._escapeHtml(w.message)}
                ${w.lineNumber ? ` <a href="#" class="line-link" onclick="goToLine(${w.lineNumber}); return false;">(line ${w.lineNumber})</a>` : ''}
            </div>
        `).join('');

        // T6: Default collapsed if > 3 warnings
        const defaultCollapsed = results.warnings.length > 3;
        const collapsedClass = defaultCollapsed ? 'collapsed' : '';
        const toggleIcon = defaultCollapsed ? '▶' : '▼';

        return `
    <section>
        <h2>Diagnostics</h2>
        <div class="collapsible-header" onclick="toggleWarnings()" style="cursor: pointer; user-select: none;">
            <span id="warningsToggleIcon" style="margin-right: 8px;">${toggleIcon}</span>
            <h3 style="display: inline; margin: 0;">Warnings (${results.warnings.length})</h3>
        </div>
        <div id="warningsContent" class="collapsible-content ${collapsedClass}" style="${defaultCollapsed ? 'display: none;' : ''}">
            ${warningItems}
        </div>
    </section>`;
    }

    private _generateTimingSection(results: ParsedResults): string {
        if (results.totalRunTime === null) {
            return '';
        }

        const hours = Math.floor(results.totalRunTime / 3600);
        const minutes = Math.floor((results.totalRunTime % 3600) / 60);
        const seconds = Math.floor(results.totalRunTime % 60);
        const timeString = `${hours}h ${minutes}m ${seconds}s`;

        return `
    <section>
        <h2>Timing</h2>
        <div class="metric">
            <div class="metric-label">Total Run Time</div>
            <div class="metric-value">${timeString}</div>
        </div>
    </section>`;
    }

    private _getErrorHtml(error: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .error {
            text-align: center;
            color: var(--vscode-errorForeground);
        }
    </style>
</head>
<body>
    <div class="error">
        <h1>Error</h1>
        <p>${this._escapeHtml(error)}</p>
    </div>
</body>
</html>`;
    }

    private _getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div>Loading results...</div>
</body>
</html>`;
    }

    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;

        // Clean up resources
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
