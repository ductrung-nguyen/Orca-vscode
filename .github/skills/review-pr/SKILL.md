---
name: review-pr
description: Fetch PR context and post code reviews with inline comments. Use this skill when (1) reviewing a pull request, (2) fetching PR metadata and diff, (3) posting review comments to a PR, (4) providing structured code review feedback, or (5) automating PR review workflows.
---

# Review PR Skill

Provides deterministic operations for fetching PR context and posting reviews to GitHub PRs.

## Prerequisites

- **GitHub CLI (`gh`)** must be installed and authenticated
- **Python 3.9+** (available on macOS, Linux, Windows)
- Repository access (public or authenticated for private repos)
- For posting reviews: write access to the repository

## Scripts

### validate-gh-auth.py

Validates GitHub CLI installation and authentication status.

**Usage:**
```bash
python3 ./scripts/validate-gh-auth.py [REPO]
# or
./scripts/validate-gh-auth.py [REPO]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| REPO | No | Repository in `owner/repo` format. Auto-detects from git remote if not provided. |

**Output JSON:**
```json
{
  "authenticated": true,
  "repo": "owner/repo",
  "user": "username",
  "error": null
}
```

**Exit Codes:**
| Code | Description |
|------|-------------|
| 0 | Success - authenticated and repo detected |
| 1 | gh CLI not installed |
| 2 | gh CLI not authenticated |
| 3 | Not a git repository or no GitHub remote |

---

### fetch-pr-context.py

Fetches PR metadata, changed files list, and full diff.

**Usage:**
```bash
python3 ./scripts/fetch-pr-context.py <PR_NUMBER> [REPO]
# or
./scripts/fetch-pr-context.py <PR_NUMBER> [REPO]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| PR_NUMBER | Yes | Pull request number to fetch |
| REPO | No | Repository in `owner/repo` format. Auto-detects if not provided. |

**Output JSON:**
```json
{
  "success": true,
  "pr": {
    "number": 123,
    "title": "feat: Add new feature",
    "body": "PR description...",
    "state": "OPEN",
    "author": "username",
    "baseRef": "main",
    "headRef": "feat/feature-branch",
    "headSha": "abc123def456...",
    "url": "https://github.com/owner/repo/pull/123",
    "isDraft": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T12:00:00Z"
  },
  "files": [
    {
      "path": "src/feature.ts",
      "additions": 50,
      "deletions": 10,
      "status": "modified"
    }
  ],
  "diff": "diff --git a/...",
  "error": null
}
```

**Exit Codes:**
| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | PR not found |
| 3 | API error |

---

### post-review.py

Submits a PR review with optional inline comments.

**Usage:**
```bash
python3 ./scripts/post-review.py <PR_NUMBER> <EVENT> [OPTIONS]
# or
./scripts/post-review.py <PR_NUMBER> <EVENT> [OPTIONS]
```

**Arguments:**
| Argument | Required | Description |
|----------|----------|-------------|
| PR_NUMBER | Yes | Pull request number |
| EVENT | Yes | Review event: `COMMENT`, `APPROVE`, or `REQUEST_CHANGES` |

**Options:**
| Option | Description |
|--------|-------------|
| `--repo REPO` | Repository in `owner/repo` format |
| `--body TEXT` | Review body text |
| `--body-file FILE` | Path to file containing review body (recommended for multi-line) |
| `--comments-file FILE` | Path to JSON file with inline comments |
| `--dry-run` | Output payload without posting |
| `--max-comments N` | Maximum inline comments (default: 10) |

**Inline Comments JSON Format:**
```json
[
  {
    "path": "src/feature.ts",
    "line": 42,
    "body": "Consider using a constant here for better maintainability."
  },
  {
    "path": "src/utils.ts",
    "line": 15,
    "body": "This could cause a null pointer exception."
  }
]
```

**Output JSON:**
```json
{
  "success": true,
  "reviewId": "12345678",
  "url": "https://github.com/owner/repo/pull/123#pullrequestreview-12345678",
  "commentsPosted": 5,
  "commentsCapped": false,
  "dryRun": false,
  "error": null
}
```

**Dry Run Output:**
```json
{
  "success": true,
  "dryRun": true,
  "payload": { ... },
  "repo": "owner/repo",
  "prNumber": 123,
  "commentsCount": 5,
  "commentsCapped": false,
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

## Common Workflows

### 1. Review a PR (Dry Run Preview)

```bash
# Validate auth
python3 ./scripts/validate-gh-auth.py

# Fetch PR context
python3 ./scripts/fetch-pr-context.py 123 > pr-context.json

# Analyze diff and prepare review (done by agent)
# ...

# Post review in dry-run mode
python3 ./scripts/post-review.py 123 COMMENT \
  --body-file review-body.txt \
  --comments-file inline-comments.json \
  --dry-run
```

### 2. Approve a PR

```bash
python3 ./scripts/post-review.py 123 APPROVE \
  --body "LGTM! Great work on this feature."
```

### 3. Request Changes

```bash
# Write review body to file
cat > /tmp/review-body.txt << 'EOF'
## Review Summary

Found a few issues that need to be addressed before merging.

### Security Concerns
- SQL injection vulnerability in user input handling

### Performance
- Consider adding pagination for large result sets
EOF

# Write inline comments
cat > /tmp/comments.json << 'EOF'
[
  {"path": "src/db.ts", "line": 45, "body": "🔴 SQL injection risk. Use parameterized queries."},
  {"path": "src/api.ts", "line": 120, "body": "⚠️ This endpoint returns all records. Add pagination."}
]
EOF

# Post review
python3 ./scripts/post-review.py 123 REQUEST_CHANGES \
  --body-file /tmp/review-body.txt \
  --comments-file /tmp/comments.json
```

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `gh not installed` | GitHub CLI missing | Install: `brew install gh` (macOS) |
| `gh not authenticated` | Not logged in | Run: `gh auth login` |
| `PR not found` | Invalid PR number or no access | Verify PR exists and you have access |
| `API error` | Rate limits or permissions | Check rate limits, verify write access |
| `Invalid comments JSON` | Malformed JSON file | Validate JSON syntax |

---

## Rate Limiting

GitHub API has rate limits. To avoid issues:

1. Use `--max-comments` to cap inline comments (default: 10)
2. Batch reviews instead of posting multiple times
3. Use dry-run mode to preview before posting

---

## Integration with Agents

This skill is used by:

- **pr-reviewer agent**: Fetches context, analyzes code, generates review
- **review-pr prompt**: Orchestrates the review workflow

### Agent Usage Example

```markdown
1. Call `validate-gh-auth.py` to verify prerequisites
2. Call `fetch-pr-context.py {PR_NUMBER}` to get PR data
3. Analyze diff and generate findings
4. Format findings as inline comments JSON
5. Call `post-review.py` with `--dry-run` for preview
6. If user confirms, call `post-review.py` without `--dry-run`
```

---

## Troubleshooting

### "Not inside a git repository"

Run the commands from within a git repository, or provide the `REPO` argument explicitly.

### "Remote is not a GitHub repository"

The origin remote points to a non-GitHub host. Use the `REPO` argument to specify the GitHub repository.

### "Failed to post review: Resource not accessible"

You don't have write access to the repository. Request collaborator access or fork the repo.

### Inline comments not appearing

Ensure the `line` numbers match actual lines in the diff. Comments on lines not in the diff will be silently ignored by GitHub.
