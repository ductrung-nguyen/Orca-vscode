#!/usr/bin/env python3
"""Get pending tasks in v3.0 pipeline.

Returns list of pending tasks with dependency status.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    print_error,
)


def run(*, file, include_blocked=False, **kwargs):
    """Get pending tasks with dependency info. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    tasks = data.get("tasks", [])

    # Build set of completed task IDs for dependency check
    completed_ids = {t["id"] for t in tasks if t.get("status") == "completed"}

    pending_tasks = []
    blocked_tasks = []

    for task in tasks:
        if task.get("status") == "pending":
            deps = task.get("dependsOn", [])
            deps_resolved = all(dep in completed_ids for dep in deps)

            task_info = {
                "id": task["id"],
                "title": task["title"],
                "detailFile": task.get("detailFile"),
                "dependsOn": deps,
                "depsResolved": deps_resolved
            }

            if deps_resolved:
                pending_tasks.append(task_info)
            else:
                task_info["blockedBy"] = [d for d in deps if d not in completed_ids]
                blocked_tasks.append(task_info)

    response = {
        "ready": pending_tasks,
        "readyCount": len(pending_tasks),
    }

    if include_blocked:
        response["blocked"] = blocked_tasks
        response["blockedCount"] = len(blocked_tasks)

    response["totalPending"] = len(pending_tasks) + len(blocked_tasks)

    return response


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    lines = [f"Ready tasks: {result['readyCount']}"]
    for t in result.get("ready", []):
        lines.append(f"  [{t['id']}] {t['title']}")
    if result.get("blocked"):
        lines.append(f"\nBlocked tasks: {result['blockedCount']}")
        for t in result["blocked"]:
            lines.append(f"  [{t['id']}] {t['title']} (blocked by: {', '.join(t['blockedBy'])})")
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get pending tasks")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--format", default="json", choices=["json", "human"],
                        help="Output format (default: json)")
    parser.add_argument("--include-blocked", action="store_true",
                        help="Include tasks blocked by dependencies")
    args = parser.parse_args()
    
    try:
        result = run(file=args.file, include_blocked=args.include_blocked)
        if args.format == "json":
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result))
    except Exception as e:
        if args.format == "json":
            print_error(str(e), "READ_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
