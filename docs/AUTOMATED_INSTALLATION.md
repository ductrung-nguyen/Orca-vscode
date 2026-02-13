# ORCA Installation Guide

This document describes how to install ORCA quantum chemistry software for use with the VS-ORCA extension.

## How to Install ORCA

ORCA is free for academic use and must be downloaded from the official ORCA Forum.

### Step 1: Register on ORCA Forum

1. Go to [ORCA Forum](https://orcaforum.kofo.mpg.de)
2. Create an account (academic email recommended)
3. Wait for account approval (usually within 24 hours)

### Step 2: Download ORCA

1. Log in to the [ORCA Forum Downloads](https://orcaforum.kofo.mpg.de/app.php/dlext/)
2. Download the installer for your platform:
   - **Linux**: `orca_X_X_X_linux_x86-64_shared_openmpi416.run`
   - **macOS**: `orca_X_X_X_macosx_arm64_openmpi416.run` (Apple Silicon) or `orca_X_X_X_macosx_x86-64_openmpi416.run` (Intel)
   - **Windows**: `OrcaX.X.X.Win64.zip`

### Step 3: Install ORCA

#### Linux / macOS

```bash
# Make the installer executable
chmod a+x orca_6_1_0_linux_x86-64_shared_openmpi416.run

# Run the installer
./orca_6_1_0_linux_x86-64_shared_openmpi416.run
```

The installer will:
- Install ORCA to a user directory
- Add ORCA to your PATH automatically
- Open a new terminal to use ORCA

**Custom installation path:**
```bash
./orca_6_1_0_linux_x86-64_shared_openmpi416.run -- -p /custom/path/to/orca
```

#### Windows

1. Extract `OrcaX.X.X.Win64.zip`
2. Run `OrcaX.X.X.Win64.exe`
3. Choose **Custom** or **Full** installation for parallel execution support
4. Default directory: `C:\Orca_X.X.X`

The installer sets required environment variables automatically.

### Step 4: Verify Installation

```bash
orca --version
```

You should see output like:
```
ORCA-Pilot, version X.X.X -  Ab-Initio, DFT and Semiempirical Electronic Structure Package
```

## Architecture

### Core Components

#### 1. `OrcaDetector`

Located: `src/installation/detector.ts`

Detects existing ORCA installations:

- Scans PATH for `orca` binary
- Checks standard installation directories
- Validates found installations

#### 2. `OrcaValidator`

Located: `src/installation/validator.ts`

Validates ORCA installations:

- Version detection
- Architecture check
- Test job execution

#### 3. `WizardPanel`

Located: `src/installation/wizard/wizardPanel.ts`

Interactive installation guide:

- Step-by-step instructions
- Detection of existing installations
- Path validation
- Configuration saving

## Wizard Flow

### UI States

1. **Welcome** - Introduction to the wizard
2. **License Agreement** - User must acknowledge terms
3. **Detection** - Scan for existing ORCA installations
4. **Installation Instructions** - Platform-specific manual installation steps
5. **Path Configuration** - Enter or browse for ORCA binary
6. **Success** - Configuration complete

### Message Flow

**Extension → Webview:**

- `initialize` - Initialize wizard with platform info
- `detectionResults` - ORCA installations found
- `validationResults` - Path validation result
- `installationSteps` - Manual installation instructions
- `error` - General error

**Webview → Extension:**

- `ready` - Webview loaded
- `startDetection` - Begin ORCA detection
- `validatePath` - Validate user-provided path
- `getInstallationSteps` - Get manual installation instructions
- `saveConfiguration` - Save ORCA binary path
- `openSettings` - Open VS Code settings
- `runTestJob` - Execute test calculation

## Testing

### Unit Tests

Located: `src/installation/__tests__/`

- `detector.test.ts` - ORCA detection
- `validator.test.ts` - Installation validation
- `errorHandling.test.ts` - Error handling

Run tests:

```bash
npm test
```

## Future Enhancements

- [ ] Detect ORCA installations from common paths per platform
- [ ] Support multiple ORCA versions
- [ ] Automatic PATH configuration assistance
- [ ] Test job templates for different calculation types

## Troubleshooting

### Common Issues

**Issue:** "ORCA not found in PATH"  
**Solution:** 
1. Ensure ORCA is installed correctly
2. Open a new terminal after installation (PATH changes require new terminal)
3. Verify with `orca --version`
4. Manually add ORCA directory to PATH if needed

**Issue:** "Permission denied" when running installer  
**Solution:** Make the installer executable: `chmod a+x orca_*.run`

**Issue:** "Library not found" errors on Linux  
**Solution:** The shared library version requires OpenMPI. Install with:
```bash
# Ubuntu/Debian
sudo apt install openmpi-bin libopenmpi-dev

# Fedora/RHEL
sudo dnf install openmpi openmpi-devel
```

**Issue:** ORCA runs but VS-ORCA doesn't detect it  
**Solution:** 
1. Use the wizard to manually specify the ORCA binary path
2. Or set `orca.binaryPath` in VS Code settings

## References

- [ORCA Official Website](https://www.faccts.de/orca/)
- [ORCA Forum](https://orcaforum.kofo.mpg.de) (downloads require registration)
- [ORCA 6.1 Manual - Installation](https://www.faccts.de/docs/orca/6.1/manual/contents/quickstartguide/installation.html)
- [VS Code Extension API](https://code.visualstudio.com/api)

---

**Last Updated:** 2026-02-14  
**Version:** 2.0.0  
**Status:** Manual Installation Only
