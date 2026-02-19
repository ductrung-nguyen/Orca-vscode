---
name: handle-pr-feedback
description: Fetch and process PR feedback (reviews and comments) for adjudication and remediation. Use this skill when (1) fetching PR review comments, (2) processing reviewer feedback, (3) replying to PR comments, (4) normalizing feedback from different sources, (5) automating PR feedback handling workflows, (6) requesting re-reviews from GitHub Copilot, or (7) watching PRs for new feedback.
---

# Handle PR Feedback Skill

Provides deterministic operations for fetching, normalizing, replying to PR feedback, requesting reviews, and watching for new feedback.

## Available Scripts

**All scripts are located in `.github/skills/handle-pr-feedback/scripts/`**

| Script | Purpose | Key Use Cases |
|--------|---------|---------------|
| **fetch-pr-feedback.py** | Fetch all PR feedback | Get reviews, inline comments, general comments |
| **reply-to-comment.py** | Reply to PR comments | Post replies to inline/general comments |
| **resolve-thread.py** | Resolve review threads | Mark threads as resolved after fixes |
| **request-review.py** | Request reviewer | Request Copilot or user re-review |
| **watch-pr-feedback.py** | Watch for new feedback | Monitor PR in feedback loops |

**IMPORTANT:** Always use these existing scripts. Never create new scripts for these operations.

## Prerequisites

- **GitHub CLI (`gh`)** must be installed and authenticated
- **Python 3.9+** (available on macOS, Linux, Windows)
- Repository access (public or authenticated for private repos)
- For replying to comments: write access to the repository

## Script Documentation

### fetch-pr-feedback.py

Fetches all feedback from a PR (reviews, inline comments, general comments) in a normalized format.

**Usage:**
```bash
python3 ./scripts/fetch-pr-feedback.py <PR_NUMBER> [REPO]
# or
./scripts/fetch-pr-feedback.py <PR_NUMBER> [REPO]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| PR_NUMBER | Yes | Pull request number |
| REPO | No | Repository in `owner/repo` format. Auto-detects if not provided. |

**Output JSON:**
```json
{
  "success": true,
  "prNumber": 123,
  "repo": "owner/repo",
  "feedbackItems": [
    {
      "id": "12345",
      "type": "review",
      "author": "reviewer",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "state": "CHANGES_REQUESTED",
      "body": "Please address these issues...",
      "file": null,
      "line": null,
      "url": "https://github.com/..."
    },
    {
      "id": "23456",
      "type": "inline",
      "author": "reviewer",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "state": null,
      "body": "This could cause a null pointer exception",
      "file": "src/handler.ts",
      "line": 42,
      "url": "https://github.com/..."
    },
    {
      "id": "34567",
      "type": "general",
      "author": "maintainer",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "state": null,
      "body": "Overall looks good, just a few minor issues.",
      "file": null,
      "line": null,
      "url": "https://github.com/..."
    }
  ],
  "summary": {
    "totalItems": 3,
    "reviews": 1,
    "inlineComments": 1,
    "generalComments": 1,
    "authors": ["reviewer", "maintainer"]
  },
  "error": null
}
```

**Feedback Types:**
| Type | Description | Has File/Line? |
|------|-------------|----------------|
| `review` | PR review submission (APPROVE, REQUEST_CHANGES, COMMENT) | No |
| `inline` | Comment on specific line in diff | Yes |
| `general` | General comment on the PR (not tied to code) | No |

**Exit Codes:**
| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | PR not found |
| 3 | API error |

---

### reply-to-comment.py

Replies to an existing PR comment (inline or general).

**Usage:**
```bash
python3 ./scripts/reply-to-comment.py <COMMENT_ID> <COMMENT_TYPE> [OPTIONS]
# or
./scripts/reply-to-comment.py <COMMENT_ID> <COMMENT_TYPE> [OPTIONS]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| COMMENT_ID | Yes | ID of the comment to reply to |
| COMMENT_TYPE | Yes | Type: `inline` or `general` |

