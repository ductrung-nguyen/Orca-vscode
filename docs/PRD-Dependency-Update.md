# Product Requirements Document: Dependency Update

**Document Version**: 1.0  
**Created**: December 21, 2025  
**Feature Type**: Maintenance & Security  
**Priority**: High  
**Status**: Draft

---

## 1. Executive Summary

### 1.1 Problem Statement

The VS-ORCA extension currently uses outdated dependencies that present several risks and limitations:

- **Current Pain Points**:

  - Development dependencies are 1-2 years old, missing security patches and bug fixes
  - TypeScript 5.3.3 lacks newer language features and performance improvements
  - ESLint 8.x is superseded by ESLint 9.x with improved TypeScript support
  - Mocha 10.2.0 has known compatibility issues with newer Node.js versions
  - @vscode/test-electron 2.3.8 may have compatibility issues with current VS Code releases
  - Missing security updates for transitive dependencies

- **Risk Impact**:
  - Security vulnerabilities in outdated packages
  - Potential incompatibility with newer VS Code versions
  - Slower build times and development experience
  - Difficulty onboarding contributors with modern toolchains
  - Technical debt accumulation

### 1.2 Proposed Solution

Perform a comprehensive dependency update to latest stable versions while maintaining:

1. **Backward compatibility** with VS Code 1.85.0 engine requirement
2. **Zero breaking changes** to existing functionality (syntax highlighting, execution, wizard, tests)
3. **Security improvements** through updated packages
4. **Performance optimization** from modern tooling
5. **Future-proofing** for easier maintenance

### 1.3 Success Metrics

#### Baseline Metrics (Current State)

- **Build Time**: 1.86 seconds (`npm run compile`)
- **Test Execution Time**: ~12 seconds (24 passing tests)
- **Test Pass Rate**: 61.5% (24/39 tests passing, 15 failing due to missing fixtures)
- **Security Vulnerabilities**: To be measured with `npm audit`

#### Target Metrics (Post-Update)

- **Primary**: All tests pass after dependency updates (100% test suite success rate)
- **Primary**: Extension builds and runs successfully in VS Code 1.85.0+
- **Primary**: No regressions in core features (syntax highlighting, ORCA execution, wizard)
- **Secondary**: Build time ≤ 2.05 seconds (baseline 1.86s + 10% tolerance)
- **Secondary**: Test execution time ≤ 13.2 seconds (baseline 12s + 10% tolerance)
- **Secondary**: Zero security vulnerabilities in dependency tree (verified by `npm audit`)
- **Secondary**: Documentation updated to reflect new dependency versions

---

## 2. Stakeholders

### 2.1 Project Roles

- **Project Owner**: Extension maintainer (ductrung-nguyen)
- **Technical Lead**: Development team
- **Approvers**: Project maintainer(s)
- **Contributors**: Open-source contributors and developers

### 2.2 Stakeholder Interests

| Stakeholder     | Primary Interest                              | Success Criteria                         |
| --------------- | --------------------------------------------- | ---------------------------------------- |
| Project Owner   | Long-term maintainability and security        | Zero critical vulnerabilities            |
| Technical Lead  | Development efficiency and tooling stability  | No build/test regressions                |
| Contributors    | Modern development experience                 | Easy onboarding, clear documentation     |
| End Users       | Stable extension functionality                | No breaking changes, improved stability  |

---

## 3. User Impact

### 3.1 Direct Beneficiaries

**Developers and Contributors**:
- Modern TypeScript features (5.7.x) for improved code quality
- Faster development cycle with optimized build tools
- Better IDE support with updated ESLint and TypeScript-ESLint
- Reduced onboarding friction with current toolchain versions
- Improved security posture reduces audit findings

**Project Maintainers**:
- Reduced technical debt from outdated dependencies
- Better long-term maintainability
- Easier to attract and onboard contributors
- Lower security risk exposure

### 3.2 Indirect Beneficiaries

**End Users (ORCA Extension Users)**:
- More stable extension through improved testing infrastructure
- Faster bug fixes enabled by modern development tools
- Reduced risk of security vulnerabilities
- Better VS Code compatibility with updated test infrastructure
- No breaking changes or disruption to user workflows

