# Product Requirements Document: ORCA Installation Capability

**Document Version**: 1.0  
**Created**: December 20, 2025  
**Feature Type**: Core Enhancement  
**Priority**: High  
**Status**: Draft

---

## 1. Executive Summary

### 1.1 Problem Statement
Currently, VS-ORCA extension requires users to manually install ORCA computational chemistry software and configure the binary path (`orca.binaryPath` setting). This creates friction in the user onboarding experience:

- **Current Pain Points**:
  - Users encounter "ORCA binary not found" errors without installation guidance
  - No automated detection of existing ORCA installations
  - Manual configuration prone to path errors and OS-specific issues
  - No validation of successful installation
  - Users must navigate complex OS-specific installation procedures independently

- **User Impact**: 
  - Estimated 60-70% of first-time users abandon setup after binary path errors
  - Support requests dominated by installation/configuration issues
  - Extension appears "broken" to users unfamiliar with ORCA installation

### 1.2 Proposed Solution
Implement an intelligent ORCA installation detection and assistance system that:

1. **Automatically detects** existing ORCA installations on system startup
2. **Guides users** through OS-specific installation when ORCA is missing
3. **Validates** installations and automatically configures binary paths
4. **Provides troubleshooting** for common installation issues

### 1.3 Success Metrics
- **Primary**: Reduce installation-related support requests by 80%
- **Primary**: Increase successful first-run rate from 30% to 90%
- **Secondary**: Reduce time-to-first-successful-job from 45min to <10min
- **Secondary**: 95% of users complete setup without external documentation

---

## 2. Requirements

### 2.1 Functional Requirements

#### FR-1: ORCA Installation Detection
**Priority**: P0 (Must Have)

The extension shall automatically detect ORCA installations:

- **FR-1.1**: Scan common installation directories on extension activation:
  - Linux: `/opt/orca`, `/usr/local/orca`, `~/orca`, `/usr/bin/orca`
  - macOS: `/usr/local/bin/orca`, `/opt/homebrew/bin/orca`, `~/Applications/orca`
  - Windows: `C:\Program Files\ORCA`, `C:\orca`, `%USERPROFILE%\orca`

- **FR-1.2**: Check environment variables:
  - `$ORCA_PATH`, `$ORCA_HOME`, `$PATH`

- **FR-1.3**: Verify binary is executable:
  - Execute bare `orca` command (no arguments) and capture stderr
  - Parse version from banner using regex: `/Program Version (\d+\.\d+\.\d+)/`
  - Note: ORCA 4.x-5.x do not support `--version` flag
  - Validate minimum supported version (ORCA 4.0+)

- **FR-1.4**: Handle multiple installations:
  - If multiple ORCA versions found, present selection UI
  - Prioritize: user-configured path > latest version > first found

**Acceptance Criteria**:
- ✅ Detects ORCA in all standard locations within 2 seconds
- ✅ Correctly identifies ORCA version from output
- ✅ Handles missing/corrupt installations gracefully
- ✅ Provides actionable error messages for detection failures

---

#### FR-2: Installation Guidance System
**Priority**: P0 (Must Have)

When ORCA is not detected, provide OS-specific installation assistance:

##### Linux Installation Paths

- **FR-2.1.1**: Detect Linux distribution:
  - Parse `/etc/os-release` or equivalent
  - Support: Ubuntu/Debian, CentOS/RHEL/Fedora, Arch, openSUSE

- **FR-2.1.2**: Package Manager Installation:
  - **Conda** (Recommended - cross-platform): `conda install -c conda-forge orca`
  - **Arch Linux** (AUR only): `yay -S orca`
  - **Note**: ORCA is NOT available in official apt/dnf repositories
  - For all other distributions: Manual download from ORCA forum (primary path)

