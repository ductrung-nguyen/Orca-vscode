# PRD: CI/CD Pipeline for VS-ORCA Extension

**Document ID**: PRD-004  
**Feature**: CI/CD Pipeline  
**Status**: Draft  
**Created**: 2025-12-22  
**Owner**: VS-ORCA Development Team

## Executive Summary

Implement a comprehensive CI/CD pipeline for the VS-ORCA VS Code extension using GitHub Actions. The pipeline will automate testing, building, and publishing to the VS Code Marketplace, enabling reliable and efficient release cycles while maintaining code quality through automated checks.

## Problem Statement

### Current Limitations

- **No Automated Testing**: Code changes are not automatically validated, risking regressions
- **Manual Release Process**: Publishing to VS Code Marketplace requires manual steps (package, publish)
- **No PR Checks**: Pull requests lack automated status checks for build and test validation
- **Error-Prone Releases**: Manual version management and publishing can lead to inconsistencies

### User Pain Points

1. **Contributor Uncertainty**: Contributors cannot verify if their changes pass tests without local setup
2. **Slow Release Cycles**: Manual publishing creates friction and delays for new releases
3. **Quality Risks**: No automated gate prevents broken code from reaching main branch
4. **Inconsistent Releases**: Manual process may miss steps (changelog, version bump, etc.)

## Goals and Non-Goals

### Goals

1. **Automated CI**: Run lint, build, and test on every PR and push to main branch
2. **Automated Publishing**: Publish to VS Code Marketplace automatically on version tags
3. **Quality Gates**: Block merging of PRs that fail CI checks
4. **Release Artifacts**: Create GitHub releases with .vsix attachments for each version
5. **Fast Feedback**: CI pipeline completes in under 5 minutes

### Non-Goals

- Multi-platform testing (Windows, macOS) - Linux-only initially for simplicity
- Pre-release channel management (defer to future iteration)
- Automatic version bumping (manual version control in package.json)
- Dependency update automation (Dependabot - separate feature)

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| CI Pass Rate | >95% for merged PRs | GitHub Actions metrics |
| CI Duration | <5 minutes | Workflow run time |
| Release Success | 100% automated publishes | Marketplace version updates |
| Coverage | All PRs have CI checks | Branch protection compliance |

## User Stories

### Story 1: Automated Testing on PRs

**As a** contributor  
**I want** automated tests to run when I open a pull request  
**So that** I know if my changes break existing functionality before review

**Acceptance Criteria**:
- ✅ CI workflow triggers on pull request to main branch
- ✅ Lint job validates code style with ESLint
- ✅ Build job compiles TypeScript successfully
- ✅ Test job runs all tests using Xvfb for headless VS Code
- ✅ PR shows clear pass/fail status for each job

### Story 2: Continuous Integration on Main

**As a** maintainer  
**I want** the main branch to always be in a working state  
**So that** I can confidently release at any time

**Acceptance Criteria**:
- ✅ CI workflow triggers on push to main branch
- ✅ All jobs (lint, build, test) must pass
- ✅ Failed CI creates visible notification
- ✅ npm dependencies are cached for faster builds

### Story 3: Automated Release Publishing

**As a** maintainer  
**I want** to publish a new version by pushing a git tag  
**So that** I can release updates without manual marketplace interactions

**Acceptance Criteria**:
- ✅ Release workflow triggers on tag push matching `v*.*.*`
- ✅ Extension is packaged using `vsce package`
- ✅ Extension is published to VS Code Marketplace using VSCE_PAT
- ✅ GitHub release is created with .vsix file attached
- ✅ Release notes are auto-generated from commits

### Story 4: Visible Build Status

**As a** user or contributor  
**I want** to see the current build status at a glance  
**So that** I know if the project is healthy

**Acceptance Criteria**:
- ✅ CI workflow badge displayed in README.md
- ✅ Badge links to workflow runs
- ✅ Badge shows current status (passing/failing)

## Technical Design

### Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PR/Push to main ──────▶ ci.yml                             │
│                          ├── lint (ESLint)                  │
│                          ├── build (TypeScript compile)     │
│                          └── test (Xvfb + Mocha)            │
│                                                              │
│  Tag v*.*.* ───────────▶ release.yml                        │
│                          ├── build                          │
│                          ├── package (vsce package)         │
│                          ├── publish (vsce publish)         │
│                          └── GitHub Release creation        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### CI Workflow (ci.yml)

**Triggers**:
- Push to `main` branch
- Pull request to `main` branch

**Jobs**:

1. **lint**
   - Checkout code
   - Setup Node.js 20.x with npm cache
   - Install dependencies (`npm ci`)
   - Run ESLint (`npm run lint`)

2. **build**
   - Checkout code
   - Setup Node.js 20.x with npm cache
   - Install dependencies (`npm ci`)
   - Compile TypeScript (`npm run compile`)

3. **test**
   - Checkout code
   - Setup Node.js 20.x with npm cache
   - Install dependencies (`npm ci`)
   - Compile TypeScript (`npm run compile`)
   - Run tests with Xvfb (`xvfb-run -a npm test`)

### Release Workflow (release.yml)

**Triggers**:
- Tag push matching `v*.*.*` pattern

**Jobs**:

