---
name: git-repo-init
description: Initialize git repository and GitHub workflow baseline. Use this skill when (1) starting a new project in full mode, (2) setting up git for the first time, (3) configuring GitHub Actions CI, (4) setting up semantic-release, or (5) configuring conventional commits.
---

# Git Repository Initialization

Initialize and verify a complete Git + GitHub workflow baseline for repositories.

**CRITICAL:** This skill only activates for `MODE=full` pipelines. Existing repositories in feature mode are not modified.

## Overview

This skill provides:

- Git repository detection and safe initialization
- GitHub remote and `gh` CLI detection via subagent
- Optional GitHub Actions CI/CD workflows (Linux-only default)
- Conventional commits enforcement with commit-msg hooks
- Semantic-release configuration for `main`, `beta`, `alpha` branches
- Git hooks setup (detect existing managers or provide fallback)
- Idempotent operations (safe re-runs)

---

## Detection Protocol

### Git Repository Detection

**Command:** `git rev-parse --git-dir 2>/dev/null`

| Exit Code | Meaning                    | Action                              |
| --------- | -------------------------- | ----------------------------------- |
| 0         | Git repository exists      | Report "Git already initialized"    |
| 128       | Not a git repository       | Offer to run `git init`             |

**Additional checks:**

```bash
# Check if inside a subdirectory of outer git repo (prevent nested init)
git rev-parse --show-toplevel 2>/dev/null

# Check if .git exists but no commits yet
git rev-parse HEAD 2>/dev/null || echo "No commits yet"

# Check current branch name
git branch --show-current
```

### GitHub Remote Detection

**Command:** `git remote -v`

**Parse formats:**

| Format | Pattern                               | Example                                    |
| ------ | ------------------------------------- | ------------------------------------------ |
| HTTPS  | `https://github.com/<owner>/<repo>`   | `https://github.com/user/repo.git`         |
| SSH    | `git@github.com:<owner>/<repo>`       | `git@github.com:user/repo.git`             |

**Regex for parsing:**

```regex
# HTTPS format
https://github\.com/([^/]+)/([^/.]+)(?:\.git)?

# SSH format
git@github\.com:([^/]+)/([^/.]+)(?:\.git)?
```

**Output structure:**

```json
{
  "hasRemote": true,
  "isGitHub": true,
  "remoteUrl": "git@github.com:owner/repo.git",
  "owner": "owner",
  "repo": "repo"
}
```

### GitHub CLI Detection

**Commands:**

```bash
# Check if gh is installed
which gh || command -v gh

# Check if gh is authenticated
gh auth status
```

**Output structure:**

```json
{
  "ghInstalled": true,
  "ghAuthenticated": true,
  "ghUser": "username"
}
```

### Combined Detection Result

```json
{
  "git": {
    "initialized": true,
    "hasCommits": false,
    "currentBranch": "main",
    "repoRoot": "/path/to/repo"
  },
  "github": {
    "hasRemote": true,
    "isGitHub": true,
    "owner": "owner",
    "repo": "repo"
  },
  "ghCli": {
    "installed": true,
    "authenticated": true
  }
}
```

---

## Configuration Decision Trees

### Decision Tree: Git Initialization

```
Is .git directory present?
├── YES → Report "Git already initialized"
│         └── Are there any commits?
│             ├── YES → Continue with remote detection
│             └── NO → Note: "Repository has no commits yet"
│                       └── Continue with remote detection
└── NO → Is this inside another git repo?
         ├── YES → ERROR: "Cannot init nested repository"
         │         └── Report outer repo root and STOP
         └── NO → Offer to run git init
                  ├── User confirms → Run `git init && git branch -M main`
                  └── User declines → STOP (git features unavailable)
```

### Decision Tree: GitHub Actions CI Setup

```
Does .github/workflows/ci.yml exist?
├── YES → Report "CI workflow already exists"
│         └── Ask to overwrite?
│             ├── YES → Generate new workflow
│             └── NO → Skip CI setup
└── NO → Is this a GitHub repository?
         ├── YES → Ask to create CI workflow
         │         ├── User confirms → Generate .github/workflows/ci.yml
         │         └── User declines → Skip CI setup
         └── NO → Skip CI setup (explain why)
```

### Decision Tree: Semantic Release Configuration

```
Does .releaserc.json or release.config.js exist?
├── YES → Report "Semantic release already configured"
│         └── Skip semantic release setup
└── NO → Is this a GitHub repository?
         ├── YES → Ask to configure semantic release
         │         ├── User confirms →
         │         │   ├── Generate .releaserc.json
         │         │   └── Generate .github/workflows/release.yml (if CI was set up)
         │         └── User declines → Skip semantic release setup
         └── NO → Explain GitHub required and skip
```

### Decision Tree: Git Hooks Setup

