---
name: pipeline-management
description: Manage pipeline status.json - stages, tasks, refinement. Schema v3.0 uses arrays for stages/tasks.
---

# Unified CLI

All pipeline operations are available through a single entrypoint:

    python <SKILL_FOLDER>/scripts/pipeline.py <group> <command> [args...] [--format json|human]

**Groups:** `init`, `stage`, `task`, `refinement`, `status`, `meta`

**Pipeline Resolution:** Most commands accept `--pipeline-id ID` to auto-resolve the status file, or `--file PATH` for direct path.

Run `python <SKILL_FOLDER>/scripts/pipeline.py --help` for full command list.

Individual scripts (e.g., `python <SKILL_FOLDER>/scripts/update_stage.py ...`) are still supported.

---

## Pipeline Resolution

Commands that operate on a pipeline status file accept two mutually exclusive options:

| Option | Example | When to use |
|---|---|---|
| `--pipeline-id ID` | `--pipeline-id 0001` | **Recommended.** Auto-resolves to `.tot-docs/{ID}-*/status.json` |
| `--file PATH` | `--file .tot-docs/0001-user-auth/status.json` | Fallback for non-standard paths or testing |

---

## Init — Initialize pipelines and run migrations

### Create a new pipeline
`python <SKILL_FOLDER>/scripts/pipeline.py init create --name NAME [--prd-id ID] [--mode feature|full|debug] [--source-type TYPE] [--source-ref REF]`

### Get next available pipeline ID (4-digit)
`python <SKILL_FOLDER>/scripts/pipeline.py init get-next-available-id [--docs-dir DIR]`

### Migrate v2.1 status file to v3.0
`python <SKILL_FOLDER>/scripts/pipeline.py init migrate-v3 --file FILE [--backup] [--dry-run]`

### Migrate to feature-based folder structure
`python <SKILL_FOLDER>/scripts/pipeline.py init migrate-folders [--dry-run] [--cwd DIR]`

### Get pipeline paths using pipeline ID
`python <SKILL_FOLDER>/scripts/pipeline.py init paths --pipeline-id ID [--format json|human|shell]`

**Returns:** Absolute paths to all pipeline artifacts:
- `pipelineDir` - Main pipeline directory (`.tot-docs/{id}-{name}/`)
- `statusFile` - Pipeline status file (`status.json`)
- `prdFile` - Product Requirements Document (`prd.md`)
- `planFile` - Implementation plan/task list (`plan.md`)
- `discoveryFile` - Discovery summary (`requirements/discovery-summary.md`)
- `requirementsDir` - Discovery/requirements subdirectory
- `tasksDir` - Tasks subdirectory  
- `taskDetailsDir` - Detailed task specifications subdirectory

**Use when:** Need to determine file paths for reading/writing artifacts within a pipeline.

**Details:** [references/init-migration.md](./references/init-migration.md)

---

## Stage — Manage pipeline stages

### Get currently active stage
`python <SKILL_FOLDER>/scripts/pipeline.py stage current --pipeline-id ID [--format json|human|name]`

### Get status of specific stage
`python <SKILL_FOLDER>/scripts/pipeline.py stage status --pipeline-id ID --stage STAGE`

### Update stage status
`python <SKILL_FOLDER>/scripts/pipeline.py stage update --pipeline-id ID --stage STAGE --status STATUS [--output TEXT] [--agent AGENT]`

### Complete stage and advance to next
`python <SKILL_FOLDER>/scripts/pipeline.py stage complete --pipeline-id ID --stage STAGE --output TEXT [--agent AGENT]`

### Reset a specific stage to pending
`python <SKILL_FOLDER>/scripts/pipeline.py stage reset --pipeline-id ID --stage STAGE [--clear-refinement]`

### Store custom stage metadata
`python <SKILL_FOLDER>/scripts/pipeline.py stage set-data --pipeline-id ID --stage STAGE --key K --value V`

**Details:** [references/stages.md](./references/stages.md)

---

## Task — Manage tasks and subtasks

### Add new parent task
`python <SKILL_FOLDER>/scripts/pipeline.py task add --pipeline-id ID --id ID --title T [--depends-on "1,2"]`

### Add sub-task under parent
`python <SKILL_FOLDER>/scripts/pipeline.py task add-subtask --pipeline-id ID --task-id ID --subtask-id SID --title T`

### Update parent task status
`python <SKILL_FOLDER>/scripts/pipeline.py task update --pipeline-id ID --task-id ID --status STATUS`

