---
name: create-pr
description: Create Pull Requests at the end of the pipeline for GitHub-hosted repositories. Use this skill when (1) creating PRs after feature implementation, (2) detecting GitHub repository context, (3) validating gh CLI availability, (4) checking branch safety before PR creation, or (5) providing manual PR URLs as fallback.
---

# Create PR Skill

Protocol for creating Pull Requests at the end of the pipeline for GitHub-hosted repositories.

**CRITICAL:** Run this skill inside a subAgent to isolate PR creation logic and ensure interactive prompts are scoped to this step only.

## When to Use This Skill

- Creating PRs after feature implementation completes
- Detecting if current repository is GitHub-hosted
- Validating GitHub CLI availability and authentication
- Checking branch safety before PR creation
- Providing manual fallback URLs when PR creation is skipped

## Critical Behavior

### ⚠️ ALWAYS Interactive

**This step MUST always prompt for user confirmation.** The `AUTO_ANSWER` variable has NO effect on PR creation. Users must explicitly confirm before a PR is created.

### 🎯 GitHub-Only

This feature ONLY applies to GitHub-hosted repositories. All other scenarios skip gracefully with a clear reason.

## Phase 0: GitHub Context Detection

Detect if the current directory is a git repository with a GitHub remote.

### Step 1: Check Git Repository

```bash
git rev-parse --is-inside-work-tree 2>/dev/null
```

- **Success (exit 0):** Continue to next step
- **Failure:** Skip with reason "Not a git repository"

### Step 2: Get Remote URL

```bash
git remote get-url origin 2>/dev/null
```

- **Success:** Continue to parse URL
- **Failure:** Skip with reason "No origin remote configured"

### Step 3: Parse Remote URL

Extract owner and repo from the remote URL.

**HTTPS Format:**
```
https://github.com/{owner}/{repo}.git
https://github.com/{owner}/{repo}
```

**SSH Format:**
```
git@github.com:{owner}/{repo}.git
git@github.com:{owner}/{repo}
```

**Parsing Logic:**
```bash
remote_url=$(git remote get-url origin)

if [[ "$remote_url" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
    owner="${BASH_REMATCH[1]}"
    repo="${BASH_REMATCH[2]}"
else
    # Not a GitHub remote
    echo "SKIP: Remote is not GitHub"
    exit 0
fi
```

### Skip Conditions

| Condition | Skip Reason |
|-----------|-------------|
| Not in git repository | "Not a git repository" |
| No origin remote | "No origin remote configured" |
| Non-GitHub remote | "Remote is not GitHub" |
| Unparseable URL | "Could not parse GitHub URL" |

## Phase 1: Branch Safety Check

Prevent PR creation from default branches.

### Check Current Branch

```bash
current_branch=$(git branch --show-current)
```

### Blocked Branches

PR creation is blocked if on:
- `main`
- `master`

```bash
if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
    echo "SKIP: Cannot create PR from $current_branch branch"
    exit 0
fi
```

### Detached HEAD

```bash
if [[ -z "$current_branch" ]]; then
    echo "SKIP: Detached HEAD state"
    exit 0
fi
```

### Base Branch Detection

Default base branch is `main`. Can be overridden with `$BASE_BRANCH` variable.

```bash
base_branch="${BASE_BRANCH:-main}"
```

## Phase 2: gh CLI Availability Check

### Check Installation

```bash
if ! command -v gh &>/dev/null; then
    echo "SKIP: GitHub CLI (gh) not installed"
    # Provide manual URL fallback
    exit 0
fi
```

### Check Authentication

```bash
if ! gh auth status &>/dev/null; then
    echo "SKIP: GitHub CLI not authenticated"
    # Provide manual URL fallback
    exit 0
fi
```

## Phase 3: File-Based PR Body Creation

**CRITICAL:** Always use `--body-file` to avoid shell quoting issues.

### PR Title Format

```
feat: [Feature description from PRD]
```

Or derive from branch name:
```bash
# feat/007-user-auth → feat: user auth (strips PRD ID prefix)
title=$(echo "$current_branch" | sed 's/^feat\/[0-9]*-*/feat: /' | sed 's/-/ /g')
```

### PR Body Template

Write to temporary file:

```bash
cat > ./.tmp/pr-body.txt << 'EOF'
## Summary

[Brief description of the feature]

## Changes

- [Key change 1]
- [Key change 2]
- [Key change 3]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Notes

[Any additional notes for reviewers]
EOF
```

### Content Rules

**NEVER include in PR body:**
- PRD IDs or references (e.g., "PRD-007")
- Task IDs or references (e.g., "Task 1.0", "TASK-007-001")
- Phase numbers or pipeline workflow details
- Internal document paths (e.g., ".tot-docs/...")
- Test counts or coverage percentages

