/**
 * Conda-based installer
 * @deprecated Not used - ORCA requires manual installation from orcaforum.kofo.mpg.de
 */

import * as os from "os";
import { spawn, ChildProcess } from "child_process";
import { BaseAutoInstaller } from "./baseAutoInstaller";
import {
  Platform,
  ProgressCallback,
  AutoInstallResult,
} from "../types";

/**
 * @deprecated Not used
 */
export class CondaAutoInstaller extends BaseAutoInstaller {
  constructor() {
    super(os.platform() as Platform);
  }

  /**
   * Check if Conda is available on the system
   */
  async canInstall(): Promise<boolean> {
    return await this.commandExists("conda");
  }

  /**
   * Check if sudo/administrator privileges are required
   */
  requiresSudo(): boolean {
    // Conda typically installs to user directory, no sudo needed
    return false;
  }

  /**
   * Get estimated installation time in seconds
   */
  getEstimatedTime(): number {
    return 180; // 3 minutes average
  }

  /**
   * Execute automated Conda installation of ORCA
   * @param progressCallback Callback for progress updates
   * @returns Installation result
   */
  async install(progressCallback: ProgressCallback): Promise<AutoInstallResult> {
    const startTime = Date.now();

    try {
      // Step 1: Verify Conda is available
      progressCallback(5, "Verifying Conda installation...");
      const condaAvailable = await this.canInstall();
      if (!condaAvailable) {
        throw new Error("Conda is not installed or not in PATH");
      }

      // Step 2: Check Conda version
      progressCallback(10, "Checking Conda version...");
      const condaVersion = await this.getCommandVersion("conda", "--version");
      if (condaVersion) {
        // Verify minimum version (4.10)
        const versionMatch = condaVersion.match(/(\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1], 10);
          const minor = parseInt(versionMatch[2], 10);
          if (major < 4 || (major === 4 && minor < 10)) {
            progressCallback(
              15,
              `Warning: Conda ${major}.${minor} detected. Version 4.10+ recommended.`,
            );
          }
        }
      }

      // Step 3: Execute installation
      progressCallback(15, "Starting ORCA installation via Conda...");
      await this.executeCondaInstall(progressCallback);

      // Step 4: Verify installation
      progressCallback(95, "Verifying installation...");
      const binaryPath = await this.findOrcaBinary();
      if (!binaryPath) {
        throw new Error(
          "Installation completed but ORCA binary not found in Conda environment",
        );
      }

      // Step 5: Get installed version
      progressCallback(98, "Checking ORCA version...");
      const version = await this.getOrcaVersion(binaryPath);

      progressCallback(100, "Installation complete!");

      const duration = (Date.now() - startTime) / 1000;
      return {
        success: true,
        binaryPath,
        version,
        duration,
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      const installError = this.handleError(error as Error);

      return {
        success: false,
        error: installError.message,
        duration,
      };
    }
  }