```
Is Husky installed (node_modules/husky)?
├── YES → Configure via Husky
│         └── Add commit-msg hook with commitlint
└── NO → Does .lefthook.yml exist?
         ├── YES → Configure via Lefthook
         │         └── Add commit-msg hook with commitlint
         └── NO → Does package.json exist?
                  ├── YES → Offer to set up Husky
                  │         ├── User confirms → Install Husky + commitlint
                  │         └── User declines → Offer fallback hook script
                  └── NO → Offer minimal shell hook fallback
                           └── Install .git/hooks/commit-msg script
```

### Decision Tree: Conventional Commits (Commitlint)

```
Does commitlint.config.js or .commitlintrc.* exist?
├── YES → Report "Commitlint already configured"
│         └── Ensure hook is connected
└── NO → Does package.json exist?
         ├── YES → Create commitlint.config.js
         │         └── Document: npm install --save-dev @commitlint/cli @commitlint/config-conventional
         └── NO → Create minimal shell hook for validation
                  └── Uses regex-based validation (no Node required)
```

---

## Idempotency Rules

**CRITICAL:** All operations must be idempotent. Safe to re-run.

### Never Overwrite Without Confirmation

| File Type         | If Exists                        |
| ----------------- | -------------------------------- |
| `.git/`           | Skip init, report existing       |
| Workflow files    | Ask before overwrite             |
| Config files      | Skip, report existing            |
| Hook scripts      | Check content, skip if same      |

### Never Delete User Files

- Only create or modify with confirmation
- Never remove existing configurations
- Never remove user customizations

### Safe Re-run Behavior

Running the prompt again should:

1. Detect existing configuration
2. Report "already configured" for each item
3. Produce summary: "No changes needed"
4. Not modify any files

---

## Templates Location

Templates for generated files are stored at:

```
.github/skills/git-repo-init/templates/
├── ci.yml                  # GitHub Actions CI workflow
├── release.yml             # GitHub Actions release workflow
├── .releaserc.json         # Semantic release configuration
├── commitlint.config.js    # Commitlint configuration
└── commit-msg-hook.sh      # Fallback shell hook for non-Node projects
```

---

## Branch Strategy

### Configured Branches

| Branch  | Purpose              | Prerelease |
| ------- | -------------------- | ---------- |
| `main`  | Stable releases      | No         |
| `beta`  | Beta prereleases     | Yes        |
| `alpha` | Alpha prereleases    | Yes        |

### Release Flow

```
feature → alpha → beta → main
    ↓        ↓       ↓      ↓
 (dev)   v1.0.0-  v1.0.0-  v1.0.0
         alpha.1  beta.1
```

### Branch Creation Guidance

Provide commands (do not auto-execute):

```bash
# Create alpha branch
git checkout -b alpha main
git push -u origin alpha

# Create beta branch
git checkout -b beta main
git push -u origin beta
```

---

## Error Handling

### Git Not Installed

```
❌ Git is not installed or not in PATH.
Please install Git: https://git-scm.com/downloads
```

### Inside Nested Repository

```
❌ Cannot initialize: This directory is inside another git repository.
Outer repository root: /path/to/outer/repo
Please move to a separate directory or use the outer repository.
```

### Non-GitHub Remote

```
ℹ️ Remote 'origin' points to a non-GitHub host: gitlab.com
GitHub-specific features (Actions, semantic-release) will be skipped.
```

### gh CLI Not Authenticated

```
⚠️ GitHub CLI is installed but not authenticated.
Run: gh auth login
GitHub-dependent automation will be limited.
```

---

## Summary Output Format

After execution, provide structured summary:

```markdown
## Git Repository Initialization Summary

### Changes Made
- [x] Initialized git repository with `main` branch
- [x] Created .github/workflows/ci.yml
- [x] Created .releaserc.json with branch config
- [x] Created commitlint.config.js
- [x] Installed commit-msg hook via Husky

### Skipped (Already Exists)
- GitHub remote already configured
- No changes to existing workflows

### Manual Steps Required
- [ ] Install dependencies: `npm install --save-dev @commitlint/cli @commitlint/config-conventional semantic-release`
- [ ] Create alpha branch: `git checkout -b alpha main && git push -u origin alpha`
- [ ] Create beta branch: `git checkout -b beta main && git push -u origin beta`

### Next Steps
Continue with feature branch creation: `git checkout -b feat/001-feature-name`
```

---

## Integration with Pipeline

### Orchestrator Stage

- **Stage ID:** 0.1 (between Init Specs and Create Branch)
- **Condition:** Only runs when `$MODE=full`
- **Invoke:** `runSubagent({ prompt: "/git-repo-init ..." })`

### Status File Update

After completion, update pipeline status:

```json
{
  "stages": {
    "git-init": {
      "status": "completed",
      "output": {
        "gitInitialized": true,
        "ciWorkflowCreated": true,
        "releaseConfigured": true,
        "hooksConfigured": true
      }
    }
  }
}
```