**DO include:**
- User-facing feature descriptions
- Key code changes
- Breaking changes (if any)
- Testing notes

### Create PR

```bash
gh pr create \
  --title "$title" \
  --body-file ./.tmp/pr-body.txt \
  --base "$base_branch" \
  --head "$current_branch"
```

### Cleanup

```bash
rm -f ./.tmp/pr-body.txt
```

## Phase 4: Interactive User Confirmation

### Confirmation Prompt

Display to user:

```
╔══════════════════════════════════════════════════════════════════╗
║                     CREATE PULL REQUEST                          ║
╠══════════════════════════════════════════════════════════════════╣
║  Title: feat: [Feature name]                                     ║
║  Base:  main ← Head: feat/user-auth                              ║
║  Repo:  owner/repo                                               ║
╚══════════════════════════════════════════════════════════════════╝

Create this PR now?
[Y]es - Create the PR
[N]o  - Skip (manual URL will be provided)
[P]review - Show full PR body before deciding

Your choice:
```

### Response Handling

| Response | Action |
|----------|--------|
| `Y` / `y` / `yes` | Proceed to create PR via `gh` |
| `N` / `n` / `no` | Skip and provide manual URL |
| `P` / `p` / `preview` | Display full title and body, then re-prompt |

### AUTO_ANSWER Ignored

```
⚠️ Note: AUTO_ANSWER variable is IGNORED for PR creation.
   User confirmation is ALWAYS required.
```

This is enforced in the prompt implementation by NOT checking the `$AUTO_ANSWER` variable.

## Phase 5: Skip/Fallback Behavior

### Manual URL Format

When skipping or on error, provide a manual compare URL:

```
https://github.com/{owner}/{repo}/compare/{base}...{head}
```

Example:
```
https://github.com/ductrung-nguyen/copilot-setup/compare/main...feat/pr-creation-prompt
```

### Skip Output

```
┌─────────────────────────────────────────────────────────────────┐
│  PR Creation Skipped                                            │
├─────────────────────────────────────────────────────────────────┤
│  Reason: [Skip reason]                                          │
│                                                                 │
│  To create the PR manually, visit:                              │
│  https://github.com/{owner}/{repo}/compare/{base}...{head}      │
└─────────────────────────────────────────────────────────────────┘
```

### Skip Reasons

| Reason | Description |
|--------|-------------|
| Not a git repository | Current directory is not a git repo |
| No origin remote configured | No `origin` remote exists |
| Remote is not GitHub | Remote URL is not github.com |
| Could not parse GitHub URL | URL format not recognized |
| Cannot create PR from main/master | On protected branch |
| Detached HEAD state | Not on a named branch |
| GitHub CLI (gh) not installed | `gh` command not found |
| GitHub CLI not authenticated | `gh auth status` failed |
| User declined | User selected [N]o |
| PR creation failed | `gh pr create` error |

## Output Contract

### Success

```
PR_CREATED: https://github.com/{owner}/{repo}/pull/{number}
```

### Skipped

```
SKIPPED: {reason}
MANUAL_URL: https://github.com/{owner}/{repo}/compare/{base}...{head}
```

## Pipeline Status Recording

### On Success

```json
{
  "stages": {
    "create-pr": {
      "status": "completed",
      "output": {
        "prUrl": "https://github.com/owner/repo/pull/123"
      }
    }
  }
}
```

### On Skip

```json
{
  "stages": {
    "create-pr": {
      "status": "skipped",
      "output": {
        "reason": "User declined",
        "manualUrl": "https://github.com/owner/repo/compare/main...feat/007-feature"
      }
    }
  }
}
```

## Error Handling

### Non-Blocking Failures

**CRITICAL:** PR creation failures or skips should NEVER block pipeline completion.

1. Log the error/skip reason
2. Provide manual URL
3. Continue pipeline to completion
4. Record status as "skipped" (not "failed")

### Error Recovery

If `gh pr create` fails:

1. Capture error message
2. Display to user
3. Provide manual URL as fallback
4. Return `SKIPPED: {error message}`

```bash
if ! output=$(gh pr create ... 2>&1); then
    echo "PR creation failed: $output"
    echo "Manual URL: https://github.com/$owner/$repo/compare/$base...$head"
    exit 0  # Don't fail the pipeline
fi
```

## Security Considerations

### Never Expose

- Internal pipeline artifacts
- Task/PRD file paths
- Workflow implementation details
- Agent/sub-agent references

### Safe to Include

- Feature descriptions (user-facing)
- Code change summaries
- Testing instructions
- Breaking change notices
