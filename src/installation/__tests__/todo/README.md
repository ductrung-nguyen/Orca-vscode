# Work-in-Progress Test Files

This directory contains test files that are not yet ready to run.

## Files

- `errorHandling.test.txt` - Tests for Installation Error Handling System
- `wizardEnhancements.test.txt` - Tests for Wizard UI Enhancements

## Status

These tests were originally written using Jest syntax but the project uses Mocha.
They have been moved out of the compilation path to prevent CI build failures.

## TODO

- Convert tests from Jest syntax to Mocha TDD (suite/test pattern)
- Install missing dependencies (sinon for wizardEnhancements tests)
- Move to `src/test/suite/` when ready
- Update to use `assert` instead of `expect`

## References

See TODOs in original test files for detailed conversion requirements.