### 3.3 Impact Assessment

- **User-Facing Changes**: None (internal tooling update only)
- **Breaking Changes**: Zero
- **Migration Required**: None for end users
- **Downtime**: None
- **Risk Level**: Low (comprehensive testing strategy in place)

---

## 4. Requirements

### 4.1 Functional Requirements

#### FR-1: TypeScript Ecosystem Update

**Priority**: P0 (Must Have)

Update TypeScript and related tooling to latest stable versions:

- **FR-1.1**: TypeScript Compiler Update

  - Current: `typescript@5.3.3` (Dec 2023)
  - Target: `typescript@5.7.x` (latest stable as of Dec 2024)
  - Rationale: Performance improvements, better type inference, bug fixes
  - Constraints: Must maintain compatibility with VS Code 1.85.0

- **FR-1.2**: TypeScript-ESLint Update

  - Current: `@typescript-eslint/eslint-plugin@6.15.0`, `@typescript-eslint/parser@6.15.0`
  - Target: `@typescript-eslint/eslint-plugin@8.x`, `@typescript-eslint/parser@8.x`
  - Rationale: Improved TypeScript 5.x support, new lint rules, performance
  - Note: Major version jump requires configuration review

- **FR-1.3**: Type Definitions Update
  - Current: `@types/node@20.x`, `@types/vscode@1.85.0`, `@types/mocha@10.0.6`
  - Target: `@types/node@22.x`, `@types/vscode@1.85.0`, `@types/mocha@10.0.x`
  - Constraints: `@types/vscode` must stay at 1.85.0 to match engine version

**Acceptance Criteria**:

- ✅ TypeScript compilation succeeds without new errors
- ✅ All existing type annotations remain valid
- ✅ No type-related runtime errors introduced
- ✅ Build time does not increase (ideally improves)

---

#### FR-2: ESLint Ecosystem Update

**Priority**: P0 (Must Have)

Update ESLint to latest major version with compatibility adjustments:

- **FR-2.1**: ESLint Core Update

  - Current: `eslint@8.56.0`
  - Target: `eslint@9.x` (latest stable)
  - Rationale: Flat config support, improved performance, security fixes
  - Breaking: ESLint 9 requires flat config format or compatibility mode

- **FR-2.2**: Configuration Migration

  - Evaluate current `.eslintrc.json` (if exists) or inline config
  - Migrate to ESLint 9 flat config (`eslint.config.js`) OR
  - Use `ESLINT_USE_FLAT_CONFIG=false` environment variable for gradual migration
  - Maintain all existing lint rules and severity levels

- **FR-2.3**: Integration Validation
  - Verify `npm run lint` script continues working
  - Test VS Code ESLint extension integration
  - Ensure no new linting errors from rule changes

**Acceptance Criteria**:

- ✅ `npm run lint` executes successfully
- ✅ No new linting errors introduced in existing code
- ✅ All current lint rules remain active
- ✅ VS Code ESLint extension continues to work

---

#### FR-3: Testing Framework Update

**Priority**: P0 (Must Have)

Update Mocha test runner and VS Code test infrastructure:

- **FR-3.1**: Mocha Update

  - Current: `mocha@10.2.0`
  - Target: `mocha@10.x` (latest stable 10.x patch version)
  - Rationale: Bug fixes, Node.js 20+ compatibility improvements
  - Constraints: Stay within v10 to avoid breaking changes

- **FR-3.2**: VS Code Test Electron Update

  - Current: `@vscode/test-electron@2.3.8`
  - Target: `@vscode/test-electron@2.4.x` (latest stable 2.x)
  - Rationale: Better VS Code API mocking, improved test isolation
  - Constraints: Stay within v2.x for compatibility with VS Code 1.85.0

- **FR-3.3**: Test Execution Validation
  - Run all existing tests: detector.test.ts, installers.test.ts, parser.test.ts, validator.test.ts, wizard.test.ts
  - Verify test coverage remains unchanged
  - Ensure test output format compatibility