**Options:**
| Option | Description |
|--------|-------------|
| `--repo REPO` | Repository in `owner/repo` format |
| `--body TEXT` | Reply body text |
| `--body-file FILE` | Path to file with reply body (recommended for multi-line) |
| `--pr-number NUMBER` | **PR number (REQUIRED for both inline and general comments)** |
| `--dry-run` | Output payload without posting |

**Output JSON:**
```json
{
  "success": true,
  "replyId": "45678",
  "url": "https://github.com/owner/repo/pull/123#discussion_r45678",
  "dryRun": false,
  "error": null
}
```

**Exit Codes:**
| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | API error |

---

### resolve-thread.py

Resolves or unresolves a PR review thread (marks conversation as resolved).

**Usage:**
```bash
python3 ./scripts/resolve-thread.py <THREAD_ID> [OPTIONS]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| THREAD_ID | Yes | GraphQL node ID of the thread (starts with `PRRT_`) |

**Options:**
| Option | Description |
|--------|-------------|
| `--unresolve` | Unresolve the thread instead of resolving |
| `--dry-run` | Output payload without executing |

**Output JSON:**
```json
{
  "success": true,
  "threadId": "PRRT_kwDO...",
  "resolved": true,
  "dryRun": false,
  "error": null
}
```

**Getting Thread IDs:**
Thread IDs are obtained via GraphQL query:
```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes { id isResolved }
        }
      }
    }
  }
' -f owner=OWNER -f repo=REPO -F pr=PR_NUMBER
```

**Exit Codes:**
| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | API error |

---

### request-review.py

Requests a review from a GitHub user (e.g., GitHub Copilot) on a PR.

**Usage:**
```bash
python3 ./scripts/request-review.py <PR_NUMBER> <REVIEWER> [OPTIONS]
# or
./scripts/request-review.py <PR_NUMBER> <REVIEWER> [OPTIONS]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| PR_NUMBER | Yes | Pull request number |
| REVIEWER | Yes | GitHub username to request review from (e.g., `copilot`) |

**Options:**
| Option | Description |
|--------|-------------|
| `--repo REPO` | Repository in `owner/repo` format |
| `--dry-run` | Output payload without posting |

**Output JSON:**
```json
{
  "success": true,
  "prNumber": 123,
  "reviewer": "copilot",
  "repo": "owner/repo",
  "requestedReviewers": ["copilot"],
  "dryRun": false,
  "error": null
}
```

**Exit Codes:**
| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | PR or reviewer not found |
| 3 | API error |

**Common Use Cases:**
```bash
# Request GitHub Copilot to review
python3 ./scripts/request-review.py 123 copilot

# Request a team member
python3 ./scripts/request-review.py 123 team-member --repo owner/repo

# Dry run to preview
python3 ./scripts/request-review.py 123 copilot --dry-run
```

---

### watch-pr-feedback.py

Watches a PR for new feedback with state tracking. Useful for implementing feedback loops.

**Usage:**
```bash
# IMPORTANT: pr_number is the ONLY positional argument
# All other arguments are OPTIONS with flags
python3 ./scripts/watch-pr-feedback.py <PR_NUMBER> [OPTIONS]

# Examples:
python3 ./scripts/watch-pr-feedback.py 66
python3 ./scripts/watch-pr-feedback.py 66 --repo owner/repo --timeout 30
```

> **⚠️ Common Mistake:** Do NOT pass repo as a positional argument!
> - ❌ WRONG: `watch-pr-feedback.py 66 owner/repo`
> - ✅ CORRECT: `watch-pr-feedback.py 66 --repo owner/repo`

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| PR_NUMBER | Yes | Pull request number to watch (ONLY positional argument) |

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `--repo REPO` | auto-detect | Repository in `owner/repo` format |
| `--timeout MINUTES` | 30 | Maximum watch duration |
| `--interval SECONDS` | 60 | Poll interval |
| `--state-file FILE` | none | State persistence file |
| `--no-new-threshold N` | 3 | Stop after N consecutive polls with no new feedback |
| `--once` | false | Check once and exit (no loop) |
| `--detect-copilot` | true | Enable smart Copilot review detection |
| `--no-detect-copilot` | - | Disable Copilot review detection |
| `--min-wait SECONDS` | 60 | Minimum seconds before checking Copilot status |

