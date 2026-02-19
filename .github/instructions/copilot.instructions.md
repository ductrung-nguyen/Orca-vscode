---
description: Global instructions for GitHub Copilot when working in this workspace.
applyTo: "**"
---

# GitHub Copilot Instructions

This file provides global instructions for GitHub Copilot when working in this workspace.

## Workspace Overview

This workspace contains prompt templates for an automated idea-to-software pipeline. The prompts guide AI agents through a structured development workflow.

## Prompt System

### Available Prompts

| Prompt                              | Purpose                   | When to Use                            |
| ----------------------------------- | ------------------------- | -------------------------------------- |
| `orchestrator.prompt.md`            | Master orchestrator       | Start here for full automation         |
| `git-repo-init.prompt.md`           | Git/GitHub setup          | MODE=full before feature branch        |
| `feature-explorer.prompt.md`        | Feature exploration       | Complex features, new software         |
| `create-prd.prompt.md`              | PRD creation              | After discovery or for simple features |
| `validate-prd.prompt.md`            | PRD validation            | Before planning                        |
| `generate-plan.prompt.md`           | Task breakdown            | After PRD validation                   |
| `process-task-list.prompt.md`       | Implementation            | Execute tasks                          |
| `validate-implementation.prompt.md` | Implementation validation | After all tasks complete               |
| `finalize-release.prompt.md`        | Release preparation       | Final stage                            |
| `feedback-copilot.prompt.md`        | Review any artifact       | Any stage                              |

### Two Main Flows

**1. Full Software Pipeline (New Project)**

```
orchestrator → [git-repo-init] → feature-explorer → create-prd → validate-prd → generate-plan → process-task-list → validate-implementation → finalize-release
```

**2. Feature Addition Pipeline (Existing Project)**

```
orchestrator → [feature-explorer (optional)] → create-prd → validate-prd → generate-plan → process-task-list → validate-implementation → finalize-release
```

Note: `git-repo-init` only runs in MODE=full (new projects) to set up git repository, GitHub Actions CI, semantic-release, and conventional commits.

Discovery levels for features:

- `$DISCOVERY=full` - Same as new software (all phases)
- `$DISCOVERY=light` - Codebase scan only (default for features)
- `$DISCOVERY=skip` - No discovery (simple features)

### Multi-Language Support

The pipeline supports any language:

- `$LANGUAGE` variable controls output language
- Auto-detects from user input if not specified
- All artifacts (PRD, tasks, specs) use the same language

## Agent Guidelines

### Commands in terminal
Never run commands that have long content directly in terminal. Always write the content to a file (without using terminal) and use the file in the command.

### Using runSubagent

When executing prompts, use `runSubagent` for:

- Each phase within a prompt
- Each task implementation
- Parallel operations when `$PARALLEL=true` and tasks are independent

### Context Isolation (Critical for Accuracy)

**Problem:** Context leaking causes inaccurate implementations.

**Solution:** Each task sub-agent receives MINIMAL, FOCUSED context:

| Include ✅                  | Exclude ❌            |
| --------------------------- | --------------------- |
| Task detail file only       | Full PRD              |
| Files to modify (from task) | Entire codebase       |
| 1 pattern example           | Other task details    |
| Task's acceptance criteria  | Previous task outputs |

**Rules:**

- Each `runSubagent` starts fresh (no carried context)
- Task details must be self-contained
- Sub-agent should NOT read files outside its scope
- If additional files needed, stop and report

### Parallel Execution Rules

When `$PARALLEL=true`:

1. Analyze task dependencies before execution
2. Group tasks that modify different files
3. Run independent tasks simultaneously
4. Validate after each parallel group
5. Fall back to sequential if conflicts detected

**Safe to parallelize:**

- Tasks modifying different files
- Independent parent tasks with no shared dependencies

**Must run sequentially:**

- Tasks modifying the same file
- Tasks with explicit dependencies
- Sub-tasks within the same parent (by default)

### State Management

Track pipeline state in:

- `.tot-docs/pipeline-status/{prd-id}-{feature-name}.json` - PRD-specific pipeline progress (isolated per PRD)
- `.tot-docs/pipeline-status/{prd-id}-tasks.json` - Task-level progress for Stage 5 (enables resume and parallelism)
- `metadata.json` in discovery folders - Discovery phase progress
- Task files (`[x]`/`[.]`/`[ ]` markers) - Human-readable task completion status

**Note:** Each PRD gets its own status files, allowing multiple PRDs to be in progress simultaneously.

**Task Status File Format:**

```json
{
  "taskFile": ".tot-docs/tasks/001-feature.md",
  "tasks": {
    "1.0": { "status": "completed", "completedAt": "2024-12-23T10:00:00Z" },
    "1.1": { "status": "completed", "completedAt": "2024-12-23T10:05:00Z" },
    "1.2": { "status": "in-progress", "startedAt": "2024-12-23T10:10:00Z" },
    "2.0": { "status": "not-started" }
  },
  "lastUpdated": "2024-12-23T10:10:00Z"
}
```

### Error Handling

1. If a stage fails, retry once
2. If still failing, log error and ask user (unless AUTO_ANSWER=true)
3. Maximum 3 retry loops for validation gates

### Git Branch Workflow

When git is enabled, use feature branches for each PRD:

1. **Create feature branch** at pipeline start:

   ```bash
   git checkout -b feat/[prd-id]-[feature-slug]
   # Example: feat/001-user-authentication
   ```

2. **Stage changes during implementation** (single commit after validation)
   - During `process-task-list`: Stage changes after each parent task, but do NOT commit
   - After `validate-implementation` passes: Create single feature commit
   - On remediation: Amend the feature commit with fixes

3. **Create Pull Request** at finalize stage:

   ```bash
   # write PR body to file and use it to create PR to avoid error with long commands
   git push -u origin feat/[prd-id]-[feature-slug]
   gh pr create --title "[Feature] - v[X.Y.Z]" --body-file pr-body.txt
   ```

4. **Tag after merge** to main branch

**Branch naming:** `feat/[prd-id]-[feature-slug]`

**Skip branching if:** Initial project setup or working directly on main

### Naming Conventions

- PRD: `{id}-{feature-name}.md` (e.g., `001-user-auth.md`)
- Task: `{prd-id}-{feature-name}.md` (e.g., `001-user-auth.md`)
- Task detail: `{task-id}-{task-name}/` (e.g., `1.0-setup-database/`)

## Quality Standards

### For PRDs

- All sections complete
- No TBD/TODO in required fields
- Acceptance criteria are testable
- Junior developer can understand

### For Tasks

- TDD approach (tests first)
- One sub-task at a time
- Update specs after completion
- Maintain relevant files list

### For Code

- Follow existing patterns
- Include error handling
- Write tests
- Document public APIs
