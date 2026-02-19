---
name: external-validation
description: Protocol for invoking external LLM validation services to provide unbiased critique of PRDs and implementation plans. Use this skill when (1) validating PRDs with an external model, (2) validating implementation plans with fresh perspective, (3) configuring external validator selection, (4) merging internal and external validation feedback, or (5) handling external validation errors.
---

# External Validation

Protocol for invoking external LLM validation to provide unbiased critique of artifacts.

## Core Principle

**WHY External Validation:** Internal validation (same model that created the artifact) can suffer from:
- Model blindness (model won't catch its own mistakes)
- Confirmation bias (validating own reasoning)
- Pattern repetition (same model, same blind spots)

**External validation uses a DIFFERENT model** to provide fresh perspective.

## When to Use External Validation

| Stage          | Artifact            | Required?                |
| -------------- | ------------------- | ------------------------ |
| validate-prd   | PRD                 | Optional but recommended |
| validate-plan  | Implementation Plan | Optional but recommended |
| validate-impl  | Implementation      | Required (code tools)    |

## Model Selection Strategy

**Rule:** External validator MUST be a different model family than the creator.

| Creator Model | Recommended Validator  |
| ------------- | ---------------------- |
| GPT-5.2       | Claude Opus or Gemini  |
| Claude Opus   | GPT-5.2 or Gemini      |
| Claude Sonnet | GPT-5.2 or Gemini      |
| Gemini        | GPT-5.2 or Claude Opus |

## Feedback Merging Protocol

When combining internal and external validation feedback:

1. **Status:** FAIL if either validator fails
2. **Issues:** Combine and deduplicate from both validators
3. **Trust external:** If external finds critical issues internal missed

## Status File Integration

```json
{
  "stages": {
    "validate-prd": {
      "status": "completed",
      "output": "PRD validated",
      "validator": "internal + gemini-3.0-pro"
    }
  },
  "externalValidation": {
    "prdValidation": {
      "status": "completed",
      "model": "gemini-3.0-pro",
      "result": "PASS",
      "issues": 0
    }
  }
}
```

## Error Handling

If external service is unavailable:
- Fall back to internal validation only
- Record skipped status with reason
- Continue pipeline with warning

## Anti-Patterns

- ❌ Using same model for external validation
- ❌ Skipping external validation on complex PRDs
- ❌ Ignoring external feedback when internal passes

## Environment Variables

```bash
EXTERNAL_VALIDATE=true              # Enable external validation
EXTERNAL_VALIDATION_MODEL="gemini-3.0-pro"  # Model to use
EXTERNAL_VALIDATION_TIMEOUT=30000   # 30 seconds
```
