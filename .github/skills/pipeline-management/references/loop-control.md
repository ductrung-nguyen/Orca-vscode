# Loop Control Reference

## Overview
Loop control determines when refine loops should continue, exit successfully, or abort due to max attempts. Critical for preventing infinite loops in validation cycles.

## check_loop.py

### Purpose
Determine whether a refinement loop should continue based on stage status and attempt count.

### Usage
```bash
python <SKILL_FOLDER>/scripts/check_loop.py \
  --pipeline-id $PIPELINE_ID \
  --stage create-prd
```

### Output States

#### CONTINUE
Continue the refinement loop (validation failed, attempts remaining).
```
CONTINUE
```

#### DONE
Exit successfully (validation passed).
```
DONE
```

#### MAX_REACHED
Abort loop (max attempts exhausted).
```
MAX_REACHED
```

## Decision Logic

The script checks the latest feedback entry in `stage.refinement.feedback[]`:

1. **No feedback yet** → `CONTINUE` (first iteration)
2. **Latest result is "passed"** → `DONE` (validation successful)
3. **Latest result is "approved"** → `DONE` (human approved)
4. **Attempt < maxAttempts and result is "failed"** → `CONTINUE` (retry)
5. **Attempt >= maxAttempts** → `MAX_REACHED` (give up)

## Common Usage Patterns

### Basic Loop Control
```bash
while true; do
    # Run creator/validator
    # ...
    
    # Check loop status
    LOOP_STATUS=$(python <SKILL_FOLDER>/scripts/check_loop.py \
      --pipeline-id $PIPELINE_ID --stage create-prd)
    
    case "$LOOP_STATUS" in
        DONE)
            echo "Validation passed!"
            break
            ;;
        MAX_REACHED)
            echo "Max attempts reached, aborting"
            exit 1
            ;;
        CONTINUE)
            echo "Continuing refinement..."
            ;;
    esac
done
```

### With Iteration Counter
```bash
ITERATION=0
MAX_ITERATIONS=5

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    
    # Run creation/validation
    # ...
    
    LOOP_STATUS=$(python <SKILL_FOLDER>/scripts/check_loop.py \
      --pipeline-id $PIPELINE_ID --stage create-prd)
    
    if [ "$LOOP_STATUS" == "DONE" ]; then
        echo "Success after $ITERATION iterations"
        break
    elif [ "$LOOP_STATUS" == "MAX_REACHED" ]; then
        echo "Failed after $ITERATION attempts"
        exit 1
    fi
done
```

### In Agent Prompts
```markdown
## Loop Control

After validation, check loop status:

LOOP_STATUS = check_loop.py --pipeline-id {PIPELINE_ID} --stage create-prd

IF LOOP_STATUS == "DONE":
    complete_stage.py and move to next stage

ELSE IF LOOP_STATUS == "MAX_REACHED":
    report failure and exit

ELSE IF LOOP_STATUS == "CONTINUE":
    get_feedback_file.py and pass to creator for refinement
```

## Refinement Limits

Default max attempts: `5` (set in `stage.refinement.maxAttempts`)

### Customizing Max Attempts
You can modify maxAttempts in status.json initialization:
```json
{
  "stages": [
    {
      "name": "create-prd",
      "refinement": {
        "maxAttempts": 3,  // Override default
        "attempt": 0,
        "feedback": []
      }
    }
  ]
}
```

## Exit Codes

- `0`: Successfully determined state (check stdout for result)
- `1`: Error (stage not found, invalid status file)

## Integration with Feedback Recording

The loop controller works in tandem with feedback recording:

```bash
# 1. Validator writes feedback
python <SKILL_FOLDER>/scripts/record_refinement.py \
  --pipeline-id $PIPELINE_ID \
  --stage create-prd \
  --result failed \
  --feedback-file create-prd-feedback-2.md

# 2. Loop controller checks if we should continue
LOOP_STATUS=$(python <SKILL_FOLDER>/scripts/check_loop.py \
  --pipeline-id $PIPELINE_ID --stage create-prd)

# Output: CONTINUE (attempt 2 of 5)
```

## Debugging Loop Issues

### Check Current Refinement State
```bash
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.stages[] | select(.name=="create-prd") | .refinement'
```

Output:
```json
{
  "maxAttempts": 5,
  "attempt": 3,
  "feedback": [
    {"file": "create-prd-feedback-1.md", "result": "failed"},
    {"file": "create-prd-feedback-2.md", "result": "failed"},
    {"file": "create-prd-feedback-3.md", "result": "failed"}
  ]
}
```

### Check Latest Feedback Result
```bash
python <SKILL_FOLDER>/scripts/read_status.py --pipeline-id $PIPELINE_ID | \
  jq '.stages[] | select(.name=="create-prd") | .refinement.feedback[-1].result'
```

## Common Pitfalls

### Infinite Loop Prevention
Always use `check_loop.py` - never implement custom loop logic that ignores max attempts.

**❌ Bad:**
```bash
while true; do
    validate
    if passed; then break; fi  # Missing max attempt check
done
```

**✅ Good:**
```bash
while true; do
    validate
    LOOP_STATUS=$(check_loop.py)
    if [ "$LOOP_STATUS" == "DONE" ]; then break; fi
    if [ "$LOOP_STATUS" == "MAX_REACHED" ]; then exit 1; fi
done
```

### Recording Before Checking
Always record refinement BEFORE checking loop status:

**❌ Bad:**
```bash
LOOP_STATUS=$(check_loop.py)  # Wrong: no feedback recorded yet
record_refinement.py --result failed
```

**✅ Good:**
```bash
record_refinement.py --result failed  # Record first
LOOP_STATUS=$(check_loop.py)          # Then check
```
