#!/usr/bin/env python3
"""Get current stage info (v3.0).

Returns the current stage name, index, and status.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    print_error,
)


def run(*, file, **kwargs):
    """Get current stage info. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    current_stage = data.get("currentStage")
    current_index = data.get("currentStageIndex", 0)
    stages = data.get("stages", [])

    # Get current stage object
    stage_obj = None
    if 0 <= current_index < len(stages):
        stage_obj = stages[current_index]

    result = {
        "currentStage": current_stage,
        "currentStageIndex": current_index,
        "totalStages": len(stages),
    }
    if stage_obj:
        result["status"] = stage_obj.get("status")
        result["startedAt"] = stage_obj.get("startedAt")

    return result


def format_human(result, fmt="human"):
    """Format result for human-readable output.

    Supports fmt='name' for bare stage name output.
    """
    if fmt == "name":
        return result.get("currentStage") or ""
    lines = [f"Current stage: {result.get('currentStage')}"]
    total = result.get('totalStages', 0)
    lines.append(f"Index: {result.get('currentStageIndex', 0)}/{total - 1 if total > 0 else 0}")
    if result.get('status'):
        lines.append(f"Status: {result['status']}")
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get current stage")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--format", default="json", choices=["json", "human", "name"],
                        help="Output format (default: json)")
    args = parser.parse_args()
    
    try:
        result = run(file=args.file)
        if args.format == "json":
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result, fmt=args.format))
    except Exception as e:
        if args.format in ["json", "human"]:
            if args.format == "json":
                print_error(str(e), "READ_ERROR")
            else:
                print(f"Error: {e}")
                sys.exit(1)
        else:
            sys.exit(1)


if __name__ == "__main__":
    main()
