# TASK-DEP-001: Baseline Measurement & Documentation

**Phase**: Phase 1 - Preparation & Baseline  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 2 hours  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Establish comprehensive baseline metrics for the current state of the extension before any dependency updates. This baseline is critical for comparing post-update performance and detecting regressions.

---

## Dependencies

**Blocked By**: None  
**Blocks**:

- TASK-DEP-002 (Compatibility Research)
- TASK-DEP-020 (Performance Benchmarking)

---

## Objectives

1. Measure and document current build performance
2. Execute test suite and record detailed results
3. Run security audit and document vulnerabilities
4. Test all core features manually and document behavior
5. Create baseline report for comparison

---

## Technical Specifications

### 1. Build Performance Measurement

**Command**: `time npm run compile`

**Metrics to Capture**:

- Total compilation time (real, user, sys)
- Number of TypeScript files compiled
- Output directory size (`du -sh out/`)
- Any compilation warnings or notes

**Example Output to Record**:

```bash
$ time npm run compile

> vs-orca@0.2.0 compile
> tsc -p ./

real    0m1.860s
user    0m2.543s
sys     0m0.234s
```

**Action Items**:

- Run compilation 3 times, record all results
- Calculate average compilation time
- Note any TypeScript warnings in output

---

### 2. Test Suite Execution

**Command**: `npm test`

**Metrics to Capture**:

- Total test execution time
- Tests passing/failing/skipped by suite
- Individual test suite timings
- Memory usage during test execution
- Any test warnings or deprecation notices

**Expected Current State** (from PRD):

- Total Tests: 39
- Passing: 24 (61.5%)
- Failing: 15 (due to missing fixtures)
- Execution Time: ~12 seconds

**Test Suite Breakdown**:

1. `detector.test.ts` - ORCA installation detection tests
2. `installers.test.ts` - OS-specific installer tests
3. `parser.test.ts` - Output parsing tests
4. `validator.test.ts` - Installation validation tests
5. `wizard.test.ts` - Installation wizard UI tests

**Action Items**:

- Run `npm test` 3 times, record all results
- Document which specific tests are failing
- Capture full test output to file: `npm test 2>&1 | tee baseline-tests.log`
- Check for test flakiness (inconsistent pass/fail)

---

### 3. Security Audit

**Command**: `npm audit`

**Metrics to Capture**:

- Total vulnerabilities by severity (critical, high, moderate, low)
- Direct vs transitive vulnerabilities
- Packages requiring updates
- Available automatic fixes

**Action Items**:

```bash
# Run audit and save report
npm audit --json > baseline-audit.json
npm audit > baseline-audit.txt

# Check for outdated packages
npm outdated > baseline-outdated.txt
```

**Document**:

- List of all vulnerable packages
- Severity levels and CVE numbers (if available)
- Whether vulnerabilities are in dev or runtime dependencies

---

### 4. Package Dependencies Analysis

**Command**: `npm ls`

**Action Items**:

```bash
# Full dependency tree
npm ls --all > baseline-dependencies-full.txt

# Direct dependencies only
npm ls --depth=0 > baseline-dependencies-direct.txt

# Check for duplicate packages
npm ls --parseable | awk '{print $1}' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn > baseline-duplicates.txt
```

**Metrics to Capture**:

- Total number of installed packages (direct + transitive)
- Any duplicate dependencies
- Deprecated packages
- Peer dependency warnings

---

### 5. Extension Packaging

**Command**: `npm run package`

**Metrics to Capture**:

- Successful .vsix creation (yes/no)
- .vsix file size in bytes
- Packaging warnings or errors
- Time to create package

**Action Items**:

```bash
# Package extension
time npm run package

# Record .vsix size
ls -lh vs-orca-*.vsix

# Verify .vsix contents
unzip -l vs-orca-*.vsix > baseline-vsix-contents.txt
```

---

### 6. Manual Feature Testing

Test all core features and document behavior:

#### Test Case 1: Syntax Highlighting

- [ ] Open `examples/water_opt.inp`
- [ ] Verify ORCA keywords highlighted correctly
- [ ] Verify comments highlighted in green
- [ ] Verify method/basis set colors
- [ ] Take screenshot for comparison

#### Test Case 2: Snippet Expansion

- [ ] Create new `.inp` file
- [ ] Type `opt` + Tab
- [ ] Verify dropdown with method choices appears
- [ ] Test 3 different snippets
- [ ] Document behavior

#### Test Case 3: ORCA Job Execution

