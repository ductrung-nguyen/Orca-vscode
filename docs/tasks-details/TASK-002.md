# TASK-002: ORCA Detector Module

**Phase**: Phase 1 - Detection & Validation Foundation  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 4-5 hours  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Implement the `OrcaDetector` class that automatically scans the system for ORCA installations across all supported operating systems. This is a critical component that enables auto-configuration and reduces user friction during setup.

---

## Dependencies

**Blocked By**:

- TASK-001 (Project Structure Setup)

**Blocks**:

- TASK-004 (Version Parser Implementation)
- TASK-005 (Detection Unit Tests)
- TASK-007 (Integration with runJob Command)
- TASK-021 (Detection Step Integration)
- TASK-030 (Detect ORCA Command)

---

## Objectives

1. Implement comprehensive ORCA installation detection across all OSes
2. Support detection from multiple sources (PATH, standard dirs, Conda, env vars)
3. Handle multiple installations with intelligent prioritization
4. Provide accurate version information for each detected installation
5. Gracefully handle detection failures and edge cases

---

## Technical Specifications

### Class Interface

**Location**: `src/installation/detector.ts`

```typescript
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawn } from "child_process";
import { OrcaInstallation, Platform } from "./types";

export class OrcaDetector {
  private platform: Platform;

  constructor() {
    this.platform = os.platform() as Platform;
  }

  /**
   * Scan system for ORCA installations
   * @returns Array of detected installations, sorted by priority
   */
  async detectInstallations(): Promise<OrcaInstallation[]> {
    const installations: OrcaInstallation[] = [];

    // 1. Check user-configured path first (highest priority)
    const configuredPath = this.getConfiguredPath();
    if (configuredPath) {
      const installation = await this.validateBinary(configuredPath);
      if (installation.isValid) {
        installation.detectionSource = "user-config";
        installations.push(installation);
      }
    }

    // 2. Check environment variables
    const envPaths = this.getEnvironmentPaths();
    for (const envPath of envPaths) {
      const installation = await this.validateBinary(envPath);
      if (installation.isValid && !this.isDuplicate(installations, installation)) {
        installation.detectionSource = "environment-variable";
        installations.push(installation);
      }
    }

    // 3. Check PATH
    const pathInstallations = await this.checkPathVariable();
    for (const installation of pathInstallations) {
      if (!this.isDuplicate(installations, installation)) {
        installations.push(installation);
      }
    }

    // 4. Check standard directories
    const standardInstallations = await this.checkStandardDirectories();
    for (const installation of standardInstallations) {
      if (!this.isDuplicate(installations, installation)) {
        installations.push(installation);
      }
    }

    // 5. Check Conda environments
    const condaInstallations = await this.checkCondaEnvironments();
    for (const installation of condaInstallations) {
      if (!this.isDuplicate(installations, installation)) {
        installations.push(installation);
      }
    }

    // Sort by priority: valid > version (latest first) > path
    return this.sortInstallations(installations);
  }

  /**
   * Validate a specific ORCA binary path
   * @param binaryPath Absolute path to orca executable
   */
  async validateBinary(binaryPath: string): Promise<OrcaInstallation> {
    // Will integrate with TASK-004 for version parsing
  }

  /**
   * Get configured binary path from settings
   */
  private getConfiguredPath(): string | undefined {
    const config = vscode.workspace.getConfiguration("orca");
    const binaryPath = config.get<string>("binaryPath");

    // Ignore default placeholder path
    if (binaryPath && binaryPath !== "/opt/orca/orca") {
      return binaryPath;
    }

    return undefined;
  }

  /**
   * Get paths from environment variables
   */
  private getEnvironmentPaths(): string[] {
    const paths: string[] = [];

    // Check ORCA-specific environment variables
    const orcaPath = process.env.ORCA_PATH;
    const orcaHome = process.env.ORCA_HOME;

    if (orcaPath) {
      paths.push(path.join(orcaPath, "orca"));
    }

    if (orcaHome) {
      paths.push(path.join(orcaHome, "orca"));
      paths.push(path.join(orcaHome, "bin", "orca"));
    }

    return paths.filter((p) => fs.existsSync(p));
  }

  /**
   * Search PATH environment variable for orca
   */
  private async checkPathVariable(): Promise<OrcaInstallation[]> {
    // Use 'which orca' on Unix, 'where orca' on Windows
  }

  /**
   * Check OS-specific standard installation directories
   */
  private async checkStandardDirectories(): Promise<OrcaInstallation[]> {
    const dirs = this.getStandardDirectories();
    const installations: OrcaInstallation[] = [];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const installation = await this.validateBinary(dir);
        if (installation.isValid) {
          installation.detectionSource = "standard-directory";
          installations.push(installation);
        }
      }
    }

    return installations;
  }

  /**
   * Get standard directories based on OS
   */
  private getStandardDirectories(): string[] {
    switch (this.platform) {
      case Platform.Linux:
        return [
          "/opt/orca/orca",
          "/usr/local/orca/orca",
          "/usr/bin/orca",
          path.join(os.homedir(), "orca", "orca"),
          path.join(os.homedir(), ".local", "bin", "orca"),
        ];

      case Platform.MacOS:
        return [
          "/usr/local/bin/orca",
          "/opt/homebrew/bin/orca",
          "/usr/local/orca/orca",
          path.join(os.homedir(), "Applications", "orca", "orca"),
          path.join(os.homedir(), "orca", "orca"),
        ];

      case Platform.Windows:
        return ["C:\\Program Files\\ORCA\\orca.exe", "C:\\orca\\orca.exe", path.join(os.homedir(), "orca", "orca.exe")];

      default:
        return [];
    }
  }

  /**
   * Check Conda environments for ORCA
   */
  private async checkCondaEnvironments(): Promise<OrcaInstallation[]> {
    // Check if conda is available
    // List conda environments: conda env list
    // Check each environment for orca binary
  }

  /**
   * Check if installation is already in list (deduplication)
   */
  private isDuplicate(installations: OrcaInstallation[], newInstall: OrcaInstallation): boolean {
    return installations.some((inst) => path.resolve(inst.path) === path.resolve(newInstall.path));
  }

  /**
   * Sort installations by priority
   */
  private sortInstallations(installations: OrcaInstallation[]): OrcaInstallation[] {
    return installations.sort((a, b) => {
      // Valid installations first
      if (a.isValid && !b.isValid) return -1;
      if (!a.isValid && b.isValid) return 1;

      // Then by version (latest first)
      if (a.version && b.version) {
        return this.compareVersions(b.version, a.version);
      }

      // Then by detection source priority
      const sourcePriority: { [key: string]: number } = {
        "user-config": 0,
        "environment-variable": 1,
        PATH: 2,
        conda: 3,
        "standard-directory": 4,
      };

      const aPriority = sourcePriority[a.detectionSource || ""] ?? 99;
      const bPriority = sourcePriority[b.detectionSource || ""] ?? 99;

      return aPriority - bPriority;
    });
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }
}
```

