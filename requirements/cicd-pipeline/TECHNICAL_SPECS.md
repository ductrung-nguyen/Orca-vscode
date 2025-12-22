# Technical Specifications

## Workflow Definitions

### 1. CI Workflow (ci.yml)

**File**: `.github/workflows/ci.yml`

**Triggers**:
- Push to `main` branch
- Pull request to `main` branch

**Structure**:
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

### 2. Release Workflow (release.yml)

**File**: `.github/workflows/release.yml`

**Triggers**:
- Tag push matching `v*.*.*`

**Structure**:
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
      - name: Publish to VS Code Marketplace
        run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: '*.vsix'
          generate_release_notes: true
```

## Environment Specifications

### Runner Configuration
| Setting | Value |
|---------|-------|
| OS | `ubuntu-latest` |
| Node.js | `20.x` (LTS) |
| npm cache | Enabled via `actions/setup-node` |

### Required GitHub Secrets
| Secret Name | Description | Scope |
|-------------|-------------|-------|
| `VSCE_PAT` | VS Code Marketplace PAT | Repository |

### VS Code Marketplace PAT Permissions
- Organization: `All accessible organizations`
- Scopes: `Marketplace > Manage`
- Expiration: 1 year (recommended)

## Test Execution

### Xvfb Requirement
VS Code tests require a display. Use `xvfb-run` on Linux:
```bash
xvfb-run -a npm test
```

**Flags**:
- `-a`: Auto-select display number

### Test Timeout
Default Mocha timeout: 10,000ms
Consider increasing for CI: 60,000ms

### Test Environment Variables
```yaml
env:
  DISPLAY: ':99.0'
```

## Packaging Specifications

### VSIX Generation
Command: `npm run package` (runs `vsce package`)

**Output**: `vs-orca-{version}.vsix`

**Contents verification**:
```bash
vsce ls  # List files that will be included
```

### Version Validation
Ensure tag matches package.json version:
```bash
TAG_VERSION=${GITHUB_REF#refs/tags/v}
PKG_VERSION=$(node -p "require('./package.json').version")
[ "$TAG_VERSION" = "$PKG_VERSION" ] || exit 1
```

## GitHub Actions Versions

### Recommended Action Versions
| Action | Version | Purpose |
|--------|---------|---------|
| `actions/checkout` | v4 | Checkout repository |
| `actions/setup-node` | v4 | Setup Node.js |
| `actions/cache` | v4 | Cache dependencies |
| `softprops/action-gh-release` | v1 | Create releases |

### Caching Strategy
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Built-in npm caching
```

**Alternative** (manual cache):
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

## Error Handling

### Build Failures
- ESLint errors: Non-zero exit code
- TypeScript errors: Non-zero exit code
- Test failures: Non-zero exit code

### Release Failures
- Invalid PAT: vsce returns non-zero
- Version mismatch: Custom validation step
- Network issues: Retry with backoff

### Retry Strategy
```yaml
- name: Publish with retry
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npx vsce publish -p ${{ secrets.VSCE_PAT }}
```

## Branch Protection (Recommended)

### Main Branch Rules
- [x] Require status checks to pass
- [x] Require branches to be up to date
- [x] Required checks: `lint`, `build`, `test`
- [ ] Require PR reviews (optional)

### Tag Protection
- Only maintainers can push tags
- Version tags trigger release

## Monitoring

### Workflow Status Badge
```markdown
[![CI](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml)
```

### Notifications
- GitHub default notifications for failures
- Optional: Slack/Discord webhook for releases
