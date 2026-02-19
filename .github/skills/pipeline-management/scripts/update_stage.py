#!/usr/bin/env python3
"""Update stage status in v3.0 pipeline.

Updates stage status with proper timestamps and index management.
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
    find_stage_index,
    validate_stage_status,
    print_error,
)


def run(*, file, stage, status, output=None, agent=None, **kwargs):
    """Update stage status. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    # Validate status value
    validate_stage_status(status)

    # Find stage in array
    stages = data.get("stages", [])
    stage_obj = find_stage_by_name(stages, stage)

    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    # Get stage index for reference
    stage_index = find_stage_index(stages, stage)

    # Update fields
    old_status = stage_obj.get("status")
    stage_obj["status"] = status

    if output:
        # Try to parse output as JSON, otherwise use as string
        try:
            stage_obj["output"] = json.loads(output)
        except (json.JSONDecodeError, TypeError):
            stage_obj["output"] = output

    # Manage timestamps
    now = get_timestamp()
    if status == "in-progress" and not stage_obj.get("startedAt"):
        stage_obj["startedAt"] = now
    elif status in ["completed", "failed", "skipped"]:
        stage_obj["completedAt"] = now

    if agent:
        stage_obj["agent"] = agent

    # Update currentStage and currentStageIndex if advancing
    if status == "in-progress":
        data["currentStage"] = stage
        data["currentStageIndex"] = stage_index

    # Update global lastUpdated
    data["lastUpdated"] = now

    safe_write_json(file_path, data)

    return {
        "success": True,
        "stage": stage,
        "stageIndex": stage_index,
        "oldStatus": old_status,
        "newStatus": status,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return f"Updated stage '{result['stage']}' to '{result['newStatus']}'"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Update stage status")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage name (e.g., create-prd)")
    parser.add_argument("--status", required=True, 
                        help="New status (pending, in-progress, completed, failed, skipped)")
    parser.add_argument("--output", help="Output value (file path or result string or JSON)")
    parser.add_argument("--agent", help="Agent name/model that performed the action")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            stage=args.stage,
            status=args.status,
            output=args.output,
            agent=args.agent,
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
