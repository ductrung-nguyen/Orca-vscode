#!/usr/bin/env python3
"""Check task completion in v3.0 pipeline.

Checks if all tasks and subtasks are completed.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    print_error,
)

VALID_STATUSES = {"completed", "in-progress", "pending", "failed"}


def validate_status_file(data):
    """Validate the status file structure (v3.0 array-based tasks).
    
    Returns:
        list: List of validation error dictionaries, empty if valid
    """
    errors = []
    
    # Check for tasks key
    if "tasks" not in data:
        errors.append({
            "error": "missing_tasks_key",
            "message": "Missing required 'tasks' key in status file"
        })
        return errors
    
    tasks = data["tasks"]
    
    if not isinstance(tasks, list):
        errors.append({
            "error": "invalid_tasks_format",
            "message": "Tasks must be an array"
        })
        return errors
    
    # Validate each task (array-based model)
    for i, task in enumerate(tasks):
        if not isinstance(task, dict):
            errors.append({
                "error": "invalid_task_format",
                "task_index": i,
                "message": f"Task at index {i} must be an object"
            })
            continue

        task_id = task.get("id", f"[index {i}]")
            
        # Check for status field
        if "status" not in task:
            errors.append({
                "error": "missing_status",
                "task_id": task_id,
                "message": f"Task {task_id} is missing required 'status' field"
            })
        elif task["status"] not in VALID_STATUSES:
            errors.append({
                "error": "invalid_status",
                "task_id": task_id,
                "status": task["status"],
                "message": f"Task {task_id} has invalid status '{task['status']}'. Valid: {VALID_STATUSES}"
            })
    
    return errors


def check_completion(data):
    """Check task completion status (v3.0 array-based tasks).
    
    Args:
        data: Parsed status file data (dict with tasks as array)
        
    Returns:
        dict: Completion status with all_complete, counts, and incomplete list
    """
    tasks = data.get("tasks", [])
    
    if not tasks:
        return {
            "all_complete": True,
            "total_tasks": 0,
            "completed_tasks": 0,
            "incomplete_tasks": []
        }
    
    total = 0
    completed = 0
    incomplete_tasks = []
    
    for task in tasks:
        total += 1
        task_id = task.get("id", "?")
        status = task.get("status", "pending")
        
        if status == "completed":
            completed += 1
        else:
            incomplete_tasks.append({
                "task_id": task_id,
                "title": task.get("title", ""),
                "status": status
            })
    
    return {
        "all_complete": completed == total,
        "total_tasks": total,
        "completed_tasks": completed,
        "incomplete_tasks": incomplete_tasks
    }


def run(*, file, **kwargs):
    """Check if all tasks are completed. Returns result dict.
    
    Sets result["_exit_code"] = 1 when tasks are incomplete or validation fails.
    Returns validation errors as part of result dict (not raised).
    """
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    # Validate structure
    validation_errors = validate_status_file(data)
    if validation_errors:
        return {
            "error": True,
            "validation_errors": validation_errors,
            "_exit_code": 1,
        }

    # Check completion
    result = check_completion(data)

    # Non-error exit code: 1 when tasks are incomplete
    if not result["all_complete"]:
        result["_exit_code"] = 1

    return result


def format_human(result, fmt="human"):
    """Format output for human readability."""
    # Validation error output
    if result.get("error"):
        lines = ["STATUS FILE VALIDATION FAILED", ""]
        for err in result.get("validation_errors", []):
            lines.append(f"  - [{err['error']}] {err['message']}")
        return "\n".join(lines)

    lines = []
    lines.append("=== Task Completion Report ===")
    lines.append("")
    lines.append(f"Total: {result['total_tasks']}")
    lines.append(f"Completed: {result['completed_tasks']}")
    lines.append(f"Incomplete: {len(result['incomplete_tasks'])}")
    lines.append("")
    
    if result["all_complete"]:
        lines.append("\u2705 All tasks complete!")
        lines.append("Ready to proceed to validation")
    else:
        lines.append("Incomplete Tasks:")
        lines.append("")
        lines.append(f"{'Task ID':<12} {'Task Name':<40} {'Status':<15}")
        lines.append("-" * 67)
        for task in result["incomplete_tasks"]:
            task_id = task["task_id"]
            title = task.get("title", "")[:38]
            status = task["status"]
            lines.append(f"{task_id:<12} {title:<40} {status:<15}")
    
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Check if all tasks are completed")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--format", default="json", choices=["json", "human"],
                        help="Output format (default: json)")
    args = parser.parse_args()
    
    try:
        result = run(file=args.file)
        exit_code = result.pop("_exit_code", 0)
        if args.format == "json":
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result))
        sys.exit(exit_code)
    except FileNotFoundError as e:
        if args.format == "json":
            print(json.dumps({
                "error": True,
                "message": str(e)
            }, indent=2))
        else:
            print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        if args.format == "json":
            print(json.dumps({
                "error": True,
                "message": str(e)
            }, indent=2))
        else:
            print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
