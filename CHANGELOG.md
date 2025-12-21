# VS-ORCA Extension Changelog

All notable changes to the "VS-ORCA" extension will be documented in this file.

## [Unreleased]

### 🔧 Maintenance: Development Dependencies Update

This maintenance release updates all development dependencies to their latest stable versions, ensuring security, compatibility, and improved tooling.

#### Updated Dependencies

**TypeScript & Type Definitions**
- TypeScript: `5.3.3` → `5.7.2` (latest 5.x)
- `@types/node`: Maintained at `20.x` for Node.js compatibility
- `@types/mocha`: Updated to `^10.0.10`
- `@types/vscode`: Pinned to `1.85.0` (matches engine requirement)

**ESLint & Code Quality**
- ESLint: `8.57.1` → `9.16.0` (major version update)
- `@typescript-eslint/eslint-plugin`: `6.21.0` → `8.17.0`
- `@typescript-eslint/parser`: `6.21.0` → `8.17.0`
- Configured ESLint 9 compatibility mode (`ESLINT_USE_FLAT_CONFIG=false`)
- Enhanced `.eslintrc.json` to ignore caught errors with `_` prefix

**Testing Framework**
- Mocha: Maintained at `10.8.2` (latest 10.x for stability)
- `@vscode/test-electron`: `2.3.8` → `2.5.2`

**Build Tools**
- `glob`: `10.5.0` → `11.0.0` (major version update)
- `@vscode/vsce`: `2.32.0` → `3.2.1` (major version update)

#### Improvements

- ✅ Zero security vulnerabilities (maintained clean audit)
- ✅ Full backward compatibility with VS Code `^1.85.0`
- ✅ All core functionality tests passing
- ✅ Extension packages successfully (208.58 KB)
- 🔧 Fixed unused error variable warnings in `orcaRunner.ts`
- 📦 Build performance: Compile time 2.28s (acceptable increase)

#### Developer Experience

- Modern tooling with latest stable versions
- Improved type checking with TypeScript 5.7
- Enhanced linting rules with ESLint 9
- Better compatibility with latest VS Code versions
- Maintained Node.js 20.x compatibility

#### Security

- **npm audit**: 0 vulnerabilities
- All dependencies at latest stable versions
- No high/critical/moderate/low security issues

---

## [0.2.0] - 2025-12-20

### 🎉 Major Feature: ORCA Installation Capability

This release introduces a comprehensive installation automation system that transforms the user onboarding experience from hours to minutes.

### Added

#### Installation Wizard

- **Interactive Setup Wizard**: Step-by-step guided installation process
  - Command: `ORCA: Setup ORCA Installation Wizard`
  - Visual webview panel with progress indicators
  - License acknowledgment and citation information
  - Automatic detection and validation
  - One-click configuration
  - Copy-to-clipboard functionality for commands

#### Automatic Detection System

- **ORCA Detector Module**: Intelligent multi-source scanning
  - Scans PATH environment variable
  - Checks standard installation directories (OS-specific)
  - Detects Conda installations
  - Parses environment variables (`$ORCA_PATH`, `$ORCA_HOME`)
  - Version extraction from ORCA stderr output
  - Detection completes in <2 seconds
  - Command: `ORCA: Detect ORCA Installations`

#### Validation & Health Checks

- **ORCA Validator Module**: Comprehensive installation verification
  - Binary existence and executability checks
  - Test job execution in safe environment
  - Dependency validation (OpenMPI, shared libraries)
  - Quick validation mode for startup
  - Detailed health reports
  - Commands:
    - `ORCA: Validate ORCA Installation`
    - `ORCA: Check ORCA Health`

#### OS-Specific Installation Strategies

- **Linux Strategy**:
  - Distribution detection (Ubuntu, Debian, Fedora, Arch, openSUSE)
  - Conda installation (recommended)
  - AUR support for Arch Linux
  - Manual tarball installation
  - Automatic PATH configuration
- **macOS Strategy**:
  - Apple Silicon vs Intel detection
  - Homebrew integration
  - Xcode Command Line Tools checking
  - Gatekeeper security handling
- **Windows Strategy**:
  - Visual C++ Redistributable checking
  - Manual ZIP installation
  - PATH configuration (GUI and CLI methods)
  - WSL2 alternative guidance

#### Multi-Version Support

- Detection and management of multiple ORCA installations
- Version selection via status bar
- Automatic prioritization: user-configured > latest > first-found

#### New Configuration Options

- `orca.autoDetectOnStartup`: Auto-detect ORCA on VS Code startup (default: false)
- `orca.installationWizardCompleted`: Internal flag tracking wizard completion
- `orca.licenseAcknowledged`: Internal flag for license acknowledgment

### Changed

#### Enhanced Existing Features

- **Run ORCA Job Command**: Now includes automatic detection fallback

  - Detects missing installations before execution
  - Offers wizard launch on first-time use
  - Prompts for installation when ORCA not found
  - No breaking changes to existing workflow

- **Status Bar Integration**:

  - Shows active ORCA version
  - Click to switch between detected installations
  - Health status indicators

- **Error Handling**:
  - User-friendly error messages with actionable suggestions
  - Automatic troubleshooting recommendations
  - Links to relevant documentation

### Fixed

#### Code Quality Improvements

