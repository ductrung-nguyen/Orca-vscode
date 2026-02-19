---
description: "Guidelines for safe git commit and pull request operations"
applyTo: "**"
---

# Git Operations Guidelines

Instructions for performing git commits and creating pull requests safely and correctly when working with GitHub Copilot in VS Code.

## Critical Rules

### Never auto-commit or auto-push when fixing bug. Always ask for user confirmation first.

### 🚫 NEVER Commit to Main Branch

**This is the most important rule. Violation can cause serious issues.**

Before ANY commit operation:

1. Check current branch: `git branch --show-current`
2. If on `main` or `master`:
   - **STOP immediately**
   - Create a feature branch first: `git checkout -b feat/[feature-name]`
   - Never use `git push origin main`

```bash
# ALWAYS check branch first
current_branch=$(git branch --show-current)
if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
    echo "ERROR: Cannot commit to $current_branch branch!"
    exit 1
fi
```

### 🚫 NEVER Use --no-verify

**This rule has ZERO exceptions. Bypassing git hooks is NEVER acceptable.**

The `--no-verify` flag bypasses pre-commit hooks that enforce:
- **Linting** - Code style and quality checks
- **Type checking** - TypeScript/Flow compilation
- **Security scanning** - Secret detection, vulnerability checks
- **Tests** - Unit test execution

**Forbidden Commands:**

```bash
# ❌ NEVER DO THIS - bypasses all hooks
git commit --no-verify
git commit -n                    # Short form, also forbidden
git push --no-verify

# ❌ NEVER combine with other flags
git commit -m "message" --no-verify
git commit --amend --no-verify
```

**If commit fails due to hooks:**

1. **Read the error message** - It tells you exactly what's wrong
2. **Fix the underlying issue** - Don't bypass the check
3. **Re-run the commit** - Without `--no-verify`

```bash
# ✅ CORRECT approach when hooks fail
npm run lint -- --fix          # Fix lint errors
npm run format                  # Fix formatting
npm run test                    # Fix failing tests
git commit -m "your message"   # Try again WITHOUT --no-verify
```

**Detection and Enforcement:**
- `process-task-list.prompt.md` checks for --no-verify usage during implementation
- `validate-implementation.prompt.md` Step 6.5 scans commit history for bypass indicators
- Any detected bypass is flagged as CRITICAL and blocks validation

### 📁 Use Temporary Files for Large Text

**Never use inline commit messages or PR bodies in terminal commands.**

VS Code's terminal integration has issues with:

- Multi-line strings in commands
- Special characters in commit messages
- Long PR descriptions

**Always use temporary files instead.**

## Git Commit Operations

### Correct Approach: File-Based Commit Message

```bash
# Step 1: Write commit message to a temporary file
cat > ./.tmp/commit-message.txt << 'EOF'
feat: Add user authentication module

- Implement JWT token generation
- Add login/logout endpoints
- Create user session management
- Add password hashing with bcrypt

Closes issue #123
EOF

# Step 2: Stage changes
git add .

# Step 3: Commit using the file
git commit -F ./.tmp/commit-message.txt

# Step 4: Clean up (optional)
rm ./.tmp/commit-message.txt
```

### Wrong Approach: Inline Message (AVOID)

```bash
# ❌ BAD - Multi-line messages break in VS Code terminal
git commit -m "feat: Add user authentication module

- Implement JWT token generation
- Add login/logout endpoints"

# ❌ BAD - Special characters can cause issues
git commit -m "fix: Handle edge case where user's name contains \"quotes\""
```

### Commit Message Format

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Pull Request Operations

### Creating PR with GitHub CLI

**Always use a file for PR body:**

