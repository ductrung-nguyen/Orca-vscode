# TASK-DEP-004: Update TypeScript to 5.7.x

**Phase**: Phase 2 - TypeScript Dependencies  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 2 hours  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Update TypeScript compiler from 5.3.3 to 5.7.2 (latest stable). TypeScript is foundational for the entire project, so this must be the first dependency updated.

---

## Dependencies

**Blocked By**:

- TASK-DEP-001 (Baseline Measurement)
- TASK-DEP-002 (Compatibility Research)
- TASK-DEP-003 (Branch Setup)

**Blocks**:

- TASK-DEP-005 (Type Definitions Update)
- TASK-DEP-006 (Fix TypeScript Errors)

---

## Objectives

1. Update `typescript` package to 5.7.2
2. Verify compilation succeeds
3. Check for new compiler warnings/errors
4. Measure build time impact
5. Commit TypeScript update

---

## Pre-Update Checks

### Current State Verification

```bash
# Verify current version
npm list typescript
# Expected: typescript@5.3.3

# Verify clean build
npm run compile
# Should succeed with no errors

# Check tsconfig.json
cat tsconfig.json | grep -E "(target|module|lib)"
```

**Expected tsconfig.json**:

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

**Validation**:

- [ ] TypeScript 5.3.3 confirmed
- [ ] Clean compilation baseline established
- [ ] tsconfig.json reviewed

---

## Implementation Steps

### 1. Update TypeScript Package

```bash
# Update to latest 5.7.x
npm install --save-dev typescript@~5.7.2

# Verify installation
npm list typescript
# Expected: typescript@5.7.2

# Check package.json
cat package.json | grep typescript
# Should show: "typescript": "^5.7.2" or "~5.7.2"
```

**Version Strategy**:

- Use `^5.7.2` (caret) to allow 5.7.x patches
- Or use `~5.7.2` (tilde) for stricter control

**Validation**:

- [ ] TypeScript updated to 5.7.2
- [ ] package.json reflects new version
- [ ] package-lock.json updated

---

### 2. Initial Compilation Test

```bash
# Clean previous build
rm -rf out/

# Compile with new TypeScript
npm run compile 2>&1 | tee ts-5.7-compile.log
```

**Expected Outcomes**:

**Scenario A: Clean Success**

```
> vs-orca@0.2.0 compile
> tsc -p ./

(No output = success)
```

✅ Proceed to Step 3

**Scenario B: New Type Errors**

```
src/extension.ts:45:12 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

🔧 Proceed to Step 4 (Fix Errors)

**Scenario C: Configuration Errors**

```
error TS5023: Unknown compiler option 'someOldOption'
```

🔧 Update tsconfig.json (see below)

---

### 3. Analyze Compilation Output

```bash
# Check for warnings (if any)
cat ts-5.7-compile.log | grep -i "warning"

# Check for deprecation notices
cat ts-5.7-compile.log | grep -i "deprecat"

# Verify output directory
ls -lh out/
# Should contain .js files for all .ts sources
```

**Validation**:

- [ ] No errors in compilation
- [ ] All source files compiled
- [ ] Output directory contains .js and .js.map files
- [ ] No unexpected warnings

---

### 4. Fix Common TypeScript 5.7 Issues (If Needed)

#### Issue 1: Stricter Type Inference

**Problem**: TypeScript 5.7 has improved inference that may catch previously untyped issues.

**Example Error**:

```typescript
// src/extension.ts
const config = vscode.workspace.getConfiguration("orca");
const path = config.get("binaryPath"); // Error: string | undefined
```

**Fix**:

```typescript
const path = config.get<string>("binaryPath", "/opt/orca/orca");
// OR
const path = config.get("binaryPath") || "/opt/orca/orca";
```

#### Issue 2: Null/Undefined Checks

**Problem**: Stricter null checks with `strict: true`

**Example Error**:

```typescript
const doc = vscode.window.activeTextEditor?.document;
const text = doc.getText(); // Error: doc may be undefined
```

**Fix**:

```typescript
if (doc) {
  const text = doc.getText();
}
// OR
const text = doc?.getText() ?? "";
```

#### Issue 3: Type Assertion Updates

**Problem**: Some type assertions may need updating

**Example Warning**:

```typescript
const value = someValue as any; // Discouraged
```

**Fix**:

```typescript
const value = someValue as unknown as TargetType;
// OR add proper types
```

---

### 5. Run Test Suite

```bash
# Compile must succeed first
npm run compile

