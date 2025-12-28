/**
 * Composable for VS Code webview API access
 * Provides typed message passing between webview and extension
 */

interface VSCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

let vscodeApi: VSCodeApi | undefined;

/**
 * Get or create the VS Code API instance (singleton pattern)
 */
function getVSCodeApi(): VSCodeApi {
  if (!vscodeApi) {
    // In VS Code webview, acquireVsCodeApi is globally available
    if (typeof acquireVsCodeApi === 'function') {
      vscodeApi = acquireVsCodeApi();
    } else {
      // Fallback for development/testing outside VS Code
      console.warn('VS Code API not available, using mock');
      vscodeApi = {
        postMessage: (message: unknown) => console.log('[Mock VS Code] postMessage:', message),
        getState: () => null,
        setState: () => {}
      };
    }
  }
  return vscodeApi;
}

/**
 * Command types for webview → extension communication
 */
export type WebviewCommand =
  | { command: 'refresh' }
  | { command: 'copyToClipboard'; text: string }
  | { command: 'openOutputFile' }
  | { command: 'goToLine'; lineNumber: number };

/**
 * Composable for interacting with VS Code extension
 */
export function useVSCodeApi() {
  const vscode = getVSCodeApi();

  /**
   * Send a typed command to the extension
   */
  const postMessage = (message: WebviewCommand) => {
    vscode.postMessage(message);
  };

  /**
   * Navigate to a specific line in the output file
   */
  const goToLine = (lineNumber: number) => {
    postMessage({ command: 'goToLine', lineNumber });
  };

  /**
   * Trigger a refresh of the parsed data
   */
  const refresh = () => {
    postMessage({ command: 'refresh' });
  };

  /**
   * Copy text to clipboard via extension
   */
  const copyToClipboard = (text: string) => {
    postMessage({ command: 'copyToClipboard', text });
  };

  /**
   * Open the output file in editor
   */
  const openOutputFile = () => {
    postMessage({ command: 'openOutputFile' });
  };

  return {
    vscode,
    postMessage,
    goToLine,
    refresh,
    copyToClipboard,
    openOutputFile
  };
}