**Copilot Review Detection:**
By default, the script monitors for Copilot review activity:
- **If Copilot is "reviewing"**: The script **ignores the no-new-threshold** and keeps waiting until Copilot completes or timeout is reached
- **If Copilot is "completed"**: Normal threshold behavior applies
- **If Copilot hasn't started** after `--min-wait` seconds: Exits early with reason `copilot_not_reviewing`

This ensures you don't miss Copilot feedback when a review is actively in progress.

**Output JSON:**
```json
{
  "success": true,
  "prNumber": 123,
  "repo": "owner/repo",
  "hasNewFeedback": true,
  "newFeedbackItems": [
    {
      "id": "12345",
      "type": "inline",
      "author": "copilot",
      "createdAt": "2026-01-06T12:00:00Z",
      "body": "Consider adding error handling here.",
      "file": "src/handler.ts",
      "line": 42
    }
  ],
  "summary": {
    "totalNew": 1,
    "pollCount": 5,
    "elapsedMinutes": 10.5,
    "exitReason": "new_feedback",
    "copilotStatus": "completed"
  },
  "state": {
    "startedAt": "2026-01-06T11:30:00Z",
    "lastProcessedAt": "2026-01-06T12:00:00Z",
    "processedFeedbackIds": ["12345", "23456"],
    "loopIterations": 5
  },
  "error": null
}
```

**Exit Reasons:**
| Reason | Description |
|--------|-------------|
| `new_feedback` | New feedback was detected |
| `timeout` | Watch timeout reached |
| `no_new_threshold` | N consecutive polls with no new feedback |
| `single_poll` | Used `--once` flag |
| `copilot_not_reviewing` | Copilot not reviewing (after min-wait) |

**Exit Codes:**
| Code | Description |
|------|-------------|
| 0 | Success (with or without new feedback) |
| 1 | Invalid arguments |
| 2 | PR not found |
| 3 | API error |
| 4 | State file error (invalid JSON) |

**State File Format:**
```json
{
  "prNumber": 123,
  "repo": "owner/repo",
  "startedAt": "2026-01-06T11:30:00Z",
  "lastProcessedAt": "2026-01-06T12:00:00Z",
  "processedFeedbackIds": ["12345", "23456"],
  "loopIterations": 2
}
```

**Common Use Cases:**
```bash
# Check once for new feedback
python3 ./scripts/watch-pr-feedback.py 123 --once

# Watch for 10 minutes with 30-second intervals
python3 ./scripts/watch-pr-feedback.py 123 --timeout 10 --interval 30

# Explicit repo (when not in git directory)
python3 ./scripts/watch-pr-feedback.py 123 --repo owner/repo

# Resume from previous state
python3 ./scripts/watch-pr-feedback.py 123 --state-file .tmp/watch-state.json

# Watch until 5 consecutive empty polls
python3 ./scripts/watch-pr-feedback.py 123 --no-new-threshold 5

# Disable Copilot detection (poll normally)
python3 ./scripts/watch-pr-feedback.py 123 --no-detect-copilot
```

---

## Common Workflows

### 1. Fetch All PR Feedback

```bash
python3 ./scripts/fetch-pr-feedback.py 123 > feedback.json

# Filter by author using Python (replace AUTHOR_NAME with the actual GitHub username)
python3 - << 'PY'
import json
from pathlib import Path

AUTHOR_NAME = "reviewer"  # Replace with the GitHub username to filter by
data = json.loads(Path("feedback.json").read_text())
filtered = [i for i in data.get("feedbackItems", []) if i.get("author") == AUTHOR_NAME]
print(json.dumps(filtered, indent=2))
PY
```

### 2. Reply to Inline Comment

```bash
# Write reply to file to avoid shell escaping issues
cat > /tmp/reply.txt << 'EOF'
Thanks for catching this! Fixed in the latest commit.

The issue was due to missing null check. I've added:
```ts
if (!user) return null;
```
EOF

python3 ./scripts/reply-to-comment.py 12345 inline \
  --body-file /tmp/reply.txt
```