- **FR-2.1.3**: Manual Download Instructions:
  - Provide link to ORCA download page (requires academic registration)
  - Display copyable terminal commands (user executes manually):
    ```bash
    # Example for ORCA 5.0.4 Linux x64
    cd ~/Downloads
    tar -xvf orca_5_0_4_linux_x86-64_shared_openmpi411.tar.xz
    sudo mv orca_5_0_4_linux_x86-64_shared_openmpi411 /opt/orca
    ```
  - Display PATH configuration command (user copies and executes):
    ```bash
    echo 'export PATH=/opt/orca:$PATH' >> ~/.bashrc
    source ~/.bashrc
    ```
  - **Security**: Extension DOES NOT modify shell configuration files automatically
  - Include dependency installation (OpenMPI, etc.)

##### macOS Installation Paths

- **FR-2.2.1**: Homebrew Detection:
  - Check if Homebrew installed: `which brew`
  - If missing, provide link to https://brew.sh (user installs manually)
  - **Note**: No automatic Homebrew installation
  - Show ORCA installation command (if formula exists):
    ```bash
    brew tap homebrew/science  # If available
    brew install orca
    ```

- **FR-2.2.2**: Manual Installation:
  - Download instructions with universal binary selection
  - Intel vs. Apple Silicon detection
  - Installation to `/usr/local/bin` or user directory
  - Display PATH configuration commands for user execution:
    ```bash
    echo 'export PATH=/usr/local/bin:$PATH' >> ~/.zshrc
    source ~/.zshrc
    ```
  - **Security**: User executes shell configuration commands manually

##### Windows Installation Paths

- **FR-2.3.1**: Manual Download Process:
  - Link to ORCA Windows download page
  - Explain academic license requirement
  - Post-download steps:
    - Extract ZIP to `C:\orca`
    - Add to System PATH via Environment Variables (user action required)
    - Install Visual C++ Redistributable (if required)

- **FR-2.3.2**: WSL2 Alternative:
  - Suggest Windows Subsystem for Linux 2 for Linux binary compatibility
  - Guide through WSL2 setup + Linux installation path

##### FR-2.4: Conda Installation (Recommended Cross-Platform Method)
**Priority**: P0 (Must Have)

Provide Conda as the primary recommended installation method for all platforms:

- **FR-2.4.1**: Conda Detection:
  - Check if Conda/Miniconda/Anaconda installed: `which conda` or `where conda`
  - If missing, link to https://docs.conda.io/en/latest/miniconda.html
  - Benefits: No PATH configuration needed, works on all OSes, handles dependencies

- **FR-2.4.2**: ORCA Installation via Conda:
  - Display command: `conda install -c conda-forge orca`
  - Note: Automatically configures environment and dependencies
  - Verify installation: `conda list orca`
  - Conda-installed ORCA automatically detected in Conda environment paths

**Rationale**: Conda is the easiest cross-platform method with automatic dependency management and no PATH configuration issues.

##### FR-2.5: ORCA Licensing Compliance
**Priority**: P0 (Must Have)

Ensure users acknowledge ORCA's licensing requirements before installation:

- **FR-2.5.1**: Academic License Disclaimer:
  - Display in installation wizard: "ORCA is free for academic use only"
  - Require explicit acknowledgment checkbox before showing download links
  - Link to ORCA forum registration: https://orcaforum.kofo.mpg.de/

- **FR-2.5.2**: Citation Requirements:
  - Display citation notice in wizard final step:
    ```
    Please cite ORCA in your publications:
    Neese, F. (2012) WIREs Comput. Mol. Sci., 2, 73-78.
    ```
  - Provide BibTeX format for easy copying

- **FR-2.5.3**: Commercial Use Restriction:
  - Warn users that commercial use requires separate license
  - Link to commercial licensing information

- **FR-2.5.4**: No Automated Downloads:
  - Extension MUST NOT download ORCA binaries automatically
  - User must visit ORCA forum and download manually after registration
  - Prevents licensing violations and unauthorized distribution

**Acceptance Criteria**:
- ✅ Displays OS-appropriate instructions within 1 second of detection failure
- ✅ Instructions copyable to clipboard with one click
- ✅ Includes prerequisite checks (admin rights, disk space, dependencies)
- ✅ Links open in external browser correctly

---

#### FR-3: Guided Installation Workflow
**Priority**: P0 (Must Have)

