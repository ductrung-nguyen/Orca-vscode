# Other Scripts Reference

## Overview
Utility scripts for reading status, managing GitHub integration, and error tracking.

## read_status.py

### Purpose
Read and optionally validate the entire pipeline status file.

### Usage
```bash
python <SKILL_FOLDER>/scripts/read_status.py \
  --pipeline-id $PIPELINE_ID \
  --validate \
  --section stages
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--validate`: Validate schema v3.0 compliance
- `--section stages|tasks|git|all`: Filter output to specific section (default: all)

### Output (Full Status)
```json
{
  "version": "3.0",
  "prdId": "001",
  "featureName": "user-authentication",
  "mode": "feature",
  "currentStageIndex": 3,
  "createdAt": "2026-02-07T10:00:00Z",
  "lastUpdated": "2026-02-07T12:30:00Z",
  "stages": [...],
  "tasks": [...],
  "git": {...},
  "files": {...},
  "errors": []
}
```

### Section Filtering
```bash
# Get only stages
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID --section stages

# Get only tasks
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID --section tasks

# Get git info
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID --section git
```

### Validation Mode
```bash
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID --validate
```

Checks:
- Schema version is 3.0
- Required fields present
- Array structures valid
- Stage/task IDs unique
- Timestamps valid ISO 8601

### Common Queries with jq
```bash
# Get all completed stages
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.stages[] | select(.status=="completed") | .name'

# Check task completion percentage
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.tasks | [.[] | select(.status=="completed")] | length'

# Get current branch
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq -r '.git.branch'
```

## add_github_issue.py

### Purpose
Record GitHub issue information in the pipeline status.

### Usage
```bash
python <SKILL_FOLDER>/scripts/add_github_issue.py \
  --pipeline-id $PIPELINE_ID \
  --number 123 \
  --url "https://github.com/user/repo/issues/123" \
  --title "Implement user authentication"
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--number N` (required): GitHub issue number
- `--url U` (required): Full issue URL
- `--title T` (required): Issue title

### Storage Location
Issues are stored in `status.json` under `files.githubIssues[]`:
```json
{
  "files": {
    "githubIssues": [
      {
        "number": 123,
        "url": "https://github.com/user/repo/issues/123",
        "title": "Implement user authentication",
        "createdAt": "2026-02-07T10:00:00Z"
      }
    ]
  }
}
```

### Use Cases
- Track issues created from PRD
- Link pipeline execution to GitHub tracking
- Reference issues in commits/PRs

### Example Workflow
```bash
# Create GitHub issue
gh issue create --title "Feature: User Auth" --body "..." > issue.txt
ISSUE_NUMBER=$(cat issue.txt | grep -oE '#[0-9]+' | cut -c2-)
ISSUE_URL=$(gh issue view $ISSUE_NUMBER --json url -q .url)

# Record in pipeline
python <SKILL_FOLDER>/scripts/add_github_issue.py \
  --pipeline-id $PIPELINE_ID \
  --number $ISSUE_NUMBER \
  --url "$ISSUE_URL" \
  --title "Feature: User Auth"
```

## update_git_info.py

### Purpose
Update git-related information in the pipeline status.

### Usage
```bash
python <SKILL_FOLDER>/scripts/update_git_info.py \
  --pipeline-id $PIPELINE_ID \
  --branch feat/001-user-auth \
  --pr-number 42
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--branch B`: Git branch name
- `--pr-number N`: Pull request number
- `--pr-url U`: Pull request URL
- `--commit-sha S`: Commit SHA

### Storage
Git info is stored under `git` object:
```json
{
  "git": {
    "enabled": true,
    "branch": "feat/001-user-auth",
    "pullRequest": {
      "number": 42,
      "url": "https://github.com/user/repo/pull/42"
    },
    "lastCommit": "a1b2c3d4"
  }
}
```

### Update Operations
```bash
# Set branch at pipeline start
python <SKILL_FOLDER>/scripts/update_git_info.py \
  --pipeline-id $PIPELINE_ID \
  --branch "feat/001-user-auth"

# Add PR after creation
python <SKILL_FOLDER>/scripts/update_git_info.py \
  --pipeline-id $PIPELINE_ID \
  --pr-number 42 \
  --pr-url "https://github.com/user/repo/pull/42"

# Record final commit
python <SKILL_FOLDER>/scripts/update_git_info.py \
  --pipeline-id $PIPELINE_ID \
  --commit-sha "a1b2c3d4e5f6"
```

### Integration Example
```bash
# Create feature branch
git checkout -b "feat/001-user-auth"
python <SKILL_FOLDER>/scripts/update_git_info.py \
  --pipeline-id $PIPELINE_ID --branch "$(git branch --show-current)"

# After implementation
git add . && git commit -m "feat: implement user authentication"
python <SKILL_FOLDER>/scripts/update_git_info.py \
  --pipeline-id $PIPELINE_ID --commit-sha "$(git rev-parse HEAD)"

# Create PR
gh pr create --title "..." --body "..." > pr.txt
PR_NUMBER=$(cat pr.txt | grep -oE '#[0-9]+' | cut -c2-)
python <SKILL_FOLDER>/scripts/update_git_info.py \
  --pipeline-id $PIPELINE_ID --pr-number $PR_NUMBER
```

## add_error.py

### Purpose
Record errors and failures in the pipeline for debugging and reporting.

### Usage
```bash
python <SKILL_FOLDER>/scripts/add_error.py \
  --pipeline-id $PIPELINE_ID \
  --message "Validation failed: Missing acceptance criteria" \
  --stage create-prd
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--message MSG` (required): Error description
- `--stage S`: Stage where error occurred (optional)
- `--severity error|warning`: Error severity (default: error)
- `--code CODE`: Error code (optional, e.g., "VALIDATION_ERROR")

### Storage
Errors are stored in `errors[]` array:
```json
{
  "errors": [
    {
      "message": "Validation failed: Missing acceptance criteria",
      "stage": "create-prd",
      "severity": "error",
      "code": "VALIDATION_ERROR",
      "timestamp": "2026-02-07T10:30:00Z"
    }
  ]
}
```

### Use Cases
- Track pipeline failures
- Debug validation issues
- Generate error reports
- Identify patterns in failures

### Error Recording Pattern
```bash
# In validation scripts
if [ validation fails ]; then
    python <SKILL_FOLDER>/scripts/add_error.py \
      --pipeline-id $PIPELINE_ID \
      --message "PRD validation failed: $REASON" \
      --stage create-prd \
      --code VALIDATION_FAILED
    
    exit 1
fi

# In implementation
if ! python <SKILL_FOLDER>/scripts/update_task.py ...; then
    python <SKILL_FOLDER>/scripts/add_error.py \
      --pipeline-id $PIPELINE_ID \
      --message "Task update failed" \
      --stage implement \
      --severity warning
fi
```

### Retrieving Errors
```bash
# Get all errors
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.errors'

# Get errors for specific stage
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.errors[] | select(.stage=="create-prd")'

# Count errors
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.errors | length'
```

### Error Report Generation
```bash
# Generate error summary
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.errors[] | "\(.timestamp) [\(.severity)] \(.stage): \(.message)"' -r

# Example output:
# 2026-02-07T10:30:00Z [error] create-prd: Validation failed: Missing acceptance criteria
# 2026-02-07T11:15:00Z [warning] implement: Task 2.0 blocked by dependency
```
