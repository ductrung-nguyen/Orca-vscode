# CI/CD Pipeline Task Breakdown

**PRD**: [004-cicd-pipeline.md](../prd/004-cicd-pipeline.md)  
**Feature Type**: Infrastructure  
**Priority**: High  
**Timeline**: 2-3 days  
**Status**: Planning

---

## Overview

This document provides a comprehensive task breakdown for implementing CI/CD pipeline automation for the VS-ORCA extension using GitHub Actions. The implementation adds automated testing on PRs, continuous integration on main branch, and automated release publishing to VS Code Marketplace.

**Key Objectives**:

- Automate lint, build, and test on every PR and push to main branch
- Automate publishing to VS Code Marketplace on version tags
- Create GitHub releases with .vsix attachments
- Add CI status badges to README
- Document the release process and CI/CD setup

---

## Task Summary

| Task ID      | Phase   | Title                                  | Priority | Est. Effort | Status      |
| ------------ | ------- | -------------------------------------- | -------- | ----------- | ----------- |
| TASK-004-001 | Phase 1 | Setup VSCE_PAT Repository Secret       | P0       | 15 min      | Not Started |
| TASK-004-002 | Phase 2 | Create CI Workflow File                | P0       | 30 min      | Not Started |
| TASK-004-003 | Phase 2 | Configure Lint Job                     | P0       | 15 min      | Not Started |
| TASK-004-004 | Phase 2 | Configure Build Job                    | P0       | 15 min      | Not Started |
| TASK-004-005 | Phase 2 | Configure Test Job with Xvfb           | P0       | 20 min      | Not Started |
| TASK-004-006 | Phase 3 | Create Release Workflow File           | P0       | 30 min      | Not Started |
| TASK-004-007 | Phase 3 | Configure Version Tag Trigger          | P0       | 10 min      | Not Started |
| TASK-004-008 | Phase 3 | Configure VSCE Package Step            | P0       | 15 min      | Not Started |
| TASK-004-009 | Phase 3 | Configure VSCE Publish Step            | P0       | 15 min      | Not Started |
| TASK-004-010 | Phase 3 | Configure GitHub Release Creation      | P0       | 20 min      | Not Started |
| TASK-004-011 | Phase 4 | Add CI Workflow Badge to README        | P1       | 10 min      | Not Started |
| TASK-004-012 | Phase 5 | Update CONTRIBUTING.md with CI Info    | P1       | 20 min      | Not Started |
| TASK-004-013 | Phase 5 | Document Release Process               | P1       | 15 min      | Not Started |
| TASK-004-014 | Phase 5 | Add VSCE_PAT Setup Instructions        | P1       | 10 min      | Not Started |
| TASK-004-015 | Phase 5 | Add Troubleshooting Guide              | P1       | 15 min      | Not Started |
| TASK-004-016 | Phase 6 | Test CI Workflow with Valid PR         | P0       | 15 min      | Not Started |
| TASK-004-017 | Phase 6 | Test CI Workflow Failure Detection     | P0       | 15 min      | Not Started |
| TASK-004-018 | Phase 6 | Test Release Workflow with Tag         | P0       | 20 min      | Not Started |
| TASK-004-019 | Phase 6 | Verify Marketplace Publication         | P0       | 10 min      | Not Started |
| TASK-004-020 | Phase 7 | Configure Branch Protection Rules      | P2       | 15 min      | Not Started |

**Total Estimated Effort**: ~5 hours

---

## Phase Details

### Phase 1: Repository Setup (Prerequisites)

**Duration**: 15 minutes  
**Goal**: Configure required secrets for automated publishing

**Subtasks**:

- **TASK-004-001**: Setup VSCE_PAT Repository Secret
  - Generate VS Code Marketplace Personal Access Token
  - Add `VSCE_PAT` secret to GitHub repository settings
  - Document PAT expiration date and renewal process

**Exit Criteria**:

- ✅ VSCE_PAT secret configured in repository
- ✅ PAT has correct scopes (Marketplace > Manage)
- ✅ Expiration date documented

**Dependencies**: None

---

### Phase 2: CI Workflow Implementation (Core)

**Duration**: 1 hour 20 minutes  
**Goal**: Create automated testing workflow for PRs and main branch

**Subtasks**:

- **TASK-004-002**: Create CI Workflow File
  - Create `.github/workflows/ci.yml`
  - Configure triggers: push to main, pull_request to main
  - Setup Node.js 20.x with npm cache

- **TASK-004-003**: Configure Lint Job
  - Checkout code with actions/checkout@v4
  - Setup Node.js with actions/setup-node@v4
  - Run `npm ci` for dependency installation
  - Run `npm run lint` for ESLint validation

- **TASK-004-004**: Configure Build Job
  - Checkout code
  - Setup Node.js with caching
  - Install dependencies
  - Run `npm run compile` for TypeScript compilation

- **TASK-004-005**: Configure Test Job with Xvfb
  - Checkout code
  - Setup Node.js with caching
  - Install dependencies
  - Compile TypeScript
  - Run tests with `xvfb-run -a npm test`

**Exit Criteria**:

