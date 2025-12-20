# TASK-001: Project Structure Setup

**Phase**: Phase 1 - Detection & Validation Foundation  
**Priority**: P0 (Blocker)  
**Estimated Effort**: 1 hour  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Create the foundational directory structure and TypeScript type definitions for the ORCA installation capability feature. This task establishes the organizational framework that all subsequent tasks will build upon.

---

## Dependencies

**Blocked By**: None  
**Blocks**: 
- TASK-002 (ORCA Detector Module)
- TASK-003 (ORCA Validator Module)
- TASK-008 (Base Installation Strategy Interface)
- TASK-017 (Wizard Webview Panel Setup)

---

## Objectives

1. Create clean, organized directory structure for installation feature
2. Define core TypeScript interfaces and types
3. Ensure project compiles after structural changes
4. Set up proper module exports

---

## Technical Specifications

### Directory Structure

Create the following directories under `src/`:

```
src/
├── installation/              # NEW: Main installation module
│   ├── types.ts              # NEW: Shared interfaces and types
│   ├── detector.ts           # Placeholder (TASK-002)
│   ├── validator.ts          # Placeholder (TASK-003)
│   ├── strategies/           # NEW: OS-specific installers
│   │   ├── base.ts          # Placeholder (TASK-008)
│   │   ├── linuxInstaller.ts    # Placeholder (TASK-009)
│   │   ├── macosInstaller.ts    # Placeholder (TASK-010)
│   │   └── windowsInstaller.ts  # Placeholder (TASK-011)
│   └── wizard/              # NEW: Installation wizard UI
│       ├── wizardPanel.ts   # Placeholder (TASK-017)
│       └── wizard.html      # Placeholder (TASK-018)
```

### Core Type Definitions

Create `src/installation/types.ts` with the following interfaces:

```typescript
/**
 * Represents a detected ORCA installation
 */
export interface OrcaInstallation {
    /** Absolute path to the ORCA binary */
    path: string;
    
    /** ORCA version string (e.g., "5.0.4") */
    version: string;
    
    /** Whether this installation passes validation */
    isValid: boolean;
    
    /** Error message if validation failed */
    validationError?: string;
    
    /** Source of detection (e.g., "PATH", "standard-directory", "conda") */
    detectionSource?: string;
}

/**
 * Result of installation validation
 */
export interface ValidationResult {
    /** Overall validation success */
    success: boolean;
    
    /** Critical errors that prevent ORCA from running */
    errors: string[];
    
    /** Non-critical issues (ORCA may still work) */
    warnings: string[];
    
    /** Detailed installation information if validation succeeded */
    installationDetails?: {
        version: string;
        architecture: string; // e.g., "x86_64", "arm64"
        dependencies: {[key: string]: boolean}; // e.g., {openmpi: true, libblas: false}
        testJobPassed: boolean;
        testJobOutput?: string;
    };
}

/**
 * Installation step in wizard
 */
export interface InstallationStep {
    /** Step title */
    title: string;
    
    /** Detailed description */
    description: string;
    
    /** Shell commands to execute (user copies and runs) */
    commands?: string[];
    
    /** External links for downloads or documentation */
    links?: {text: string, url: string}[];
    
    /** Whether this step is required (vs. optional) */
    isRequired: boolean;
}

/**
 * Prerequisite for ORCA installation
 */
export interface Prerequisite {
    /** Name of the prerequisite (e.g., "OpenMPI") */
    name: string;
    
    /** Command to check if prerequisite is met */
    checkCommand: string;
    
    /** Command to install prerequisite (if available) */
    installCommand?: string;
    
    /** Whether this prerequisite is currently met */
    isMet: boolean;
    
    /** Error message if check failed */
    error?: string;
}

/**
 * Wizard state for persistence
 */
export interface WizardState {
    /** Current step index (0-6) */
    currentStep: number;
    
    /** Installations detected during wizard */
    detectedInstalls: OrcaInstallation[];
    
    /** Path selected by user */
    selectedPath?: string;
    
    /** Whether user acknowledged license terms */
    licenseAcknowledged: boolean;
    
    /** Whether validation passed */
    validationPassed: boolean;
    
    /** Timestamp of last wizard interaction (for state expiration) */
    timestamp: number;
}

/**
 * OS platform type
 */
export enum Platform {
    Linux = 'linux',
    MacOS = 'darwin',
    Windows = 'win32'
}

/**
 * Installation method type
 */
export enum InstallationMethod {
    Conda = 'conda',
    Manual = 'manual',
    PackageManager = 'package-manager' // apt, yum, brew, etc.
}
```

### Placeholder Files

Create minimal placeholder files to ensure imports don't fail:

**src/installation/detector.ts**:
```typescript
// Placeholder - TASK-002 will implement
import { OrcaInstallation } from './types';

export class OrcaDetector {
    async detectInstallations(): Promise<OrcaInstallation[]> {
        return [];
    }
}
```

**src/installation/validator.ts**:
```typescript
// Placeholder - TASK-003 will implement
import { ValidationResult } from './types';

export class OrcaValidator {
    async validateInstallation(binaryPath: string): Promise<ValidationResult> {
        return { success: false, errors: ['Not implemented'], warnings: [] };
    }
}
```

**src/installation/strategies/base.ts**:
```typescript
// Placeholder - TASK-008 will implement
import { InstallationStep, Prerequisite } from '../types';

export interface InstallationStrategy {
    getInstructions(): InstallationStep[];
    getPrerequisites(): Promise<Prerequisite[]>;
    canAutoInstall(): boolean;
}
```

---

## Implementation Steps

### Step 1: Create Directory Structure (10 min)
```bash
cd /home/nguyend/projects/Orca-vscode/src
mkdir -p installation/strategies installation/wizard
```

### Step 2: Create types.ts (20 min)
- Copy type definitions from specification above
- Add JSDoc comments for all interfaces
- Export all types and enums

### Step 3: Create Placeholder Files (15 min)
- Create minimal detector.ts, validator.ts, base.ts
- Ensure exports are correct
- Add "TODO: TASK-XXX" comments

### Step 4: Update tsconfig.json (5 min)
Verify path resolution works:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": ["src/*"]
    }
  }
}
```

### Step 5: Verify Compilation (10 min)
```bash
npm run compile
```
Ensure no TypeScript errors.

---

## Acceptance Criteria

- [ ] All directories exist under `src/installation/`
- [ ] `types.ts` defines all core interfaces with complete JSDoc
- [ ] Placeholder files exist and export correctly
- [ ] Project compiles with `npm run compile` (0 errors)
- [ ] Git structure clean (no unintended files)
- [ ] Commit message follows convention: `feat: add installation module structure (TASK-001)`

---

## Testing

### Manual Verification
1. Run `npm run compile` - should succeed
2. Check VS Code IntelliSense - types should autocomplete
3. Try importing types in extension.ts - no errors

### Automated Testing
No unit tests required for this task (structure only).

---

## Deliverables

- [ ] Directory structure created
- [ ] `src/installation/types.ts` with all interfaces
- [ ] Placeholder files: detector.ts, validator.ts, base.ts
- [ ] Successful compilation
- [ ] Git commit with proper message

---

## Notes

- Keep type definitions minimal for now - can extend in later tasks
- Placeholder files should not throw errors when imported
- Focus on clean organization that scales well
- All paths should use absolute imports where possible

---

## References

- PRD Section 3.1: Architecture Overview
- PRD Section 3.2: Component Specifications
- TypeScript Handbook: [Modules](https://www.typescriptlang.org/docs/handbook/modules.html)

---

**Created**: December 20, 2025  
**Last Updated**: December 20, 2025
