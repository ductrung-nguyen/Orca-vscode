#!/usr/bin/env python3
"""Generate feedback file path for a specific attempt (v3.0).

Returns the path where a feedback file should be written.
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
    """Generate feedback file path for a specific attempt. Returns result dict."""
    file_path = get_status_file_path(file)

    # Read status to validate stage exists
    data = safe_read_json(file_path)
    stages = data.get("stages", [])
    stage_obj = find_stage_by_name(stages, stage)

    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    # Determine attempt number
    if attempt is None:
        refinement = stage_obj.get("refinement")
        if not refinement:
            attempt = 1
        else:
            current_attempt = refinement.get("attempt", 0)
            attempt = current_attempt + 1

    # Generate feedback file name
    feedback_filename = f"{stage}-feedback-{attempt}.md"

    # Resolve paths
    pipeline_dir = os.path.dirname(os.path.abspath(file_path))
    absolute_path = os.path.join(pipeline_dir, feedback_filename)

    return {
        "stage": stage,
        "attempt": attempt,
        "file": feedback_filename,
        "absolutePath": absolute_path,
        "exists": os.path.exists(absolute_path),
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output.

    Supports fmt='path' for bare absolute path output.
    """
    if fmt == "path":
        return result["absolutePath"]
    lines = [
        f"Feedback file path for '{result['stage']}' attempt {result['attempt']}:",
        f"  Relative: {result['file']}",
        f"  Absolute: {result['absolutePath']}",
    ]
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get feedback file path for a specific attempt")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage name")
    parser.add_argument("--attempt", type=int, default=None, 
                        help="Attempt number (default: auto-calculate next attempt)")
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
