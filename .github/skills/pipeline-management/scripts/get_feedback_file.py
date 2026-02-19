#!/usr/bin/env python3
"""Get feedback file path for a stage (v3.0).

Returns the path to the latest feedback file from a stage's embedded refinement.
"""

import argparse
import json
import os
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    find_stage_by_name,
    print_error,
)


def run(*, file, stage, attempt=None, **kwargs):
    """Get path to existing feedback file. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    stages = data.get("stages", [])
    stage_obj = find_stage_by_name(stages, stage)

    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    refinement = stage_obj.get("refinement")
    if not refinement:
        raise ValueError(f"Stage '{stage}' has no refinement data")

    feedback_list = refinement.get("feedback", [])
    if not feedback_list:
        raise ValueError(f"No feedback recorded for stage '{stage}'")

    # Get specific attempt or latest
    actual_attempt = attempt
    if actual_attempt is not None:
        if 1 <= actual_attempt <= len(feedback_list):
            feedback_entry = feedback_list[actual_attempt - 1]
        else:
            raise ValueError(f"Attempt {actual_attempt} not found (max: {len(feedback_list)})")
    else:
        feedback_entry = feedback_list[-1]
        actual_attempt = len(feedback_list)

    feedback_file = feedback_entry.get("file")
    if not feedback_file:
        raise ValueError(f"No feedback file recorded for attempt {actual_attempt}")

    # Resolve to absolute path
    pipeline_dir = os.path.dirname(os.path.abspath(file_path))
    absolute_path = os.path.join(pipeline_dir, feedback_file)

    return {
        "stage": stage,
        "attempt": actual_attempt,
        "file": feedback_file,
        "absolutePath": absolute_path,
        "result": feedback_entry.get("result"),
        "model": feedback_entry.get("model"),
        "exists": os.path.exists(absolute_path),
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output.

    Supports fmt='path' for bare absolute path output.
    """
    if fmt == "path":
        return result["absolutePath"]
    lines = [
        f"Feedback file for '{result['stage']}' attempt {result['attempt']}:",
        f"  Relative: {result['file']}",
        f"  Absolute: {result['absolutePath']}",
        f"  Result: {result.get('result')}",
    ]
    if result.get("model"):
        lines.append(f"  Model: {result['model']}")
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get path to feedback file")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage name")
    parser.add_argument("--attempt", type=int, default=None, 
                        help="Specific attempt number (default: latest)")
    parser.add_argument("--format", default="json", choices=["json", "human", "path"],
                        help="Output format (default: json)")
    args = parser.parse_args()
    
    try:
        result = run(file=args.file, stage=args.stage, attempt=args.attempt)
        if args.format == "json":
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result, fmt=args.format))
    except ValueError as e:
        if args.format in ["json", "human"]:
            if args.format == "json":
                print_error(str(e), "VALIDATION_ERROR")
            else:
                print(f"Error: {e}")
                sys.exit(1)
        else:
            sys.exit(1)
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
