# Automated ORCA Installation

This document describes the automated installation feature for VS-ORCA extension.

## Overview

The automated installation feature transforms the ORCA installation wizard from a manual "copy-paste commands" experience to a fully automated one-click installation with real-time progress feedback and comprehensive error handling.

## Supported Installation Methods

### Automated Installation

#### Conda (All Platforms) - **ONLY** Automated Method ✅

**Platforms:** macOS, Windows, Linux  
**Requirements:** Conda (Anaconda or Miniconda) installed

**Installation command:**

```bash
conda install -c conda-forge orca
```

**Advantages:**

- Cross-platform support
- Automated dependency management
- No sudo/admin privileges required
- Version management built-in
- **Only package manager that has ORCA quantum chemistry software**

**Limitations:**

- Requires Conda to be pre-installed
- Larger initial download (includes dependencies)

### Manual Installation

**Platforms:** All

Step-by-step instructions for downloading from ORCA forum and manual setup. This is the fallback when automated methods are unavailable or fail.

**Download:** Register at https://orcaforum.kofo.mpg.de and download directly from the ORCA forum.

### ❌ NOT Supported (Different Software!)

**IMPORTANT:** These package managers have packages named "orca" but they are DIFFERENT software:

- ❌ **Homebrew** (`brew install --cask orca`) - This installs **Plotly Orca** (chart image generator), NOT ORCA quantum chemistry
- ❌ **apt** (`apt install orca`) - This installs **GNOME Orca** (screen reader for accessibility), NOT ORCA quantum chemistry
- ❌ **yum/dnf** - ORCA quantum chemistry is not available in Linux distribution repositories

**Why this matters:** Installing the wrong "orca" package will not give you ORCA quantum chemistry software. Always use Conda or manual download from the ORCA forum.

## Architecture

### Class Hierarchy

```
BaseAutoInstaller (abstract)
├── CondaAutoInstaller
├── BrewAutoInstaller
└── AptAutoInstaller
```

### Core Components

#### 1. `BaseAutoInstaller` (Abstract Base Class)

Located: `src/installation/autoInstallers/baseAutoInstaller.ts`

Provides common functionality:

- Command execution utilities
- Binary verification
- Version detection
- Common helper methods

Abstract methods (must be implemented by subclasses):

- `canInstall(): Promise<boolean>` - Check if installer can run
- `install(onProgress?: ProgressCallback): Promise<InstallationResult>` - Execute installation
- `getEstimatedTime(): number` - Return estimated duration in seconds

#### 2. `CondaAutoInstaller`

Located: `src/installation/autoInstallers/condaAutoInstaller.ts`

Implements Conda-based installation:

- Conda availability detection
- Package installation with progress parsing
- Cancellation support
- Binary path detection post-install

#### 3. `BrewAutoInstaller`

Located: `src/installation/autoInstallers/brewAutoInstaller.ts`

Implements Homebrew-based installation:

- macOS platform detection
- Homebrew availability check
- Tap management (if needed)
- Installation with progress tracking

#### 4. `AptAutoInstaller`

Located: `src/installation/autoInstallers/aptAutoInstaller.ts`

Implements apt-based installation:

- Linux platform detection
- Package availability check
- **Interactive sudo handling via integrated terminal**
- Terminal output monitoring for progress

**Special Note on Sudo Handling:**  
The apt installer uses VS Code's integrated terminal to handle sudo password prompts interactively. This ensures security (no password storage) while maintaining automation.

#### 5. `ProgressMonitor`

Located: `src/installation/progressMonitor.ts`

Provides real-time progress updates to the wizard UI:

- Progress percentage updates
- Status message updates
- Elapsed/remaining time estimates
- Output line streaming

#### 6. `InstallationErrorHandler`

Located: `src/installation/installationError.ts`

Comprehensive error handling system:

- Error pattern matching (network, disk space, permissions, etc.)
- User-friendly error messages
- Actionable remediation steps
- Retry eligibility detection

Error types supported:

- `NetworkError` - Connection timeouts, DNS failures
- `DiskSpaceError` - Insufficient storage
- `PermissionError` - Access denied, EACCES
- `PackageNotFoundError` - Package unavailable in repositories
- `DependencyError` - Conflicting dependencies
- `TimeoutError` - Operation timeout
- `CancellationError` - User cancelled
- `ValidationError` - Post-install validation failed
- `UnknownError` - Catch-all with generic remediation

#### 7. `RetryStrategy`

Located: `src/installation/installationError.ts`

Implements exponential backoff retry logic:

- Configurable max retries (default: 3)
- Exponential delay calculation
- Retry eligibility checks
- Async execution with retry loop

## Wizard Integration

### Message Flow

**Extension → Webview:**

- `initialize` - Initialize wizard with state
- `detectionResults` - ORCA installations found
- `progressUpdate` - Installation progress (0-100%)
- `outputLine` - Live command output
- `installationComplete` - Success with binary path/version
- `installationError` - Failure with error details
- `error` - General error

**Webview → Extension:**

- `ready` - Webview loaded
- `startAutomatedInstallation` - Begin installation (with method)
- `cancelInstallation` - Cancel ongoing installation
- `retryInstallation` - Retry after failure
- `openSettings` - Open VS Code settings
- `runTestJob` - Execute test calculation

### UI States