---

## Implementation Steps

### Step 1: Implement Basic Structure (30 min)

- Create class with constructor
- Add platform detection
- Implement getConfiguredPath()

### Step 2: Implement Standard Directory Scanning (45 min)

- Implement getStandardDirectories()
- Add checkStandardDirectories()
- Test on local machine

### Step 3: Implement Environment Variable Checking (30 min)

- Implement getEnvironmentPaths()
- Handle ORCA_PATH, ORCA_HOME
- Test with mock environment variables

### Step 4: Implement PATH Scanning (45 min)

- Use child_process to run 'which' or 'where'
- Parse output for binary location
- Handle command not found errors

### Step 5: Implement Conda Detection (60 min)

- Check if conda exists
- Parse `conda env list` output
- Search each environment for orca binary
- Handle conda not installed case

### Step 6: Implement Sorting and Deduplication (30 min)

- Implement isDuplicate()
- Implement sortInstallations()
- Implement compareVersions()

### Step 7: Integration with Version Parser (30 min)

- Integrate validateBinary() with TASK-004
- Handle version parsing failures
- Set isValid flag appropriately

### Step 8: Error Handling and Edge Cases (30 min)

- Add try-catch blocks
- Handle permission errors
- Add timeout for long-running checks
- Log errors appropriately

---

## Acceptance Criteria