Provide an interactive step-by-step installation assistant:

- **FR-3.1**: Installation Wizard UI:
  - Multi-step webview panel with progress indicators
  - Step 1: Welcome & ORCA version selection
  - Step 2: Download instructions (external link)
  - Step 3: Installation location selection
  - Step 4: Dependency verification
  - Step 5: PATH configuration
  - Step 6: Installation validation

- **FR-3.2**: Automatic Path Configuration:
  - After user indicates installation complete, re-run detection
  - If found, auto-populate `orca.binaryPath` setting
  - Show confirmation: "ORCA detected at /opt/orca/orca"

- **FR-3.3**: Installation Verification:
  - Execute bare `orca` command to confirm (parse stderr banner)
  - Test with minimal input file (H2 single point):
    ```
    ! HF STO-3G
    * xyz 0 1
    H 0 0 0
    H 0 0 0.74
    *
    ```
  - Test job executed in extension-managed directory: `context.globalStorageUri.fsPath/validation`
  - Parse output for "HURRAY" convergence marker
  - Display test result in wizard
  - Clean up validation directory after test completion

**Acceptance Criteria**:
- ✅ Wizard completable without external documentation
- ✅ Each step has clear success/failure states
- ✅ User can restart wizard from any step
- ✅ Validation test completes in <30 seconds

---

#### FR-4: Installation Validation & Health Checks
**Priority**: P1 (Should Have)

Continuous validation of ORCA installation health:

- **FR-4.1**: Startup Health Check:
  - On extension activation, verify configured binary still exists
  - Check if version changed (update detection)
  - Warn if ORCA binary no longer executable

- **FR-4.2**: Pre-Job Validation:
  - Before each job run, validate binary accessibility
  - Check for common runtime dependencies (MPI, OpenBLAS)
  - Verify write permissions in working directory

- **FR-4.3**: Installation Doctor Command:
  - New command: `ORCA: Diagnose Installation`
  - Comprehensive diagnostics output:
    - Binary path validity
    - Version information
    - Environment variables
    - Dependency status
    - Test job execution
  - Copy diagnostics to clipboard for support

**Acceptance Criteria**:
- ✅ Health check completes in <2 seconds
- ✅ Detects 90% of common installation issues
- ✅ Diagnostic report includes actionable remediation steps

---

#### FR-5: Multi-Version Support
**Priority**: P2 (Nice to Have)

Allow users to manage multiple ORCA versions:

- **FR-5.1**: Version Profile System:
  - Store multiple ORCA installations in settings:
    ```json
    "orca.installations": [
      {"name": "ORCA 5.0.4", "path": "/opt/orca504/orca", "default": true},
      {"name": "ORCA 4.2.1", "path": "/opt/orca421/orca", "default": false}
    ]
    ```
  - Quick-switch command: `ORCA: Switch Version`
  - Show active version in status bar

- **FR-5.2**: Per-Project Version Override:
  - Workspace setting: `orca.workspaceBinaryPath`
  - Overrides global setting for specific projects
  - Useful for reproducibility requirements

**Acceptance Criteria**:
- ✅ Switch between versions without editing settings JSON
- ✅ Version displayed in status bar at all times
- ✅ Workspace override respected across reloads

---

#### FR-6: Wizard State Persistence
**Priority**: P0 (Must Have)

Persist installation wizard progress to allow resumption:

- **FR-6.1**: State Storage:
  - Use VS Code's `context.globalState` API for wizard progress
  - Store current step, detected installations, user choices
  - State key: `orca.wizardState`

- **FR-6.2**: Resume Capability:
  - On wizard re-open, check for existing state
  - Offer to resume from last completed step or start fresh
  - Clear state on successful wizard completion

- **FR-6.3**: State Schema:
  ```typescript
  interface WizardState {
    currentStep: number;  // 0-5
    detectedInstalls: OrcaInstallation[];
    selectedPath?: string;
    licenseAcknowledged: boolean;
    validationPassed: boolean;
    timestamp: number;  // For state expiration (7 days)
  }
  ```

