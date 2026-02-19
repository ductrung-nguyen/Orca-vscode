---
name: create-github-issues
description: Create GitHub issues from a validated PRD file with user-facing content. Supports multiple issues per PRD (bug/feature), agent-driven issue count, and repository template integration. Use this skill when (1) creating GitHub issues for a PRD, (2) tracking features in GitHub, (3) ensuring idempotent issue creation, (4) integrating with repository issue templates, or (5) splitting complex PRDs into trackable issues.
---

# Create GitHub Issues from PRD

Create one or more GitHub issues from a validated PRD file. The agent analyzes the PRD to determine optimal issue count (1-5 issues maximum), supports bug/feature types, and integrates with repository issue templates.

**CRITICAL:** Run this skill inside a subAgent to isolate context and prevent leaking internal file paths or task IDs into public GitHub issues.

**Key Principles:**
- **Zero internal references** - Never expose PRD IDs, task IDs, or internal file paths
- **Agent-driven splitting** - Intelligently split complex PRDs into trackable issues
- **Template-aware** - Use repository's issue templates when available

## Prerequisites

- **GitHub CLI (`gh`)** must be installed and authenticated
- Repository must be hosted on GitHub (remote URL must contain `github.com`)
- PRD file must follow standard format with required sections

## When to Use This Skill

- Pipeline stage after `validate-prd` to create trackable feature/bug issues
- User wants to create GitHub issues for a validated PRD
- Syncing PRD features with GitHub project tracking
- Splitting complex features into multiple trackable issues
- Integrating with repository-specific issue templates

## Input Variables

| Variable        | Required | Default | Description                                         |
| --------------- | -------- | ------- | --------------------------------------------------- |
| `PRD_FILE`      | Yes      | -       | Path to the validated PRD file                      |
| `DRY_RUN`       | No       | `false` | Preview without creating issues                     |
| `CREATE_ISSUES` | No       | `true`  | Master toggle to enable/disable issue creation      |
| `STATUS_FILE`   | No       | auto    | Pipeline status file path (auto-detected from PRD) |

### Variable Details

- **`PRD_FILE`**: Absolute path to a PRD file (e.g., `.tot-docs/prd/001-feature.md`). Must exist.
- **`DRY_RUN`**: When `true`, shows what would be created without making API calls
- **`CREATE_ISSUES`**: When `false`, the entire stage is skipped
- **`STATUS_FILE`**: Pipeline status file where issue references are stored

## Content Sanitization Protocol

**CRITICAL: Never expose internal references in GitHub issues.**

### Forbidden Patterns

Before including ANY content in an issue, scan and remove:

| Pattern Type | Regex | Action |
| --- | --- | --- |
| PRD IDs | `\b(PRD-?\d{3})\b` | Remove entirely |
| Task IDs | `\b\d+\.\d+(-[a-z-]+)?\b` | Remove entirely |
| File paths | `.tot-docs/(prd|tasks|requirements)/` | Remove line |
| Internal terms | `pipeline`, `sub-agent`, `orchestrator` | Remove or rephrase |
| Section refs | `\bFR-\d+\.\d+\b`, `\bUS-\d+\b` | Remove entirely (do not include section IDs in issues) |

### Title Requirements

- Use descriptive, human-readable titles only
- Never include `[PRD-XXX]`, `[XXX]`, or any ID prefix
- Example: "Add Password Reset Flow" not "[008] Password Reset"

### Label Requirements

- Use only: `bug`, `enhancement`, `priority:high`, `priority:medium`, `priority:low`
- **NEVER** use: `prd-*`, `task-*`, or any ID-based labels

## GitHub Issue Template Detection

Before creating issues, check for repository-specific templates.

### Template Discovery

```bash
# Check for issue template directory
ls -la .github/ISSUE_TEMPLATE/ 2>/dev/null

# Or single template file
ls -la .github/ISSUE_TEMPLATE.md 2>/dev/null
```

### Template Parsing

For YAML-frontmatter templates:

```yaml
---
name: Feature Request
description: Suggest an idea for this project
labels: ["enhancement"]
assignees: []
---
```

