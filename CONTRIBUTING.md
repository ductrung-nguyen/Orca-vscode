# Contributing to VS-ORCA

Thank you for your interest in contributing to VS-ORCA! This document provides guidelines for contributing to the project.

## Continuous Integration

All pull requests and pushes to `main` are automatically tested by our CI pipeline.

### CI Checks

Every PR must pass these automated checks before merging:

| Check | Description | Command |
|-------|-------------|---------|
| **Lint** | ESLint validation | `npm run lint` |
| **Build** | TypeScript compilation | `npm run compile` |
| **Test** | Unit and integration tests | `npm test` |

### CI Status

[![CI](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml)

View CI runs: [GitHub Actions](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml)

### Running Tests Locally

Before submitting a PR, run the full test suite locally:

```bash
# Run linting
npm run lint

# Compile TypeScript
npm run compile

# Run tests (requires display on Linux)
npm test

# On Linux without display, use Xvfb
xvfb-run -a npm test
```

---

## Development Setup

1. **Prerequisites**:
   - Node.js (v20 or higher)
   - VS Code (v1.85.0 or higher)
   - Git

2. **Clone and Install**:
   ```bash
   git clone https://github.com/ductrung-nguyen/Orca-vscode.git
   cd Orca-vscode
   npm install
   ```

3. **Build**:
   ```bash
   npm run compile
   ```

4. **Run Extension**:
   - Press `F5` in VS Code to launch Extension Development Host
   - Open a `.inp` file to test syntax highlighting
   - Configure `orca.binaryPath` to test execution

## Project Structure

```
Orca-vscode/
├── src/
│   ├── extension.ts        # Main extension entry point
│   └── orcaRunner.ts       # ORCA execution and parsing logic
├── syntaxes/
│   └── orca.tmLanguage.json # TextMate grammar for highlighting
├── snippets/
│   └── orca.json           # Code snippet definitions
├── examples/               # Sample ORCA input files
├── package.json            # Extension manifest
└── tsconfig.json           # TypeScript configuration
```

## How to Contribute

### Reporting Bugs

Create an issue on GitHub with:
- VS Code version
- Extension version
- Operating system
- Steps to reproduce
- Expected vs. actual behavior
- Error logs (if any)

### Suggesting Features

Open an issue with:
- Clear description of the feature
- Use case / problem it solves
- Example usage
- Priority (P0/P1/P2) if applicable

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**:
   - Follow existing code style
   - Add comments for complex logic
   - Update README if adding user-facing features

4. **Test thoroughly**:
   - Test syntax highlighting with various input files
   - Test execution with different ORCA versions
   - Ensure no regressions in existing features

5. **Commit with clear messages**:
   ```bash
   git commit -m "Add feature: <description>"
   ```

6. **Push and create Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Guidelines

### TypeScript Style
- Use `const` and `let`, avoid `var`
- Prefer explicit types over `any`
- Use async/await over callbacks
- Add JSDoc comments for public APIs

### Naming Conventions
- Classes: `PascalCase`
- Functions/Methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: prefix with `_` or use `private`

### Error Handling
- Always handle errors gracefully
- Show user-friendly error messages via `vscode.window.showErrorMessage`
- Log detailed errors to output channel for debugging

## Adding New Features

### Syntax Highlighting
Edit [syntaxes/orca.tmLanguage.json](syntaxes/orca.tmLanguage.json):
- Add patterns to `repository` section
- Include in main `patterns` array
- Test with various input files

### Code Snippets
Edit [snippets/orca.json](snippets/orca.json):
- Use descriptive `prefix` (what user types)
- Provide numbered placeholders `${1:default}`
- Add dropdown choices with `${1|choice1,choice2|}`
- Include `description` field

### Commands
1. Register in `package.json` under `contributes.commands`
2. Implement handler in `src/extension.ts`
3. Add to context subscriptions
4. Update README with usage instructions

## Testing

### Manual Testing Checklist
- [ ] Syntax highlighting works for all keyword types
- [ ] Snippets expand correctly with Tab
- [ ] F5 runs ORCA job successfully
- [ ] Output streams in real-time
- [ ] Kill command terminates job
- [ ] Status bar updates correctly
- [ ] Configuration settings work
- [ ] Error messages are clear and helpful

### Before Submitting PR
- [ ] Code compiles without errors (`npm run compile`)
- [ ] ESLint passes (`npm run lint`)
- [ ] README updated if needed
- [ ] CHANGELOG.md updated with changes
- [ ] Tested in Extension Development Host

## Release Process

(For maintainers)

### Automated Release Pipeline

VS-ORCA uses GitHub Actions for automated releases. When you push a version tag, the release workflow:

1. ✅ Runs all CI checks (lint, build, test)
2. 📦 Packages the extension as `.vsix`
3. 🚀 Publishes to VS Code Marketplace
4. 📋 Creates a GitHub Release with the `.vsix` attached

### Release Steps

1. **Update version in `package.json`**:
   ```bash
   # Update version field, e.g., "0.4.0"
   ```

2. **Update `CHANGELOG.md`** with release notes:
   ```markdown
   ## [0.4.0] - YYYY-MM-DD
   
   ### Added
   - New feature description
   
   ### Changed
   - Changed behavior description
   
   ### Fixed
   - Bug fix description
   ```

3. **Commit the changes**:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "Release v0.4.0"
   ```

4. **Create and push the version tag**:
   ```bash
   git tag v0.4.0
   git push origin main
   git push origin v0.4.0
   ```

5. **Monitor the release**:
   - Watch [GitHub Actions](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/release.yml)
   - Verify the extension appears in [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ductrung-nguyen.vs-orca)

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

### Pre-release Versions

For pre-release versions, use suffixes:
- `v0.4.0-alpha.1` - Alpha release
- `v0.4.0-beta.1` - Beta release
- `v0.4.0-rc.1` - Release candidate

---

## VSCE_PAT Setup (For Maintainers)

The release workflow requires a VS Code Marketplace Personal Access Token (PAT) to publish the extension.

### Generating a PAT

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Sign in with your Microsoft account
3. Click **User settings** (top right) → **Personal access tokens**
4. Click **New Token**
5. Configure the token:
   - **Name**: `VS-ORCA VSCE Publishing`
   - **Organization**: `All accessible organizations`
   - **Expiration**: Set a reasonable expiration (max 1 year)
   - **Scopes**: Click **Custom defined**, then:
     - Under **Marketplace**, check **Manage**
6. Click **Create** and copy the token immediately

### Adding the Secret to GitHub

1. Go to the [repository settings](https://github.com/ductrung-nguyen/Orca-vscode/settings)
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set:
   - **Name**: `VSCE_PAT`
   - **Value**: Paste your PAT
5. Click **Add secret**

### PAT Renewal Reminder

- Set a calendar reminder 2 weeks before PAT expiration
- Document the expiration date in team notes
- Regenerate PAT and update the GitHub secret before expiration

---

## Troubleshooting

### CI Pipeline Issues

#### Lint Job Fails

**Symptoms**: ESLint errors in CI

**Solution**:
```bash
# Run lint locally to see errors
npm run lint

# Auto-fix some issues
npm run lint -- --fix
```

#### Build Job Fails

**Symptoms**: TypeScript compilation errors

**Solution**:
```bash
# Check for type errors
npm run compile

# Common fixes:
# - Add missing type annotations
# - Install missing @types/* packages
# - Check import paths
```

#### Test Job Fails

**Symptoms**: Tests fail in CI but pass locally

**Possible Causes**:
1. **Missing Xvfb**: VS Code extension tests require a display
   ```bash
   # Run with Xvfb locally
   xvfb-run -a npm test
   ```

2. **Timing issues**: Add appropriate waits in tests
3. **Path differences**: Use path.join() instead of hardcoded separators

### Release Workflow Issues

#### "VSCE_PAT not configured"

**Symptoms**: Release workflow fails at publish step

**Solution**:
1. Verify `VSCE_PAT` secret exists in repository settings
2. Regenerate the PAT if expired
3. Ensure PAT has `Marketplace > Manage` scope

#### "Version mismatch" Error

**Symptoms**: Release fails with version verification error

**Solution**:
Ensure the tag version matches `package.json`:
```bash
# Tag should match package.json version
# If package.json has "version": "0.4.0"
# Then tag should be v0.4.0
git tag v0.4.0  # Correct
git tag v0.4.1  # Wrong - will fail
```

#### "Extension not found in Marketplace"

**Symptoms**: Published but not visible

**Possible Causes**:
1. **Propagation delay**: Wait 5-10 minutes
2. **Publisher mismatch**: Verify `publisher` in `package.json`
3. **Validation failure**: Check workflow logs for marketplace errors

### Common Development Issues

#### "Cannot find module" Errors

```bash
# Reinstall dependencies
rm -rf node_modules
npm ci
```

#### Syntax Highlighting Not Working

1. Ensure `.inp` file extension is recognized
2. Check `syntaxes/orca.tmLanguage.json` for syntax errors
3. Reload VS Code window (Ctrl+Shift+P → "Reload Window")

#### Extension Not Activating

1. Check activation events in `package.json`
2. Look for errors in Extension Development Host console
3. Verify `main` entry point in `package.json`

---

## Questions?

- Open a discussion on GitHub
- Check existing issues and PRs
- Review the [README](README.md) for documentation

---

**Thank you for contributing to VS-ORCA! 🧪⚛️**