- **FR-6.4**: State Cleanup:
  - Expire wizard state after 7 days of inactivity
  - Provide "Reset Wizard" command to clear state manually
  - Clear state on ORCA binary configuration change

**Acceptance Criteria**:
- ✅ User can close wizard mid-process and resume later
- ✅ State persists across VS Code restarts
- ✅ Expired states automatically cleaned up
- ✅ State cleared on successful wizard completion

---

### 2.2 Non-Functional Requirements

#### NFR-1: Performance
- Installation detection: <3 seconds on cold start
- Health check validation: <1 second
- UI responsiveness: All wizard steps render <500ms
- Test job execution: <30 seconds for H2 validation

#### NFR-2: Compatibility
- **OS Support**: Linux (kernel 4.0+), macOS 10.14+, Windows 10/11
- **ORCA Versions**: 4.0.0 to 6.x (latest)
- **VS Code Versions**: 1.85.0+ (current engine requirement)
- **Shell Environments**: bash, zsh, PowerShell, cmd.exe

#### NFR-3: Security
- No automatic downloads of ORCA binaries (licensing compliance)
- No automatic modification of shell configuration files (~/.bashrc, ~/.zshrc)
- No execution of user-provided paths without validation
- Test jobs executed in extension-managed directory (not system temp)
- Validate all file paths against directory traversal attacks
- User must explicitly execute all shell commands (display as copyable text)

#### NFR-4: Usability
- Installation wizard completable by non-technical users
- Average completion time: <15 minutes for new installation
- All instructions use plain language (no jargon)
- Error messages include copy-pasteable solutions

#### NFR-5: Maintainability
- Installation logic isolated in dedicated module: `src/orcaInstaller.ts`
- OS-specific code in separate strategy classes
- Unit tests for all detection/validation logic
- Mock ORCA binary for integration tests

---

## 3. Technical Design

### 3.1 Architecture Overview

```
src/
├── extension.ts              # Entry point - registers installation commands
├── orcaRunner.ts             # Existing execution engine (unchanged)
├── orcaInstaller.ts          # NEW: Installation orchestrator
├── installation/             # NEW: Installation subsystem
│   ├── detector.ts           # ORCA detection logic
│   ├── validator.ts          # Installation validation
│   ├── strategies/           # OS-specific installation guides
│   │   ├── linuxInstaller.ts
│   │   ├── macosInstaller.ts
│   │   └── windowsInstaller.ts
│   └── wizard/               # Installation wizard UI
│       ├── wizardPanel.ts    # Webview panel controller
│       └── wizard.html       # Wizard HTML template
└── test/
    └── suite/
        ├── detector.test.ts  # NEW: Detection tests
        └── validator.test.ts # NEW: Validation tests
```

### 3.2 Component Specifications

#### OrcaDetector (detector.ts)
```typescript
export interface OrcaInstallation {
    path: string;
    version: string;
    isValid: boolean;
    validationError?: string;
}

export class OrcaDetector {
    /**
     * Scan system for ORCA installations
     * @returns Array of detected installations, sorted by priority
     */
    async detectInstallations(): Promise<OrcaInstallation[]>;
    
    /**
     * Validate a specific ORCA binary path
     * @param binaryPath Absolute path to orca executable
     */
    async validateBinary(binaryPath: string): Promise<OrcaInstallation>;
    
    /**
     * Get ORCA version from binary output
     * @param binaryPath Path to test
     */
    private async getVersion(binaryPath: string): Promise<string>;
}
```

**Detection Algorithm**:
1. Check user-configured `orca.binaryPath` first (if exists)
2. Scan OS-specific standard directories
3. Parse `$PATH` environment variable (includes Conda environments)
4. Check `$ORCA_PATH` / `$ORCA_HOME` variables
5. For each candidate:
   - Verify file exists and is executable
   - Run bare `orca` command (no arguments) and capture stderr
   - Parse version from banner using regex: `/Program Version (\d+\.\d+\.\d+)/`
   - Note: ORCA 4.x-5.x output version banner to stderr, not stdout
