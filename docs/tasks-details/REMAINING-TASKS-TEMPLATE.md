# Remaining Task Templates - Quick Reference

This document provides templates for the remaining detailed task files (TASK-DEP-006, 008-018, 020, 022-024) that follow the same comprehensive format as the sample tasks already created.

---

## TASK-DEP-006: Fix TypeScript Compilation Errors

**Phase**: Phase 2 - TypeScript Dependencies  
**Priority**: P0  
**Effort**: 2 hours

**Key Actions**:
- Fix any new type errors from TypeScript 5.7
- Update type assertions as needed
- Resolve strict mode issues
- Ensure clean compilation with zero errors

**Acceptance**: All TypeScript files compile cleanly, no type errors

---

## TASK-DEP-008: Update @typescript-eslint/* to 8.x

**Phase**: Phase 3 - ESLint & Code Quality  
**Priority**: P0  
**Effort**: 1.5 hours

**Key Actions**:
- Update @typescript-eslint/eslint-plugin to 8.17.0
- Update @typescript-eslint/parser to 8.17.0
- Map old rule names to new rule names
- Verify TypeScript 5.7 compatibility

**Acceptance**: Both packages updated, lint rules work correctly

---

## TASK-DEP-009: Configure ESLint Compatibility Mode

**Phase**: Phase 3 - ESLint & Code Quality  
**Priority**: P0  
**Effort**: 1.5 hours

**Key Actions**:
- Set ESLINT_USE_FLAT_CONFIG=false in npm scripts
- Update package.json lint script
- Resolve any new lint errors
- Document flat config migration for v0.3.0

**Acceptance**: npm run lint succeeds, compatibility mode active

---

## TASK-DEP-010: Update Mocha to Latest 10.x

**Phase**: Phase 4 - Testing Tools & Framework  
**Priority**: P0  
**Effort**: 1 hour

**Key Actions**:
- Update mocha from 10.2.0 to 10.8.2
- Verify test runner compatibility
- Run full test suite
- Check for timeout issues

**Acceptance**: Mocha updated, tests run successfully

---

## TASK-DEP-011: Update @vscode/test-electron to 2.4.x

**Phase**: Phase 4 - Testing Tools & Framework  
**Priority**: P0  
**Effort**: 1.5 hours

**Key Actions**:
- Update @vscode/test-electron from 2.3.8 to 2.4.1
- Verify VS Code test infrastructure
- Test all 5 test suites
- Verify VS Code 1.85.0 compatibility

**Acceptance**: Package updated, all tests pass

---

## TASK-DEP-012: Fix Test Infrastructure Issues

**Phase**: Phase 4 - Testing Tools & Framework  
**Priority**: P0  
**Effort**: 2 hours

**Key Actions**:
- Resolve any test failures from updates
- Fix missing fixtures (address 15 failing tests from baseline)
- Update test configurations
- Achieve 100% test pass rate (39/39)

**Acceptance**: All tests pass, no infrastructure issues

---

## TASK-DEP-013: Update glob to 11.x

**Phase**: Phase 5 - Build & Packaging Tools  
**Priority**: P1  
**Effort**: 1 hour

**Key Actions**:
- Update glob from 10.3.10 to 11.0.0
- Review breaking changes in v11
- Verify pattern matching in test file discovery
- Check performance

**Acceptance**: glob updated, file discovery works

---

## TASK-DEP-014: Update @vscode/vsce to 3.x

**Phase**: Phase 5 - Build & Packaging Tools  
**Priority**: P1  
**Effort**: 1 hour

**Key Actions**:
- Update @vscode/vsce from 2.22.0 to 3.2.1
- Review v3 breaking changes
- Test package command
- Verify package.json compatibility

**Acceptance**: vsce updated, packaging works

---

## TASK-DEP-015: Validate Extension Packaging

**Phase**: Phase 5 - Build & Packaging Tools  
**Priority**: P0  
**Effort**: 1 hour

**Key Actions**:
- Run npm run package
- Create .vsix file successfully
- Verify .vsix contents
- Check file size (within ±10% of baseline)
- Test installation from .vsix

**Acceptance**: .vsix created, valid, installable

---

## TASK-DEP-016: Comprehensive Test Suite Execution

**Phase**: Phase 6 - Validation & Testing  
**Priority**: P0  
**Effort**: 2 hours

**Key Actions**:
- Run npm test 3 times
- Check for flaky tests
- Verify 100% pass rate (39/39 tests)
- Document test execution times
- Compare with baseline (12s target: ≤13.2s)

**Acceptance**: Tests pass consistently, no flakiness

---

## TASK-DEP-017: Manual Feature Testing

**Phase**: Phase 6 - Validation & Testing  
**Priority**: P0  
**Effort**: 2 hours

