# VS-ORCA v0.4.0 Release Notes

**Release Date**: December 22, 2025

## 🚀 DevOps: CI/CD Pipeline Implementation

This release introduces a complete CI/CD pipeline using GitHub Actions, automating quality checks on every commit and streamlining the release process for VS Code Marketplace.

---

## What's New

### GitHub Actions CI Workflow

We've implemented a robust continuous integration pipeline that ensures code quality on every change:

- **Automated Testing**: All pull requests and pushes to `main` are automatically tested
- **Three-Stage Pipeline**:
  - **Lint**: ESLint validation catches code style issues
  - **Build**: TypeScript compilation verifies type safety
  - **Test**: Full test suite runs with VS Code Extension Host
- **Fast Feedback**: Concurrent run cancellation prevents resource waste
- **Optimized Builds**: Node.js 20 with npm caching for quick CI runs

### GitHub Actions Release Workflow

Publishing to VS Code Marketplace is now automated:

- **Tag-Triggered Releases**: Push a `v*.*.*` tag to trigger automatic publishing
- **Quality Gates**: Full CI validation runs before any release
- **Marketplace Publishing**: Automatic upload to VS Code Marketplace via `@vscode/vsce`
- **Release Artifacts**: `.vsix` file attached to GitHub Releases for manual installation
- **Secure**: Uses GitHub Secrets for Marketplace authentication

### Developer Experience Improvements

- **CI Status Badge**: README now shows live build status
- **Documentation**: CONTRIBUTING.md includes comprehensive CI/CD guide
- **Troubleshooting**: Common CI issues documented with solutions

---

## Technical Details

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
Triggers:
  - Push to main branch
  - All pull requests to main

Jobs:
  1. lint     - ESLint validation
  2. build    - TypeScript compilation  
  3. test     - VS Code Extension Host tests with Xvfb

Environment:
  - Ubuntu latest
  - Node.js 20.x
  - npm ci with caching
```

### Release Workflow (`.github/workflows/release.yml`)

```yaml
Triggers:
  - Version tags (v*.*.*)

Jobs:
  1. ci       - Full CI pipeline (lint, build, test)
  2. release  - Package and publish to Marketplace

Requirements:
  - VSCE_PAT secret configured in repository
```

### Performance

| Metric | Value |
|--------|-------|
| CI Pipeline Duration | ~2-3 minutes |
| Release Duration | ~5 minutes |
| Cache Hit Ratio | >90% for repeat builds |

---

## Files Changed

### New Files

- `.github/workflows/ci.yml` - Continuous Integration workflow
- `.github/workflows/release.yml` - Release automation workflow

### Modified Files

- `README.md` - Added CI and Release badges
- `CONTRIBUTING.md` - Added CI/CD documentation and troubleshooting

---

## For Maintainers

### Setting Up Release Publishing

1. Generate a Personal Access Token at https://marketplace.visualstudio.com/manage
2. Add the token as `VSCE_PAT` in GitHub repository secrets
3. Push a version tag to trigger release:
   ```bash
   git tag v0.4.0
   git push origin v0.4.0
   ```

### Manual Release (if needed)

```bash
npm run package
npx vsce publish
```

---

## Migration Notes

- **No Breaking Changes**: This release only adds DevOps infrastructure
- **No Configuration Changes**: All existing settings remain unchanged
- **No API Changes**: Extension behavior is identical to v0.3.0

---

## What's Next

With CI/CD infrastructure in place, future releases will be:
- **More Reliable**: Every change is automatically tested
- **Faster**: One-click releases to Marketplace
- **Transparent**: Build status visible to all contributors

---

## Links

- [GitHub Actions CI](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml)
- [GitHub Actions Release](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/release.yml)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ductrung-nguyen.vs-orca)
- [Contributing Guide](../CONTRIBUTING.md)

---

## Acknowledgments

Thank you to everyone who contributed to making the development workflow more robust and automated!
