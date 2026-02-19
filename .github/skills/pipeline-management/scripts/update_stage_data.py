#!/usr/bin/env python3
"""Update stage-specific data field (NEW in v3.0).

Updates a key-value pair in a stage's data object.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    safe_write_json,
    get_status_file_path,
    get_timestamp,
    find_stage_by_name,
    print_error,
)


def run(*, file, stage, key, value, **kwargs):
    """Update a key-value pair in a stage's data object. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    stages = data.get("stages", [])
    stage_obj = find_stage_by_name(stages, stage)

    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    # Initialize data object if null
    if stage_obj.get("data") is None:
        stage_obj["data"] = {}

    # Try to parse value as JSON, otherwise use as string
    try:
        parsed_value = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        parsed_value = value

    # Set the value
    old_value = stage_obj["data"].get(key)
    stage_obj["data"][key] = parsed_value

    # Update global lastUpdated
    data["lastUpdated"] = get_timestamp()

    safe_write_json(file_path, data)

    return {
        "success": True,
        "stage": stage,
        "key": key,
        "oldValue": old_value,
        "newValue": parsed_value,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return f"Updated '{result['stage']}' data.{result['key']} = {result['newValue']!r}"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Update stage-specific data field")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage name")
    parser.add_argument("--key", required=True, help="Data key (e.g., 'depth', 'brainstormMode')")
    parser.add_argument("--value", required=True, help="Value (parsed as JSON if valid, else string)")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            stage=args.stage,
            key=args.key,
            value=args.value,
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
            print_error(str(e), "UPDATE_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
