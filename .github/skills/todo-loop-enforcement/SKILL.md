---
name: todo-loop-enforcement
description: Enforce TODO list usage for refine-loop coordinators to control iteration flow and prevent premature exits. Use this skill when (1) implementing PRD refine loops, (2) implementing plan refine loops, (3) tracking loop attempts and progress, (4) controlling loop exit conditions, or (5) syncing TODO state with pipeline status.
---

# TODO Loop Enforcement

Enforce TODO list usage for refine-loop coordinators to control iteration flow.

## Core Principle

**CRITICAL:** Loop coordinators MUST use the TODO list to control iteration flow. The TODO list is the ONLY mechanism for determining when to continue or stop the loop.

## When to Use

- `prd-refine-loop` coordinator
- `plan-refine-loop` coordinator
- Any future refine-loop patterns

## TODO List Protocol

### 1. Initialize (First Invocation Only)

```markdown
1. [in-progress] Attempt 1 - Generate/validate PRD
2. [not-started] Attempt 2 - Refine based on feedback (if needed)
3. [not-started] Attempt 3 - Refine based on feedback (if needed)
```

### 2. Mark Attempt In-Progress

**BEFORE** invoking sub-agents, mark current attempt as in-progress.

### 3. Mark Attempt Completed

**AFTER** sub-agents return, mark attempt as completed with outcome.

### 4. Check Exit Condition

**ONLY after updating TODO:**
- If PASS: Mark remaining as skipped, return success
- If max attempts: Return failure
- Otherwise: Continue to next attempt

## Loop Flow Pattern

```javascript
1. Initialize TODO list (first time only)
2. FOR each attempt (1 to MAX_ATTEMPTS):
   a. Mark TODO item as "in-progress"
   b. Invoke creator sub-agent
   c. Invoke validator sub-agent
   d. Mark TODO item as "completed" with outcome
   e. IF result === "PASS": return SUCCESS
   f. IF attempt === MAX_ATTEMPTS: return FAIL
   g. ELSE: continue to next attempt
```

## TODO States

| State         | Meaning                    |
| ------------- | -------------------------- |
| `not-started` | Attempt not yet executed   |
| `in-progress` | Currently executing        |
| `completed`   | Attempt finished           |
| `skipped`     | Not needed (PASS achieved) |

## Anti-Patterns

- ❌ Exiting loop without TODO update
- ❌ Checking exit condition before TODO update
- ❌ Missing MAX_ATTEMPTS check
- ❌ Early exit on first failure

## Integration with Pipeline Status

After TODO update, sync to pipeline status:

```json
{
  "stages": {
    "generate-plan": {
      "status": "completed",
      "output": ".tot-docs/tasks/001-feature.md",
      "planRefinement": {
        "attempts": 3,
        "maxAttempts": 5,
        "history": [
          { "attempt": 1, "result": "FAIL", "issueCount": {...} },
          { "attempt": 2, "result": "FAIL", "issueCount": {...} },
          { "attempt": 3, "result": "PASS", "issueCount": {...} }
        ]
      }
    }
  }
}
```