1. **release**
   - Checkout code
   - Setup Node.js 20.x with npm cache
   - Install dependencies (`npm ci`)
   - Compile TypeScript (`npm run compile`)
   - Package extension (`npm run package`)
   - Publish to VS Code Marketplace (`npx vsce publish -p $VSCE_PAT`)
   - Create GitHub Release with .vsix artifact

### Environment Specifications

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 20.x | LTS version for stability |
| npm | 10.x | Bundled with Node.js 20 |
| Ubuntu | latest | GitHub Actions runner |
| VS Code | 1.85.0+ | Test runner requirement |
| Xvfb | System | Headless display for tests |

### GitHub Secrets Required

| Secret | Purpose | Scope |
|--------|---------|-------|
| `VSCE_PAT` | VS Code Marketplace Personal Access Token | Repository |

**PAT Configuration**:
- Organization: All accessible organizations
- Scopes: `Marketplace > Manage`
- Expiration: 1 year (with renewal reminder)

### Caching Strategy

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Built-in npm caching
```

Cache key based on `package-lock.json` hash for accurate invalidation.

## Implementation Tasks

### TASK-001: Create CI Workflow
**Priority**: P0 (Critical)  
**Estimated Time**: 30 minutes

**Deliverables**:
- Create `.github/workflows/ci.yml`
- Configure lint, build, and test jobs
- Enable npm caching
- Verify Xvfb test execution

### TASK-002: Create Release Workflow
**Priority**: P0 (Critical)  
**Estimated Time**: 45 minutes

**Deliverables**:
- Create `.github/workflows/release.yml`
- Configure version tag trigger
- Configure vsce package and publish steps
- Configure GitHub release creation with artifacts

### TASK-003: Setup Repository Secrets
**Priority**: P0 (Critical)  
**Estimated Time**: 15 minutes

**Deliverables**:
- Generate VS Code Marketplace PAT
- Add `VSCE_PAT` secret to repository
- Document PAT renewal process

### TASK-004: Add Workflow Badges
**Priority**: P1 (Important)  
**Estimated Time**: 10 minutes

**Deliverables**:
- Add CI workflow badge to README.md
- Verify badge displays correctly

### TASK-005: Update Documentation
**Priority**: P1 (Important)  
**Estimated Time**: 30 minutes

**Deliverables**:
- Update CONTRIBUTING.md with CI information
- Document new automated release process
- Add VSCE_PAT setup instructions
- Add troubleshooting guide

### TASK-006: Configure Branch Protection (Optional)
**Priority**: P2 (Nice to have)  
**Estimated Time**: 15 minutes

**Deliverables**:
- Enable branch protection on main
- Require status checks to pass before merging
- Configure required checks (lint, build, test)

## Implementation Order

```
TASK-003 (Secrets) → TASK-001 (CI) → TASK-002 (Release) → TASK-004 (Badges) → TASK-005 (Docs) → TASK-006 (Protection)
```

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| VSCE_PAT expiration | Medium | High | Set calendar reminder, document renewal in CONTRIBUTING.md |
| Test flakiness in CI | Low | Medium | Add retry logic, increase timeouts |
| npm registry issues | Low | Medium | Use npm cache, consider fallback |
| VS Code download fails | Low | Low | Retry mechanism in @vscode/test-electron |

## Validation Criteria

### CI Workflow Validation
1. Create test PR with valid code → All jobs pass
2. Create test PR with lint error → Lint job fails
3. Create test PR with broken test → Test job fails
4. Push to main → Workflow triggers and completes

### Release Workflow Validation
1. Push tag `v0.x.x` → Workflow triggers
2. Extension packaged successfully → .vsix file created
3. Extension published → Visible in VS Code Marketplace
4. GitHub release created → Includes .vsix attachment

## Dependencies

### External Dependencies
- GitHub Actions runners (free tier sufficient)
- VS Code Marketplace publisher account (`ductrung-nguyen`)
- npm registry access

### Internal Dependencies
- Existing test suite must be passing
- `package.json` scripts: `compile`, `lint`, `test`, `package`
- `@vscode/vsce` package for publishing

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup | Day 1 | Secrets configured, CI workflow created |
| Release | Day 1-2 | Release workflow created, tested |
| Documentation | Day 2 | README badges, CONTRIBUTING updates |
| Validation | Day 2-3 | End-to-end testing, branch protection |

**Total Estimated Effort**: 2-4 hours

## Appendix

### GitHub Actions Versions

| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout` | v4 | Checkout repository |
| `actions/setup-node` | v4 | Setup Node.js environment |
| `softprops/action-gh-release` | v1 | Create GitHub releases |

### Workflow Badge Markdown

```markdown
[![CI](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml)
```

### Sample Release Process

1. Update version in `package.json` (e.g., `0.4.0`)
2. Update `CHANGELOG.md` with release notes
3. Commit: `git commit -am "Release v0.4.0"`
4. Tag: `git tag v0.4.0`
5. Push: `git push && git push --tags`
6. GitHub Actions automatically:
   - Builds and tests the extension
   - Packages the .vsix file
   - Publishes to VS Code Marketplace
   - Creates GitHub release with artifact

### Branch Protection Settings (Recommended)

```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "lint" },
      { "context": "build" },
      { "context": "test" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
```