**Acceptance Criteria**:

- ✅ All 5 test suites pass without modification
- ✅ `npm test` executes successfully
- ✅ No test timeouts or hanging processes
- ✅ Test output remains readable and actionable

---

#### FR-4: Build & Development Tools Update

**Priority**: P1 (Should Have)

Update build tooling and development utilities:

- **FR-4.1**: Glob Pattern Matcher Update

  - Current: `glob@10.3.10`
  - Target: `glob@11.x` (latest stable)
  - Rationale: Performance improvements, better pattern support
  - Usage: Test file discovery, fixture loading

- **FR-4.2**: VS Code Extension Packaging Update
  - Current: `@vscode/vsce@2.22.0`
  - Target: `@vscode/vsce@3.x` (latest stable)
  - Rationale: Better .vsix packaging, improved validation
  - Test: Run `npm run package` to verify .vsix creation

**Acceptance Criteria**:

- ✅ Extension packages successfully with `vsce package`
- ✅ .vsix file size does not increase significantly (±10%)
- ✅ Test discovery with glob patterns continues to work
- ✅ All build scripts execute without errors

---

### 4.2 Non-Functional Requirements

#### NFR-1: Backward Compatibility

**Priority**: P0 (Must Have)

- **NFR-1.1**: VS Code Engine Compatibility

  - Extension must run on VS Code 1.85.0 and higher
  - No features requiring VS Code 1.86.0+ APIs
  - Test on VS Code 1.85.0 (minimum) and latest stable version

- **NFR-1.2**: Node.js Runtime Compatibility

  - Target Node.js 18.x and 20.x (VS Code 1.85.0 uses Node 18.17)
  - TypeScript compilation target remains ES2020 or compatible
  - No dependencies requiring Node.js 22+ features

- **NFR-1.3**: Extension API Stability
  - All VS Code API usage remains unchanged
  - No breaking changes to public extension commands or configuration
  - Extension activation events remain compatible

**Acceptance Criteria**:

- ✅ Extension activates successfully in VS Code 1.85.0
- ✅ All commands executable without errors
- ✅ No console errors or warnings on activation
- ✅ Test suite passes on Node.js 18.x and 20.x

---

#### NFR-2: Security & Vulnerability Remediation

**Priority**: P0 (Must Have)

- **NFR-2.1**: Direct Dependency Audit

  - Run `npm audit` after updates
  - Zero high or critical vulnerabilities in direct dependencies
  - Document any moderate vulnerabilities with justification

- **NFR-2.2**: Transitive Dependency Audit

  - Review `npm audit` for indirect dependencies
  - Use `npm audit fix` to resolve auto-fixable vulnerabilities
  - Document any remaining vulnerabilities with mitigation plan

- **NFR-2.3**: License Compliance
  - Verify all dependencies use approved licenses (MIT, Apache 2.0, BSD)
  - Document any license changes from updates
  - Ensure no GPL/AGPL dependencies introduced

**Acceptance Criteria**:

- ✅ `npm audit` reports zero high/critical vulnerabilities
- ✅ All licenses remain OSI-approved and compatible
- ✅ Security documentation updated in SECURITY.md (if exists)

---

#### NFR-3: Development Experience

**Priority**: P1 (Should Have)

- **NFR-3.1**: Build Performance

  - TypeScript compilation time does not regress
  - Watch mode (`npm run watch`) remains responsive
  - Test execution time within ±10% of current baseline

- **NFR-3.2**: Developer Onboarding

  - `npm install` completes without errors
  - `npm run compile` works immediately after clone
  - Clear error messages for missing prerequisites

- **NFR-3.3**: Documentation Updates
  - Update package.json version history (if applicable)
  - Document any breaking changes in CHANGELOG.md
  - Update CONTRIBUTING.md with new dependency versions

**Acceptance Criteria**:

- ✅ Fresh clone → `npm install` → `npm test` succeeds
- ✅ Build times measured and documented
- ✅ CHANGELOG.md includes dependency update entry

---

