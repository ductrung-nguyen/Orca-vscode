#!/usr/bin/env python3
"""Get task status in v3.0 pipeline.

Returns task status with subtask summary.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    find_task_by_id,
    print_error,
)


def run(*, file, task_id, **kwargs):
    """Get task status with subtask summary. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    tasks = data.get("tasks", [])

    # Find task in array
    task = find_task_by_id(tasks, task_id)
    if not task:
        raise ValueError(f"Task '{task_id}' not found")

    # Build response
    response = {
        "id": task["id"],
        "title": task["title"],
        "status": task["status"],
        "detailFile": task.get("detailFile"),
        "dependsOn": task.get("dependsOn", []),
        "startedAt": task.get("startedAt"),
        "completedAt": task.get("completedAt"),
    }

    # Add subtask summary
    subtasks = task.get("subtasks", [])
    if subtasks:
        completed = sum(1 for s in subtasks if s.get("status") == "completed")
        response["subtasks"] = {
            "total": len(subtasks),
            "completed": completed,
            "items": subtasks
        }

    return response


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    lines = [
        f"Task [{result['id']}]: {result['title']}",
        f"  Status: {result['status']}",
    ]
    if result.get("dependsOn"):
        lines.append(f"  Depends on: {', '.join(result['dependsOn'])}")
    if result.get("startedAt"):
        lines.append(f"  Started: {result['startedAt']}")
    if result.get("completedAt"):
        lines.append(f"  Completed: {result['completedAt']}")
    if result.get("subtasks"):
        s = result["subtasks"]
        lines.append(f"  Subtasks: {s['completed']}/{s['total']} completed")
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get task status")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--task-id", required=True, help="Task ID")
    parser.add_argument("--format", default="json", choices=["json", "human"],
                        help="Output format (default: json)")
    args = parser.parse_args()
    
    try:
        result = run(file=args.file, task_id=args.task_id)
        if args.format == "json":
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result))
    except ValueError as e:
        if args.format == "json":
            print_error(str(e), "VALIDATION_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)
    except Exception as e:
        if args.format == "json":
            print_error(str(e), "READ_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
