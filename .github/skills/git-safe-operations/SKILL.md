---
name: git-safe-operations
description: Enforce safe git commit and pull request operations following best practices. Use this skill when (1) making git commits in the pipeline, (2) creating pull requests with GitHub CLI, (3) checking branch safety before commits, (4) formatting commit messages properly, or (5) excluding internal docs from commits.
---

# Git Safe Operations

Safe git commit and pull request operations following best practices.

**CRITICAL:** Run git operations inside a subAgent to isolate side effects from the main orchestrator context and enforce branch safety checks.

## Single Commit Per Feature (Pipeline Default)

The pipeline uses a **single-commit-per-feature** model:

1. **During implementation (process-task-list):** Stage changes only, no commits
2. **After validation passes (validate-implementation):** Create ONE feature commit
3. **On remediation:** Stage fixes, amend feature commit after re-validation
4. **On finalize:** Amend docs into feature commit (or separate `docs:` commit)

**Why:** Avoids flooding changelog with intermediate commits. One clean commit per feature.

## Critical Rules

### 🚫 NEVER Commit to Main Branch

Before ANY commit operation:

1. Check current branch: `git branch --show-current`
2. If on `main` or `master`: **STOP** and create a feature branch first

```bash
current_branch=$(git branch --show-current)
if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
    echo "ERROR: Cannot commit to $current_branch branch!"
    exit 1
fi
```

### 📁 Use Temporary Files for Large Text

**Never use inline commit messages or PR bodies in terminal commands.**

```bash
# Write commit message to file
cat > ./.tmp/commit-message.txt << 'EOF'
feat: Add user authentication module

- Implement JWT token generation
- Add login/logout endpoints
EOF

# Commit using file
git commit -F ./.tmp/commit-message.txt
```

## Commit Message Format

Follow conventional commits: `<type>(<scope>): <subject>`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Good:** `feat(auth): add password reset with email verification`
**Bad:** `feat(001): add password reset flow` ❌ PRD ID as scope

## Internal Docs Exclusion

By default, NEVER commit the `.tot-docs` directory (pipeline documentation):

```bash
# Exclude internal docs when staging
git add . ':!.tot-docs'
```

Override with `$COMMIT_DOCS=true` if needed.

## Feature Commit Status Tracking

Track feature commit state in the pipeline status file:

```json
{
  "featureCommit": {
    "created": true,
    "sha": "abc123def456",
    "createdAt": "2026-01-01T00:00:00Z",
    "amendCount": 0
  }
}
```

- `created`: Whether the feature commit has been created
- `sha`: Current commit SHA (updated on amend)
- `amendCount`: Number of times the commit was amended (for remediation cycles)

## Pull Request Operations

Always use a file for PR body:

```bash
cat > ./.tmp/pr-body.txt << 'EOF'
## Summary
This PR implements user authentication.
EOF

gh pr create \
  --title "feat: Add user authentication" \
  --body-file ./.tmp/pr-body.txt \
  --base main
```

## Code Formatting (Before Commit)

| Language | Format Command               | Lint Command   |
| -------- | ---------------------------- | -------------- |
| Go       | `go fmt ./...`               | `go vet ./...` |
| Python   | `black .` or `ruff format .` | `ruff check .` |
| JS/TS    | `npx prettier --write .`     | `npm run lint` |

## Verification Checklist

Before every commit:
- [ ] Not on main/master branch
- [ ] Commit message in a file (not inline)
- [ ] Code formatted and linted
- [ ] Internal docs excluded (unless $COMMIT_DOCS=true)
- [ ] No `.env*` files staged (security check)
