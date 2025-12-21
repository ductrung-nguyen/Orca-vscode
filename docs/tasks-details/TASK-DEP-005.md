# TASK-DEP-005: Update @types/* Packages

**Phase**: Phase 2 - TypeScript Dependencies  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 1 hour  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Update TypeScript type definition packages (`@types/*`) to latest versions, ensuring compatibility with TypeScript 5.7.2 and Node.js LTS.

---

## Dependencies

**Blocked By**:
- TASK-DEP-004 (TypeScript 5.7.2 Update)

**Blocks**:
- TASK-DEP-006 (Fix TypeScript Errors)

---

## Objectives

1. Update `@types/node` from 20.x to 22.x
2. Update `@types/mocha` from 10.0.6 to 10.0.10
3. Verify `@types/vscode` remains at 1.85.0 (LOCKED)
4. Ensure type compatibility across all packages

---

## Package Update Plan

### Package 1: @types/node

**Current**: `^20.x`  
**Target**: `^22.x` (Node.js 22 LTS types)

**Rationale**:
- Node.js 22 is latest LTS (as of Dec 2024)
- Better type coverage for modern Node.js APIs
- VS Code 1.85.0 uses Node.js 18.17, but newer types are backward compatible

**Command**:
```bash
npm install --save-dev @types/node@^22
```

**Validation**:
- [ ] Package updated successfully
- [ ] No breaking type changes in our code
- [ ] Compatible with Node.js 18.x runtime

---

### Package 2: @types/mocha

**Current**: `^10.0.6`  
**Target**: `^10.0.10` (latest 10.0.x)

**Rationale**:
- Patch updates for Mocha 10.x API
- Better type definitions for test suite
- No breaking changes within 10.0.x series

**Command**:
```bash
npm install --save-dev @types/mocha@^10.0.10
```

**Validation**:
- [ ] Package updated successfully
- [ ] Test files compile without new errors
- [ ] Test suite types remain compatible

---

### Package 3: @types/vscode

**Current**: `^1.85.0`  
**Target**: `^1.85.0` (**NO CHANGE - LOCKED**)

**Rationale**:
- MUST match `engines.vscode` version in package.json
- VS Code API compatibility requirement
- Updating would require updating minimum VS Code version

**Command**:
```bash
# Verify current version is locked
npm list @types/vscode
# Should show: @types/vscode@1.85.0

# NO UPDATE NEEDED - this is intentional
```

**Validation**:
- [ ] Version confirmed at 1.85.0
- [ ] Matches engines.vscode in package.json
- [ ] Documented as intentionally not updated

---

## Implementation Steps

### 1. Verify Current Versions

```bash
# Check current @types versions
npm list | grep @types

# Expected output:
# ├── @types/mocha@10.0.6
# ├── @types/node@20.x.x
# └── @types/vscode@1.85.0
```

---

### 2. Update @types/node

```bash
# Update to Node.js 22 types
npm install --save-dev @types/node@^22

# Verify installation
npm list @types/node
# Should show: @types/node@22.x.x (e.g., 22.10.0)
```

**Expected Changes in package.json**:
```json
{
  "devDependencies": {
    "@types/node": "^22.x"
  }
}
```

---

### 3. Update @types/mocha

```bash
# Update to latest 10.0.x
npm install --save-dev @types/mocha@^10.0.10

# Verify installation
npm list @types/mocha
# Should show: @types/mocha@10.0.10
```

**Expected Changes in package.json**:
```json
{
  "devDependencies": {
    "@types/mocha": "^10.0.10"
  }
}
```

---

### 4. Verify @types/vscode is Locked

```bash
# Confirm @types/vscode version
npm list @types/vscode
# MUST show: @types/vscode@1.85.0

# Verify engines.vscode matches
grep -A 2 "engines" package.json
# Should show: "vscode": "^1.85.0"
```

**NO CHANGES** - This is correct and intentional.

---

### 5. Compile Project with New Types

```bash
# Clean build
rm -rf out/

# Compile
npm run compile 2>&1 | tee types-update-compile.log
```

**Expected Outcomes**:

**Scenario A: Success (Ideal)**
```
> tsc -p ./
(No output = success)
```

**Scenario B: New Type Errors**
```
src/orcaRunner.ts:67:22 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```
Document errors for TASK-DEP-006

**Scenario C: Type Definition Conflicts**
```
node_modules/@types/node/index.d.ts:1234:12 - error TS2300: Duplicate identifier 'fetch'.
```
Investigate package conflicts

---

### 6. Check Test File Types

```bash
# Compile test files specifically
npx tsc --noEmit src/test/**/*.ts 2>&1 | tee test-types-check.log
```

**Focus Areas**:
- `src/test/suite/*.test.ts` - Mocha type usage
- `src/test/runTest.ts` - Node.js type usage

**Common Mocha Type Issues**:
```typescript
// May need updates if types changed
import { describe, it } from 'mocha';  // Ensure imports work

describe('Test Suite', () => {
  it('should pass', function() {  // 'this' context typing
    this.timeout(5000);
  });
});
```

---

### 7. Run Test Suite

```bash
# Full test execution
npm test 2>&1 | tee types-update-test.log
```

**Validation**:
- [ ] Tests compile successfully
- [ ] Test execution completes
- [ ] No new test failures (baseline: 24/39 passing)
- [ ] Mocha types work correctly

---

## Acceptance Criteria

- [ ] `@types/node` updated to ^22.x
- [ ] `@types/mocha` updated to ^10.0.10
- [ ] `@types/vscode` confirmed at 1.85.0 (not updated)
- [ ] `npm run compile` succeeds with no new errors
- [ ] `npm test` passes with baseline rate (24/39)
- [ ] All type definitions compatible with TypeScript 5.7.2
- [ ] No type-related warnings in compilation
- [ ] Changes committed to feature branch

---

## Commit Message

```bash
git add package.json package-lock.json
git commit -m "chore(deps): update @types/* packages

Updates:
- @types/node: 20.x → 22.x (Node.js 22 LTS types)
- @types/mocha: 10.0.6 → 10.0.10 (latest 10.0.x)
- @types/vscode: 1.85.0 (LOCKED - no change)

Verification:
- All TypeScript files compile cleanly
- Test suite passes with baseline rate (24/39)
- No breaking type changes detected
- Compatible with TypeScript 5.7.2

Related: TASK-DEP-005
Ref: PRD-Dependency-Update.md Phase 2"

git push origin feature/dependency-update
```

---

## Troubleshooting

### Issue: @types/node Breaking Changes

**Symptoms**: Compilation errors in Node.js API usage

**Solution**:
```typescript
// Old (Node.js 18 types)
const buffer = Buffer.from(data);

// May need explicit typing
const buffer: Buffer = Buffer.from(data);
```

### Issue: @types/mocha Incompatibility

**Symptoms**: Test context typing errors

**Solution**:
```typescript
// Ensure proper Mocha imports
import type { Context } from 'mocha';

// Or use function syntax for 'this' context
it('test', function(this: Context) {
  this.timeout(5000);
});
```

### Issue: Type Conflicts Between Packages

**Symptoms**: "Duplicate identifier" errors

**Solution**:
1. Check for conflicting type definitions
2. Use `skipLibCheck: true` in tsconfig.json (temporary)
3. Report issue to DefinitelyTyped if persistent

---

## Validation Checklist

- [ ] All three @types packages addressed
- [ ] @types/vscode intentionally not updated (documented)
- [ ] Compilation succeeds
- [ ] Test suite runs successfully
- [ ] No new type errors introduced
- [ ] package.json and package-lock.json updated
- [ ] Commit pushed to remote

---

## Related Tasks

- TASK-DEP-004: TypeScript 5.7.2 update (prerequisite)
- TASK-DEP-006: Fix TypeScript errors (next)

---

## Related Files

- `package.json` - Type definitions versions
- `tsconfig.json` - TypeScript configuration
- `src/test/**/*.ts` - Test files using Mocha types
- `src/**/*.ts` - Source files using Node.js types

---

**Created**: December 21, 2025  
**Last Updated**: December 21, 2025