1. **License Agreement** - User must accept terms
2. **Method Selection** - Choose Conda/Homebrew/Apt/Manual
3. **Installation Progress** - Real-time progress bar and log
4. **Error Display** - Clear error message with remediation steps
5. **Success** - Installation details and next steps

## Usage Example

### From Extension Code

```typescript
import { CondaAutoInstaller } from "./autoInstallers/condaAutoInstaller";
import { ProgressMonitor } from "./progressMonitor";

// Create installer
const installer = new CondaAutoInstaller();

// Check availability
if (await installer.canInstall()) {
  // Install with progress callback
  const result = await installer.install((percentage, message) => {
    console.log(`${percentage}% - ${message}`);
  });

  if (result.success) {
    console.log(`ORCA installed at: ${result.binaryPath}`);
    console.log(`Version: ${result.version}`);
    console.log(`Duration: ${result.duration}s`);
  } else {
    console.error(`Installation failed: ${result.error}`);
    console.error(`Remediation:`, result.details?.remediation);
  }
}
```

### From Wizard

The wizard automatically handles installation flow:

1. User selects installation method
2. User clicks "Install"
3. Wizard invokes `handleStartAutomatedInstallation(method)`
4. Progress updates sent to UI in real-time
5. On success: validates installation, configures settings, shows success screen
6. On failure: displays error with remediation, offers retry/manual fallback

## Error Handling

### Error Detection

Errors are parsed using pattern matching against known error signatures:

```typescript
const error = InstallationErrorHandler.parseError(
    new Error('CondaHTTPError: connection timeout'),
    'conda install orca',
    1
);

// Returns:
{
    type: 'network-error',
    message: 'Network connection failed during installation',
    remediation: [
        'Check your internet connection',
        'Verify firewall settings...',
        ...
    ],
    canRetry: true,
    details: '...'
}
```

### Retry Logic

```typescript
const strategy = new RetryStrategy(3, 1000, 30000);

const result = await strategy.executeWithRetry(
  async () => {
    return await installer.install();
  },
  (error) => {
    // Only retry network/timeout errors
    return error.type === "network-error" || error.type === "timeout-error";
  },
);
```

## Testing

### Unit Tests

Located: `src/installation/__tests__/`

- `errorHandling.test.ts` - Error parsing and retry logic
- `brewAutoInstaller.test.ts` - Homebrew installer
- `aptAutoInstaller.test.ts` - Apt installer
- `condaAutoInstaller.test.ts` - Conda installer (existing)
- `progressMonitor.test.ts` - Progress tracking (existing)

Run tests:

```bash
npm test
```

### Integration Tests

Integration tests require actual package managers and are platform-specific.

**TODO:** Implement integration tests for:

- Conda flow on macOS
- Conda flow on Windows
- Error handling scenarios
- Cancellation behavior

## Security Considerations

1. **Command Injection Prevention:**
   - All commands use array-based execution (not shell strings)
   - No user input directly in commands
   - Command arguments are validated

2. **Sudo Handling:**
   - Apt installer uses interactive terminal (user types password)
   - No password storage or logging
   - Non-interactive sudo explicitly avoided for security

3. **Output Sanitization:**
   - Command outputs are sanitized before display
   - Sensitive information (paths, usernames) are not logged
   - Error messages are user-friendly (no stacktraces to user)

## Performance

### Installation Times (Estimated)

| Method   | Platform | Time      | Notes                    |
| -------- | -------- | --------- | ------------------------ |
| Conda    | All      | 3-5 min   | Depends on network speed |
| Homebrew | macOS    | 2-4 min   | Pre-compiled binaries    |
| Apt      | Linux    | 5-10 min  | May need compilation     |
| Manual   | All      | 10-20 min | User-dependent           |

### Progress Accuracy

- Conda: ~80% accurate (parsed from package manager output)
- Homebrew: ~70% accurate (parsed from brew output)
- Apt: ~60% accurate (incremental estimation + terminal monitoring)

## Future Enhancements

### Phase 2 (Post-MVP)

- [ ] Windows native package manager support (winget)
- [ ] RPM-based Linux support (yum/dnf)
- [ ] Docker-based installation option
- [ ] Parallel installation attempts (fallback cascade)
- [ ] Installation caching for offline retry

### Phase 3 (Advanced)

- [ ] Multiple ORCA version management
- [ ] Automatic ORCA updates
- [ ] Custom installation location
- [ ] Telemetry for installation success rates (opt-in)
- [ ] A/B testing for installer strategies

## Troubleshooting

### Common Issues

**Issue:** "Conda not found"  
**Solution:** Install Conda from https://conda.io or use manual installation

**Issue:** "Permission denied" (Linux)  
**Solution:** Ensure user has sudo privileges or use Conda installer (no sudo required)

**Issue:** "Package not found in repositories"  
**Solution:** ORCA may not be available via that package manager. Try Conda or manual installation.

**Issue:** Installation hangs at 90%  
**Solution:** This is usually package verification. Wait a few minutes or check terminal output.

## References

- [ORCA Official Website](https://www.faccts.de/orca/)
- [ORCA Forum](https://orcaforum.kofo.mpg.de)
- [Conda Documentation](https://docs.conda.io)
- [VS Code Extension API](https://code.visualstudio.com/api)

---

**Last Updated:** 2026-02-12  
**Version:** 1.0.0  
**Status:** Implemented