6. Return sorted list (latest version first)

**Error Handling**:
- Timeout for version check: 5 seconds
- Catch spawn errors (ENOENT, EACCES)
- Graceful handling of corrupt binaries

---

#### OrcaValidator (validator.ts)
```typescript
export interface ValidationResult {
    success: boolean;
    errors: string[];
    warnings: string[];
    installationDetails?: {
        version: string;
        dependencies: {[key: string]: boolean}; // e.g., {openmpi: true, libblas: false}
        testJobPassed: boolean;
    };
}

export class OrcaValidator {
    /**
     * Comprehensive installation health check
     */
    async validateInstallation(binaryPath: string): Promise<ValidationResult>;
    
    /**
     * Run minimal test job to verify functionality
     */
    private async runTestJob(binaryPath: string): Promise<boolean>;
    
    /**
     * Check for required dependencies
     */
    private async checkDependencies(binaryPath: string): Promise<{[key: string]: boolean}>;
}
```

**Test Job Specification**:
- Input: H2 molecule, HF/STO-3G single point
- Location: Extension-managed directory (`path.join(context.globalStorageUri.fsPath, 'validation')`)
- Cleanup: Delete validation directory contents after test completion
- Timeout: 30 seconds
- Success criteria: Output contains "HURRAY" and "FINAL SINGLE POINT ENERGY"

---

#### OS-Specific Installers (strategies/)

**Base Interface**:
```typescript
export interface InstallationStrategy {
    getInstructions(): InstallationStep[];
    getPrerequisites(): Prerequisite[];
    canAutoInstall(): boolean; // True if package manager available
    autoInstall?(): Promise<void>; // Optional automated installation
}

export interface InstallationStep {
    title: string;
    description: string;
    commands?: string[]; // Shell commands
    links?: {text: string, url: string}[];
    isRequired: boolean;
}

export interface Prerequisite {
    name: string;
    checkCommand: string; // e.g., "which gcc"
    installCommand?: string;
    isMet: boolean;
}
```

**LinuxInstaller**:
- Detects distro from `/etc/os-release`
- **Primary**: Recommends Conda installation (cross-platform, easiest)
- **AUR only**: Provides `yay -S orca` for Arch Linux users
- **Manual**: Tarball download + display PATH commands for user execution
- Checks for OpenMPI, GCC 9+, Python 3.7+ (dependency validation)
- **Security**: No automatic shell config modification

**MacOSInstaller**:
- **Primary**: Recommends Conda installation (cross-platform, easiest)
- Checks for Homebrew (`which brew`) - detection only, no auto-install
- If Homebrew missing, link to https://brew.sh for manual installation
- Provides brew formula if available (community tap)
- Manual download for Intel vs. Apple Silicon
- Displays PATH commands for user execution (no automatic shell config)
- Handles Gatekeeper issues ("unidentified developer")

**WindowsInstaller**:
- Direct download link to ORCA website
- ZIP extraction instructions
- PATH configuration via `setx` command
- WSL2 alternative for advanced users

---

#### Installation Wizard (wizard/)

**Webview Architecture**:
- Single-page application using Webview API
- Communication via `postMessage` protocol:
  - `extension → webview`: Installation steps, validation results
  - `webview → extension`: User actions (next step, validate, cancel)

**Wizard Flow**:
```
[Welcome] → [License] → [Detect] → [Install] → [Configure] → [Validate] → [Complete]
     ↓          ↓          ↓           ↓           ↓            ↓           ↓
  Info     Academic  Scanning   Conda/Manual  Path Entry   Test Job    Success!
           License   System     Instructions  & Confirm     Running     + Config
          Acknowledgment                                    (in ext dir)
```

**UI Components**:
- Progress bar (7 steps including license acknowledgment)
- License acknowledgment checkbox (required to proceed)
- Code blocks with copy-to-clipboard button (user executes manually)
- Validation status indicators (⏳ ✅ ❌)
- Collapsible troubleshooting sections
- "Skip to manual configuration" escape hatch
- State persistence (resume wizard capability)

---

### 3.3 Command Integration

