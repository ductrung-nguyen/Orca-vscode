# TASK-003: ORCA Validator Module

**Phase**: Phase 1 - Detection & Validation Foundation  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 4-5 hours  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Implement the `OrcaValidator` class that performs comprehensive validation of ORCA installations, including test job execution, dependency checking, and health validation. This ensures detected installations are actually functional before user attempts to run calculations.

---

## Dependencies

**Blocked By**: 
- TASK-001 (Project Structure Setup)

**Blocks**: 
- TASK-006 (Validation Unit Tests)
- TASK-024 (Validation Step Integration)
- TASK-031 (Validate ORCA Command)
- TASK-032 (Diagnose ORCA Command)

---

## Objectives

1. Validate ORCA binary is executable and functional
2. Execute minimal test job to verify end-to-end functionality
3. Check for required dependencies (OpenMPI, libraries)
4. Provide detailed validation results with actionable errors
5. Use extension-managed directory for test jobs (security)

---

## Technical Specifications

### Class Interface

**Location**: `src/installation/validator.ts`

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { ValidationResult, Platform } from './types';

export class OrcaValidator {
    private context: vscode.ExtensionContext;
    private platform: Platform;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.platform = process.platform as Platform;
    }
    
    /**
     * Comprehensive installation health check
     * @param binaryPath Absolute path to ORCA binary
     * @returns Detailed validation results
     */
    async validateInstallation(binaryPath: string): Promise<ValidationResult> {
        const result: ValidationResult = {
            success: false,
            errors: [],
            warnings: []
        };
        
        // 1. Check binary exists and is executable
        if (!await this.checkBinaryExists(binaryPath)) {
            result.errors.push(`ORCA binary not found at: ${binaryPath}`);
            return result;
        }
        
        if (!await this.checkBinaryExecutable(binaryPath)) {
            result.errors.push(`ORCA binary is not executable: ${binaryPath}`);
            result.errors.push('Try running: chmod +x ' + binaryPath);
            return result;
        }
        
        // 2. Get version information
        let version: string;
        try {
            version = await this.getVersion(binaryPath);
        } catch (error) {
            result.errors.push(`Failed to get ORCA version: ${(error as Error).message}`);
            return result;
        }
        
        // 3. Check dependencies (non-blocking)
        const dependencies = await this.checkDependencies(binaryPath);
        const missingDeps = Object.entries(dependencies)
            .filter(([_, isMet]) => !isMet)
            .map(([name, _]) => name);
        
        if (missingDeps.length > 0) {
            result.warnings.push(`Missing dependencies: ${missingDeps.join(', ')}`);
            result.warnings.push('ORCA may still work but with limited functionality');
        }
        
        // 4. Run test job (most comprehensive check)
        let testJobPassed = false;
        let testJobOutput = '';
        
        try {
            const testResult = await this.runTestJob(binaryPath);
            testJobPassed = testResult.success;
            testJobOutput = testResult.output;
            
            if (!testJobPassed) {
                result.errors.push('Test job execution failed');
                result.errors.push('Output: ' + testResult.output.substring(0, 500));
            }
        } catch (error) {
            result.errors.push(`Test job execution error: ${(error as Error).message}`);
        }
        
        // 5. Build final result
        result.success = result.errors.length === 0 && testJobPassed;
        
        if (result.success) {
            result.installationDetails = {
                version,
                architecture: process.arch,
                dependencies,
                testJobPassed,
                testJobOutput: testJobOutput.substring(0, 1000) // Truncate
            };
        }
        
        return result;
    }
    
    /**
     * Check if binary file exists
     */
    private async checkBinaryExists(binaryPath: string): Promise<boolean> {
        try {
            await fs.promises.access(binaryPath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Check if binary is executable
     */
    private async checkBinaryExecutable(binaryPath: string): Promise<boolean> {
        try {
            await fs.promises.access(binaryPath, fs.constants.X_OK);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Get ORCA version by running bare command
     */
    private async getVersion(binaryPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const process = spawn(binaryPath, [], { shell: false });
            let stderr = '';
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                reject(new Error('Version check timeout (5 seconds)'));
            }, 5000);
            
            process.on('close', () => {
                clearTimeout(timeout);
                
                // Parse version from stderr banner
                const versionMatch = stderr.match(/Program Version (\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    resolve(versionMatch[1]);
                } else {
                    reject(new Error('Could not parse ORCA version from output'));
                }
            });
            
            process.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    
    /**
     * Run minimal test job to verify functionality
     */
    private async runTestJob(binaryPath: string): Promise<{success: boolean, output: string}> {
        // Create validation directory in extension storage
        const validationDir = path.join(
            this.context.globalStorageUri.fsPath,
            'validation'
        );
        
        // Ensure directory exists
        await fs.promises.mkdir(validationDir, { recursive: true });
        
        // Create minimal H2 input file
        const inputFile = path.join(validationDir, 'test.inp');
        const inputContent = `# ORCA Validation Test - H2 molecule
! HF STO-3G

* xyz 0 1
H 0.0 0.0 0.0
H 0.0 0.0 0.74
*
`;
        
        await fs.promises.writeFile(inputFile, inputContent, 'utf-8');
        
        // Run ORCA
        return new Promise((resolve) => {
            const process = spawn(binaryPath, [inputFile], {
                cwd: validationDir,
                shell: false
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            const timeout = setTimeout(() => {
                process.kill('SIGTERM');
                setTimeout(() => process.kill('SIGKILL'), 1000);
                resolve({
                    success: false,
                    output: 'Test job timeout (30 seconds)'
                });
            }, 30000);
            
            process.on('close', async (code) => {
                clearTimeout(timeout);
                
                // Read output file
                const outputFile = path.join(validationDir, 'test.out');
                let outputContent = '';
                
                try {
                    outputContent = await fs.promises.readFile(outputFile, 'utf-8');
                } catch {
                    outputContent = stdout + stderr;
                }
                
                // Check for success markers
                const success = outputContent.includes('HURRAY') &&
                               outputContent.includes('FINAL SINGLE POINT ENERGY');
                
                // Clean up validation directory
                try {
                    await this.cleanupValidationDir(validationDir);
                } catch (error) {
                    console.warn('Failed to cleanup validation directory:', error);
                }
                
                resolve({
                    success,
                    output: outputContent
                });
            });
            
            process.on('error', async (error) => {
                clearTimeout(timeout);
                
                // Clean up on error
                try {
                    await this.cleanupValidationDir(validationDir);
                } catch {}
                
                resolve({
                    success: false,
                    output: `Process error: ${error.message}`
                });
            });
        });
    }
    
    /**
     * Clean up validation directory contents
     */
    private async cleanupValidationDir(validationDir: string): Promise<void> {
        try {
            const files = await fs.promises.readdir(validationDir);
            
            for (const file of files) {
                const filePath = path.join(validationDir, file);
                await fs.promises.unlink(filePath);
            }
        } catch (error) {
            console.warn('Error cleaning validation directory:', error);
        }
    }
    
    /**
     * Check for required dependencies
     */
    private async checkDependencies(binaryPath: string): Promise<{[key: string]: boolean}> {
        const dependencies: {[key: string]: boolean} = {};
        
        // Platform-specific dependency checks
        switch (this.platform) {
            case Platform.Linux:
                dependencies.openmpi = await this.checkCommand('ompi_info');
                dependencies.mpirun = await this.checkCommand('mpirun');
                dependencies.gcc = await this.checkCommand('gcc');
                dependencies.python = await this.checkCommand('python3');
                break;
                
            case Platform.MacOS:
                dependencies.openmpi = await this.checkCommand('ompi_info');
                dependencies.gcc = await this.checkCommand('gcc');
                dependencies.python = await this.checkCommand('python3');
                break;
                
            case Platform.Windows:
                dependencies.python = await this.checkCommand('python');
                // Windows typically doesn't need MPI for single-core
                break;
        }
        
        return dependencies;
    }
    
    /**
     * Check if a command is available in PATH
     */
    private async checkCommand(command: string): Promise<boolean> {
        return new Promise((resolve) => {
            const checkCmd = this.platform === Platform.Windows ? 'where' : 'which';
            const process = spawn(checkCmd, [command], { shell: false });
            
            let found = false;
            
            process.stdout.on('data', () => {
                found = true;
            });
            
            const timeout = setTimeout(() => {
                process.kill();
                resolve(false);
            }, 2000);
            
            process.on('close', (code) => {
                clearTimeout(timeout);
                resolve(code === 0 && found);
            });
            
            process.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }
    
    /**
     * Quick validation (no test job)
     */
    async quickValidate(binaryPath: string): Promise<boolean> {
        if (!await this.checkBinaryExists(binaryPath)) {
            return false;
        }
        
        if (!await this.checkBinaryExecutable(binaryPath)) {
            return false;
        }
        
        try {
            await this.getVersion(binaryPath);
            return true;
        } catch {
            return false;
        }
    }
}
```

---

## Implementation Steps

### Step 1: Implement Basic Checks (45 min)
- checkBinaryExists()
- checkBinaryExecutable()
- Basic constructor and structure

### Step 2: Implement Version Detection (30 min)
- getVersion() with timeout
- Parse stderr for version string
- Handle errors gracefully

### Step 3: Implement Test Job Execution (90 min)
- Create validation directory in extension storage
- Generate H2 test input file
- Spawn ORCA process
- Monitor output and timeout
- Parse results for success markers

### Step 4: Implement Cleanup Logic (30 min)
- cleanupValidationDir()
- Handle cleanup errors gracefully
- Ensure cleanup always runs

### Step 5: Implement Dependency Checking (45 min)
- checkDependencies()
- checkCommand() helper
- Platform-specific dependency lists

### Step 6: Integrate Full Validation (30 min)
- validateInstallation() orchestration
- Build comprehensive ValidationResult
- Handle all error cases

### Step 7: Add Quick Validation (15 min)
- quickValidate() for fast checks
- Use in startup health checks

### Step 8: Testing and Polish (45 min)
- Test with valid ORCA installation
- Test with missing dependencies
- Test timeout scenarios
- Add logging

---

## Acceptance Criteria

- [ ] Validates binary in <1 second (excluding test job)
- [ ] Test job completes in <30 seconds for H2 molecule
- [ ] Returns structured ValidationResult with errors and warnings
- [ ] Cleans up test files after execution (always)
- [ ] Handles timeout scenarios gracefully
- [ ] Checks platform-specific dependencies correctly
- [ ] Uses extension storage directory (not system temp)
- [ ] No false positives (non-ORCA binaries rejected)
- [ ] All public methods have JSDoc comments
- [ ] Proper error messages with remediation suggestions

---

## Test Job Specification

### Input File (H2 Single Point)
```
! HF STO-3G

* xyz 0 1
H 0.0 0.0 0.0
H 0.0 0.0 0.74
*
```

### Expected Output
- Contains: `HURRAY` (convergence marker)
- Contains: `FINAL SINGLE POINT ENERGY` (energy calculation completed)
- Exit code: 0
- Runtime: <5 seconds typically

### Success Criteria
Both markers must be present in output file or stdout.

---

## Testing

### Unit Tests (TASK-006)
Will be implemented in separate task:
- Mock spawn for version detection
- Mock file system operations
- Test timeout handling
- Mock test job execution

### Manual Testing Checklist
- [ ] Test with valid ORCA 5.0+ installation
- [ ] Test with ORCA 4.2 installation
- [ ] Test with non-executable binary (chmod -x)
- [ ] Test with non-ORCA binary
- [ ] Test with missing dependencies
- [ ] Test timeout scenarios (simulate hung process)
- [ ] Verify cleanup of validation directory
- [ ] Test on all 3 platforms (Linux, macOS, Windows)

---

## Edge Cases

1. **Hung ORCA Process**:
   - 30-second timeout on test job
   - Kill with SIGTERM, then SIGKILL after 1 second
   - Return failure with timeout message

2. **Validation Directory Access**:
   - Create directory with recursive: true
   - Handle permission errors gracefully
   - Fall back to error message if cannot create

3. **Output File Not Created**:
   - ORCA may fail before creating .out file
   - Capture stdout/stderr as fallback
   - Check for error messages in stderr

4. **Multiple Simultaneous Validations**:
   - Use unique directory names (timestamp or UUID)
   - Prevent conflicts between concurrent validations

5. **Cleanup Failures**:
   - Log cleanup errors but don't fail validation
   - Warn user if directory cannot be cleaned

---

## Performance Considerations

- **Quick Validate**: Provide fast path without test job (<1 second)
- **Parallel Dependency Checks**: Check all dependencies concurrently
- **Test Job Optimization**: Use smallest possible molecule (H2)
- **Cleanup**: Asynchronous cleanup (don't block result return)

---

## Security Considerations

- **Extension Storage**: Always use `context.globalStorageUri.fsPath`
- **No Shell**: Always use `shell: false` in spawn
- **Path Validation**: Validate binary path before execution
- **Timeout**: Always set timeouts on spawned processes
- **Cleanup**: Always clean up temporary files

---

## Deliverables

- [ ] Complete `src/installation/validator.ts` implementation
- [ ] All validation methods with error handling
- [ ] Test job execution in extension storage
- [ ] Dependency checking for all platforms
- [ ] JSDoc comments for all public methods
- [ ] Manual testing on at least 2 platforms
- [ ] Git commit: `feat: implement ORCA validator module (TASK-003)`

---

## Integration Points

### With Extension Context
```typescript
// In extension.ts
import { OrcaValidator } from './installation/validator';

export function activate(context: vscode.ExtensionContext) {
    const validator = new OrcaValidator(context);
    
    // Use in commands
    const result = await validator.validateInstallation(binaryPath);
    if (result.success) {
        vscode.window.showInformationMessage(
            `ORCA ${result.installationDetails?.version} validated successfully!`
        );
    }
}
```

### With Detector (TASK-002)
```typescript
// detector.ts
async validateBinary(binaryPath: string): Promise<OrcaInstallation> {
    // Use quickValidate for detection (fast)
    const isValid = await validator.quickValidate(binaryPath);
    
    return {
        path: binaryPath,
        version: await this.getVersion(binaryPath),
        isValid
    };
}
```

---

## Notes

- Test job should be minimal for speed
- Cleanup is critical - never leave files behind
- Provide actionable error messages
- Log all validation steps for debugging

---

## References

- PRD Section 2.1: FR-4 (Installation Validation & Health Checks)
- PRD Section 3.2: OrcaValidator Component Specification
- PRD Section 3.3.1: Test Job Specification
- Extension Storage: https://code.visualstudio.com/api/references/vscode-api#ExtensionContext

---

**Created**: December 20, 2025  
**Last Updated**: December 20, 2025
