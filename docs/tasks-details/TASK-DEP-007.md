# TASK-DEP-007: Update ESLint Core to 9.x

**Phase**: Phase 3 - ESLint & Code Quality  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 2 hours  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Update ESLint from 8.56.0 to 9.16.0, introducing flat config support. Use compatibility mode initially to minimize migration risk.

---

## Dependencies

**Blocked By**:
- TASK-DEP-006 (TypeScript compilation must be clean)

**Blocks**:
- TASK-DEP-008 (@typescript-eslint update)
- TASK-DEP-009 (ESLint configuration)

---

## Objectives

1. Update `eslint` package to 9.16.0
2. Configure ESLint 9 compatibility mode
3. Verify `npm run lint` continues working
4. Document flat config migration for future

---

## Pre-Update Analysis

### ESLint 9 Breaking Changes

**Major Changes**:
- Flat config is now default format
- Legacy `.eslintrc.*` requires compatibility mode
- Some rule defaults changed
- Deprecated rules removed

**Mitigation Strategy**: Use `ESLINT_USE_FLAT_CONFIG=false` environment variable

---

## Implementation Steps

### 1. Check Current ESLint Configuration

```bash
# Find ESLint config
find . -name ".eslintrc*" -o -name "eslint.config.*"

# Check package.json for inline config
grep -A 10 "eslintConfig" package.json

# Current lint script
grep "lint" package.json
# Expected: "lint": "eslint src --ext ts"
```

---

### 2. Update ESLint Package

```bash
# Update to ESLint 9.16.0
npm install --save-dev eslint@^9.16.0

# Verify installation
npm list eslint
# Should show: eslint@9.16.0
```

---

### 3. Configure Compatibility Mode

**Option A: Environment Variable (Recommended)**

Add to lint script in package.json:
```json
{
  "scripts": {
    "lint": "ESLINT_USE_FLAT_CONFIG=false eslint src --ext ts"
  }
}
```

**Option B: Create eslint.config.js Stub**

Create minimal flat config that preserves legacy behavior:
```javascript
// eslint.config.js
const { FlatCompat } = require("@eslint/eslintrc");
const compat = new FlatCompat();

module.exports = [
  ...compat.config({
    extends: [
      // Existing extends from .eslintrc
    ],
    // Existing rules from .eslintrc
  })
];
```

---

### 4. Test Linting

```bash
# Run lint with new ESLint 9
npm run lint 2>&1 | tee eslint9-test.log
```

**Expected Outcomes**:

**Scenario A: Success**
```
> eslint src --ext ts
(No output or existing known issues)
```

**Scenario B: Configuration Errors**
```
Error: Could not find config file
```
Fix: Verify compatibility mode is active

**Scenario C: New Linting Errors**
```
src/extension.ts
  45:12  error  Unexpected usage...
```
Document for resolution in TASK-DEP-009

---

### 5. Run Full Build Pipeline

```bash
# Clean, compile, lint, test
rm -rf out/
npm run compile
npm run lint
npm test
```

**Validation**:
- [ ] Compilation succeeds
- [ ] Linting completes (may have errors to fix later)
- [ ] Tests run successfully

---

## Acceptance Criteria

- [ ] ESLint updated to 9.16.0
- [ ] Compatibility mode configured
- [ ] `npm run lint` executes without fatal errors
- [ ] No regression in existing lint checks
- [ ] Flat config migration documented for future
- [ ] Changes committed to feature branch

---

## Commit Message

```bash
git add package.json package-lock.json
git commit -m "chore(deps): update ESLint to 9.16.0

- Update eslint from 8.56.0 to 9.16.0
- Configure ESLINT_USE_FLAT_CONFIG=false for compatibility
- Preserve existing lint rules and behavior
- Flat config migration deferred to v0.3.0

Verification:
- npm run lint executes successfully
- No new fatal linting errors
- Compatible with @typescript-eslint updates

Related: TASK-DEP-007
Ref: PRD-Dependency-Update.md Phase 3"

git push origin feature/dependency-update
```

---

## Related Tasks

- TASK-DEP-008: @typescript-eslint update (next)
- TASK-DEP-009: ESLint configuration fixes

---

**Created**: December 21, 2025  
**Last Updated**: December 21, 2025
