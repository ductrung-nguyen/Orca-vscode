#!/usr/bin/env python3
"""Get next available task with resolved dependencies (NEW in v3.0).

Returns the next task that is pending and has all dependencies completed.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    print_error,
)


def get_next_task(tasks: list) -> dict:
    """Get next available task where all dependencies are resolved.
    
    Args:
        tasks: List of task dictionaries
    
    Returns:
        Next task dict if available, None otherwise
    """
    # Build set of completed task IDs
    completed_ids = {t["id"] for t in tasks if t.get("status") == "completed"}
    
    for task in tasks:
        if task.get("status") == "pending":
            deps = task.get("dependsOn", [])
            if all(dep in completed_ids for dep in deps):
                return task
    
    return None


def run(*, file, **kwargs):
    """Get next available task with resolved dependencies. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    tasks = data.get("tasks", [])

    if not tasks:
        return {"hasNext": False, "reason": "no_tasks"}

    next_task = get_next_task(tasks)

    if next_task:
        return {
            "hasNext": True,
            "task": {
                "id": next_task["id"],
                "title": next_task["title"],
                "detailFile": next_task.get("detailFile"),
                "dependsOn": next_task.get("dependsOn", []),
            },
        }

    # Check if all completed or blocked
    pending = [t for t in tasks if t.get("status") == "pending"]
    in_progress = [t for t in tasks if t.get("status") == "in-progress"]

    if not pending and not in_progress:
        reason = "all_completed"
    elif in_progress:
        reason = "task_in_progress"
    else:
        reason = "blocked_on_dependencies"

    return {"hasNext": False, "reason": reason}


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    if result["hasNext"]:
        task = result["task"]
        lines = [f"Next task: [{task['id']}] {task['title']}"]
        if task.get("detailFile"):
            lines.append(f"  Detail: {task['detailFile']}")
        if task.get("dependsOn"):
            lines.append(f"  Dependencies: {', '.join(task['dependsOn'])}")
        return "\n".join(lines)
    return f"No next task available. Reason: {result['reason']}"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get next available task with resolved dependencies")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--format", default="json", choices=["json", "human"],
                        help="Output format (default: json)")
    args = parser.parse_args()
    
    try:
        result = run(file=args.file)
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