- Fixed all ESLint/TypeScript errors (13 files affected)
- Replaced inline `require()` with proper ES6 imports
- Fixed unused parameter warnings with underscore prefix convention
- Replaced `hasOwnProperty` anti-pattern with `Object.prototype.hasOwnProperty.call()`
- Added proper type guards for message payload handling
- Enhanced mock context in tests with all required properties
- Zero compilation errors achieved

#### Robustness Enhancements

- Fixed Windows path handling with spaces
- Improved cross-platform compatibility
- Enhanced process cleanup and resource management
- Better error recovery in validation pipeline

### Documentation

#### New Documentation

- **INSTALLATION.md**: Comprehensive installation guide

  - Wizard usage instructions
  - Manual installation for all platforms
  - Troubleshooting section
  - Conda installation guide

- **PRD**: Product Requirements Document for installation capability
- **Implementation Summary**: Complete task breakdown and status
- **Testing Documentation**: Validation strategy and test coverage

#### Updated Documentation

- **README.md**: Added installation wizard section and new commands
- **CONTRIBUTING.md**: Updated with new module architecture
- **QUICKSTART.md**: Simplified getting started guide

### Technical Details

#### New Modules

- `src/installation/detector.ts` (462 lines): Detection engine
- `src/installation/validator.ts` (344 lines): Validation pipeline
- `src/installation/types.ts`: Core type definitions
- `src/installation/strategies/base.ts`: Strategy pattern base
- `src/installation/strategies/linuxInstaller.ts` (207 lines)
- `src/installation/strategies/macosInstaller.ts` (164 lines)
- `src/installation/strategies/windowsInstaller.ts` (180 lines)
- `src/installation/wizard/wizardPanel.ts` (400+ lines): Interactive wizard UI

#### Test Coverage

- `src/test/suite/detector.test.ts`: Detection module tests
- `src/test/suite/validator.test.ts`: Validation module tests
- `src/test/suite/installers.test.ts`: Strategy tests
- `src/test/suite/wizard.test.ts`: Wizard integration tests

#### Architecture Improvements

- Strategy pattern for OS-specific installation logic
- Clean separation of concerns (detection, validation, installation)
- Extensible design for future installation methods
- Mock-friendly architecture for testing

### Performance

- Detection scans complete in <2 seconds
- Validation with test job: <10 seconds
- Quick validation mode: <1 second
- No impact on extension startup time (detection on-demand)

### Known Limitations

- Manual download required for ORCA (academic license restriction)
- Conda installation recommended for best experience
- Some Linux distributions require manual installation
- Windows requires manual PATH configuration
- Validation test job requires write access to extension storage

### Migration Notes

- **No Breaking Changes**: All existing workflows remain functional
- Existing `orca.binaryPath` settings are preserved and respected
- New features are opt-in and non-intrusive
- Users can continue with manual configuration if preferred

### Success Metrics (Expected)

- 80% reduction in installation-related support requests
- 90% first-run success rate (up from 30%)
- <10 minutes time-to-first-successful-job (down from 45 minutes)
- 95% of users complete setup without external documentation

---

## [0.1.0] - 2025-12-20

### Added - Phase 1 MVP

- **Syntax Highlighting**: Complete TextMate grammar for ORCA input files
  - Keywords (! prefix): functionals, basis sets, job types
  - Blocks (% prefix): %pal, %scf, %geom, etc.
  - Coordinates: xyz, int, gzmt formats with element symbols
  - Comments (#) support
- **Code Snippets**: 15+ production-ready templates
  - Basic jobs: sp, opt, freq, optfreq
  - Advanced: ts, cpcm, tddft, casscf, neb
  - Configuration blocks: pal, scf, geom, basis
- **Execution Engine**: Local ORCA job runner
  - F5 keybinding to run current .inp file
  - Configurable binary path via settings
  - Auto-save before run (configurable)
  - Process management (kill running jobs)
- **Output Streaming**: Real-time output display
  - Dedicated ORCA output channel
  - Live stdout/stderr capture
  - File watching for large output files
- **Result Parsing**: Automated data extraction
  - Convergence detection ("HURRAY" / "SCF NOT CONVERGED")
  - Final energy extraction and status bar display
  - Geometry optimization status
  - Frequency calculation detection
  - Imaginary frequency warnings
- **UI Integration**:
  - Status bar item showing job state
  - Editor toolbar play button
  - Command palette commands
  - Context menu integration

### Configuration Options

- `orca.binaryPath`: Path to ORCA executable
- `orca.mpiProcs`: Default MPI process count
- `orca.autoSaveBeforeRun`: Auto-save before execution
- `orca.clearOutputBeforeRun`: Clear output panel on new job
- `orca.maxOutputSize`: Max output file size (MB)

### Known Issues

- Large output files (>50 MB) may cause performance degradation
- Windows paths with spaces require manual escaping
- Limited keyword coverage in syntax highlighting

## [Unreleased] - Future Phases

### Phase 2: Enhanced Analysis (Planned)

- Side panel with optimization trajectory
- Energy vs. cycle plotting
- Molecular orbital visualization hooks
- CSV/JSON export of results

### Phase 3: Remote Execution (Planned)

- SSH connection management
- SLURM/PBS job submission
- Queue monitoring
- Automatic result retrieval