**New Commands**:
```json
// package.json contributions
{
  "commands": [
    {
      "command": "vs-orca.setupOrca",
      "title": "Setup ORCA Installation",
      "category": "ORCA"
    },
    {
      "command": "vs-orca.detectOrca",
      "title": "Detect ORCA Installations",
      "category": "ORCA"
    },
    {
      "command": "vs-orca.validateOrca",
      "title": "Validate ORCA Installation",
      "category": "ORCA"
    },
    {
      "command": "vs-orca.diagnoseOrca",
      "title": "Diagnose ORCA Installation",
      "category": "ORCA"
    }
  ]
}
```

**Integration with Existing Flow** (extension.ts):
```typescript
// Modified runJob command
const runCommand = vscode.commands.registerCommand('vs-orca.runJob', async () => {
    // ... existing validation ...
    
    // NEW: Enhanced binary validation
    if (!binaryPath || binaryPath === '/opt/orca/orca') {
        const detected = await orcaDetector.detectInstallations();
        
        if (detected.length > 0) {
            // Found installation, offer to configure
            const response = await vscode.window.showInformationMessage(
                `Found ORCA ${detected[0].version} at ${detected[0].path}`,
                'Use This', 'Setup Different Installation'
            );
            
            if (response === 'Use This') {
                await config.update('orca.binaryPath', detected[0].path, true);
                // Proceed with job
            } else {
                vscode.commands.executeCommand('vs-orca.setupOrca');
                return;
            }
        } else {
            // No installation found, launch wizard
            const response = await vscode.window.showWarningMessage(
                'ORCA is not installed on your system.',
                'Setup ORCA', 'Manual Configuration', 'Cancel'
            );
            
            if (response === 'Setup ORCA') {
                vscode.commands.executeCommand('vs-orca.setupOrca');
            } else if (response === 'Manual Configuration') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'orca.binaryPath');
            }
            return;
        }
    }
    
    // ... rest of existing runJob logic ...
});
```

---

### 3.4 Configuration Schema Updates

**New Settings** (package.json):
```json
{
  "configuration": {
    "properties": {
      "orca.autoDetectOnStartup": {
        "type": "boolean",
        "default": true,
        "description": "Automatically detect ORCA installation on extension activation"
      },
      "orca.installations": {
        "type": "array",
        "default": [],
        "description": "List of known ORCA installations (managed by extension)",
        "items": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "path": {"type": "string"},
            "version": {"type": "string"},
            "isDefault": {"type": "boolean"}
          }
        }
      },
      "orca.installationWizardCompleted": {
        "type": "boolean",
        "default": false,
        "description": "Internal flag: has user completed setup wizard"
      },
      "orca.licenseAcknowledged": {
        "type": "boolean",
        "default": false,
        "description": "User has acknowledged ORCA academic license terms"
      }
    }
  }
}

**State Persistence** (using globalState API):
```typescript
// Wizard state stored in context.globalState
interface WizardState {
  currentStep: number;
  detectedInstalls: OrcaInstallation[];
  selectedPath?: string;
  licenseAcknowledged: boolean;
  validationPassed: boolean;
  timestamp: number;
}

