# CI/CD Pipeline Requirements for VS-ORCA Extension

## Executive Summary

This document outlines the requirements for implementing a CI/CD pipeline for the VS-ORCA VS Code extension. The pipeline will automate testing, building, and publishing to the VS Code Extension Marketplace.

## Current State Analysis

### Existing Infrastructure
- **Repository**: GitHub (ductrung-nguyen/Orca-vscode)
- **Package Manager**: npm
- **Build Tool**: TypeScript compiler (tsc)
- **Packaging Tool**: @vscode/vsce v3.7.1
- **Test Framework**: Mocha + @vscode/test-electron v2.5.2
- **Linting**: ESLint with TypeScript support
- **No existing CI/CD**: `.github/workflows/` directory does not exist

### Package.json Scripts
```json
{
  "vscode:prepublish": "npm run compile",
  "compile": "tsc -p ./",
  "watch": "tsc -watch -p ./",
  "pretest": "npm run compile && npm run lint",
  "lint": "cross-env ESLINT_USE_FLAT_CONFIG=false eslint src --ext ts",
  "test": "node ./out/test/runTest.js",
  "package": "vsce package"
}
```

### Test Suite
- **Location**: `src/test/suite/`
- **Test Files**: 7 test files covering:
  - detector.test.ts
  - installers.test.ts
  - outputFileWriter.test.ts
  - outputParser.test.ts
  - parser.test.ts
  - validator.test.ts
  - wizard.test.ts
- **Test Runner**: Uses `@vscode/test-electron` which downloads and runs VS Code

### Extension Metadata
- **Publisher**: `ductrung-nguyen`
- **Version**: `0.3.0`
- **VS Code Engine**: `^1.85.0`
- **Main Entry**: `./out/extension.js`

## Required Workflows

### 1. CI Workflow (ci.yml)
**Trigger**: Pull requests and pushes to main branch
**Purpose**: Validate code quality and run tests

**Jobs**:
1. **Lint**: Run ESLint on TypeScript source
2. **Build**: Compile TypeScript to JavaScript
3. **Test**: Run VS Code integration tests

**Requirements**:
- Node.js 20.x (LTS)
- Ubuntu runner (supports Xvfb for headless VS Code)
- Cache npm dependencies for faster builds

### 2. Release Workflow (release.yml)
**Trigger**: Tag push matching `v*.*.*` pattern
**Purpose**: Build and publish to VS Code Marketplace

**Jobs**:
1. **Build**: Compile and package extension
2. **Publish**: Upload to VS Code Marketplace

**Requirements**:
- VS Code Marketplace Personal Access Token (PAT)
- Store PAT as GitHub secret: `VSCE_PAT`
- Match version in package.json with tag version

### 3. Pre-release Workflow (prerelease.yml) [Optional]
**Trigger**: Manual dispatch or push to `develop` branch
**Purpose**: Create pre-release builds for testing

**Requirements**:
- Append `-pre.{buildnumber}` to version
- Upload .vsix as GitHub release artifact

## Technical Specifications

### Environment Requirements
| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 20.x | LTS version |
| npm | 10.x | Comes with Node.js 20 |
| VS Code | 1.85.0+ | For test runner |
| Ubuntu | latest | GitHub Actions runner |

### GitHub Secrets Required
| Secret | Purpose |
|--------|---------|
| `VSCE_PAT` | Personal Access Token for VS Code Marketplace |

### VS Code Marketplace Setup
1. Create publisher account at https://marketplace.visualstudio.com/manage
2. Generate Personal Access Token with `Marketplace > Manage` scope
3. Add token to GitHub repository secrets

### Xvfb Configuration
Required for running VS Code tests in headless environment:
```yaml
- name: Run tests
  run: xvfb-run -a npm test
```

## Workflow Specifications

### CI Workflow Matrix
```yaml
strategy:
  matrix:
    os: [ubuntu-latest]
    node-version: [20.x]
```

### Caching Strategy
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Artifact Retention
- Build artifacts: 7 days
- Release artifacts: Permanent (attached to GitHub release)

## Implementation Tasks

### Task 1: Create CI Workflow
- [ ] Create `.github/workflows/ci.yml`
- [ ] Configure lint job
- [ ] Configure build job
- [ ] Configure test job with Xvfb
- [ ] Add npm caching
- [ ] Add badge to README

### Task 2: Create Release Workflow
- [ ] Create `.github/workflows/release.yml`
- [ ] Configure version validation
- [ ] Configure vsce package step
- [ ] Configure vsce publish step
- [ ] Add VSCE_PAT secret documentation

### Task 3: Documentation Updates
- [ ] Update CONTRIBUTING.md with CI/CD info
- [ ] Add workflow badges to README
- [ ] Document release process
- [ ] Add troubleshooting guide

### Task 4: Setup Marketplace
- [ ] Verify publisher account
- [ ] Generate and store PAT
- [ ] Test manual publish first

## Success Criteria

1. **CI Workflow**:
   - Runs on every PR and push to main
   - Fails if lint errors exist
   - Fails if compilation fails
   - Fails if tests fail
   - Completes in under 5 minutes

2. **Release Workflow**:
   - Triggers only on version tags
   - Publishes extension to marketplace
   - Creates GitHub release with .vsix attachment
   - Includes release notes from CHANGELOG

3. **Developer Experience**:
   - PR checks visible in GitHub
   - Clear failure messages
   - Fast feedback loop (<3 minutes for lint/build)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| VSCE_PAT expiration | Set calendar reminder, document renewal process |
| Test flakiness | Add retry logic, increase timeouts |
| npm registry issues | Use npm cache, consider fallback |
| VS Code download fails | Cache VS Code binary in CI |

## References

- [VS Code Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Tool Documentation](https://github.com/microsoft/vscode-vsce)
- [GitHub Actions for VS Code](https://github.com/marketplace/actions/setup-vscode-test)
- [@vscode/test-electron](https://github.com/microsoft/vscode-test)