- [ ] Detects ORCA in all standard locations within 2 seconds
- [ ] Returns empty array gracefully when no installations found
- [ ] Correctly identifies multiple installations
- [ ] Sorts installations by priority (latest version first)
- [ ] No false positives for non-ORCA binaries
- [ ] Handles missing directories gracefully (no exceptions)
- [ ] Detects Conda-installed ORCA
- [ ] Deduplicates symbolic links and multiple paths to same binary
- [ ] Returns installations with correct detectionSource labels
- [ ] All methods have JSDoc comments

---

## Testing

### Unit Tests (TASK-005)

Will be implemented in separate task:

- Mock file system
- Mock spawn commands
- Test each detection method in isolation
- Test sorting and deduplication

### Manual Testing Checklist

- [ ] Test on Linux with ORCA in /opt/orca
- [ ] Test on Linux with ORCA in PATH
- [ ] Test on macOS with Homebrew installation
- [ ] Test on Windows with manual installation
- [ ] Test with Conda installation
- [ ] Test with multiple versions installed
- [ ] Test with no ORCA installed (empty result)
- [ ] Test with broken symlinks
- [ ] Test with ORCA_PATH environment variable set

---

## Edge Cases to Handle

1. **Symbolic Links**:

   - Resolve symlinks to avoid duplicates
   - Use `fs.realpathSync()` or `fs.promises.realpath()`

2. **Permission Errors**:

   - Check file executability with `fs.promises.access(path, fs.constants.X_OK)`
   - Catch EACCES errors gracefully

3. **Conda Not Installed**:

   - Check `which conda` first
   - Return empty array if conda not found

4. **Long-Running Checks**:

   - Set 5-second timeout for all spawn operations
   - Kill process if timeout exceeded

5. **Invalid Binaries**:

   - File exists but is not ORCA (e.g., shell script with same name)
   - Version parser should catch this in TASK-004

6. **Windows-Specific**:
   - Handle .exe extension properly
   - Use `where` command instead of `which`
   - Path separators (\\ vs /)

---

## Performance Considerations

- **Parallel Scanning**: Check multiple directories concurrently using `Promise.all()`
- **Early Exit**: Stop scanning once reasonable installation found (optional)
- **Caching**: Consider caching detection results for 5 minutes
- **Timeout**: Overall detection should complete in <2 seconds

---

## Security Considerations

- **Path Traversal**: Validate all paths before checking
- **Command Injection**: Never use `shell: true` with spawn
- **Permission Checks**: Always verify executable permissions before attempting to run

---

## Deliverables

- [ ] Complete `src/installation/detector.ts` implementation
- [ ] All methods implemented with proper error handling
- [ ] JSDoc comments for all public methods
- [ ] Integration with version parser (TASK-004)
- [ ] Manual testing on at least 2 platforms
- [ ] Git commit: `feat: implement ORCA detector module (TASK-002)`

---

## Integration Points

### With TASK-004 (Version Parser)

```typescript
async validateBinary(binaryPath: string): Promise<OrcaInstallation> {
    const installation: OrcaInstallation = {
        path: binaryPath,
        version: '',
        isValid: false
    };

    // Check file exists and is executable
    try {
        await fs.promises.access(binaryPath, fs.constants.X_OK);
    } catch {
        installation.validationError = 'Binary not found or not executable';
        return installation;
    }

    // Get version (TASK-004)
    try {
        installation.version = await this.getVersion(binaryPath);
        installation.isValid = true;
    } catch (error) {
        installation.validationError = (error as Error).message;
    }

    return installation;
}

private async getVersion(binaryPath: string): Promise<string> {
    // Will be implemented in TASK-004
    // For now, return empty string
    return '';
}
```

### With Extension.ts (TASK-007)

```typescript
// In extension.ts
import { OrcaDetector } from "./installation/detector";

const detector = new OrcaDetector();
const installations = await detector.detectInstallations();

if (installations.length > 0) {
  console.log(`Found ORCA ${installations[0].version} at ${installations[0].path}`);
}
```

---

## Notes

- Focus on reliability over speed (2 seconds is acceptable)
- Prioritize user-configured paths (respect explicit configuration)
- Log all detection attempts for debugging
- Consider adding verbose logging mode for troubleshooting

---

## References

- PRD Section 2.1: FR-1 (ORCA Installation Detection)
- PRD Section 3.2: OrcaDetector Component Specification
- Node.js spawn documentation: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options

---

**Created**: December 20, 2025  
**Last Updated**: December 20, 2025