```bash
# Step 1: Write PR body to a temporary file
cat > ./.tmp/pr-body.txt << 'EOF'
## Summary

This PR implements the user authentication feature.

## Changes

- Added JWT token generation in `src/auth/jwt.ts`
- Created login/logout endpoints in `src/routes/auth.ts`
- Implemented session management in `src/services/session.ts`

## Testing

- [x] Unit tests added
- [x] Integration tests pass
- [x] Manual testing completed

## Related Issues

Closes #123
EOF

# Step 2: Create PR using the file
gh pr create \
  --title "feat: Add user authentication module" \
  --body-file ./.tmp/pr-body.txt \
  --base main \
  --head "$(git branch --show-current)"

# Step 3: Clean up
rm ./.tmp/pr-body.txt
```

### Wrong Approach: Inline PR Body (AVOID)

```bash
# ❌ BAD - Long body breaks terminal
gh pr create --title "feat: Auth" --body "## Summary
This is a very long description..."

# ❌ BAD - Heredoc in command can fail
gh pr create --title "feat: Auth" --body "$(cat << EOF
...
EOF
)"
```

### PR Title Guidelines

- Keep under 72 characters
- Use conventional commit format: `type: description`
- Be descriptive but concise

## Safe Git Workflow

### Before Starting Work

```bash
# 1. Ensure you're not on main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/[prd-id]-[feature-slug]

# 3. Verify branch
git branch --show-current
```

### During Development

```bash
# Commit frequently with file-based messages
cat > ./.tmp/commit-message.txt << 'EOF'
[commit message here]
EOF
git add [files]
git commit -F ./.tmp/commit-message.txt
```

### Before Creating PR

```bash
# 1. Verify not on main
if [[ "$(git branch --show-current)" == "main" ]]; then
    echo "ERROR: Cannot create PR from main!"
    exit 1
fi

# 2. Push branch
git push -u origin "$(git branch --show-current)"

# 3. Create PR with file-based body
cat > ./.tmp/pr-body.txt << 'EOF'
[PR body here]
EOF
gh pr create --title "[title]" --body-file ./.tmp/pr-body.txt --base main
```

## Helper Functions

Add these to your workflow for safety:

### Safe Commit Function

```bash
safe_commit() {
    local msg_file="$1"

    # Check branch
    local branch=$(git branch --show-current)
    if [[ "$branch" == "main" || "$branch" == "master" ]]; then
        echo "❌ ERROR: Cannot commit to $branch branch!"
        return 1
    fi

    # Check message file exists
    if [[ ! -f "$msg_file" ]]; then
        echo "❌ ERROR: Commit message file not found: $msg_file"
        return 1
    fi

    git commit -F "$msg_file"
}
```

### Safe PR Function

```bash
safe_pr() {
    local title="$1"
    local body_file="$2"

    # Check branch
    local branch=$(git branch --show-current)
    if [[ "$branch" == "main" || "$branch" == "master" ]]; then
        echo "❌ ERROR: Cannot create PR from $branch branch!"
        return 1
    fi

    # Check body file exists
    if [[ ! -f "$body_file" ]]; then
        echo "❌ ERROR: PR body file not found: $body_file"
        return 1
    fi

    # Push and create PR
    git push -u origin "$branch"
    gh pr create --title "$title" --body-file "$body_file" --base main
}
```

## Verification Checklist

Before every commit:

- [ ] Not on main/master branch
- [ ] Commit message in a file (not inline)
- [ ] Changes staged correctly

Before every PR:

- [ ] Not on main/master branch
- [ ] PR body in a file (not inline)
- [ ] Branch pushed to remote
- [ ] Base branch is correct (usually main)

## Common Mistakes to Avoid

| Mistake                     | Why It's Bad               | Correct Approach                 |
| --------------------------- | -------------------------- | -------------------------------- |
| Commit to main              | Bypasses review process    | Create feature branch first      |
| Inline multi-line message   | Breaks in VS Code terminal | Use `-F` with file               |
| Inline PR body              | Special chars cause issues | Use `--body-file`                |
| Long commit message in `-m` | Truncation/parsing issues  | Use file-based approach          |
| Force push to main          | Destroys history           | Never force push shared branches |

## Integration with Pipeline

When the orchestrator creates feature branches:

- Branch naming: `feat/[prd-id]-[feature-slug]`
- Example: `feat/001-user-authentication`

