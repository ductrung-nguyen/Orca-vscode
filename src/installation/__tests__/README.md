# Installation Tests (Not Currently Integrated)

⚠️ **Important:** These test files use Jest-style syntax (`describe`, `it`, `expect`) but the VS-ORCA extension uses Mocha (TDD UI) for testing.

## Current Status

These tests are **not executed** by `npm test` because:

1. The test harness (`src/test/runTest.ts`) only discovers tests in `src/test/suite/` after TypeScript compilation
2. These tests use Jest syntax, but the project uses Mocha with TDD UI (`suite`, `test`, `assert`)

## To Make These Tests Run

Choose one of:

### Option 1: Convert to Mocha TDD

1. Replace `describe` → `suite`
2. Replace `it` → `test`  
3. Replace `expect().toBe()` → `assert.strictEqual()`
4. Move files to `src/test/suite/installation/`

### Option 2: Set Up Jest

1. Configure Jest test runner
2. Update npm test script to run both Mocha and Jest
3. Keep dependencies: `@types/jest`, `jest`

## Files

- `errorHandling.test.ts` - InstallationErrorHandler tests (Jest style)
- `wizardEnhancements.test.ts` - Wizard enhancement placeholder (Jest style)

Until integration is complete, these serve as documentation of intended test coverage.
