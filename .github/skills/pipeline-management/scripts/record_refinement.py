#!/usr/bin/env python3
"""Record refinement attempt for a stage (v3.0).

Records a refinement attempt with embedded refinement in the stage.
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


def run(*, file, stage, result, feedback_file=None, model=None, **kwargs):
    """Record a refinement attempt for a stage. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    stages = data.get("stages", [])
    stage_obj = find_stage_by_name(stages, stage)

    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    # Initialize refinement if null
    if stage_obj.get("refinement") is None:
        stage_obj["refinement"] = {
            "maxAttempts": 5,
            "attempt": 0,
            "feedback": []
        }

    refinement = stage_obj["refinement"]

    # Check max attempts
    if refinement["attempt"] >= refinement["maxAttempts"]:
        raise ValueError(
            f"Stage '{stage}' has reached max refinement attempts "
            f"({refinement['maxAttempts']})"
        )

    # Increment attempt counter
    refinement["attempt"] += 1
    current_attempt = refinement["attempt"]

    now = get_timestamp()

    # Create feedback entry
    feedback_entry = {
        "file": feedback_file,
        "result": result,
        "model": model,
        "startedAt": now,
        "completedAt": now
    }

    refinement["feedback"].append(feedback_entry)

    # Update global lastUpdated
    data["lastUpdated"] = now

    safe_write_json(file_path, data)

    return {
        "success": True,
        "stage": stage,
        "attempt": current_attempt,
        "maxAttempts": refinement["maxAttempts"],
        "result": result,
    }


def format_human(result_dict, fmt="human"):
    """Format result for human-readable output."""
    return f"Recorded refinement for '{result_dict['stage']}' - attempt {result_dict['attempt']}: {result_dict['result']}"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Record a refinement attempt for a stage")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, 
                        help="Stage name (e.g., 'create-prd', 'generate-plan', 'implement')")
    parser.add_argument("--result", required=True, 
                        choices=["passed", "failed", "approved", "rejected"],
                        help="Result of validation")
    parser.add_argument("--feedback-file", default=None, 
                        help="Path to feedback file (relative to pipeline dir)")
    parser.add_argument("--model", default=None, 
                        help="Model/agent that performed validation")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result_dict = run(
            file=args.file,
            stage=args.stage,
            result=args.result,
            feedback_file=args.feedback_file,
            model=args.model,
        )
        if args.output_json:
            print(json.dumps(result_dict, indent=2))
        else:
            print(format_human(result_dict))
    except ValueError as e:
        if args.output_json:
            print_error(str(e), "VALIDATION_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)
    except Exception as e:
        if args.output_json:
            print_error(str(e), "RECORD_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