  /**
   * Execute the Conda install command with progress monitoring
   */
  private async executeCondaInstall(
    progressCallback: ProgressCallback,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use array args for security (no shell injection)
      const args = ["install", "-c", "conda-forge", "orca", "-y"];

      const childProcess: ChildProcess = spawn("conda", args, {
        shell: false,
        env: process.env,
      });

      let currentProgress = 15;
      let lastOutput = "";

      // Monitor stdout for progress
      childProcess.stdout?.on("data", (data: Buffer) => {
        const output = data.toString();
        lastOutput = output;

        // Parse progress from Conda output
        const progress = this.parseCondaProgress(output);
        if (progress !== null && progress > currentProgress) {
          currentProgress = progress;
          const message = this.getProgressMessage(currentProgress);
          progressCallback(currentProgress, message);
        }
      });

      // Monitor stderr (Conda uses stderr for some progress info)
      childProcess.stderr?.on("data", (data: Buffer) => {
        const output = data.toString();
        // Conda outputs progress to stderr too
        const progress = this.parseCondaProgress(output);
        if (progress !== null && progress > currentProgress) {
          currentProgress = progress;
          const message = this.getProgressMessage(currentProgress);
          progressCallback(currentProgress, message);
        }
      });

      // Timeout after 10 minutes (declare before using in handlers)
      const timeoutHandle = setTimeout(() => {
        childProcess.kill("SIGTERM");
        reject(new Error("Installation timed out after 10 minutes"));
      }, 600000);

      // Handle errors
      childProcess.on("error", (error: Error) => {
        clearTimeout(timeoutHandle);
        reject(error);
      });

      // Handle completion
      childProcess.on("close", (code: number | null) => {
        clearTimeout(timeoutHandle);
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Conda installation failed with exit code ${code}\nLast output: ${lastOutput}`,
            ),
          );
        }
      });
    });
  }

  /**
   * Parse progress percentage from Conda output
   * Conda output includes phases: Collecting, Solving, Downloading, Installing
   */
  private parseCondaProgress(output: string): number | null {
    const lowerOutput = output.toLowerCase();

    // Phase-based progress estimation
    if (lowerOutput.includes("collecting package metadata")) {
      return 20;
    }
    if (lowerOutput.includes("solving environment")) {
      return 30;
    }
    if (
      lowerOutput.includes("downloading") ||
      lowerOutput.includes("fetching")
    ) {
      // If we see percentage in output
      const percentMatch = output.match(/(\d+)%/);
      if (percentMatch) {
        const percentage = parseInt(percentMatch[1], 10);
        // Map 0-100% of download to 40-80% overall progress
        return 40 + Math.floor(percentage * 0.4);
      }
      return 50; // Generic downloading progress
    }
    if (lowerOutput.includes("extracting") || lowerOutput.includes("extract")) {
      return 85;
    }
    if (
      lowerOutput.includes("installing") ||
      lowerOutput.includes("preparing transaction")
    ) {
      return 90;
    }
    if (lowerOutput.includes("verifying") || lowerOutput.includes("verify")) {
      return 92;
    }

    return null;
  }

  /**
   * Get user-friendly progress message based on percentage
   */
  private getProgressMessage(percentage: number): string {
    if (percentage < 20) {
      return "Initializing Conda...";
    }
    if (percentage < 30) {
      return "Collecting package metadata...";
    }
    if (percentage < 40) {
      return "Solving environment dependencies...";
    }
    if (percentage < 80) {
      return "Downloading ORCA and dependencies...";
    }
    if (percentage < 90) {
      return "Extracting packages...";
    }
    if (percentage < 95) {
      return "Installing ORCA...";
    }
    return "Finalizing installation...";
  }

  /**
   * Find ORCA binary in Conda environment
   */
  private async findOrcaBinary(): Promise<string | undefined> {
    try {
      // Try to find orca binary using Conda
      const result = await this.executeCommand("conda", ["run", "-n", "base", "which", "orca"], {
        timeout: 5000,
      });

      if (result.exitCode === 0 && result.stdout.trim()) {
        return result.stdout.trim();
      }

      // Fallback: use 'which' or 'where' command
      const checkCmd = this.platform === Platform.Windows ? "where" : "which";
      const fallbackResult = await this.executeCommand(checkCmd, ["orca"], {
        timeout: 5000,
      });

      if (fallbackResult.exitCode === 0 && fallbackResult.stdout.trim()) {
        return fallbackResult.stdout.trim().split("\n")[0];
      }
    } catch {
      // If commands fail, return undefined
      return undefined;
    }

    return undefined;
  }

  /**
   * Get ORCA version from installed binary
   */
  private async getOrcaVersion(binaryPath: string): Promise<string | undefined> {
    try {
      // ORCA requires an input file to run, so we can't use --version
      // Instead, try to parse version from binary path or use conda list
      const result = await this.executeCommand("conda", ["list", "orca", "--json"], {
        timeout: 5000,
      });

      if (result.exitCode === 0 && result.stdout.trim()) {
        try {
          const packages = JSON.parse(result.stdout);
          if (Array.isArray(packages) && packages.length > 0) {
            const orcaPackage = packages.find((pkg) => pkg.name === "orca");
            if (orcaPackage && orcaPackage.version) {
              return orcaPackage.version;
            }
          }
        } catch {
          // JSON parse failed, continue to fallback
        }
      }

      // Fallback: return "unknown"
      return "unknown";
    } catch {
      return undefined;
    }
  }
}