### Update sub-task status
`python <SKILL_FOLDER>/scripts/pipeline.py task update-subtask --pipeline-id ID --task-id ID --subtask-id SID --status S`

### Get task details including sub-tasks
`python <SKILL_FOLDER>/scripts/pipeline.py task status --pipeline-id ID --task-id ID`

### Get all pending tasks
`python <SKILL_FOLDER>/scripts/pipeline.py task pending --pipeline-id ID [--include-blocked]`

### Get next executable task (deps resolved)
`python <SKILL_FOLDER>/scripts/pipeline.py task next --pipeline-id ID`

### Check if all tasks completed
`python <SKILL_FOLDER>/scripts/pipeline.py task check-done --pipeline-id ID`

**Details:** [references/tasks.md](./references/tasks.md)

---

## Refinement — Record refinement attempts, query feedback, check loop control

### Record validation result for current iteration
`python <SKILL_FOLDER>/scripts/pipeline.py refinement record --pipeline-id ID --stage STAGE --result passed|failed [--feedback-file F] [--model M]`

### Get feedback file path (latest or specific attempt)
Who uses it: Creator agents who need to read feedback to fix issues
`python <SKILL_FOLDER>/scripts/pipeline.py refinement get-feedback --pipeline-id ID --stage STAGE [--attempt N] [--format json|human|path]`

### Generate new feedback path for writing
Who uses it: Validator agents who need to know where to write feedback
`python <SKILL_FOLDER>/scripts/pipeline.py refinement next-feedback-path --pipeline-id ID --stage STAGE [--attempt N] [--format json|human|path]`

### Check if refinement loop should continue
`python <SKILL_FOLDER>/scripts/pipeline.py refinement check-loop --pipeline-id ID --stage STAGE`

Returns: `CONTINUE`, `DONE`, or `MAX_REACHED`

**Details:** [references/feedback-files.md](./references/feedback-files.md) | [references/loop-control.md](./references/loop-control.md)

### Loop Coordinator Usage Pattern

Refine-loop coordinators (prd-refine-loop, plan-refine-loop, impl-refine-loop) should follow this exact sequence in each iteration:

```bash
# 1. Get latest feedback (for creator's input, empty on first iteration)
LAST_FEEDBACK = pipeline.py refinement get-feedback \
  --pipeline-id ID --stage STAGE --format path

# 2. Get new feedback path (for validator's output)
NEW_FEEDBACK = pipeline.py refinement next-feedback-path \
  --pipeline-id ID --stage STAGE --format path

# 3. Invoke CREATOR sub-agent (pass LAST_FEEDBACK as input)
# 4. Invoke VALIDATOR sub-agent (pass NEW_FEEDBACK as output path)

# 5. Record result (ALWAYS do this BEFORE check-loop)
pipeline.py refinement record --pipeline-id ID --stage STAGE \
  --result passed|failed --feedback-file NEW_FEEDBACK

# 6. Check if loop should continue
pipeline.py refinement check-loop --pipeline-id ID --stage STAGE
# Returns: CONTINUE | DONE | MAX_REACHED
```

**Critical ordering:** Step 5 (record) MUST happen BEFORE Step 6 (check-loop).  
**PASS/FAIL determination:** Read the sub-agent's return message containing "PASS:" or "FAIL:" prefix.

---

## Get the status of a stage, task, or entire pipeline

`python <SKILL_FOLDER>/scripts/pipeline.py status --pipeline-id ID [--validate] [--section stages|tasks|git|source|files|errors]`

**Details:** [references/other-scripts.md](./references/other-scripts.md)

---

## Meta — Update git info, issues, and errors

### Update git branch/PR info
`python <SKILL_FOLDER>/scripts/pipeline.py meta git-update --pipeline-id ID [--branch B] [--pr-number N] [--pr-url URL]`

### Record GitHub issue in pipeline
`python <SKILL_FOLDER>/scripts/pipeline.py meta issue-add --pipeline-id ID --number N --url U --title T [--type feature|bug|task|enhancement]`

### Record error in pipeline
`python <SKILL_FOLDER>/scripts/pipeline.py meta error-add --pipeline-id ID --message MSG [--stage S] [--task-id T] [--code C]`

**Details:** [references/other-scripts.md](./references/other-scripts.md)

---

# Modes
- `feature`: discover → create-prd → create-issues → generate-plan → implement → finalize → handle-pr-feedback
- `full`: git-init → (feature stages)
- `debug`: analyze-bug → generate-fix → implement-fix → validate-fix → finalize-fix
