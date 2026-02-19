#!/usr/bin/env python3
"""Update task status in v3.0 pipeline.

Updates task status with proper timestamps.
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
    validate_task_status,
    print_error,
)


def run(*, file, task_id, status, **kwargs):
    """Update task status. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    # Validate status
    validate_task_status(status)

    tasks = data.get("tasks", [])

    # Find task in array
    task = find_task_by_id(tasks, task_id)
    if not task:
        raise ValueError(f"Task '{task_id}' not found")

    # Update status
    old_status = task.get("status")
    task["status"] = status

    # Manage timestamps
    now = get_timestamp()
    if status == "in-progress" and not task.get("startedAt"):
        task["startedAt"] = now
    elif status in ["completed", "failed"]:
        task["completedAt"] = now

    # Update global lastUpdated
    data["lastUpdated"] = now

    safe_write_json(file_path, data)

    return {
        "success": True,
        "taskId": task_id,
        "oldStatus": old_status,
        "newStatus": status,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return f"Updated task '{result['taskId']}' to '{result['newStatus']}'"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Update task status")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--task-id", required=True, help="Task ID")
    parser.add_argument("--status", required=True, 
                        help="New status (pending, in-progress, completed, failed)")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            task_id=args.task_id,
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
