---
name: subagent-context-isolation
description: Enforce independent, context-isolated sub-agent invocations in refine-loop patterns to ensure unbiased validation. Use this skill when (1) coordinating PRD refine loops, (2) coordinating plan refine loops, (3) invoking creator and validator sub-agents, (4) ensuring unbiased artifact validation, or (5) implementing file-based communication between agents.
---

# Subagent Context Isolation

Enforce independent, context-isolated sub-agent invocations for unbiased validation.

## Core Principle

**CRITICAL:** In refine-loop patterns, creator and validator sub-agents MUST be completely independent. The validator has NO knowledge of the creator's reasoning, only the artifact itself.

## Why Context Isolation Matters

| With Isolation               | Without Isolation                           |
| ---------------------------- | ------------------------------------------- |
| Validator sees only artifact | Validator influenced by creator's reasoning |
| Unbiased critique            | Confirmation bias                           |
| Catches actual issues        | Misses issues creator justified             |

## Invocation Protocol

### 1. Creator Sub-agent
**Context:** Full discovery/requirements + template

### 2. Validator Sub-agent (Independent)
**Context:** ONLY the artifact (PRD/Plan file) + requirements reference

```javascript
// Validator: ONLY artifact + requirements
@agent prd-validator
PRD_FILE: .tot-docs/prd/001-feature.md

// NO access to:
// - Creator's reasoning
// - Creator's chat history
// - Creator's todo list
```

### 3. Creator Sub-agent (Refinement)
**Context:** Artifact + Validator feedback ONLY

## File-Based Communication

**RULE:** Sub-agents communicate ONLY through files, never through shared memory/context.

| Artifact      | Who Reads           | Who Writes  |
| ------------- | ------------------- | ----------- |
| PRD file      | Validator, Planner  | Creator     |
| Feedback file | Creator (refine)    | Validator   |
| Plan file     | Validator, Executor | Planner     |
| Status file   | All                 | Coordinator |

## Anti-Patterns

- ❌ Passing coordinator context to sub-agents
- ❌ Validator sees creator's reasoning
- ❌ Reusing same agent session
- ❌ Feedback loop contamination

## Validation Loop Isolation

During parent task completion in `process-task-list`, a validation loop runs with strict isolation:

### Validation SubAgent
**Context:** ONLY staged changes + lint/test commands
**NO Access To:**
- Implementation task details
- Why code was written this way
- Previous validation attempts

```javascript
// Validation SubAgent receives ONLY:
runSubagent({
  prompt: "Review staged changes: `git diff --cached`",
  // NO task context, NO PRD, NO previous reasoning
})
```

### Remediation SubAgent
**Context:** ONLY validation failures + file paths
**NO Access To:**
- Original implementation reasoning
- Why validation failed previously
- Task acceptance criteria

```javascript
// Remediation SubAgent receives ONLY:
runSubagent({
  prompt: "Fix issues: [list from validation]",
  // NO implementation context, NO validation logic
})
```

### Why This Matters

| With Isolation            | Without Isolation            |
| ------------------------- | ---------------------------- |
| Finds real issues         | Overlooks "intentional" issues |
| Unbiased fixes            | Confirmation bias            |
| Complete remediation      | Partial fixes                |

### Isolation Rules Table

| SubAgent           | Receives ✅                                       | Does NOT Receive ❌                              |
| ------------------ | ------------------------------------------------ | ----------------------------------------------- |
| **Implementation** | Task detail file, files to modify, 1 pattern example | Full PRD, other tasks, previous implementation |
| **Validation**     | Staged diff (`git diff --cached`), lint/test commands | Implementation reasoning, task context, why changes made |
| **Remediation**    | Validation failures list, file paths with issues | Implementation intent, validation logic, previous fixes |

### Enforcement Checklist

Before invoking each SubAgent, verify:

- [ ] **Implementation:** Only sees its own task detail file
- [ ] **Validation:** Cannot infer why code was written
- [ ] **Remediation:** Cannot see original task or validation reasoning
- [ ] **All:** No shared context between invocations

## Verification Questions

Before invoking a sub-agent:
1. Does this sub-agent see ONLY its required inputs?
2. Could this sub-agent be influenced by previous agents?
3. Can I explain the input in one sentence?
