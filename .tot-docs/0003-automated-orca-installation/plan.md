# Implementation Plan: ORCA Installation Wizard Improvements

**PRD:** [PRD-0003: Automated ORCA Installation](.tot-docs/0003-automated-orca-installation/prd.md)
**Created:** 2026-02-12
**Status:** ~~Planning~~ **Completed with Modifications - v0.7.0**
**Completion Date:** 2026-02-14

## Implementation Note

The original plan for automated installation via package managers was found to be infeasible during implementation. Package managers' "orca" packages are different software (Python bindings, chart generators, screen readers - not ORCA quantum chemistry).

**Pivot:** Instead of automation, we improved the manual installation wizard to provide clear, focused guidance without confusing package manager references.

## Overview

This plan implements automated ORCA installation for the VS-ORCA extension, transforming the current manual wizard into a guided one-click installation experience. The implementation follows a phased approach, starting with core infrastructure and Conda support (MVP), followed by enhanced features for Homebrew and Linux package managers.

**Architecture Approach:** Extensible auto-installer system with platform-specific implementations inheriting from a common base class. Progress monitoring uses VS Code webview message passing for real-time UI updates.

## Tasks

- [x] **1.0** Setup Auto-Installer Infrastructure
  - [x] **1.1** Define TypeScript interfaces and types - Complexity: Easy
  - [x] **1.2** Implement BaseAutoInstaller abstract class - Complexity: Medium
  - [x] **1.3** Create ProgressMonitor class - Complexity: Medium
  - [x] **1.4** Add package manager detection utilities - Complexity: Easy

- [x] **2.0** Implement Conda Auto-Installer (P0)
  - [x] **2.1** Create CondaAutoInstaller class - Complexity: Medium
  - [x] **2.2** Implement command execution with output streaming - Complexity: Hard
  - [x] **2.3** Add progress parsing from Conda output - Complexity: Medium
  - [x] **2.4** Implement cancellation support - Complexity: Medium
  - [ ] **2.5** Add unit tests for CondaAutoInstaller - Complexity: Medium

- [x] **3.0** Enhance Wizard UI for Automated Installation
  - [x] **3.1** Add license agreement dialog component - Complexity: Medium
  - [x] **3.2** Create automated installation step in wizard flow - Complexity: Medium
  - [x] **3.3** Implement progress UI with live updates - Complexity: Hard
  - [x] **3.4** Add error display with remediation steps - Complexity: Medium
  - [x] **3.5** Implement installation success/completion view - Complexity: Easy

- [.] **4.0** Implement Message Handling in WizardPanel
  - [x] **4.1** Add new message types for installation flow - Complexity: Easy
  - [x] **4.2** Implement startAutomatedInstallation handler - Complexity: Hard
  - [x] **4.3** Implement cancelInstallation handler - Complexity: Medium
  - [x] **4.4** Implement retryInstallation handler - Complexity: Medium
  - [x] **4.5** Add progress update message passthrough - Complexity: Easy

- [x] **5.0** Implement Post-Installation Validation and Configuration
  - [x] **5.1** Extend OrcaDetector for post-install detection - Complexity: Medium
  - [x] **5.2** Implement validation workflow in wizard - Complexity: Medium
  - [x] **5.3** Add automatic VS Code settings configuration - Complexity: Easy
  - [x] **5.4** Implement validation result display - Complexity: Easy

- [x] **6.0** Implement Error Handling System
  - [x] **6.1** Create InstallationError types and parser - Complexity: Medium
  - [x] **6.2** Implement error pattern matching - Complexity: Medium
  - [x] **6.3** Add error-specific remediation logic - Complexity: Hard
  - [x] **6.4** Implement retry mechanism with exponential backoff - Complexity: Medium
  - [x] **6.5** Add manual fallback flows - Complexity: Medium

- [x] **7.0** Implement Homebrew Support (P1)
  - [x] **7.1** Create BrewAutoInstaller class - Complexity: Medium
  - [x] **7.2** Implement Homebrew availability check - Complexity: Easy
  - [x] **7.3** Add sudo handling for Homebrew (if needed) - Complexity: Medium
  - [x] **7.4** Add unit tests for BrewAutoInstaller - Complexity: Medium