Parse with regex:
```regex
^---\n([\s\S]*?)\n---\n([\s\S]*)$
```

### Template Field Mapping

Map PRD sections to common template fields:

| Template Field | PRD Source | Fallback |
| --- | --- | --- |
| `### Description` | Overview | Goals summary |
| `### Problem` | User Stories (pain points) | "Not specified" |
| `### Expected Behavior` | Acceptance Criteria | Functional Requirements |
| `### Proposed Solution` | Goals + Overview | Summary of feature |
| `### Alternatives` | Non-Goals | "None considered" |
| `### Additional Context` | Dependencies, Constraints | Empty |

### No Template Behavior

If no template found, use default structure (see Issue Body Template below).

## PRD Analysis & Issue Planning

The agent analyzes the PRD to determine optimal issue count (1-5 maximum).

### Issue Count Determination

Analyze the PRD and decide how many issues to create:

| Condition | Issue Count | Example |
| --- | --- | --- |
| Single cohesive feature | 1 | "Add dark mode toggle" |
| Feature + known bug fix | 2 | Feature + bug regression |
| Multiple distinct components | 2-3 | Auth + UI + API |
| Complex multi-phase feature | 3-5 | Large refactoring project |

**Maximum: 5 issues per PRD** (hard limit)

### Splitting Criteria

Create separate issues when:
1. **Different issue types** - Bug vs Feature should be separate
2. **Independent deliverables** - Can be merged separately
3. **Different owners** - Frontend vs Backend teams
4. **Phased delivery** - Clear phase boundaries in PRD

### Issue Planning Output

For each planned issue, determine:
- **Type**: `bug` or `feature`
- **Title**: Human-readable, no IDs
- **Priority**: `high`, `medium`, or `low`
- **Content scope**: Which PRD sections apply

## PRD Parsing Protocol

### Metadata Extraction Regex

The PRD parser uses these patterns to extract metadata:

```regex
# Extract PRD title
^# PRD: (.+)$

# Extract PRD ID
\*\*ID:\*\*\s*(\d{3})
```

### Section Extraction Rules

Extract user-facing content from these PRD sections:

| Section | Regex Pattern | Max Chars | Purpose in Issue |
| ------- | ------------- | --------- | ---------------- |
| Overview | `## 1. Overview\n\n([\s\S]*?)(?=\n## \d+\.)` | 2000 | Main description |
| Goals | `## 2. Goals\n\n([\s\S]*?)(?=\n## \d+\.)` | 1500 | Checklist of goals |
| User Stories | `## 3. User Stories\n\n([\s\S]*?)(?=\n## \d+\.)` | 3000 | Feature requirements |
| Functional Requirements | `## 4. Functional Requirements\n\n([\s\S]*?)(?=\n## \d+\.)` | 2500 | Scope items |
| Non-Goals | `## 5. Non-Goals\n\n([\s\S]*?)(?=\n## \d+\.|$)` | 1000 | Out of scope |

### Missing Section Handling

If a section is not found, use placeholder text:
```
(Not specified in PRD)
```

## GitHub Context Detection

### Step 1: Check Git Repository

```bash
git rev-parse --git-dir 2>/dev/null
# Exit code 0 = git repo, non-zero = not a git repo
```

If not a git repo → **Skip stage**, return `{ "status": "skipped", "reason": "Not a git repository" }`

### Step 2: Get Remote URL

```bash
git remote get-url origin 2>/dev/null
```

### Step 3: Parse GitHub Remote

```regex
# HTTPS format
https://github\.com/([^/]+)/([^/.]+)(\.git)?

# SSH format
git@github\.com:([^/]+)/([^/.]+)(\.git)?
```

Extract: `OWNER` = group 1, `REPO` = group 2 (strip `.git` suffix)

### Skip Conditions

Skip the stage (non-blocking) if:
- Not a git repository
- No `origin` remote configured
- Remote URL is not GitHub (e.g., GitLab, Bitbucket)
- `CREATE_ISSUES=false`

## Issue Creation Protocol

### Issue Title Format

Use descriptive, human-readable titles only. **Never include internal IDs.**