# Run tests
npm test 2>&1 | tee ts-5.7-test.log
```

**Expected Outcome**:

- Same pass/fail rate as baseline (24/39 passing)
- No new test failures introduced by TypeScript update
- If new failures, investigate if TypeScript-related

**Validation**:

- [ ] Tests run successfully
- [ ] No regression in pass rate
- [ ] Test failures match baseline

---

### 6. Measure Build Performance

```bash
# Measure compilation time (3 runs)
for i in {1..3}; do
  rm -rf out/
  echo "Build Run $i with TypeScript 5.7.2"
  time npm run compile
done
```

**Comparison**:

- Baseline (TS 5.3.3): 1.86 seconds
- Target: ≤ 2.05 seconds (+10% tolerance)
- Expected: Similar or improved (TS 5.7 has optimizations)

**Validation**:

- [ ] Build time measured
- [ ] Within acceptable range
- [ ] Performance documented

---

### 7. Verify Watch Mode

```bash
# Start watch mode
npm run watch

# In another terminal, modify a file
echo "// Test comment" >> src/extension.ts

# Check watch mode recompiles
# Should see: "File change detected. Starting incremental compilation..."

# Stop watch mode (Ctrl+C)
# Revert test change
git checkout src/extension.ts
```

**Validation**:

- [ ] Watch mode starts successfully
- [ ] Incremental compilation works
- [ ] No errors in watch mode

---

## Acceptance Criteria

- [ ] TypeScript updated to 5.7.2 in package.json
- [ ] `npm run compile` succeeds with zero errors
- [ ] `npm test` passes with same rate as baseline (24/39)
- [ ] Build time within ±10% of baseline (1.67s - 2.05s)
- [ ] Watch mode works correctly
- [ ] No new TypeScript warnings introduced
- [ ] Changes committed to feature branch

---

## Commit Message

```bash
git add package.json package-lock.json
git commit -m "chore(deps): update TypeScript to 5.7.2

- Update typescript from 5.3.3 to 5.7.2
- Verify clean compilation with no errors
- Test suite passes with baseline pass rate (24/39)
- Build time: [X.XX]s (baseline: 1.86s)
- No breaking changes detected

Performance:
- Compilation time: [X.XX]s
- Watch mode: verified working

Related: TASK-DEP-004
Ref: PRD-Dependency-Update.md Phase 2"

git push origin feature/dependency-update
```

---

## Rollback Procedure

If critical issues arise:

```bash
# Revert TypeScript update
npm install --save-dev typescript@5.3.3

# Verify rollback
npm list typescript
# Should show: typescript@5.3.3

# Test
npm run compile
npm test
```

---

## Troubleshooting

### Issue: Compilation Fails with New Errors

**Solution**:

1. Review error messages carefully
2. Check if errors are legitimate type issues (good!)
3. Fix type issues in TASK-DEP-006
4. If errors seem incorrect, file TypeScript issue

### Issue: Build Time Significantly Increased

**Solution**:

1. Check if incremental builds are working
2. Verify `outDir` in tsconfig.json
3. Check for TypeScript configuration issues
4. Consider profiling: `tsc -p . --diagnostics`

### Issue: Watch Mode Not Working

**Solution**:

1. Check tsconfig.json for `incremental: true`
2. Verify `.tsbuildinfo` file is being created
3. Check Node.js version (should be 18+)

---

## Related Tasks

- TASK-DEP-005: Update @types/\* packages (next)
- TASK-DEP-006: Fix TypeScript compilation errors
- TASK-DEP-002: Compatibility research findings

---

## Related Files

- `package.json` - TypeScript version
- `tsconfig.json` - TypeScript configuration
- `src/**/*.ts` - Source files to compile
- `.baseline/build-times.txt` - Baseline measurements

---

**Created**: December 21, 2025  
**Last Updated**: December 21, 2025