## 5. Technical Specification

### 5.1 Dependency Update Strategy

#### Phase 1: Pre-Update Analysis

1. **Baseline Measurement**:

   - Run test suite and record pass/fail counts
   - Measure build time with `time npm run compile`
   - Execute `npm audit` and save report
   - Document current behavior of all features

2. **Compatibility Research**:
   - Review CHANGELOG for each target dependency
   - Identify breaking changes requiring code modifications
   - Check VS Code 1.85.0 compatibility for all updates
   - Verify Node.js 18.x/20.x support

#### Phase 2: Incremental Updates

1. **TypeScript Ecosystem** (First):

   - Update `typescript` to 5.7.x
   - Update `@types/*` packages
   - Run `npm run compile` → Fix any type errors
   - Run test suite → Fix any test failures

2. **ESLint Ecosystem** (Second):

   - Update `eslint` to 9.x
   - Update `@typescript-eslint/*` plugins
   - Run `npm run lint` → Fix configuration if needed
   - Resolve any new linting errors

3. **Testing Framework** (Third):

   - Update `mocha` to latest 10.x
   - Update `@vscode/test-electron` to latest 2.x
   - Run `npm test` → Fix any test infrastructure issues

4. **Build Tools** (Fourth):
   - Update `glob`, `@vscode/vsce`
   - Test packaging with `npm run package`
   - Verify .vsix file validity

#### Phase 3: Validation & Documentation

1. **Comprehensive Testing**:

   - Run full test suite 3 times (ensure no flaky tests)
   - Manual testing: syntax highlighting, ORCA execution, wizard
   - Test on multiple VS Code versions (1.85.0, 1.90.0, latest)

2. **Security Audit**:

   - Run `npm audit` → Address all findings
   - Run `npm outdated` → Verify no critical updates missed
   - Document any accepted vulnerabilities

3. **Documentation**:
   - Update CHANGELOG.md with dependency changes
   - Update any developer documentation referencing versions
   - Create git commit with detailed commit message

### 5.2 Updated Dependency Manifest

```json
{
  "devDependencies": {
    "@types/mocha": "^10.0.10",
    "@types/node": "^22.x",
    "@types/vscode": "^1.85.0",
    "@typescript-eslint/eslint-plugin": "^8.17.0",
    "@typescript-eslint/parser": "^8.17.0",
    "@vscode/test-electron": "^2.4.1",
    "@vscode/vsce": "^3.2.1",
    "eslint": "^9.16.0",
    "glob": "^11.0.0",
    "mocha": "^10.8.2",
    "typescript": "^5.7.2"
  },
  "dependencies": {}
}
```

**Version Selection Rationale**:

- TypeScript 5.7.2: Latest stable with performance improvements
- ESLint 9.16.0: Latest with flat config support
- @typescript-eslint 8.17.0: Latest supporting TypeScript 5.7
- Mocha 10.8.2: Latest 10.x patch with Node.js 20+ fixes
- @vscode/test-electron 2.4.1: Latest 2.x compatible with VS Code 1.85.0
- @vscode/vsce 3.2.1: Latest with improved packaging
- glob 11.0.0: Latest with performance improvements
- @types/node 22.x: Latest LTS Node.js types
- @types/vscode 1.85.0: **LOCKED** to match engine version

### 5.3 Configuration Changes Required

#### ESLint 9.x Migration

If using `.eslintrc.json`:

```javascript
// Option 1: Migrate to eslint.config.js (recommended)
import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

export default [
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Existing rules from .eslintrc.json
    },
  },
];

// Option 2: Use compatibility mode (temporary)
// Set environment variable: ESLINT_USE_FLAT_CONFIG=false
```

#### TypeScript Configuration (tsconfig.json)

