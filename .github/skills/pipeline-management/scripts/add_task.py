#!/usr/bin/env python3
"""Add a new task to the pipeline (NEW in v3.0).

Adds a task to the tasks array with optional dependencies and detail file.
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
    print_error,
)


def run(*, file, id, title, detail_file=None, depends_on=None, **kwargs):
    """Add a new task to the pipeline. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    tasks = data.get("tasks", [])

    # Check if task ID already exists
    existing = find_task_by_id(tasks, id)
    if existing:
        raise ValueError(f"Task '{id}' already exists")

    # Parse dependencies
    deps = []
    if depends_on:
        if isinstance(depends_on, str):
            deps = [d.strip() for d in depends_on.split(",") if d.strip()]
        else:
            deps = list(depends_on)
        # Validate dependencies exist
        for dep_id in deps:
            if not find_task_by_id(tasks, dep_id):
                raise ValueError(f"Dependency task '{dep_id}' not found")

    # Create task object
    task = {
        "id": id,
        "title": title,
        "status": "pending",
        "detailFile": detail_file,
        "dependsOn": deps,
        "startedAt": None,
        "completedAt": None,
        "subtasks": []
    }

    # Append to tasks array
    tasks.append(task)
    data["tasks"] = tasks

    # Update global lastUpdated
    data["lastUpdated"] = get_timestamp()

    safe_write_json(file_path, data)

    return {
        "success": True,
        "taskId": id,
        "title": title,
        "tasksCount": len(tasks),
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return f"Added task '{result['taskId']}': {result['title']}"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Add a new task to the pipeline")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--id", required=True, help="Task ID (e.g., '1', '2')")
    parser.add_argument("--title", required=True, help="Task title")
    parser.add_argument("--detail-file", default=None, 
                        help="Path to detail file (relative to pipelineDir)")
    parser.add_argument("--depends-on", default=None, 
                        help="Comma-separated task IDs (e.g., '1,2')")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            id=args.id,
            title=args.title,
            detail_file=args.detail_file,
            depends_on=args.depends_on,
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
