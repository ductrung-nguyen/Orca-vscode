# Feedback File Management Reference

## Overview
Each refinement stage (e.g., `create-prd`, `generate-plan`, `implement`) can go through multiple iterations. Feedback files are tracked in the pipeline status under `stage.refinement.feedback[]`.

## Typical Workflow

1. **Validator writes feedback** → creates feedback file (e.g., `create-prd-feedback-1.md`)
2. **Validator records result** → `record_refinement.py` adds entry to `stage.refinement.feedback[]`
3. **Creator retrieves feedback** → reads feedback file to fix issues
4. **Loop continues** → until validation passes or max attempts reached

## Getting Feedback for Current Iteration

### Get Latest Feedback (Most Common)
```bash
# Returns feedback from the most recent validation attempt
python <SKILL_FOLDER>/scripts/get_feedback_file.py \
  --pipeline-id 001-user-auth \
  --stage create-prd \
  --format path
```

**Output:** `/path/to/.tot-docs/pipeline-status/001-user-auth/create-prd-feedback-3.md`

Use this when starting a refinement iteration to see what needs to be fixed.

### Get Feedback for Specific Attempt
```bash
# Returns feedback from attempt 2 specifically
python <SKILL_FOLDER>/scripts/get_feedback_file.py \
  --pipeline-id 001-user-auth \
  --stage create-prd \
  --attempt 2 \
  --format path
```

**Output:** `/path/to/.tot-docs/pipeline-status/001-user-auth/create-prd-feedback-2.md`

Use this when debugging or reviewing historical feedback.

### Generate Feedback Path (Before Recording)
```bash
# Get the path where feedback SHOULD be written for next attempt (auto-calculates)
python <SKILL_FOLDER>/scripts/get_feedback_file_for_attempt.py \
  --pipeline-id 001-user-auth \
  --stage create-prd \
  --format path
```

**Output:** `/path/to/.tot-docs/pipeline-status/001-user-auth/create-prd-feedback-3.md`

Use this in validator agents BEFORE writing feedback (to know where to write).

**Note:** If refinement.attempt = 2, this auto-returns path for attempt 3. You can override with `--attempt N` if needed.

## Output Formats

### `--format path` (Default for scripts)
Returns absolute path only. Best for piping to other commands.
```bash
FEEDBACK_PATH=$(python <SKILL_FOLDER>/scripts/get_feedback_file.py \
  --pipeline-id $PIPELINE_ID --stage create-prd --format path)
cat "$FEEDBACK_PATH"
```

### `--format json` (For programmatic use)
Returns structured JSON with all details:
```json
{
  "stage": "create-prd",
  "attempt": 3,
  "file": "create-prd-feedback-3.md",
  "absolutePath": "/path/to/create-prd-feedback-3.md",
  "result": "failed",
  "model": "tot.prd-validator",
  "exists": true
}
```

### `--format human` (For debugging)
Human-readable output:
```
Feedback file for 'create-prd' attempt 3:
  Relative: create-prd-feedback-3.md
  Absolute: /path/to/create-prd-feedback-3.md
  Result: failed
  Model: tot.prd-validator
```

## Common Usage Patterns

### In Refine Loop (Coordinator Agent)
```bash
# Check if we should continue looping
LOOP_STATUS=$(python <SKILL_FOLDER>/scripts/check_loop.py \
  --pipeline-id $PIPELINE_ID --stage create-prd)

if [ "$LOOP_STATUS" == "CONTINUE" ]; then
    # Get latest feedback for creator to fix
    FEEDBACK_PATH=$(python <SKILL_FOLDER>/scripts/get_feedback_file.py \
      --pipeline-id $PIPELINE_ID --stage create-prd --format path)
    
    # Pass to creator agent
    runSubagent tot.prd-creator \
      "MODE=refine FEEDBACK_FILE=$FEEDBACK_PATH ..."
fi
```

### In Validator Agent
```bash
# Get path where we should write feedback (auto-calculates next attempt)
FEEDBACK_PATH=$(python <SKILL_FOLDER>/scripts/get_feedback_file_for_attempt.py \
  --pipeline-id $PIPELINE_ID --stage create-prd --format path)

# Write feedback
echo "## Issues Found\n- Missing acceptance criteria" > "$FEEDBACK_PATH"

# Record the feedback
python <SKILL_FOLDER>/scripts/record_refinement.py \
  --pipeline-id $PIPELINE_ID \
  --stage create-prd \
  --result failed \
  --feedback-file "$(basename "$FEEDBACK_PATH")"
```

## Feedback File Naming Convention
- Pattern: `{stage-name}-feedback-{attempt}.md`
- Examples:
  - `create-prd-feedback-1.md` → First validation
  - `generate-plan-feedback-2.md` → Second validation
  - `implement-feedback-3.md` → Third validation

## Storage Location
Feedback files are stored alongside the pipeline status file:
```
.tot-docs/pipeline-status/001-user-auth/
├── status.json
├── create-prd-feedback-1.md
├── create-prd-feedback-2.md
└── generate-plan-feedback-1.md
```

## Error Handling

**Stage not found:**
```json
{"error": "Stage 'create-prd' not found", "code": "VALIDATION_ERROR"}
```

**No feedback recorded:**
```json
{"error": "No feedback recorded for stage 'create-prd'", "code": "VALIDATION_ERROR"}
```

**Attempt not found:**
```json
{"error": "Attempt 5 not found (max: 3)", "code": "VALIDATION_ERROR"}
```
