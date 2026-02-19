---
name: task-feedback-reader
description: Parse task feedback files to determine implementation loop exit conditions. Use this skill when (1) checking if a sub-task validation passed, (2) reading feedback for remediation, (3) determining loop continuation, or (4) extracting issues from validation feedback.
---

# Task Feedback Reader

Parse feedback files to control implementation refine loops.

## Feedback File Location

Feedback files are stored in the feature directory:

```
.tot-docs/{prd-id}-{name}/task-{task-id}-feedback.md
```

Example: `.tot-docs/001-user-auth/task-1.1-feedback.md`

## File Format

```markdown
# Task Feedback: {task-id}

**Status:** PASS | FAIL
**Attempt:** {N}/{MAX}
**Timestamp:** {ISO timestamp}

## Summary
{One-line summary}

## Issues (if FAIL)

### Critical
- [ ] {description} - {file:line}

### Warnings
- [ ] {description}

## Suggestions
{Improvement suggestions}

## Sign-Off
✅ APPROVED - Task {task-id} implementation verified
```

## Parsing Protocol

### 1. Read Feedback File

```python
feedback_path = f".tot-docs/{prd_id}-{feature_name}/task-{task_id}-feedback.md"
content = read_file(feedback_path)
```

### 2. Extract Status

```python
# Look for **Status:** line
status_match = re.search(r'\*\*Status:\*\*\s*(PASS|FAIL)', content)
status = status_match.group(1) if status_match else "UNKNOWN"
```

### 3. Check Sign-Off (PASS indicator)

```python
# Sign-off present = definitely PASS
has_signoff = "✅ APPROVED" in content
```

### 4. Count Issues

```python
# Count unchecked items under ## Issues
critical_count = len(re.findall(r'### Critical\n(.*?)(?=###|\n##|$)', content, re.DOTALL))
warning_count = len(re.findall(r'- \[ \]', content))
```

### 5. Return Structured Data

```json
{
  "status": "PASS|FAIL|UNKNOWN",
  "signedOff": true|false,
  "attempt": 2,
  "maxAttempts": 5,
  "issues": {
    "critical": 0,
    "warnings": 0
  },
  "shouldContinue": false
}
```

## Loop Exit Decision

```python
def should_exit_loop(feedback):
    # Exit on PASS
    if feedback["status"] == "PASS" or feedback["signedOff"]:
        return True, "PASS"
    
    # Exit on max attempts
    if feedback["attempt"] >= feedback["maxAttempts"]:
        return True, "MAX_ATTEMPTS"
    
    # Continue loop
    return False, "CONTINUE"
```

## Error Handling

| Scenario | Action |
|----------|--------|
| File not found | Return `status: "UNKNOWN"`, `shouldContinue: true` |
| Malformed file | Log warning, return `status: "UNKNOWN"` |
| Missing status line | Check for sign-off as fallback |

## Usage in impl-refine-loop

```python
# After validator runs
feedback = parse_feedback_file(prd_id, task_id)

if feedback["status"] == "PASS":
    # Exit loop successfully
    return "PASS"
elif feedback["attempt"] >= MAX_ATTEMPTS:
    # Exit loop with failure
    return "FAIL: Max attempts reached"
else:
    # Continue to remediation
    invoke_implementor_for_remediation(feedback)
```