**Key Actions**:
- Test syntax highlighting (water_opt.inp)
- Test snippet expansion
- Test ORCA job execution (F5)
- Test installation wizard
- Test all commands
- Document results

**Acceptance**: All features work as expected

---

## TASK-DEP-018: Cross-Version VS Code Testing

**Phase**: Phase 6 - Validation & Testing  
**Priority**: P0  
**Effort**: 1.5 hours

**Key Actions**:
- Test on VS Code 1.85.0 (minimum version)
- Test on latest stable VS Code
- Verify activation
- Test all commands
- Document compatibility

**Acceptance**: Works on 1.85.0 and latest

---

## TASK-DEP-020: Performance Benchmarking

**Phase**: Phase 6 - Validation & Testing  
**Priority**: P0  
**Effort**: 1 hour

**Key Actions**:
- Measure build time (3 runs, average)
- Measure test execution time (3 runs, average)
- Measure .vsix file size
- Compare with baseline
- Document improvements/regressions
- Verify within tolerance (±10%)

**Acceptance Criteria**:
- Build time: ≤ 2.05s (baseline 1.86s)
- Test time: ≤ 13.2s (baseline 12s)
- Metrics documented

---

## TASK-DEP-022: Update Developer Documentation

**Phase**: Phase 7 - Documentation & Finalization  
**Priority**: P1  
**Effort**: 1 hour

**Key Actions**:
- Update CONTRIBUTING.md (if version-specific)
- Update README.md (if needed)
- Document new dependency versions
- Add troubleshooting for common issues
- Update development setup instructions

**Acceptance**: Documentation current and accurate

---

## TASK-DEP-023: Create Detailed Commit Message

**Phase**: Phase 7 - Documentation & Finalization  
**Priority**: P0  
**Effort**: 0.5 hours

**Key Actions**:
- Write comprehensive commit message
- Include all dependency changes
- Add performance metrics
- Reference PRD and tasks
- Follow conventional commits format

**Template**:
```
chore(deps): update all development dependencies to latest

TypeScript Ecosystem:
- typescript: 5.3.3 → 5.7.2
- @types/node: 20.x → 22.x
- @types/mocha: 10.0.6 → 10.0.10

ESLint Ecosystem:
- eslint: 8.56.0 → 9.16.0
- @typescript-eslint/*: 6.15.0 → 8.17.0

Testing:
- mocha: 10.2.0 → 10.8.2
- @vscode/test-electron: 2.3.8 → 2.4.1

Build Tools:
- glob: 10.3.10 → 11.0.0
- @vscode/vsce: 2.22.0 → 3.2.1

Performance:
- Build time: [X.XX]s (baseline: 1.86s) ✅
- Test time: [X.XX]s (baseline: 12s) ✅
- All tests passing: 39/39 ✅

Security:
- Zero high/critical vulnerabilities ✅

Breaking Changes: None
User Impact: None (internal tooling only)

Ref: PRD-Dependency-Update.md
Tasks: TASK-DEP-001 through TASK-DEP-024
```

**Acceptance**: Commit message complete and informative

---

## TASK-DEP-024: Final Review & Merge Preparation

**Phase**: Phase 7 - Documentation & Finalization  
**Priority**: P0  
**Effort**: 1 hour

**Key Actions**:
- Review all acceptance criteria met
- Run final validation sequence:
  - npm install (clean)
  - npm run compile
  - npm run lint
  - npm test
  - npm run package
- Verify all documentation updated
- Check all commits pushed
- Prepare PR description
- Complete final checklist

**Final Checklist**:
- [ ] All dependencies updated
- [ ] Build succeeds
- [ ] Tests pass (100%)
- [ ] Lint clean
- [ ] Package creates .vsix
- [ ] Security audit clean
- [ ] Performance within targets
- [ ] CHANGELOG updated
- [ ] Documentation updated
- [ ] Commits pushed
- [ ] Ready for PR/merge

**Acceptance**: All checks pass, ready to merge

---

## Implementation Notes

### For Each Task:

1. **Follow established pattern** from TASK-DEP-001 through TASK-DEP-005
2. **Include sections**:
   - Overview
   - Dependencies (Blocked By / Blocks)
   - Objectives
   - Implementation Steps
   - Acceptance Criteria
   - Commit Message template
   - Troubleshooting
   - Related Tasks/Files

3. **Be specific**:
   - Exact commands to run
   - Expected outputs
   - Version numbers
   - Validation steps

4. **Document thoroughly**:
   - Why each step is needed
   - What success looks like
   - How to troubleshoot
   - Where to find related info

---

## Task File Naming Convention

```
docs/tasks-details/TASK-DEP-XXX.md
```

Where XXX is the three-digit task number (001-024)

---

**Created**: December 21, 2025  
**Status**: Template Reference for Remaining Tasks  
**Usage**: Expand each template above into full detailed task file following the pattern of existing tasks