### 3. Reply to General Comment

```bash
cat > /tmp/reply.txt << 'EOF'
Thanks for the review! I've addressed all the feedback:

- Fixed null pointer in handler.ts
- Added missing tests
- Updated documentation
EOF

python3 ./scripts/reply-to-comment.py 34567 general \
  --pr-number 123 \
  --body-file /tmp/reply.txt
```

### 4. Dry Run Preview

```bash
python3 ./scripts/reply-to-comment.py 12345 inline \
  --body "Acknowledged, will fix." \
  --dry-run
```

### 5. Request Copilot Review

```bash
# Request GitHub Copilot to re-review after pushing fixes
python3 ./scripts/request-review.py 123 copilot
```

### 6. Watch Loop Workflow

```bash
# Initialize state and check for existing feedback
python3 ./scripts/watch-pr-feedback.py 123 --once \
  --state-file .tmp/pr-state.json > initial.json

# Process any initial feedback...

# Start watch loop (polls every 60s for up to 30 minutes)
while true; do
  result=$(python3 ./scripts/watch-pr-feedback.py 123 \
    --timeout 30 --interval 60 \
    --state-file .tmp/pr-state.json)
  
  has_new=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('hasNewFeedback', False))")
  exit_reason=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('summary', {}).get('exitReason', ''))")
  
  if [ "$has_new" = "True" ]; then
    echo "New feedback detected, processing..."
    # Process new feedback items...
    # Push fixes...
    # Request re-review...
    python3 ./scripts/request-review.py 123 copilot
    continue
  fi
  
  if [ "$exit_reason" = "timeout" ] || [ "$exit_reason" = "no_new_threshold" ]; then
    echo "Watch loop complete: $exit_reason"
    break
  fi
done
```

---

## Normalized Feedback Format

All feedback items are normalized to a consistent structure:

```json
{
  "id": "string",           // Unique identifier
  "type": "string",         // "review" | "inline" | "general"
  "author": "string",       // GitHub username
  "createdAt": "string",    // ISO 8601 timestamp
  "updatedAt": "string",    // ISO 8601 timestamp
  "state": "string|null",   // For reviews: "APPROVED", "CHANGES_REQUESTED", "COMMENTED", "PENDING"
  "body": "string",         // Comment content
  "file": "string|null",    // File path (inline comments only)
  "line": "number|null",    // Line number (inline comments only)
  "url": "string"           // Direct link to comment
}
```

This format allows the agent to process all feedback uniformly regardless of source.

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `gh not installed` | GitHub CLI missing | Install: `brew install gh` (macOS) |
| `gh not authenticated` | Not logged in | Run: `gh auth login` |
| `PR not found` | Invalid PR number | Verify PR exists and you have access |
| `API error` | Rate limits or permissions | Check rate limits, verify access |
| `Could not detect repository` | Not in git repo | Provide `--repo` argument |

---

## Integration with Agents

This skill is used by:

- **pr-feedback-handler agent**: Evaluates feedback and determines actions
- **handle-pr-feedback prompt**: Orchestrates the feedback handling workflow

### Agent Usage Example

```markdown
1. Call `fetch-pr-feedback.py {PR_NUMBER}` to get all feedback
2. For each feedback item, determine judgment (VALID/PARTIALLY_VALID/MISGUIDED)
3. For items needing code changes, generate fixes
4. For items needing replies, generate reply content
5. Call `reply-to-comment.py` to post replies (with user confirmation)
```

---

## Troubleshooting

### "Not inside a git repository"

Run the commands from within a git repository, or provide the `REPO` argument explicitly.

### "PR_NUMBER is required for general comment replies"

General comments are at the issue level, so the PR number is needed to post replies. Use `--pr-number`.

### Reply not appearing in thread

For general comments, GitHub doesn't have true threading. The reply appears as a new comment referencing the original. For inline comments, replies appear in the proper thread.

### Empty feedback items

If a PR has no reviews or comments yet, `feedbackItems` will be an empty array. The `summary` will show zero counts.