**Good Examples:**
- `Add Password Reset Flow`
- `Fix Login Session Timeout Bug`
- `Implement User Profile Management`

**Bad Examples (NEVER use):**
- `[008] PRD-Based GitHub Issue Creation` ❌
- `[PRD-001] User Authentication` ❌
- `Task 1.0 - Setup Database` ❌

### Issue Body Template

Use repository template if available, otherwise use this default structure:

```markdown
## Context

{Brief context explaining the feature/bug - from PRD Overview}

## What is Missing / Problem

{Current gap or problem - derived from User Stories pain points}

## Expected Behavior

{What should happen - from Acceptance Criteria or Goals}

## Why This Matters

{Business value or user impact - from Goals section}

## Proposed Solution

{High-level approach - from Overview/Goals}

## Acceptance Criteria

- [ ] {Criterion 1 - from PRD acceptance criteria}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Priority

{high/medium/low with justification}
```

**Note:** Never include internal file paths, PRD IDs, or section references in the issue body.

### Content Truncation

If total body exceeds 10,000 characters, reduce in order:

1. Reduce Acceptance Criteria from 5 → 3 items
2. Reduce Proposed Solution details
3. Truncate Context to 1000 chars

### Labels

Apply these labels to created issues:

| Label | When to Use |
| --- | --- |
| `enhancement` | New functionality |
| `bug` | Defect or regression |
| `priority:high` | Critical path, blockers |
| `priority:medium` | Important but not blocking |
| `priority:low` | Nice-to-have |

**NEVER use these labels:**
- `prd-*` (exposes internal IDs)
- `task-*` (exposes internal structure)
- Any label containing numeric IDs

### gh CLI Command

```bash
# Create issue with human-readable title
gh issue create \
  --title "{descriptive-title}" \
  --body-file ./.tmp/issue-body-{random}.txt \
  --label "{bug|enhancement}" \
  --label "priority:{high|medium|low}"
```

### Creating Multiple Issues

When creating multiple issues from one PRD:

```bash
# Loop through planned issues
for issue in "${PLANNED_ISSUES[@]}"; do
  gh issue create \
    --title "${issue[title]}" \
    --body-file "./.tmp/issue-${issue[index]}.txt" \
    --label "${issue[type]}" \
    --label "priority:${issue[priority]}"
done
```

### Error Handling

| Error | Action |
| --- | --- |
| `gh` not installed | Skip stage, return `{ "status": "skipped", "reason": "gh CLI not installed" }` |
| `gh` not authenticated | Skip stage, return `{ "status": "skipped", "reason": "gh not authenticated" }` |
| Rate limit exceeded | Wait 60 seconds, retry once |
| Network error | Retry once, then return failed |
| Label doesn't exist | Create label, or continue without if creation fails |

### Security

- **NEVER** log or expose authentication tokens
- Use `gh`'s built-in auth mechanism (no raw tokens in commands)
- Use secure temp files with random suffixes
- Delete temp files immediately after issue creation
- Log only issue number and error type on failure - NOT full content

## Duplicate Detection Logic

Two-layer detection to prevent duplicate issues:

### Layer 1: Status File Detection

Check if pipeline status file already has issues:

```json
{
  "githubIssues": [
    { "number": 42, "url": "...", "title": "Add Password Reset" },
    { "number": 43, "url": "...", "title": "Fix Session Bug" }
  ]
}
```

If found → Skip creation for matching titles, return existing URLs

### Layer 2: GitHub Search

For each planned issue, search GitHub for potential duplicates:

```bash
# Search by title keywords (NOT by internal IDs)
gh issue list --search "in:title password reset" --json number,title,url
```

Decision tree:
- Similar title found (>80% match) → Skip creation, return existing
- No match → Create new issue

## Pipeline Status Update Protocol

After successfully creating issues, update the pipeline status file:

### Status File Location

```
.tot-docs/pipeline-status/{prd-id}-{feature-name}.json
```

### Update Structure (Multiple Issues)