- ✅ CI workflow triggers on PR to main
- ✅ CI workflow triggers on push to main
- ✅ Lint, build, and test jobs run in parallel
- ✅ npm dependencies are cached
- ✅ Tests run successfully with Xvfb

**Dependencies**: None

---

### Phase 3: Release Workflow Implementation (Core)

**Duration**: 1 hour 30 minutes  
**Goal**: Automate publishing to VS Code Marketplace on version tags

**Subtasks**:

- **TASK-004-006**: Create Release Workflow File
  - Create `.github/workflows/release.yml`
  - Configure workflow name and environment

- **TASK-004-007**: Configure Version Tag Trigger
  - Configure trigger on tag push matching `v*.*.*`
  - Ensure workflow only runs on version tags

- **TASK-004-008**: Configure VSCE Package Step
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Run `npm run compile`
  - Run `npm run package` to create .vsix file

- **TASK-004-009**: Configure VSCE Publish Step
  - Use `npx vsce publish -p ${{ secrets.VSCE_PAT }}`
  - Handle publish failures gracefully

- **TASK-004-010**: Configure GitHub Release Creation
  - Use `softprops/action-gh-release@v1`
  - Attach .vsix file as release artifact
  - Auto-generate release notes from commits

**Exit Criteria**:

- ✅ Release workflow triggers on `v*.*.*` tags
- ✅ Extension is packaged successfully
- ✅ Extension is published to VS Code Marketplace
- ✅ GitHub release created with .vsix attachment
- ✅ Release notes auto-generated

**Dependencies**: TASK-004-001 (VSCE_PAT must be configured)

---

### Phase 4: Status Badges (Documentation)

**Duration**: 10 minutes  
**Goal**: Add visible build status to repository

**Subtasks**:

- **TASK-004-011**: Add CI Workflow Badge to README
  - Add markdown badge at top of README.md
  - Link badge to workflow runs page
  - Verify badge displays correctly

**Exit Criteria**:

- ✅ CI badge visible in README
- ✅ Badge links to GitHub Actions
- ✅ Badge shows current status

**Dependencies**: TASK-004-002 (CI workflow must exist)

---

### Phase 5: Documentation Updates

**Duration**: 1 hour  
**Goal**: Document CI/CD setup and release process

**Subtasks**:

- **TASK-004-012**: Update CONTRIBUTING.md with CI Info
  - Add section on automated testing
  - Explain PR status checks
  - Document how to run tests locally

- **TASK-004-013**: Document Release Process
  - Document version bump process
  - Document tag creation process
  - Explain automated publish flow

- **TASK-004-014**: Add VSCE_PAT Setup Instructions
  - Document PAT generation steps
  - Document required scopes
  - Add renewal reminder process

- **TASK-004-015**: Add Troubleshooting Guide
  - Common CI failures and fixes
  - Release workflow debugging
  - PAT expiration handling

**Exit Criteria**:

- ✅ CONTRIBUTING.md updated with CI info
- ✅ Release process documented
- ✅ VSCE_PAT setup instructions complete
- ✅ Troubleshooting guide available

**Dependencies**: Phase 2 and Phase 3 complete

---

### Phase 6: Validation Testing

**Duration**: 1 hour  
**Goal**: Verify all workflows function correctly

**Subtasks**:

- **TASK-004-016**: Test CI Workflow with Valid PR
  - Create test branch with valid changes
  - Open PR and verify all jobs pass
  - Verify PR shows status checks

- **TASK-004-017**: Test CI Workflow Failure Detection
  - Introduce intentional lint error
  - Verify lint job fails
  - Introduce broken test
  - Verify test job fails

- **TASK-004-018**: Test Release Workflow with Tag
  - Bump version in package.json
  - Create and push version tag
  - Verify workflow triggers

- **TASK-004-019**: Verify Marketplace Publication
  - Check VS Code Marketplace for new version
  - Verify .vsix attached to GitHub release
  - Verify release notes generated

**Exit Criteria**:

- ✅ CI passes for valid code
- ✅ CI fails for broken code
- ✅ Release workflow triggers on tags
- ✅ Extension appears in Marketplace
- ✅ GitHub release has .vsix artifact

**Dependencies**: All previous phases complete

---

### Phase 7: Branch Protection (Optional)

**Duration**: 15 minutes  
**Goal**: Enforce CI checks before merging

**Subtasks**:

- **TASK-004-020**: Configure Branch Protection Rules
  - Enable branch protection on main
  - Require status checks: lint, build, test
  - Enable "Require branches to be up to date"

**Exit Criteria**:

- ✅ Branch protection enabled
- ✅ PRs cannot merge without passing CI
- ✅ Maintainers can bypass if needed

**Dependencies**: Phase 6 complete (workflows validated)

---

## Task Dependency Graph

