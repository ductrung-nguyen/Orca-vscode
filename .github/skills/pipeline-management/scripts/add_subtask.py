#!/usr/bin/env python3
"""Add a subtask to an existing task (NEW in v3.0).

Appends a subtask to a task's subtasks array.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    safe_write_json,
    get_status_file_path,
    get_timestamp,
    find_task_by_id,
    find_subtask,
    print_error,
)


def run(*, file, task_id, subtask_id, title, **kwargs):
    """Add a subtask to an existing task. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    tasks = data.get("tasks", [])

    # Find parent task
    task = find_task_by_id(tasks, task_id)
    if not task:
        raise ValueError(f"Parent task '{task_id}' not found")

    # Ensure subtasks array exists
    if "subtasks" not in task:
        task["subtasks"] = []

    # Check if subtask ID already exists
    existing = find_subtask(task, subtask_id)
    if existing:
        raise ValueError(f"Subtask '{subtask_id}' already exists in task '{task_id}'")

    # Create subtask object
    subtask = {
        "id": subtask_id,
        "title": title,
        "status": "pending"
    }

    # Append to subtasks array
    task["subtasks"].append(subtask)

    # Update global lastUpdated
    data["lastUpdated"] = get_timestamp()

    safe_write_json(file_path, data)

    return {
        "success": True,
        "taskId": task_id,
        "subtaskId": subtask_id,
        "subtasksCount": len(task["subtasks"]),
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return f"Added subtask '{result['subtaskId']}' to task '{result['taskId']}'"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Add a subtask to an existing task")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--task-id", required=True, help="Parent task ID")
    parser.add_argument("--subtask-id", required=True, help="Subtask ID (e.g., '1.1')")
    parser.add_argument("--title", required=True, help="Subtask title")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            task_id=args.task_id,
            subtask_id=args.subtask_id,
            title=args.title,
        )
        if args.output_json:
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result))
    except ValueError as e:
        if args.output_json:
            print_error(str(e), "VALIDATION_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)
    except Exception as e:
        if args.output_json:
            print_error(str(e), "ADD_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
