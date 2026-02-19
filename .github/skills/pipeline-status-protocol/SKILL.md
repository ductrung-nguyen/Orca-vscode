---
name: pipeline-status-protocol
description: Define the standard protocol for reading/writing PRD pipeline status files across all stages. Use this skill when (1) updating pipeline status after stage completion, (2) initializing a new pipeline status file, (3) tracking task progress during implementation, (4) handling stage failures and errors, or (5) resuming a pipeline from a specific stage.
---

# Pipeline Status Protocol

Standard protocol for reading/writing PRD pipeline status files across all stages.

## Status File Location

Each feature/bug gets its own folder with isolated files:

```
.tot-docs/{prd-id}-{feature-name}/status.json
```

Example: `.tot-docs/001-user-auth/status.json`

## Schema Version

Current schema version: **2.1** (feature-based folder structure)

## Stage Keys

| Stage Key       | Description                      | Previous ID |
| --------------- | -------------------------------- | ----------- |
| `discover`      | Requirements discovery           | 1           |
| `create-prd`    | PRD creation                     | 2           |
| `validate-prd`  | PRD validation gate              | 3           |
| `generate-plan` | Task plan generation             | 4           |
| `validate-plan` | Plan validation gate             | 5           |
| `create-issues` | GitHub issue creation (optional) | N/A         |
| `implement`     | Task implementation              | 6           |
| `validate-impl` | Implementation validation        | 7           |
| `finalize`      | Release finalization             | 8           |
| `create-pr`     | Pull request creation (optional) | N/A         |

## Status File Structure

```json
{
  "schemaVersion": "2.1",
  "prdId": "001",
  "featureName": "user-auth",
  "featureDir": ".tot-docs/001-user-auth",
  "started": "2024-12-23T10:00:00Z",
  "mode": "feature",
  "currentStage": "implement",
  "prdFile": ".tot-docs/001-user-auth/prd.md",
  "taskFile": ".tot-docs/001-user-auth/tasks.md",
  "requirementsDir": ".tot-docs/001-user-auth/requirements",
  "stages": {
    "discover": { "status": "completed", "output": ".tot-docs/001-user-auth/requirements" },
    "create-prd": { "status": "completed", "output": ".tot-docs/001-user-auth/prd.md" },
    "validate-prd": { "status": "completed", "output": "PASS" },
    "generate-plan": { "status": "completed", "output": ".tot-docs/001-user-auth/tasks.md" },
    "validate-plan": { "status": "completed", "output": "PASS" },
    "create-issues": { "status": "completed", "output": { "issuesCreated": 5, "issuesSkipped": 0, "issuesFailed": 0 } },
    "implement": { "status": "in-progress", "output": null },
    "validate-impl": { "status": "pending", "output": null },
    "finalize": { "status": "pending", "output": null },
    "create-pr": { "status": "pending", "output": null }
  },
  "lastUpdated": "2024-12-23T10:15:00Z"
}
```

## Status Values

- `"pending"` - Not started yet
- `"in-progress"` - Currently executing
- `"completed"` - Finished successfully
- `"failed"` - Failed (check errors array)
- `"skipped"` - Skipped (e.g., discovery in feature mode)

## Update Protocol

**CRITICAL:** After EACH stage completes, update the status file BEFORE proceeding:

1. Read current pipeline status file
2. Update current stage: `{ "status": "completed", "output": "[actual output path]" }`
3. Update next stage: `{ "status": "in-progress", "output": null }`
4. Update `"currentStage"` to next stage key
5. Update `"lastUpdated"` timestamp
6. Write the updated JSON back to file
7. THEN proceed to next stage

## Task Tracking (implement stage)

Track individual task progress in the `tasks` field:

```json
{
  "tasks": {
    "1.0": { "status": "completed", "title": "Setup Project", "type": "parent", "completedAt": "..." },
    "1.1": { "status": "completed", "title": "Create package.json", "type": "sub", "parent": "1.0" },
    "1.2": { "status": "in-progress", "title": "Setup TypeScript", "type": "sub", "parent": "1.0" }
  }
}
```

## Create-Issues Stage Output

The `create-issues` stage has a structured output format:

### Completed (success)

```json
{
  "status": "completed",
  "output": {
    "issuesCreated": 5,
    "issuesSkipped": 2,
    "issuesFailed": 0,
    "issues": [
      { "taskId": "1.0", "number": 42, "url": "https://github.com/owner/repo/issues/42" }
    ]
  }
}
```

### Skipped

```json
{
  "status": "skipped",
  "output": "Not a GitHub repository"
}
```

Common skip reasons:
- `"Not a GitHub repository"`
- `"CREATE_ISSUES=false"`
- `"GitHub CLI (gh) not installed"`
- `"GitHub CLI not authenticated"`
- `"Remote is not GitHub"`

### Failed

```json
{
  "status": "failed",
  "output": "Plan file not found: .tot-docs/tasks/missing.md"
}
```

**Note:** The `create-issues` stage is non-blocking. Even if it fails, the pipeline continues to the `implement` stage.

## Create-PR Stage Output

The `create-pr` stage has a structured output format for PR creation at the end of the finalize stage.

### Completed (success)

```json
{
  "status": "completed",
  "output": {
    "prUrl": "https://github.com/owner/repo/pull/123"
  }
}
```

### Skipped

```json
{
  "status": "skipped",
  "output": {
    "reason": "User declined",
    "manualUrl": "https://github.com/owner/repo/compare/main...feat/001-feature"
  }
}
```

Common skip reasons:
- `"Not a git repository"`
- `"No origin remote configured"`
- `"Remote is not GitHub"`
- `"Cannot create PR from main branch"`
- `"Cannot create PR from master branch"`
- `"Detached HEAD state"`
- `"GitHub CLI (gh) not installed"`
- `"GitHub CLI not authenticated"`
- `"User declined"`
- `"PR creation failed: {error}"`

**Note:** The `create-pr` stage is:
- **Always interactive** - `AUTO_ANSWER` variable is ignored
- **Non-blocking** - failures/skips do not block pipeline completion
- **GitHub-only** - only applies to GitHub-hosted repositories

## When to Use This Skill

- Initializing a new pipeline status file
- Updating stage status after completion
- Tracking task progress during implementation
- Handling stage failures and recording errors
- Resuming a pipeline from a specific stage
