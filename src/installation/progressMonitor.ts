/**
 * Progress monitor for automated installation
 * Manages real-time progress updates to the wizard webview
 */

import * as vscode from "vscode";
import { AutoInstallResult, AutoInstallationError } from "./types";

/**
 * Message types sent to webview for installation progress
 */
enum ProgressMessageType {
  ProgressUpdate = "progressUpdate",
  OutputLine = "outputLine",
  InstallationError = "installationError",
  InstallationComplete = "installationComplete",
}

/**
 * Progress update message payload
 */
interface ProgressUpdatePayload {
  percentage: number;
  message: string;
  elapsedTime?: number;
  estimatedRemaining?: number;
}

/**
 * Output line message payload
 */
interface OutputLinePayload {
  line: string;
  timestamp: number;
}

/**
 * Installation error message payload
 */
interface ErrorPayload {
  message: string;
  code: string;
  remediation: string[];
  canRetry: boolean;
}

/**
 * Installation complete message payload
 */
interface CompletePayload {
  success: boolean;
  binaryPath?: string;
  version?: string;
  duration: number;
}

/**
 * Monitors and reports installation progress to the webview
 */
export class ProgressMonitor {
  private webview: vscode.Webview;
  private startTime: number;
  private lastPercentage: number = 0;

  constructor(webview: vscode.Webview) {
    this.webview = webview;
    this.startTime = Date.now();
  }

  /**
   * Update installation progress
   * @param percentage Progress percentage (0-100)
   * @param message User-friendly progress message
   */
  updateProgress(percentage: number, message: string): void {
    // Validate percentage
    percentage = Math.max(0, Math.min(100, percentage));

    // Only send update if percentage changed or message is different
    if (percentage === this.lastPercentage && message === "") {
      return;
    }

    this.lastPercentage = percentage;

    const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);

    // Calculate estimated remaining time based on current progress
    let estimatedRemaining: number | undefined;
    if (percentage > 10 && percentage < 100) {
      const totalEstimated = (elapsedTime / percentage) * 100;
      estimatedRemaining = Math.floor(totalEstimated - elapsedTime);
    }

    const payload: ProgressUpdatePayload = {
      percentage,
      message,
      elapsedTime,
      estimatedRemaining,
    };

    this.sendMessage(ProgressMessageType.ProgressUpdate, payload);
  }

  /**
   * Stream a single line of output to the webview log
   * @param line Output line from installation process
   */
  streamOutput(line: string): void {
    const payload: OutputLinePayload = {
      line,
      timestamp: Date.now(),
    };

    this.sendMessage(ProgressMessageType.OutputLine, payload);
  }

  /**
   * Report an installation error
   * @param error Structured installation error
   */
  reportError(error: AutoInstallationError): void {
    const payload: ErrorPayload = {
      message: error.message,
      code: error.code,
      remediation: error.remediation,
      canRetry: error.canRetry,
    };

    this.sendMessage(ProgressMessageType.InstallationError, payload);
  }

  /**
   * Report installation completion
   * @param result Installation result
   */
  complete(result: AutoInstallResult): void {
    const duration = Math.floor((Date.now() - this.startTime) / 1000);

    const payload: CompletePayload = {
      success: result.success,
      binaryPath: result.binaryPath,
      version: result.version,
      duration,
    };

    this.sendMessage(ProgressMessageType.InstallationComplete, payload);
  }

  /**
   * Send a message to the webview
   */
  private sendMessage(type: ProgressMessageType, payload: unknown): void {
    this.webview.postMessage({
      type,
      payload,
    });
  }

  /**
   * Reset the progress monitor for a new installation attempt
   */
  reset(): void {
    this.startTime = Date.now();
    this.lastPercentage = 0;
  }
}
