/**
 * Package manager detection and priority utilities
 * Detects available package managers and ranks them by suitability
 */

import * as os from "os";
import { spawn } from "child_process";
import { Platform, PackageManager, PackageManagerInfo } from "./types";

/**
 * Detects and prioritizes package managers on the system
 */
export class PackageManagerDetector {
  private platform: Platform;

  constructor() {
    this.platform = os.platform() as Platform;
  }

  /**
   * Detect all available package managers
   * @returns Array of available package managers, sorted by priority
   */
  async detectAvailableManagers(): Promise<PackageManagerInfo[]> {
    const managers: PackageManagerInfo[] = [];

    // Check Conda (highest priority, cross-platform)
    const condaInfo = await this.checkConda();
    if (condaInfo.available) {
      managers.push(condaInfo);
    }

    // Platform-specific package managers
    switch (this.platform) {
            case Platform.MacOS: {
                const brewInfo = await this.checkHomebrew();
                if (brewInfo.available) {
                    managers.push(brewInfo);
                }
                break;
            }
                
            case Platform.Linux: {
                // Check apt (Debian/Ubuntu)
                const aptInfo = await this.checkApt();
                if (aptInfo.available) {
                    managers.push(aptInfo);
                }
                
                // Check yum (RHEL/CentOS)
                const yumInfo = await this.checkYum();
                if (yumInfo.available) {
                    managers.push(yumInfo);
                }
                break;
            }
                
            case Platform.Windows: {
                // Check winget (Windows 11+)
                const wingetInfo = await this.checkWinget();
                if (wingetInfo.available) {
                    managers.push(wingetInfo);
                }
                break;
            }
        }
        
        // Sort by priority (lower number = higher priority)
        return managers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if Conda is available
   */
  private async checkConda(): Promise<PackageManagerInfo> {
    const available = await this.commandExists("conda");
    let version: string | undefined;
    let path: string | undefined;

    if (available) {
      version = await this.getCommandVersion("conda", "--version");
      path = await this.getCommandPath("conda");
    }

    return {
      manager: PackageManager.Conda,
      available,
      version,
      path,
      priority: 1, // Highest priority (recommended)
      requiresSudo: false,
    };
  }

  /**
   * Check if Homebrew is available (macOS)
   */
  private async checkHomebrew(): Promise<PackageManagerInfo> {
    const available = await this.commandExists("brew");
    let version: string | undefined;
    let path: string | undefined;

    if (available) {
      version = await this.getCommandVersion("brew", "--version");
      path = await this.getCommandPath("brew");
    }

    return {
      manager: PackageManager.Homebrew,
      available,
      version,
      path,
      priority: 2,
      requiresSudo: false, // Homebrew typically doesn't require sudo
    };
  }

  /**
   * Check if apt is available (Debian/Ubuntu)
   */
  private async checkApt(): Promise<PackageManagerInfo> {
    const available = await this.commandExists("apt");
    let version: string | undefined;
    let path: string | undefined;

    if (available) {
      version = await this.getCommandVersion("apt", "--version");
      path = await this.getCommandPath("apt");
    }

    return {
      manager: PackageManager.Apt,
      available,
      version,
      path,
      priority: 3,
      requiresSudo: true, // apt requires sudo for installation
    };
  }

  /**
   * Check if yum is available (RHEL/CentOS)
   */
  private async checkYum(): Promise<PackageManagerInfo> {
    const available = await this.commandExists("yum");
    let version: string | undefined;
    let path: string | undefined;

    if (available) {
      version = await this.getCommandVersion("yum", "--version");
      path = await this.getCommandPath("yum");
    }

    return {
      manager: PackageManager.Yum,
      available,
      version,
      path,
      priority: 3,
      requiresSudo: true, // yum requires sudo for installation
    };
  }

  /**
   * Check if winget is available (Windows)
   */
  private async checkWinget(): Promise<PackageManagerInfo> {
    const available = await this.commandExists("winget");
    let version: string | undefined;
    let path: string | undefined;

    if (available) {
      version = await this.getCommandVersion("winget", "--version");
      path = await this.getCommandPath("winget");
    }

    return {
      manager: PackageManager.Winget,
      available,
      version,
      path,
      priority: 2,
      requiresSudo: false, // winget doesn't require admin for user-scope installs
    };
  }

  /**
   * Check if a command exists on the system
   */
  private async commandExists(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const checkCmd = this.platform === Platform.Windows ? "where" : "which";
      const process = spawn(checkCmd, [command], { shell: true });

      const timeout = setTimeout(() => {
        process.kill("SIGTERM");
        resolve(false);
      }, 5000); // 5 second timeout

      let hasOutput = false;

      process.stdout?.on("data", () => {
        hasOutput = true;
      });

      process.on("close", (code: number | null) => {
        clearTimeout(timeout);
        resolve(code === 0 && hasOutput);
      });

      process.on("error", () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  /**
   * Get version string of a command
   */
  private async getCommandVersion(
    command: string,
    versionArg: string,
  ): Promise<string | undefined> {
    return new Promise((resolve) => {
      const process = spawn(command, [versionArg], { shell: false });
      let output = "";

      const timeout = setTimeout(() => {
        process.kill("SIGTERM");
        resolve(undefined);
      }, 5000);

      process.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      process.on("close", (code: number | null) => {
        clearTimeout(timeout);
        if (code === 0 && output.trim()) {
          // Extract version number (first line, cleaned)
          const firstLine = output.split("\n")[0].trim();
          resolve(firstLine);
        } else {
          resolve(undefined);
        }
      });

      process.on("error", () => {
        clearTimeout(timeout);
        resolve(undefined);
      });
    });
  }

  /**
   * Get absolute path of a command
   */
  private async getCommandPath(command: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const checkCmd = this.platform === Platform.Windows ? "where" : "which";
      const process = spawn(checkCmd, [command], { shell: true });
      let output = "";

      const timeout = setTimeout(() => {
        process.kill("SIGTERM");
        resolve(undefined);
      }, 5000);

      process.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      process.on("close", (code: number | null) => {
        clearTimeout(timeout);
        if (code === 0 && output.trim()) {
          // Return first path if multiple found
          const firstPath = output.split("\n")[0].trim();
          resolve(firstPath);
        } else {
          resolve(undefined);
        }
      });

      process.on("error", () => {
        clearTimeout(timeout);
        resolve(undefined);
      });
    });
  }

  /**
   * Get recommended package manager (highest priority available)
   */
  async getRecommendedManager(): Promise<PackageManagerInfo | undefined> {
    const managers = await this.detectAvailableManagers();
    return managers.length > 0 ? managers[0] : undefined;
  }
}