// Example usage
await context.globalState.update('orca.wizardState', wizardState);
const savedState = context.globalState.get<WizardState>('orca.wizardState');
```

---

### 3.5 Testing Strategy

#### Unit Tests
- **detector.test.ts**: Mock file system, test path scanning
- **validator.test.ts**: Mock spawn, test version parsing
- **installer.test.ts**: Test instruction generation for each OS

#### Integration Tests
- Create mock ORCA binary (shell script returning version string)
- Test full detection → validation → configuration flow
- Verify settings updates persist

#### Manual Test Cases
1. **Fresh Install**: Clean VM, run wizard end-to-end
2. **Existing Install**: Pre-installed ORCA, verify auto-detection
3. **Multiple Versions**: Install ORCA 4.x and 5.x, test switching
4. **Failed Detection**: Corrupt binary, verify error messaging
5. **Network Failure**: Offline system, ensure local instructions work

---

## 4. Implementation Plan

### 4.1 Development Phases

#### Phase 1: Detection & Validation (Week 1)
**Deliverables**:
- `detector.ts` with full OS scanning (including Conda environment detection)
- `validator.ts` with test job execution in extension storage directory
- Version detection using stderr parsing (no --version flag)
- Unit tests with 80%+ coverage
- Integration with `runJob` command

**Effort**: 18-22 hours

---

#### Phase 2: Installation Strategies (Week 2)
**Deliverables**:
- OS-specific installer classes (Linux, macOS, Windows)
- Conda installation as primary recommendation (FR-2.4)
- Licensing compliance UI (FR-2.5)
- Instruction generation with copyable commands (no auto-execution)
- Prerequisite checking
- Manual testing on all 3 platforms

**Effort**: 24-28 hours

---

#### Phase 3: Wizard UI (Week 3)
**Deliverables**:
- Webview panel with step navigation (7 steps including license)
- License acknowledgment checkbox (required)
- Integration with detector/validator
- Copy-to-clipboard functionality (user executes commands)
- State persistence using globalState API (FR-6)
- Resume wizard capability

**Effort**: 28-32 hours

---

#### Phase 4: Commands & Polish (Week 4)
**Deliverables**:
- `setupOrca`, `detectOrca`, `validateOrca`, `diagnoseOrca` commands
- Status bar integration (show active version)
- Documentation updates (README, QUICKSTART)
- End-to-end testing on fresh VMs

**Effort**: 16-20 hours

---

### 4.2 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ORCA 4.x-5.x no `--version` flag | High | High | ✅ FIXED: Parse version from stderr banner with regex |
| Non-existent package repos (apt/dnf) | High | High | ✅ FIXED: Removed, use Conda as primary method |
| Shell config modification security | Medium | High | ✅ FIXED: Display commands as copyable text only |
| Homebrew auto-install issues | Medium | Medium | ✅ FIXED: Detection only, link to brew.sh |
| License violation (auto-downloads) | Medium | Critical | ✅ FIXED: FR-2.5 licensing compliance, no auto-downloads |
| Test job file conflicts | Low | Medium | ✅ FIXED: Use extension storage directory |
| Wizard state loss on crash | Medium | Medium | ✅ FIXED: FR-6 state persistence with globalState API |
| Windows PATH not updated after install | High | Medium | Provide `setx` command and reboot instructions |
| Test job hangs | Low | High | 30-second timeout + kill process |

---

### 4.3 Success Criteria & Metrics

**Pre-Launch Validation**:
- ✅ Detects ORCA in 95% of standard installations
- ✅ Wizard completable on all 3 OSes without external help
- ✅ Test job validation succeeds for ORCA 4.0 - 6.0
- ✅ Zero false positives for invalid binaries
- ✅ All unit tests passing, 80%+ code coverage

**Post-Launch Metrics** (90 days):
- Reduce "ORCA not found" error rate by 80%
- 90% of new users complete setup wizard
- Average setup time: <10 minutes (down from 45 minutes)
- <5% of users contact support for installation issues

---

## 5. User Stories

### US-1: First-Time User (No ORCA Installed)
**As a** computational chemistry student new to ORCA,  
**I want** to install ORCA directly from VS Code,  
**So that** I can start running calculations without manual setup.

**Acceptance Criteria**:
1. On first `.inp` file open, see prompt: "ORCA not detected. Setup now?"
2. Click "Setup ORCA" → wizard opens with OS-specific instructions
3. Follow download link, return to wizard, confirm installation location
4. Wizard validates installation and shows "✅ ORCA ready!"
5. Can immediately run job without touching settings

---

### US-2: Experienced User (Multiple Versions)
**As a** researcher with ORCA 4.2 and 5.0 installed,  
**I want** to switch between versions per project,  
**So that** I can reproduce published results.

**Acceptance Criteria**:
1. Extension detects both installations on startup
2. Status bar shows "ORCA 5.0.4" (active version)
3. Click status bar → dropdown appears with both versions
4. Select "ORCA 4.2.1" → settings updated, jobs use new binary
5. Workspace settings override global version for specific projects

---

### US-3: Broken Installation Recovery
**As a** user whose ORCA binary was deleted,  
**I want** to be notified before job failures,  
**So that** I can fix the installation proactively.

**Acceptance Criteria**:
1. Configured binary path deleted externally
2. On next extension activation, see warning: "ORCA binary missing"
3. Click "Diagnose" → doctor report shows:
   - ❌ Binary not found at `/opt/orca/orca`
   - ✅ PATH contains `/opt/orca`
   - Suggestion: "Binary may have been moved. Run Setup Wizard?"
4. Re-run detection finds ORCA at new location
5. Settings updated automatically

---

### US-4: System Administrator (Pre-Installed ORCA)
**As a** sysadmin deploying VS-ORCA to lab machines,  
**I want** the extension to auto-configure from system ORCA,  
**So that** students don't need manual setup.

**Acceptance Criteria**:
1. ORCA pre-installed to `/opt/orca` via Ansible
2. Extension activates on first use
3. Auto-detection finds system installation within 2 seconds
4. No user prompts if binary valid
5. Logs show: "Detected ORCA 5.0.4 at /opt/orca/orca"

---

## 6. Open Questions & Future Enhancements

### Open Questions
1. **Q**: Should we support Docker-based ORCA installations?  
   **A**: Deferred to Phase 5 (containerization support)

2. **Q**: Should wizard offer to download ORCA directly (requires academic credentials)?  
   **A**: No - legal/licensing issues. Provide links only.

3. **Q**: How to handle MPI configuration (number of cores)?  
   **A**: Existing `orca.mpiProcs` setting sufficient for now

### Future Enhancements (Post-MVP)
- **Automatic Updates**: Notify when new ORCA version available
- **HPC Setup**: Guide for configuring remote ORCA installations
- **Telemetry**: Opt-in anonymous installation success/failure reporting
- **Cloud ORCA**: Integration with ORCA cloud computing services
- **Docker Support**: Containerized ORCA installations
- **Environment Modules**: Support for HPC module systems (module load orca)

---

## 7. Appendix

### 7.1 ORCA Download URLs
- Official Website: https://orcaforum.kofo.mpg.de/
- Registration Required: Academic email verification
- Download Page: https://orcaforum.kofo.mpg.de/app.php/portal (login required)

### 7.2 Supported ORCA Versions
| Version | Release Date | Supported | Notes |
|---------|--------------|-----------|-------|
| 6.0.x   | 2024+        | ✅ Full   | Latest stable |
| 5.0.x   | 2022         | ✅ Full   | Most common |
| 4.2.x   | 2020         | ✅ Full   | Legacy projects |
| 4.0.x   | 2018         | ⚠️ Limited | Minimum version |
| 3.x     | 2016         | ❌ No     | Too old |

### 7.3 Dependencies by OS

**Linux**:
- OpenMPI 3.1+ or MPICH 3.3+
- GCC 9+ (libstdc++)
- BLAS/LAPACK (OpenBLAS recommended)
- Python 3.7+ (for plotting scripts)

**macOS**:
- Xcode Command Line Tools
- OpenMPI (via Homebrew)
- Compatible with macOS 10.14+

**Windows**:
- Visual C++ Redistributable 2019
- No MPI required (single-threaded mode)
- WSL2 recommended for full features

### 7.4 Reference Implementations
- **Rust Analyzer**: Installation wizard for rust-analyzer binary
- **Python Extension**: Python interpreter detection and setup
- **Docker Extension**: Container installation guidance

---

## 8. Approval Sign-Off

| Role | Name | Approval Date | Signature |
|------|------|---------------|-----------|
| Product Owner | [TBD] | | |
| Tech Lead | [TBD] | | |
| UX Designer | [TBD] | | |
| QA Lead | [TBD] | | |

---

**Document Control**  
**Last Updated**: December 20, 2025  
**Next Review**: Upon Phase 1 completion  
**Document Owner**: VS-ORCA Development Team
