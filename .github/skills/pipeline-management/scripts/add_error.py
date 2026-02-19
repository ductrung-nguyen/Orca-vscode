#!/usr/bin/env python3
"""Add an error entry to the errors array (NEW in v3.0).

Appends an error with timestamp and optional context.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    safe_write_json,
    get_status_file_path,
    get_timestamp,
    print_error,
)


def run(*, file, message, stage=None, task_id=None, code=None, **kwargs):
    """Add an error entry to the errors array. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    # Initialize errors array if not exists
    if "errors" not in data:
        data["errors"] = []

    # Create error object
    now = get_timestamp()
    error = {
        "timestamp": now,
        "message": message
    }

    if stage:
        error["stage"] = stage
    if task_id:
        error["taskId"] = task_id
    if code:
        error["code"] = code

    # Append to errors array
    data["errors"].append(error)

    # Update global lastUpdated
    data["lastUpdated"] = now

    safe_write_json(file_path, data)

    return {
        "success": True,
        "error": error,
        "errorsCount": len(data["errors"]),
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return f"Added error: {result['error']['message']}"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Add an error entry to the errors array")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--message", required=True, help="Error message")
    parser.add_argument("--stage", default=None, help="Stage where error occurred")
    parser.add_argument("--task-id", default=None, help="Task ID where error occurred")
    parser.add_argument("--code", default=None, help="Error code")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()

    try:
        result = run(
            file=args.file,
            message=args.message,
            stage=args.stage,
            task_id=args.task_id,
            code=args.code,
        )
        if args.output_json:
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result))
    except Exception as e:
        if args.output_json:
            print_error(str(e), "ADD_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