When process-task-list commits:

- Use file-based commits for each parent task
- Never include internal agent task reference in commit message
- Only include Jira/GitHub issue references if applicable
- Example: `feat(component): Implement login endpoint`

## Commit Protocol

### Single Commit Per Feature (Default)

The pipeline uses a **single-commit-per-feature** model:

1. **During implementation (process-task-list):**
   - Stage changes after each parent task completion
   - Do NOT commit during implementation
   
2. **After validation passes (validate-implementation):**
   - Create ONE commit aggregating all implementation work
   - Use conventional commit format with feature scope
   
3. **On remediation (validation fails):**
   - Stage fixes
   - After re-validation passes, amend the feature commit
   
4. **On finalize:**
   - Amend docs into feature commit, OR
   - Create separate `docs:` commit (if `$SEPARATE_DOCS_COMMIT=true`)

### Commit Message Format

- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- **SCOPE must be a feature area** (e.g., `auth`, `api`, `pipeline`) - NOT a PRD ID or task number
- **Focus on CODE changes only** - Do not mention tasks, PRD, or workflow
- Do NOT add AI as co-author
- Do NOT include test counts (e.g., "45 tests passing")
- **CRITICAL:** Exclude internal docs from commits (see below)

### Commit Message Aggregation

When creating the feature commit, aggregate parent task descriptions:

**Good example (single feature commit):**
```
feat(auth): implement user authentication system

- Add JWT token generation and validation
- Create login/logout API endpoints
- Implement password reset flow
- Add session management
```

**NOT this (per-task commits - old behavior):**
```
feat(auth): setup auth module
feat(auth): add JWT tokens
feat(auth): create login endpoint
feat(auth): add logout endpoint
...
```

**Bad commit messages (NEVER do this):**

```
feat(001): add password reset flow            # ❌ PRD ID as scope
feat(005): Phase 1 - TOC Data Generation      # ❌ PRD ID + Phase reference
feat(auth): Complete task 2.3 - password reset # ❌ Task reference
fix(api): Fix issue from PRD requirement FR-5 # ❌ PRD reference
feat(auth): add login (154 tests, 85% coverage) # ❌ Test counts
feat: Tasks completed: TASK-003-001 through TASK-003-005 # ❌ Task IDs
feat: implement sub-tasks 1.1, 1.2, 1.3       # ❌ Sub-task references
```

### Code Formatting (Before Commit)

**ALWAYS** format AND lint code before committing using the language's standard tools:

| Language | Format Command               | Lint Command   |
| -------- | ---------------------------- | -------------- |
| Go       | `go fmt ./...`               | `go vet ./...` |
| Rust     | `cargo fmt`                  | `cargo clippy` |
| Python   | `black .` or `ruff format .` | `ruff check .` |
| JS/TS    | `npx prettier --write .`     | `npm run lint` |

**MUST fix all lint errors before committing.** Warnings can be addressed later but errors block commit.

### Internal Docs Exclusion (Default Behavior)

**Problem:** AI-generated artifacts leave traces in repository history.

**Solution:** By default, NEVER commit these paths:

| Path                       | Content                  |
| -------------------------- | ------------------------ |
| `.tot-docs/requirements/`    | Discovery files          |
| `.tot-docs/prd/`             | PRD documents            |
| `.tot-docs/tasks/`           | Task lists               |
| `.tot-docs/tasks-details/`   | Task details             |
| `.tot-docs/pipeline-status/` | Pipeline state (per PRD) |

**When committing code changes:**

```bash
# WRONG - commits everything including internal docs
git add .

# CORRECT - exclude internal docs
git add . ':!.tot-docs/requirements' ':!.tot-docs/prd' ':!.tot-docs/tasks' ':!.tot-docs/tasks-details' ':!.tot-docs/pipeline-status'

# Or use explicit paths
git add src/ tests/ package.json tsconfig.json  # Only source files
```

**Override:** If `$COMMIT_DOCS=true`, include internal docs in commits.