```json
{
  "stages": {
    "create-issues": {
      "status": "completed",
      "output": {
        "issuesCreated": 2,
        "issues": [
          { "number": 42, "url": "...", "title": "Add Password Reset", "type": "enhancement" },
          { "number": 43, "url": "...", "title": "Fix Session Bug", "type": "bug" }
        ]
      }
    }
  },
  "githubIssues": [
    { "number": 42, "url": "...", "title": "Add Password Reset", "type": "enhancement", "createdAt": "..." },
    { "number": 43, "url": "...", "title": "Fix Session Bug", "type": "bug", "createdAt": "..." }
  ],
  "lastUpdated": "2024-12-31T10:00:00Z"
}
```

## Output Format

### Success Output (Multiple Issues)

```json
{
  "status": "completed",
  "issuesCreated": 2,
  "issues": [
    { "number": 42, "url": "https://github.com/owner/repo/issues/42", "title": "Add Password Reset", "type": "enhancement" },
    { "number": 43, "url": "https://github.com/owner/repo/issues/43", "title": "Fix Session Bug", "type": "bug" }
  ]
}
```

### Skipped Output

```json
{
  "status": "skipped",
  "reason": "Issues already exist",
  "existingIssues": [
    { "number": 42, "url": "...", "title": "Add Password Reset" }
  ]
}
```

### Partial Success Output

```json
{
  "status": "partial",
  "issuesCreated": 1,
  "issuesFailed": 1,
  "issues": [
    { "number": 42, "url": "...", "title": "Add Password Reset", "type": "enhancement" }
  ],
  "errors": [
    { "title": "Fix Session Bug", "reason": "Rate limit exceeded" }
  ]
}
```

### Failed Output

```json
{
  "status": "failed",
  "reason": "GitHub API rate limit exceeded"
}
```

## Error Handling Guidelines

### Missing PRD File

```json
{
  "status": "skipped",
  "reason": "PRD file not found"
}
```

Stage skips but pipeline should NOT block on this.

### gh CLI Not Installed

```bash
which gh || command -v gh
```

If not found:
```json
{
  "status": "skipped",
  "reason": "GitHub CLI (gh) not installed. Install with: brew install gh"
}
```

### gh Not Authenticated

```bash
gh auth status 2>/dev/null
```

Check exit code for authentication status:
```json
{
  "status": "skipped",
  "reason": "GitHub CLI not authenticated. Run: gh auth login"
}
```

## Pipeline Integration

This stage fits into the orchestrator pipeline:

```
validate-prd → create-issues → generate-plan
```

### Non-Blocking by Design

The create-issues stage should NEVER halt the pipeline:
- All errors result in skip or failed status
- Pipeline continues to `generate-plan` regardless of create-issues outcome
- Failures are logged for later review

### Orchestrator Invocation

```javascript
runSubagent({
  prompt: "/create-github-issues PRD_FILE='[prdFile]' DRY_RUN=false\n\nAnalyze PRD and create 1-5 GitHub issues.\nReturn JSON: { status, issuesCreated, issues: [...] }",
  description: "Stage: Create GitHub Issues"
})
```

### Status File Update

After stage completes, the pipeline status is updated:

```json
{
  "stages": {
    "create-issues": {
      "status": "completed",
      "output": {
        "issuesCreated": 2,
        "issues": [...]
      }
    }
  },
  "githubIssues": [...]
}
```

## Version History

### v2.0 (Current) - PRD-Based with Multi-Issue Support

| Feature | Description |
| --- | --- |
| Multiple issues | Agent-driven 1-5 issues per PRD |
| Zero internal refs | No PRD IDs, task IDs, or file paths exposed |
| Template support | Uses repository issue templates when available |
| Bug/feature types | Separate issue types with appropriate labels |
| Structured content | Context, Problem, Expected, Why, Proposal, Criteria |

### v1.0 (Previous) - Single Issue

| Aspect | v1.0 Behavior |
| --- | --- |
| Issues per PRD | 1 (single issue) |
| Title format | `[008] Feature Name` (exposed PRD ID - fixed in v2.0) |
| Labels | `feature`, `prd-008` (exposed internal PRD ID - removed in v2.0) |
| Template support | None |

### Migration

No migration needed - v2.0 is backward compatible. Existing pipelines will automatically use new behavior.
