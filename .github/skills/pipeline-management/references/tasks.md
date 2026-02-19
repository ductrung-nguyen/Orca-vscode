# Task Management Reference

## Overview
Tasks represent individual implementation units within the `implement` stage. Tasks support parent-child relationships, dependencies, and status tracking.

## Task Structure
- **Parent Task**: Top-level task (e.g., `1.0`, `2.0`)
- **Sub-task**: Child of parent task (e.g., `1.1`, `1.2`)
- **Dependencies**: Tasks can depend on other tasks (`dependsOn` field)

## add_task.py

### Purpose
Add a new parent task to the pipeline.

### Usage
```bash
python <SKILL_FOLDER>/scripts/add_task.py \
  --pipeline-id $PIPELINE_ID \
  --id 1.0 \
  --title "Setup authentication module" \
  --depends-on "0.0"
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--id ID` (required): Task ID (e.g., `1.0`, `2.0`)
- `--title TITLE` (required): Task description
- `--depends-on "ID1,ID2"`: Comma-separated list of dependency task IDs

### Task States
- `not-started`: Default initial state
- `in-progress`: Currently being worked on
- `completed`: Successfully finished
- `failed`: Error occurred
- `blocked`: Waiting for dependencies

### Example
```bash
# Add independent task
python <SKILL_FOLDER>/scripts/add_task.py \
  --pipeline-id $PIPELINE_ID --id 1.0 --title "Create database schema"

# Add task with dependency
python <SKILL_FOLDER>/scripts/add_task.py \
  --pipeline-id $PIPELINE_ID --id 2.0 --title "Build API endpoints" --depends-on "1.0"
```

## add_subtask.py

### Purpose
Add a sub-task under an existing parent task.

### Usage
```bash
python <SKILL_FOLDER>/scripts/add_subtask.py \
  --pipeline-id $PIPELINE_ID \
  --task-id 1.0 \
  --subtask-id 1.1 \
  --title "Write user model tests"
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--task-id ID` (required): Parent task ID
- `--subtask-id SID` (required): Sub-task ID (e.g., `1.1`, `1.2`)
- `--title TITLE` (required): Sub-task description

### Example - Task Breakdown
```bash
# Parent task
python <SKILL_FOLDER>/scripts/add_task.py \
  --pipeline-id $PIPELINE_ID --id 1.0 --title "Implement user authentication"

# Sub-tasks
python <SKILL_FOLDER>/scripts/add_subtask.py \
  --pipeline-id $PIPELINE_ID --task-id 1.0 --subtask-id 1.1 --title "Write tests for login"

python <SKILL_FOLDER>/scripts/add_subtask.py \
  --pipeline-id $PIPELINE_ID --task-id 1.0 --subtask-id 1.2 --title "Implement login endpoint"

python <SKILL_FOLDER>/scripts/add_subtask.py \
  --pipeline-id $PIPELINE_ID --task-id 1.0 --subtask-id 1.3 --title "Update documentation"
```

## update_task.py

### Purpose
Update the status of a parent task.

### Usage
```bash
python <SKILL_FOLDER>/scripts/update_task.py \
  --pipeline-id $PIPELINE_ID \
  --task-id 1.0 \
  --status completed
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--task-id ID` (required): Task ID
- `--status STATUS` (required): New status

### Statuses
- `not-started`, `in-progress`, `completed`, `failed`, `blocked`

### Behavior
- Sets timestamps (startedAt, completedAt)
- Updates lastUpdated
- Auto-calculates blocked state based on dependencies

## update_subtask.py

### Purpose
Update the status of a sub-task.

### Usage
```bash
python <SKILL_FOLDER>/scripts/update_subtask.py \
  --pipeline-id $PIPELINE_ID \
  --task-id 1.0 \
  --subtask-id 1.1 \
  --status completed
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--task-id ID` (required): Parent task ID
- `--subtask-id SID` (required): Sub-task ID
- `--status STATUS` (required): New status

### Parent Task Completion
When all sub-tasks are completed, the parent task is automatically marked as completed.

## get_task_status.py

### Purpose
Get detailed status of a specific task (including sub-tasks).

### Usage
```bash
python <SKILL_FOLDER>/scripts/get_task_status.py \
  --pipeline-id $PIPELINE_ID \
  --task-id 1.0
```

### Output
```json
{
  "id": "1.0",
  "title": "Implement user authentication",
  "status": "in-progress",
  "dependsOn": [],
  "startedAt": "2026-02-07T10:00:00Z",
  "subtasks": [
    {
      "id": "1.1",
      "title": "Write tests for login",
      "status": "completed",
      "completedAt": "2026-02-07T10:15:00Z"
    },
    {
      "id": "1.2",
      "title": "Implement login endpoint",
      "status": "in-progress"
    }
  ]
}
```

## get_pending_tasks.py

### Purpose
Get list of all tasks that are not yet completed.

### Usage
```bash
python <SKILL_FOLDER>/scripts/get_pending_tasks.py \
  --pipeline-id $PIPELINE_ID \
  --include-blocked
```

### Parameters
- `--pipeline-id ID` (required): Pipeline ID
- `--include-blocked`: Include blocked tasks in results (default: exclude)

### Output
```json
{
  "pending": [
    {"id": "1.0", "status": "in-progress", "title": "..."},
    {"id": "2.0", "status": "not-started", "title": "..."}
  ],
  "blocked": [
    {"id": "3.0", "status": "blocked", "dependsOn": ["2.0"], "title": "..."}
  ],
  "total": 2,
  "totalBlocked": 1
}
```

### Use Cases
- Show work remaining
- Track progress metrics
- Identify bottlenecks

## get_next_task.py

### Purpose
Get the next task that can be executed (dependencies resolved).

### Usage
```bash
python <SKILL_FOLDER>/scripts/get_next_task.py --pipeline-id $PIPELINE_ID
```

### Behavior
Returns the first task where:
- Status is `not-started`
- All dependencies are `completed`
- Not blocked by other tasks

### Output
```json
{
  "found": true,
  "task": {
    "id": "2.0",
    "title": "Build API endpoints",
    "status": "not-started",
    "dependsOn": ["1.0"]
  }
}
```

Or if no task available:
```json
{
  "found": false,
  "reason": "All tasks completed or blocked"
}
```

### Usage in Loops
```bash
while true; do
    NEXT=$(python <SKILL_FOLDER>/scripts/get_next_task.py --pipeline-id $PIPELINE_ID)
    FOUND=$(echo "$NEXT" | jq -r '.found')
    
    if [ "$FOUND" == "false" ]; then
        break
    fi
    
    TASK_ID=$(echo "$NEXT" | jq -r '.task.id')
    # Process task...
done
```

## check_task_completion.py

### Purpose
Check if all tasks in the pipeline are completed.

### Usage
```bash
python <SKILL_FOLDER>/scripts/check_task_completion.py --pipeline-id $PIPELINE_ID
```

### Output
```json
{
  "allCompleted": true,
  "total": 10,
  "completed": 10,
  "pending": 0,
  "failed": 0,
  "blocked": 0
}
```

### Exit Codes
- `0`: All tasks completed
- `1`: Tasks still pending/blocked/failed

### Usage in Scripts
```bash
if python <SKILL_FOLDER>/scripts/check_task_completion.py --pipeline-id $PIPELINE_ID; then
    echo "All tasks completed! Moving to validation..."
else
    echo "Tasks still pending"
fi
```
