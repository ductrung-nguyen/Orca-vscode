#!/usr/bin/env python3
"""Update subtask status (NEW in v3.0).

Updates the status of a subtask within a task.
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
    validate_task_status,
    print_error,
)


def run(*, file, task_id, subtask_id, status, **kwargs):
    """Update subtask status. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    # Validate status
    validate_task_status(status)

    tasks = data.get("tasks", [])

    # Find parent task
    task = find_task_by_id(tasks, task_id)
    if not task:
        raise ValueError(f"Parent task '{task_id}' not found")

    # Find subtask
    subtask = find_subtask(task, subtask_id)
    if not subtask:
        raise ValueError(f"Subtask '{subtask_id}' not found in task '{task_id}'")

    # Update subtask status
    old_status = subtask.get("status")
    subtask["status"] = status

    # Update global lastUpdated
    data["lastUpdated"] = get_timestamp()

    safe_write_json(file_path, data)

    return {
        "success": True,
        "taskId": task_id,
        "subtaskId": subtask_id,
        "oldStatus": old_status,
        "newStatus": status,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return f"Updated subtask '{result['subtaskId']}' to '{result['newStatus']}'"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Update subtask status")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--task-id", required=True, help="Parent task ID")
    parser.add_argument("--subtask-id", required=True, help="Subtask ID")
    parser.add_argument("--status", required=True, 
                        help="New status (pending, in-progress, completed, failed)")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            task_id=args.task_id,
            subtask_id=args.subtask_id,
            status=args.status,
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
            print_error(str(e), "UPDATE_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