```
Phase 1 (Prerequisites)
└─ TASK-004-001 (VSCE_PAT Secret)
   │
Phase 2 (CI Workflow) [No dependencies]
├─ TASK-004-002 (Create ci.yml)
│  ├─ TASK-004-003 (Lint Job)
│  ├─ TASK-004-004 (Build Job)
│  └─ TASK-004-005 (Test Job)
│
Phase 3 (Release Workflow) [Depends on TASK-004-001]
├─ TASK-004-006 (Create release.yml)
│  ├─ TASK-004-007 (Tag Trigger)
│  ├─ TASK-004-008 (Package Step)
│  ├─ TASK-004-009 (Publish Step)
│  └─ TASK-004-010 (GitHub Release)
│
Phase 4 (Badges) [Depends on TASK-004-002]
└─ TASK-004-011 (README Badge)
│
Phase 5 (Documentation) [Depends on Phase 2+3]
├─ TASK-004-012 (CONTRIBUTING.md)
├─ TASK-004-013 (Release Process)
├─ TASK-004-014 (VSCE_PAT Instructions)
└─ TASK-004-015 (Troubleshooting)
│
Phase 6 (Validation) [Depends on all phases]
├─ TASK-004-016 (Test CI - Pass)
├─ TASK-004-017 (Test CI - Fail)
├─ TASK-004-018 (Test Release)
└─ TASK-004-019 (Verify Marketplace)
│
Phase 7 (Protection) [Optional, depends on Phase 6]
└─ TASK-004-020 (Branch Protection)
```

---

## Priority Breakdown

### P0 Tasks (Must-Have) - 14 tasks

Core CI/CD functionality:

- TASK-004-001: VSCE_PAT secret setup
- TASK-004-002 to TASK-004-005: CI workflow implementation
- TASK-004-006 to TASK-004-010: Release workflow implementation
- TASK-004-016 to TASK-004-019: Validation testing

### P1 Tasks (Important) - 5 tasks

Documentation and visibility:

- TASK-004-011: CI workflow badge
- TASK-004-012 to TASK-004-015: Documentation updates

### P2 Tasks (Nice-to-Have) - 1 task

Optional enhancement:

- TASK-004-020: Branch protection configuration

---

## Risk Assessment

| Risk                     | Impact | Probability | Mitigation                                                |
| ------------------------ | ------ | ----------- | --------------------------------------------------------- |
| VSCE_PAT expiration      | High   | Medium      | Set calendar reminder, document renewal in CONTRIBUTING   |
| Test flakiness in CI     | Medium | Low         | Add retry logic, increase timeouts for Xvfb tests         |
| npm registry unavailable | Low    | Low         | npm cache reduces dependency on registry                  |
| VS Code download fails   | Low    | Low         | @vscode/test-electron has built-in retry                  |
| Secrets leak in logs     | High   | Low         | GitHub Actions masks secrets, review workflow outputs     |

---

## Implementation Notes

### Workflow File Locations

```
.github/
└── workflows/
    ├── ci.yml        # Continuous Integration
    └── release.yml   # Automated Release
```

### CI Workflow Structure

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run compile

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run compile
      - run: xvfb-run -a npm test
```

### Release Workflow Structure

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run compile
      - run: npm run package
      - run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
      - uses: softprops/action-gh-release@v1
        with:
          files: '*.vsix'
          generate_release_notes: true
```

### GitHub Actions Versions

| Action                       | Version | Purpose                    |
| ---------------------------- | ------- | -------------------------- |
| `actions/checkout`           | v4      | Checkout repository        |
| `actions/setup-node`         | v4      | Setup Node.js environment  |
| `softprops/action-gh-release`| v1      | Create GitHub releases     |

### Required Secrets

| Secret     | Purpose                              | Scope      |
| ---------- | ------------------------------------ | ---------- |
| `VSCE_PAT` | VS Code Marketplace Personal Access Token | Repository |

---

## Testing Strategy

### CI Workflow Validation

1. **Pass Case**: Create PR with valid code → All jobs pass
2. **Lint Failure**: Introduce ESLint error → Lint job fails
3. **Build Failure**: Introduce TypeScript error → Build job fails
4. **Test Failure**: Break a test → Test job fails
5. **Push to Main**: Merge PR → Workflow triggers

### Release Workflow Validation

1. **Tag Trigger**: Push `v0.x.x` tag → Workflow triggers
2. **Package Creation**: Verify .vsix file created
3. **Marketplace Publish**: Verify version in Marketplace
4. **GitHub Release**: Verify release with artifact

---

## Success Metrics

| Metric           | Target                    | Measurement                    |
| ---------------- | ------------------------- | ------------------------------ |
| CI Pass Rate     | >95% for merged PRs       | GitHub Actions metrics         |
| CI Duration      | <5 minutes                | Workflow run time              |
| Release Success  | 100% automated publishes  | Marketplace version updates    |
| Coverage         | All PRs have CI checks    | Branch protection compliance   |

---

## Release Checklist

- [ ] VSCE_PAT secret configured
- [ ] CI workflow created and tested
- [ ] Release workflow created and tested
- [ ] README badge added
- [ ] Documentation updated
- [ ] Validation testing complete
- [ ] (Optional) Branch protection enabled

---

## Sample Release Process

After CI/CD is configured:

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

---

**Revision History**:

- 2025-12-22: Initial task breakdown (v1.0)
