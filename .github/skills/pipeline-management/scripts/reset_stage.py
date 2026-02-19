#!/usr/bin/env python3
"""Reset a stage to pending in v3.0 pipeline.

Resets a stage status and optionally clears its refinement.
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
    print_error,
)


def run(*, file, stage, clear_refinement=False, **kwargs):
    """Reset a stage to pending. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    stages = data.get("stages", [])
    stage_obj = find_stage_by_name(stages, stage)

    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    stage_index = find_stage_index(stages, stage)

    # Reset stage status
    old_status = stage_obj.get("status")
    stage_obj["status"] = "pending"
    stage_obj["startedAt"] = None
    stage_obj["completedAt"] = None
    stage_obj["output"] = None

    # Optionally reset refinement
    if clear_refinement and stage_obj.get("refinement"):
        stage_obj["refinement"] = {
            "maxAttempts": stage_obj["refinement"].get("maxAttempts", 5),
            "attempt": 0,
            "feedback": []
        }

    # Update currentStage if resetting current or earlier stage
    if stage_index <= data.get("currentStageIndex", 0):
        data["currentStage"] = stage_obj["name"]
        data["currentStageIndex"] = stage_index

    # Update global lastUpdated
    data["lastUpdated"] = get_timestamp()

    safe_write_json(file_path, data)

    return {
        "success": True,
        "stage": stage,
        "stageIndex": stage_index,
        "oldStatus": old_status,
        "newStatus": "pending",
        "refinementCleared": clear_refinement,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    msg = f"Reset stage '{result['stage']}' to pending"
    if result.get("refinementCleared"):
        msg += " (refinement cleared)"
    return msg


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Reset a stage to pending")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage name to reset")
    parser.add_argument("--clear-refinement", action="store_true",
                        help="Also reset refinement counter and feedback")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            stage=args.stage,
            clear_refinement=args.clear_refinement,
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
            print_error(str(e), "RESET_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