No changes required, but verify:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true
  }
}
```

---

## 6. Implementation Plan

### 6.1 Development Phases

#### Phase 1: Preparation (1 day)

- [ ] Create feature branch: `feature/dependency-update`
- [ ] Backup current package-lock.json
- [ ] Run baseline tests and document results
- [ ] Measure baseline build times
- [ ] Run `npm audit` and save report

#### Phase 2: TypeScript Update (1 day)

- [ ] Update `typescript` to 5.7.x
- [ ] Update `@types/node` to 22.x
- [ ] Update `@types/mocha` to 10.0.x
- [ ] Run `npm install`
- [ ] Fix any TypeScript compilation errors
- [ ] Run test suite → Fix failures

#### Phase 3: ESLint Update (1 day)

- [ ] Update `eslint` to 9.x
- [ ] Update `@typescript-eslint/*` to 8.x
- [ ] Migrate ESLint config (if needed)
- [ ] Run `npm run lint` → Fix issues
- [ ] Verify VS Code ESLint extension works

#### Phase 4: Testing Tools Update (1 day)

- [ ] Update `mocha` to latest 10.x
- [ ] Update `@vscode/test-electron` to 2.4.x
- [ ] Update `glob` to 11.x
- [ ] Run test suite → Fix any infrastructure issues
- [ ] Verify all 5 test suites pass

#### Phase 5: Build Tools Update (0.5 days)

- [ ] Update `@vscode/vsce` to 3.x
- [ ] Run `npm run package`
- [ ] Verify .vsix file validity
- [ ] Test extension installation from .vsix

#### Phase 6: Validation (1 day)

- [ ] Run test suite 3 times (check for flaky tests)
- [ ] Manual feature testing (syntax, execution, wizard)
- [ ] Test on VS Code 1.85.0 (minimum version)
- [ ] Test on VS Code latest stable
- [ ] Run `npm audit` → Fix vulnerabilities
- [ ] Compare build times vs baseline

#### Phase 7: Documentation (0.5 days)

- [ ] Update CHANGELOG.md
- [ ] Update CONTRIBUTING.md (if version-specific)
- [ ] Document any breaking changes
- [ ] Create detailed commit message
- [ ] Update README.md (if needed)

**Total Timeline**: 6 days (1 + 1 + 1 + 1 + 0.5 + 1 + 0.5)

### 6.2 Rollback Plan

If critical issues discovered after updates:

1. **Immediate Rollback**:

   ```bash
   git checkout package.json package-lock.json
   npm install
   npm test
   ```

2. **Partial Rollback**:

   - Revert specific dependency to previous version
   - Run `npm install <package>@<old-version>`
   - Document reason for rollback

3. **Version Pinning**:
   - Use exact versions (remove `^`) for problematic packages
   - Document in package.json comments

---

## 7. Testing Strategy

### 7.1 Automated Testing

#### Unit Tests

- **Location**: `src/test/suite/`
- **Coverage**: detector.test.ts, installers.test.ts, parser.test.ts, validator.test.ts, wizard.test.ts
- **Execution**: `npm test`
- **Success Criteria**: 100% pass rate, no new warnings

#### Integration Tests

- **Scenario 1**: Extension activation in VS Code 1.85.0
- **Scenario 2**: Syntax highlighting for `.inp` files
- **Scenario 3**: ORCA job execution (mock binary)
- **Scenario 4**: Installation wizard workflow
- **Scenario 5**: Output parsing with real ORCA output samples

#### Build Tests

- **Test 1**: Fresh clone → `npm install` → `npm run compile`
- **Test 2**: Watch mode: `npm run watch` → modify file → verify recompile
- **Test 3**: Linting: `npm run lint` → verify no errors
- **Test 4**: Package: `npm run package` → verify .vsix creation

### 7.2 Manual Testing

#### Feature Validation Checklist

- [ ] **Syntax Highlighting**: Open `examples/water_opt.inp` → verify colors
- [ ] **Snippets**: Type `opt` + Tab → verify expansion
- [ ] **ORCA Execution**: F5 on .inp file → verify output panel
- [ ] **Installation Wizard**: Run `vs-orca.setupOrca` → complete workflow
- [ ] **Auto-Detection**: Restart VS Code → verify ORCA detection
- [ ] **Kill Job**: Start job → kill → verify process termination
- [ ] **Configuration**: Modify `orca.binaryPath` → verify persistence

#### Cross-Platform Testing (if applicable)

- [ ] Linux (Ubuntu 22.04)
- [ ] macOS (Intel and/or Apple Silicon)
- [ ] Windows 10/11

### 7.3 Security Testing

- [ ] Run `npm audit` → Zero high/critical vulnerabilities
- [ ] Check license compliance with `npm ls --json`
- [ ] Verify no suspicious network requests in dependencies
- [ ] Review CHANGELOG of major version updates for security fixes

---

## 8. Risks & Mitigation

### 8.1 Technical Risks

| Risk                           | Likelihood | Impact   | Mitigation                                   |
| ------------------------------ | ---------- | -------- | -------------------------------------------- |
| ESLint 9 breaking changes      | High       | Medium   | Use flat config compatibility mode initially |
| TypeScript 5.7 new errors      | Medium     | Medium   | Incremental update with immediate testing    |
| Test framework incompatibility | Low        | High     | Stay within major version (Mocha 10.x)       |
| VS Code 1.85.0 incompatibility | Low        | Critical | Lock @types/vscode, test on minimum version  |
| Dependency conflicts           | Medium     | Medium   | Use `npm ls` to detect conflicts early       |
| Performance regression         | Low        | Medium   | Measure and compare build times              |

### 8.2 Project Risks

| Risk                  | Likelihood | Impact | Mitigation                                   |
| --------------------- | ---------- | ------ | -------------------------------------------- |
| Extended testing time | Medium     | Low    | Allocate 2 days for validation               |
| Flaky tests exposed   | Low        | Medium | Run tests multiple times, fix root causes    |
| Documentation lag     | Medium     | Low    | Update docs during implementation, not after |
| User impact from bugs | Low        | High   | Thorough testing before release              |

### 8.3 Mitigation Strategies

1. **Incremental Approach**: Update one ecosystem at a time (TypeScript → ESLint → Testing → Build)
2. **Version Pinning**: Use exact versions (`5.7.2` not `^5.7.0`) if stability issues arise
3. **Automated Validation**: Run CI/CD pipeline on feature branch before merge
4. **Rollback Readiness**: Keep package.json backup, document rollback procedure
5. **Community Feedback**: If released as beta, monitor GitHub issues for 1 week

---

## 9. Dependencies & Constraints

### 9.1 Technical Dependencies

- **VS Code Engine**: Must remain compatible with `^1.85.0`
- **Node.js Runtime**: Support Node.js 18.x (used by VS Code 1.85.0)
- **TypeScript Target**: ES2020 compilation target for compatibility
- **No Runtime Dependencies**: Extension has zero `dependencies` (only `devDependencies`)

### 9.2 External Constraints

- **ORCA Compatibility**: Dependency updates must not affect ORCA binary execution
- **Test Environment**: Tests must run in CI/CD (GitHub Actions) without external services
- **Packaging**: Final .vsix size should not exceed 5MB
- **License Compliance**: All dependencies must use OSI-approved licenses

### 9.3 Project Constraints

- **Timeline**: Target 6 days for complete implementation and validation
- **Breaking Changes**: Zero user-facing breaking changes allowed
- **Test Coverage**: Must maintain 100% test pass rate
- **Documentation**: All changes must be documented in CHANGELOG.md

---

## 10. Success Criteria

### 10.1 Acceptance Criteria

- [ ] All devDependencies updated to latest stable versions
- [ ] `npm install` completes without warnings
- [ ] `npm run compile` succeeds without errors in ≤ 2.05 seconds (baseline 1.86s + 10%)
- [ ] `npm run lint` executes successfully with zero errors
- [ ] `npm test` passes all test suites (100% pass rate) in ≤ 13.2 seconds (baseline 12s + 10%)
- [ ] `npm run package` creates valid .vsix file (size ≤ 5MB, within ±10% of current size)
- [ ] Extension activates in VS Code 1.85.0 without errors
- [ ] All core features work: syntax highlighting, execution, wizard
- [ ] `npm audit` reports zero high/critical vulnerabilities
- [ ] Build time: 1.67s - 2.05s (baseline 1.86s ± 10%)
- [ ] Test execution time: 10.8s - 13.2s (baseline 12s ± 10%)
- [ ] CHANGELOG.md updated with dependency changes

### 10.2 Quality Gates

1. **Code Quality**: No new ESLint errors, TypeScript compilation clean
2. **Test Quality**: All tests pass, no skipped or flaky tests
3. **Security Quality**: Zero high/critical npm audit findings
4. **Performance Quality**: Build time does not regress
5. **Documentation Quality**: CHANGELOG and commit messages complete

### 10.3 Release Criteria

Before merging to main branch:

- [ ] All acceptance criteria met
- [ ] Code review completed (if applicable)
- [ ] Manual testing on 2+ platforms
- [ ] Performance benchmarks acceptable
- [ ] Documentation review completed

---

## 11. Design Decisions

### 11.1 Resolved Decisions

All key decisions have been finalized and incorporated into the main document:

1. **ESLint Configuration**: Use compatibility mode (`ESLINT_USE_FLAT_CONFIG=false`) initially, plan flat config migration for v0.3.0
   - **Rationale**: Minimizes risk during dependency update; flat config migration is a separate, lower-priority task
   - **Location**: Section 5.3 (Configuration Changes Required)

2. **TypeScript Target**: Keep ES2020 compilation target
   - **Rationale**: Ensures Node.js 18 compatibility (required by VS Code 1.85.0)
   - **Location**: Section 4.2 (NFR-1.2)

3. **Dependency Versioning**: Use caret ranges (^) for all dependencies
   - **Rationale**: Follows npm best practices; allows automatic patch updates
   - **Fallback**: Pin exact versions only if stability issues arise
   - **Location**: Section 5.2 (Updated Dependency Manifest)

4. **Testing Scope**: Focus on regression testing only
   - **Rationale**: Dependency updates should not change behavior; new tests only if behavior changes detected
   - **Location**: Section 7.1 (Automated Testing)

5. **Release Version**: Target v0.2.1 (patch release)
   - **Rationale**: Internal tooling update with zero user-facing changes
   - **Location**: Section 10.3 (Release Criteria)

### 11.2 Open Items

No unresolved questions remain. All decisions documented above are final and approved.

---

## 12. Appendix

### 12.1 Current Dependency Versions

| Package                          | Current | Latest Stable | Update Type |
| -------------------------------- | ------- | ------------- | ----------- |
| typescript                       | 5.3.3   | 5.7.2         | Minor       |
| eslint                           | 8.56.0  | 9.16.0        | Major       |
| @typescript-eslint/eslint-plugin | 6.15.0  | 8.17.0        | Major       |
| @typescript-eslint/parser        | 6.15.0  | 8.17.0        | Major       |
| mocha                            | 10.2.0  | 10.8.2        | Patch       |
| @vscode/test-electron            | 2.3.8   | 2.4.1         | Minor       |
| @vscode/vsce                     | 2.22.0  | 3.2.1         | Major       |
| glob                             | 10.3.10 | 11.0.0        | Major       |
| @types/node                      | 20.x    | 22.x          | Major       |
| @types/mocha                     | 10.0.6  | 10.0.10       | Patch       |
| @types/vscode                    | 1.85.0  | 1.85.0        | **LOCKED**  |

### 12.2 Reference Documentation

- [TypeScript 5.7 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html)
- [ESLint 9.x Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [VS Code Extension API Compatibility](https://code.visualstudio.com/api/references/vscode-api)
- [Mocha 10.x Documentation](https://mochajs.org/#release-notes)

### 12.3 Related Documents

- [VS-ORCA Architecture Guide](/.github/copilot-instructions.md)
- [CONTRIBUTING.md](/CONTRIBUTING.md)
- [CHANGELOG.md](/CHANGELOG.md)
- [package.json](/package.json)

---

**Document Status**: Draft  
**Next Review**: After Phase 2 completion  
**Approvers**: Project Maintainer  
**Questions/Feedback**: GitHub Issues or Discussions
