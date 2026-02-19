# Stage Management Reference

## Overview
Stages represent major phases in the pipeline (e.g., `create-prd`, `generate-plan`, `implement`). These scripts manage stage lifecycle, status updates, and progression.

## get_current_stage.py

### Purpose
Returns the currently active stage in the pipeline.

### Usage
```bash
python <SKILL_FOLDER>/scripts/get_current_stage.py \
  --pipeline-id 001-auth \
  --format json
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--format json|name`: Output format (default: json)

### Output Formats

**JSON format:**
```json
{
  "name": "generate-plan",
  "status": "in-progress",
  "agent": "tot.plan-generator",
  "index": 3,
  "refinement": {
    "attempt": 2,
    "maxAttempts": 5
  }
}
```

**Name format:**
```
generate-plan
```

### Common Usage
```bash
# Get stage name only
STAGE=$(python <SKILL_FOLDER>/scripts/get_current_stage.py --pipeline-id $PIPELINE_ID --format name)

# Get full stage details
STAGE_DATA=$(python <SKILL_FOLDER>/scripts/get_current_stage.py --pipeline-id $PIPELINE_ID)
```

## get_stage_status.py

### Purpose
Get status of a specific stage (not necessarily the current one).

### Usage
```bash
python <SKILL_FOLDER>/scripts/get_stage_status.py \
  --pipeline-id $PIPELINE_ID \
  --stage create-prd
```

### Output
```json
{
  "name": "create-prd",
  "status": "completed",
  "agent": "tot.prd-creator",
  "output": ".tot-docs/prd/001-user-auth.md",
  "startedAt": "2026-02-07T10:00:00Z",
  "completedAt": "2026-02-07T10:15:00Z",
  "refinement": {
    "attempt": 3,
    "maxAttempts": 5,
    "feedback": [...]
  }
}
```

### Use Cases
- Check if prerequisite stage completed
- Get output file from previous stage
- Review refinement history

## update_stage.py

### Purpose
Update stage status and optional metadata.

### Usage
```bash
python <SKILL_FOLDER>/scripts/update_stage.py \
  --pipeline-id $PIPELINE_ID \
  --stage create-prd \
  --status in-progress \
  --agent tot.prd-creator
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--stage STAGE` (required): Stage name
- `--status STATUS` (required): New status
  - `not-started`: Initial state
  - `in-progress`: Currently running
  - `completed`: Successfully finished
  - `failed`: Error occurred
  - `skipped`: Intentionally bypassed
- `--agent AGENT`: Agent name executing the stage

### Behavior
- Sets `startedAt` timestamp on first in-progress
- Sets `completedAt` timestamp on completion
- Updates `lastUpdated` in root

### Common Patterns
```bash
# Start a stage
python <SKILL_FOLDER>/scripts/update_stage.py \
  --pipeline-id $PIPELINE_ID --stage generate-plan --status in-progress --agent tot.plan-generator

# Mark failed
python <SKILL_FOLDER>/scripts/update_stage.py \
  --pipeline-id $PIPELINE_ID --stage generate-plan --status failed
```

## complete_stage.py

### Purpose
Mark stage as completed AND advance to next stage automatically.

### Usage
```bash
python <SKILL_FOLDER>/scripts/complete_stage.py \
  --pipeline-id $PIPELINE_ID \
  --stage create-prd \
  --output .tot-docs/prd/001-user-auth.md \
  --agent tot.prd-creator
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--stage STAGE` (required): Stage to complete
- `--output TEXT`: Output file/text from stage
- `--agent AGENT`: Agent that completed the stage

### Behavior
1. Sets stage status to `completed`
2. Records `completedAt` timestamp
3. Stores output path in stage
4. Advances `currentStageIndex` to next stage
5. Returns next stage info

### Output
```json
{
  "success": true,
  "completedStage": "create-prd",
  "nextStage": {
    "name": "create-issues",
    "status": "not-started"
  }
}
```

### When to Use
Use `complete_stage.py` instead of `update_stage.py` when:
- Stage successfully finished
- Ready to move to next stage
- Need to know what comes next

## reset_stage.py

### Purpose
Reset a stage back to `not-started` state.

### Usage
```bash
python <SKILL_FOLDER>/scripts/reset_stage.py \
  --pipeline-id $PIPELINE_ID \
  --stage generate-plan \
  --clear-refinement
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--stage STAGE` (required): Stage to reset
- `--clear-refinement`: Also clear refinement history

### Behavior
- Sets status to `not-started`
- Clears timestamps (startedAt, completedAt)
- Optionally clears refinement data
- Keeps stage in array (doesn't delete)

### Use Cases
- Retry failed stage from scratch
- Debug stage execution
- Manual pipeline manipulation

## update_stage_data.py

### Purpose
Update arbitrary data fields within a stage.

### Usage
```bash
python <SKILL_FOLDER>/scripts/update_stage_data.py \
  --pipeline-id $PIPELINE_ID \
  --stage create-prd \
  --key issuesCreated \
  --value 3
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--stage STAGE` (required): Stage name
- `--key KEY` (required): Data field key
- `--value VALUE` (required): Data value (auto-converted to int/bool/string)

### Use Cases
- Store custom metadata
- Track stage-specific metrics
- Pass data between stages

### Example
```bash
# Store custom data
python <SKILL_FOLDER>/scripts/update_stage_data.py \
  --pipeline-id $PIPELINE_ID --stage implement --key testsAdded --value 45

# Retrieve later
STAGE_DATA=$(python <SKILL_FOLDER>/scripts/get_stage_status.py --pipeline-id $PIPELINE_ID --stage implement)
TESTS=$(echo "$STAGE_DATA" | jq -r '.data.testsAdded')
```
