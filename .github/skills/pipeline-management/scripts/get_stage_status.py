#!/usr/bin/env python3
"""Get status of a specific stage (NEW in v3.0).

Returns detailed status information for a specific stage.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    find_stage_by_name,
    find_stage_index,
    print_error,
)


def run(*, file, stage, **kwargs):
    """Get detailed status of a specific stage. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    stages = data.get("stages", [])
    stage_obj = find_stage_by_name(stages, stage)

    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    stage_index = find_stage_index(stages, stage)

    # Build response
    response = {
        "name": stage_obj["name"],
        "index": stage_index,
        "status": stage_obj["status"],
        "startedAt": stage_obj.get("startedAt"),
        "completedAt": stage_obj.get("completedAt"),
        "output": stage_obj.get("output"),
        "data": stage_obj.get("data"),
    }

    # Add refinement summary if exists
    refinement = stage_obj.get("refinement")
    if refinement:
        response["refinement"] = {
            "attempt": refinement.get("attempt", 0),
            "maxAttempts": refinement.get("maxAttempts", 5),
            "lastResult": None
        }
        feedback = refinement.get("feedback", [])
        if feedback:
            response["refinement"]["lastResult"] = feedback[-1].get("result")

    return response


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    lines = [
        f"Stage: {result['name']} (index: {result['index']})",
        f"Status: {result['status']}",
    ]
    if result.get('startedAt'):
        lines.append(f"Started: {result['startedAt']}")
    if result.get('completedAt'):
        lines.append(f"Completed: {result['completedAt']}")
    if result.get('output'):
        lines.append(f"Output: {result['output']}")
    if result.get('refinement'):
        r = result['refinement']
        lines.append(f"Refinement: attempt {r['attempt']}/{r['maxAttempts']}, last: {r['lastResult']}")
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get status of a specific stage")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage name")
    parser.add_argument("--format", default="json", choices=["json", "human"],
                        help="Output format (default: json)")
    args = parser.parse_args()
    
    try:
        result = run(file=args.file, stage=args.stage)
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