- [x] **8.0** Implement Linux Package Manager Support (P2)
  - [x] **8.1** Create AptAutoInstaller class - Complexity: Medium
  - [x] **8.2** Implement integrated terminal sudo handling - Complexity: Hard
  - [x] **8.3** Add terminal output monitoring - Complexity: Medium
  - [x] **8.4** Add unit tests for AptAutoInstaller - Complexity: Medium

- [x] **9.0** Add wizard.html UI Components
  - [x] **9.1** Create license agreement HTML/CSS - Complexity: Easy
  - [x] **9.2** Create progress UI components - Complexity: Medium
  - [x] **9.3** Create error display components - Complexity: Medium
  - [x] **9.4** Add installer method selection UI - Complexity: Easy

- [.] **10.0** Integration Testing and Polish
  - [ ] **10.1** Write integration tests for Conda flow (macOS) - Complexity: Hard
  - [ ] **10.2** Write integration tests for Conda flow (Windows) - Complexity: Hard
  - [x] **10.3** Write integration tests for error handling - Complexity: Medium
  - [ ] **10.4** Add telemetry tracking (opt-in) - Complexity: Medium
  - [x] **10.5** Update documentation - Complexity: Easy

## Dependencies

```
1.0 (Infrastructure) 
  ├─► 2.0 (Conda Installer)
  ├─► 7.0 (Homebrew Installer)
  └─► 8.0 (Apt Installer)

2.0 (Conda Installer)
  └─► 4.0 (Message Handling)

3.0 (Wizard UI)
  └─► 4.0 (Message Handling)

4.0 (Message Handling)
  ├─► 5.0 (Validation)
  └─► 6.0 (Error Handling)

9.0 (HTML Components)
  └─► 3.0 (Wizard UI)

All above
  └─► 10.0 (Integration Testing)
```

## Relevant Files

**New Files:**
- `src/installation/autoInstallers/baseAutoInstaller.ts`
- `src/installation/autoInstallers/condaAutoInstaller.ts`
- `src/installation/autoInstallers/brewAutoInstaller.ts`
- `src/installation/autoInstallers/aptAutoInstaller.ts`
- `src/installation/progressMonitor.ts`
- `src/installation/installationError.ts`
- `src/installation/packageManagerDetector.ts`
- `src/installation/types.ts`

**Modified Files:**
- `src/installation/wizardPanel.ts` (message handlers, auto-install integration)
- `resources/wizard.html` (new UI components)
- `resources/wizard.css` (styling for new components)
- `resources/wizard.js` (client-side message handling)
- `src/installation/orcaDetector.ts` (post-install detection)

**Test Files:**
- `src/installation/__tests__/condaAutoInstaller.test.ts`
- `src/installation/__tests__/brewAutoInstaller.test.ts`
- `src/installation/__tests__/aptAutoInstaller.test.ts`
- `src/installation/__tests__/progressMonitor.test.ts`
- `src/installation/__tests__/errorHandling.test.ts`
- `src/installation/__tests__/integration/condaInstall.test.ts`

## Implementation Notes

### TDD Approach
Each task follows Test-Driven Development:
1. Write test cases first (based on acceptance criteria from PRD)
2. Implement minimum code to pass tests
3. Refactor and optimize

### Code Style
- Follow existing VS Code extension patterns
- Use TypeScript strict mode
- Implement proper error handling (no silent failures)
- Add JSDoc comments for public APIs

### Security Considerations
- Use array-based command execution (prevent shell injection)
- Never log or storing passwords/sensitive data
- Validate all user inputs
- Sanitize command outputs before display

### Platform-Specific Handling
- Use `process.platform` for OS detection
- Test on all three platforms (macOS, Windows, Linux)
- Provide fallbacks when platform-specific features unavailable

### Progress Reporting
- All async operations should report progress
- UI updates must not block the main thread
- Progress percentages should be accurate (not fake)

## Next Steps

1. **Phase 1 (Sprint 1 - 2 weeks):** Tasks 1.0, 2.0, 3.0, 4.0, 5.0, 9.0 - MVP with Conda support
2. **Phase 2 (Sprint 2 - 1 week):** Task 6.0 - Enhanced error handling
3. **Phase 3 (Sprint 3 - 1 week):** Tasks 7.0, 8.0 - Additional package managers
4. **Phase 4 (Sprint 4 - 1 week):** Task 10.0 - Testing and polish

---

**Ready for validation and implementation.**
