/**
 * Base abstract class for automated ORCA installers
 * Provides common functionality and defines the contract for platform-specific installers
 */

import { spawn, ChildProcess } from "child_process";
import {
  Platform,
  ProgressCallback,
  AutoInstallResult,
  CommandResult,
  CommandOptions,
  AutoInstallationError,
  OutputCallback,
} from "../types";

/**
 * Abstract base class for automated installers
 * Subclasses implement specific package manager installation logic
 */
export abstract class BaseAutoInstaller {
  protected platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  /**
   * Check if this installer can run on the current system
   * @returns Promise resolving to true if installation is possible
   */
  abstract canInstall(): Promise<boolean>;

  /**
   * Execute the automated installation
   * @param progressCallback Callback for progress updates
   * @returns Promise resolving to installation result
   */
  abstract install(
    progressCallback: ProgressCallback,
  ): Promise<AutoInstallResult>;

  /**
   * Check if this installer requires sudo/administrator privileges
   * @returns true if sudo is required
   */
  abstract requiresSudo(): boolean;

  /**
   * Get estimated installation time in seconds
   * @returns Estimated duration
   */
  abstract getEstimatedTime(): number;

  /**
   * Execute a command with streaming output
   * @param cmd Command to execute
   * @param args Command arguments (array for safety)
   * @param options Execution options
   * @returns Promise resolving to command result
   */
  protected async executeCommand(
    cmd: string,
    args: string[],
    options?: CommandOptions,
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = "";
      let stderr = "";

      // Spawn process with array args (prevents shell injection)
      const childProcess = spawn(cmd, args, {
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env },
        shell: false, // Explicit safety: no shell interpretation
      });

      // Collect stdout
      childProcess.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr
      childProcess.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle completion
      childProcess.on("close", (code: number | null) => {
        resolve({
          exitCode: code ?? -1,
          stdout,
          stderr,
          duration: (Date.now() - startTime) / 1000,
        });
      });

      // Handle errors
      childProcess.on("error", (error: Error) => {
        reject(
          this.createError(
            "COMMAND_EXEC_ERROR",
            `Failed to execute command: ${error.message}`,
            error,
            ["Verify the command exists", "Check system permissions"],
            false,
          ),
        );
      });

      // Timeout handling
      let timeoutHandle: NodeJS.Timeout | undefined;
      if (options?.timeout) {
        timeoutHandle = setTimeout(() => {
          childProcess.kill("SIGTERM");
          reject(
            this.createError(
              "COMMAND_TIMEOUT",
              `Command timed out after ${options.timeout}ms`,
              undefined,
              ["Try again with a longer timeout", "Check network connection"],
              true,
            ),
          );
        }, options.timeout);
      }

      // Clear timeout on process completion/error
      childProcess.on("close", () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      });

      childProcess.on("error", () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      });
    });
  }

  /**
   * Stream output from a child process with callback
   * @param childProcess The spawned process
   * @param callback Callback for each output line
   */
  protected async streamOutput(
    childProcess: ChildProcess,
    callback: OutputCallback,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stream stdout line by line
      childProcess.stdout?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            callback(line.trim());
          }
        });
      });

      // Stream stderr line by line
      childProcess.stderr?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n");
        lines.forEach((line) => {
          if (line.trim()) {
            callback(`[stderr] ${line.trim()}`);
          }
        });
      });

      childProcess.on("close", (code: number | null) => {
        if (code === 0 || code === null) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      childProcess.on("error", (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse progress percentage from command output
   * Override in subclasses for package-manager-specific parsing
   * @param output Output line from command
   * @returns Progress percentage (0-100) or null if not found
   */
  protected parseProgress(output: string): number | null {
    // Default implementation: look for percentage patterns
    const percentMatch = output.match(/(\d+)%/);
    if (percentMatch) {
      return parseInt(percentMatch[1], 10);
    }
    return null;
  }

  /**
   * Handle and categorize errors with remediation steps
   * @param error The error to handle
   * @returns Structured installation error
   */
  protected handleError(
    error: Error | AutoInstallationError,
  ): AutoInstallationError {
    // If already an AutoInstallationError, return as-is
    if (this.isAutoInstallationError(error)) {
      return error;
    }

    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("enotfound")
    ) {
      return this.createError(
        "ERR_NETWORK_001",
        "Network connection failed",
        error,
        [
          "Check your internet connection",
          "Verify firewall/proxy settings",
          "Try again in a few minutes",
          "Use manual installation as fallback",
        ],
        true,
      );
    }

    // Disk space errors
    if (message.includes("no space") || message.includes("disk full")) {
      return this.createError(
        "ERR_DISK_001",
        "Insufficient disk space",
        error,
        [
          "Free up at least 2GB of disk space",
          "Remove unnecessary files or applications",
          "Choose a different installation location",
        ],
        false,
      );
    }

    // Permission errors
    if (message.includes("permission") || message.includes("eacces")) {
      return this.createError(
        "ERR_PERMISSION_001",
        "Permission denied",
        error,
        [
          "Try running with administrator privileges",
          "Check file system permissions",
          "Use manual installation with appropriate permissions",
        ],
        true,
      );
    }

    // Package not found
    if (
      message.includes("not found") ||
      message.includes("package") ||
      message.includes("404")
    ) {
      return this.createError(
        "ERR_PACKAGE_001",
        "Package not found in repository",
        error,
        [
          "Update package manager cache",
          "Verify ORCA is available for your platform",
          "Use alternative installation method",
        ],
        false,
      );
    }

    // Generic error
    return this.createError(
      "ERR_UNKNOWN",
      error.message || "Installation failed",
      error,
      [
        "Check the installation log for details",
        "Try manual installation",
        "Report this issue on GitHub",
      ],
      true,
    );
  }

  /**
   * Check if a command exists on the system
   * @param command Command name to check
   * @returns Promise resolving to true if command exists
   */
  protected async commandExists(command: string): Promise<boolean> {
    try {
      const checkCmd = this.platform === Platform.Windows ? "where" : "which";
      const result = await this.executeCommand(checkCmd, [command], {
        timeout: 5000,
      });
      return result.exitCode === 0 && result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get version of a command
   * @param command Command name
   * @param versionArg Argument to get version (default: --version)
   * @returns Version string or undefined
   */
  protected async getCommandVersion(
    command: string,
    versionArg: string = "--version",
  ): Promise<string | undefined> {
    try {
      const result = await this.executeCommand(command, [versionArg], {
        timeout: 5000,
      });
      if (result.exitCode === 0) {
        return result.stdout.trim();
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  /**
   * Create a structured installation error
   */
  private createError(
    code: string,
    message: string,
    originalError?: Error,
    remediation: string[] = [],
    canRetry: boolean = true,
  ): AutoInstallationError {
    return {
      code,
      message,
      originalError,
      remediation,
      canRetry,
      details: originalError ? { stack: originalError.stack } : undefined,
    };
  }

  /**
   * Type guard for AutoInstallationError
   */
  private isAutoInstallationError(
    error: unknown,
  ): error is AutoInstallationError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "remediation" in error
    );
  }
}
