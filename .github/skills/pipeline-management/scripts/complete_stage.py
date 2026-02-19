#!/usr/bin/env python3
"""Complete stage and advance to next in v3.0 pipeline.

Marks current stage as completed and advances to the next stage in the array.
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


def run(*, file, stage, output, agent=None, **kwargs):
    """Complete stage and advance to next. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    stages = data.get("stages", [])

    # Find stage in array
    stage_obj = find_stage_by_name(stages, stage)
    if not stage_obj:
        raise ValueError(f"Stage '{stage}' not found")

    stage_index = find_stage_index(stages, stage)

    # 1. Update current stage to completed
    now = get_timestamp()
    stage_obj["status"] = "completed"
    stage_obj["completedAt"] = now

    # Parse output as JSON if possible
    try:
        stage_obj["output"] = json.loads(output)
    except (json.JSONDecodeError, TypeError):
        stage_obj["output"] = output

    # Set agent if provided
    if agent:
        stage_obj["agent"] = agent

    # 2. Determine next stage using array index
    next_stage_index = stage_index + 1
    next_stage_name = None

    if next_stage_index < len(stages):
        next_stage = stages[next_stage_index]
        next_stage_name = next_stage["name"]

        # 3. Update next stage status to in-progress
        next_stage["status"] = "in-progress"
        next_stage["startedAt"] = now

        # Update current stage tracking
        data["currentStage"] = next_stage_name
        data["currentStageIndex"] = next_stage_index
    else:
        # Pipeline complete - last stage
        data["currentStage"] = stage
        data["currentStageIndex"] = stage_index

    # 4. Global updates
    data["lastUpdated"] = now

    safe_write_json(file_path, data)

    result = {
        "success": True,
        "completedStage": stage,
        "completedStageIndex": stage_index,
    }
    if next_stage_name:
        result["nextStage"] = next_stage_name
        result["nextStageIndex"] = next_stage_index
    else:
        result["pipelineComplete"] = True
    return result


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    if result.get("nextStage"):
        return f"Completed stage '{result['completedStage']}', advanced to '{result['nextStage']}'"
    return f"Completed stage '{result['completedStage']}' - pipeline complete!"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Complete stage and advance pipeline")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage explicitly completing")
    parser.add_argument("--output", required=True, help="Output of the completed stage")
    parser.add_argument("--agent", help="Agent/model that completed this stage")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            stage=args.stage,
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
            print_error(str(e), "COMPLETE_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