- [ ] Open `examples/methane_freq.inp`
- [ ] Press F5 or run `vs-orca.runJob`
- [ ] Verify output panel opens
- [ ] Document error message (no ORCA binary expected)
- [ ] Verify behavior matches expectation

#### Test Case 4: Installation Wizard

- [ ] Run command `vs-orca.setupOrca`
- [ ] Verify wizard webview opens
- [ ] Navigate through wizard steps
- [ ] Document UI behavior
- [ ] Close wizard

#### Test Case 5: Configuration

- [ ] Open VS Code settings
- [ ] Navigate to ORCA settings
- [ ] Modify `orca.binaryPath`
- [ ] Verify setting persists
- [ ] Reset to default

---

### 7. Current Dependency Versions

Document exact versions from `package.json` and `package-lock.json`:

**Direct DevDependencies** (from package.json):

```json
{
  "@types/mocha": "^10.0.6",
  "@types/node": "^20.x",
  "@types/vscode": "^1.85.0",
  "@typescript-eslint/eslint-plugin": "^6.15.0",
  "@typescript-eslint/parser": "^6.15.0",
  "@vscode/test-electron": "^2.3.8",
  "eslint": "^8.56.0",
  "glob": "^10.3.10",
  "mocha": "^10.2.0",
  "typescript": "^5.3.3",
  "@vscode/vsce": "^2.22.0"
}
```

**Action Items**:

- Run `npm list --depth=0 --json > baseline-versions.json`
- Extract resolved versions from package-lock.json
- Create comparison table for PRD reference

---

## Acceptance Criteria

- [ ] Build time measured (3 runs, average calculated)
- [ ] Test suite executed (3 runs, pass/fail counts recorded)
- [ ] Security audit completed (JSON and text reports saved)
- [ ] Dependency tree analyzed (full tree and duplicates documented)
- [ ] Extension packaging tested (.vsix created and analyzed)
- [ ] All 5 manual test cases executed and documented
- [ ] Current dependency versions documented
- [ ] Baseline report created with all metrics
- [ ] Baseline files committed to feature branch (in `.baseline/` directory)

---

## Deliverables

1. **Baseline Report** (`docs/baseline-report.md`):

   - Summary of all metrics
   - Known issues and limitations
   - Performance baseline for comparison

2. **Baseline Data Directory** (`.baseline/`):

   - `build-times.txt` - 3 compilation time measurements
   - `test-results.txt` - 3 test execution logs
   - `audit.json` and `audit.txt` - Security audit reports
   - `dependencies.json` - Full dependency tree
   - `outdated.txt` - List of outdated packages
   - `vsix-info.txt` - Package size and contents
   - `manual-tests.md` - Manual test case results

3. **Screenshots**:
   - Syntax highlighting in action
   - Test execution output
   - Extension package info

---

## Commands Reference

```bash
# Create baseline directory
mkdir -p .baseline

# Build performance
for i in {1..3}; do
  echo "Build Run $i" >> .baseline/build-times.txt
  time npm run compile 2>&1 | tee -a .baseline/build-times.txt
done

# Test execution
for i in {1..3}; do
  echo "Test Run $i" >> .baseline/test-results.txt
  npm test 2>&1 | tee -a .baseline/test-results.txt
done

# Security audit
npm audit --json > .baseline/audit.json
npm audit > .baseline/audit.txt
npm outdated > .baseline/outdated.txt

# Dependencies
npm ls --json > .baseline/dependencies.json
npm ls --depth=0 > .baseline/dependencies-direct.txt

# Packaging
npm run package 2>&1 | tee .baseline/package-log.txt
ls -lh vs-orca-*.vsix > .baseline/vsix-info.txt
unzip -l vs-orca-*.vsix > .baseline/vsix-contents.txt

# Commit baseline
git add .baseline/
git commit -m "chore: add dependency update baseline measurements"
```

---

## Validation

- [ ] All measurement commands executed successfully
- [ ] Baseline report is comprehensive and readable
- [ ] Baseline data files committed to git
- [ ] Manual test cases documented with screenshots
- [ ] Team review of baseline completed

---

## Notes

- Run all measurements on clean workspace (`npm install` from scratch)
- Ensure no other processes consuming CPU during measurements
- Use same machine/environment for baseline and post-update measurements
- Baseline data will be used in TASK-DEP-020 for comparison

---

## Related Files

- `package.json` - Current dependency versions
- `package-lock.json` - Resolved dependency versions
- `docs/PRD-Dependency-Update.md` - Success metrics definition

---

**Created**: December 21, 2025  
**Last Updated**: December 21, 2025
