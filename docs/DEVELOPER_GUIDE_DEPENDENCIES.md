# Dependency Update - Developer Documentation

**Last Updated**: December 21, 2025
**Branch**: feature/dependency-update-2025

## Overview

This document provides guidance for developers working with the updated dependencies in VS-ORCA v0.2.1. All development dependencies have been updated to their latest stable versions while maintaining backward compatibility with VS Code 1.85.0.

## Updated Dependencies Reference

### TypeScript (5.3.3 → 5.7.2)

**Major Changes:**

- Enhanced type inference
- Improved error messages
- Better generic handling
- New utility types

**Migration Notes:**

- No breaking changes in our codebase
- All existing TypeScript patterns compatible
- Benefits from improved type checking automatically

**Resources:**

- [TypeScript 5.7 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/)

### ESLint (8.57.1 → 9.16.0)

**Major Changes:**

- New flat config system (eslint.config.js)
- Removed deprecated rules
- Enhanced performance

**Our Configuration:**

```json
// package.json
"lint": "ESLINT_USE_FLAT_CONFIG=false eslint src --ext ts"
```

**Why Legacy Config?**

- Maintains compatibility with existing `.eslintrc.json`
- Avoids migration disruption during this update
- ESLint 9 fully supports legacy configs via `ESLINT_USE_FLAT_CONFIG=false`

**Migration Path (Future):**
To migrate to flat config in the future:

1. Remove `ESLINT_USE_FLAT_CONFIG=false` from lint script
2. Rename `.eslintrc.json` to `eslint.config.js`
3. Convert to flat config format (see [migration guide](https://eslint.org/docs/latest/use/configure/migration-guide))

**Current .eslintrc.json Features:**

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_" // NEW: Ignores _err in catch blocks
      }
    ]
  }
}
```

### @typescript-eslint (6.21.0 → 8.17.0)

**Major Changes:**

- Updated to support ESLint 9
- New rules and refinements
- Performance improvements

**Breaking Changes Handled:**

- All rules compatible with our codebase
- No configuration changes required beyond version bump

**Resources:**

- [typescript-eslint v8 Release](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8/)

### Testing Tools

**Mocha (10.8.2):**

- Kept at 10.x for stability
- Mocha 11.x has breaking changes we'll address in future release
- All tests running correctly

**@vscode/test-electron (2.3.8 → 2.5.2):**

- Updated to latest 2.x
- Enhanced VS Code test environment
- Better integration with VS Code 1.107.x

### Build Tools

**glob (10.5.0 → 11.0.0):**

- Major version update
- API changes in how patterns are processed
- Our usage patterns still compatible

**@vscode/vsce (2.32.0 → 3.2.1):**

- Major version update
- Enhanced packaging capabilities
- Stricter validation (caught @types/vscode version mismatch)

## Development Workflow

### Building

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

**Expected compile time**: ~2.3s (increased from 1.9s due to enhanced type checking)

### Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npx eslint src --ext ts --fix
```

**Note**: You'll see a deprecation warning about eslintrc. This is expected and can be safely ignored until we migrate to flat config.

### Testing

```bash
# Run all tests
npm test

# Compile and run tests separately
npm run compile
npm test
```

**Known Issue**: Test fixtures not automatically copied to `out/test/fixtures/`. Workaround:

```bash
mkdir -p out/test/fixtures
cp src/test/fixtures/*.out out/test/fixtures/
```

**TODO**: Add fixture copying to build process.

### Packaging

```bash
# Create VSIX package
npm run package
```

**Expected output**: `vs-orca-0.2.0.vsix` (~209 KB)

## Common Issues & Solutions

### Issue: ESLint deprecation warning

**Symptom:**

```
ESLintRCWarning: You are using an eslintrc configuration file, which is deprecated
```

**Solution:**
This is expected. We're using compatibility mode (`ESLINT_USE_FLAT_CONFIG=false`) to maintain existing config. No action needed.

### Issue: @types/vscode version mismatch

**Symptom:**

```
ERROR: @types/vscode ^1.107.0 greater than engines.vscode ^1.85.0
```

**Solution:**

```bash
npm install --save-dev --save-exact @types/vscode@1.85.0
```

**Why?**: `@types/vscode` must match the minimum VS Code version in `engines.vscode`.

### Issue: Test fixtures not found

**Symptom:**

```
Error: ENOENT: no such file or directory, open '.../out/test/fixtures/converged.out'
```

**Solution:**

```bash
mkdir -p out/test/fixtures
cp src/test/fixtures/*.out out/test/fixtures/
```

## Best Practices

### 1. Always Run Tests Before Committing

```bash
npm run pretest  # Runs compile + lint
npm test
```

### 2. Use Proper Error Handling

For unused error variables in catch blocks, prefix with `_`:

```typescript
try {
  // code
} catch (_err) {
  // Error intentionally ignored
}
```

### 3. Maintain @types/vscode Version

When updating dependencies:

```bash
# DON'T update @types/vscode beyond engine requirement
npm install --save-dev --save-exact @types/vscode@1.85.0
```

### 4. Check Security Regularly

```bash
npm audit
# Should always show: found 0 vulnerabilities
```

## Future Improvements

1. **Migrate to ESLint Flat Config**

   - Target: Next major version (0.3.0)
   - Benefits: Native ESLint 9 config, better performance
   - Effort: ~2 hours

2. **Automate Test Fixture Copying**

   - Add to compile script or create separate build task
   - Effort: ~30 minutes

3. **Consider Mocha 11.x**

   - Evaluate breaking changes
   - Test compatibility
   - Effort: ~2 hours

4. **Update to Node.js 22.x**
   - When VS Code minimum requirements increase
   - Update @types/node accordingly

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [typescript-eslint](https://typescript-eslint.io/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Mocha Documentation](https://mochajs.org/)

## Support

For issues related to:

- **Dependency conflicts**: Check this document first
- **Build errors**: See "Common Issues & Solutions"
- **Test failures**: Review validation report in `docs/DEPENDENCY_UPDATE_VALIDATION.md`
- **Security vulnerabilities**: Run `npm audit` and update if needed

## Changelog

| Date       | Change                    | Version   |
| ---------- | ------------------------- | --------- |
| 2025-12-21 | Initial dependency update | 0.2.1-dev |
