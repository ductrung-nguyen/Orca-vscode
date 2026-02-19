#!/usr/bin/env python3
"""
Reset pipeline back to a target stage by index.

Usage:
    python reset_to_stage.py --file STATUS.json --target-stage 2

This script:
- Resets all stages where index >= target (e.g., 2, 3, 4, 5, 6)
- Clears associated approvals for those stages
- Clears associated refinements for those stages
- Sets currentStageIndex to target

Stage Index Reference:
| Index | Stage         | Approval Key | Refinement Key          |
|-------|---------------|--------------|-------------------------|
| 1     | discover      | discovery    | discoveryRefinement     |
| 2     | generate-plan | -            | planRefinement          |
| 3     | approve-plan  | plan         | -                       |
| 4     | implement     | -            | implementationRefinement|
| 5     | validate      | -            | -                       |
| 6     | finalize      | fix          | fixRefinement           |
"""

import argparse
from pipeline_utils import safe_read_json, safe_write_json, get_status_file_path, get_timestamp

# Default stage order for bugfix pipeline v2
DEFAULT_STAGE_ORDER = [
    {"index": 1, "name": "discover", "approvalKey": "discovery", "refinementKey": "discoveryRefinement"},
    {"index": 2, "name": "generate-plan", "approvalKey": None, "refinementKey": "planRefinement"},
    {"index": 3, "name": "approve-plan", "approvalKey": "plan", "refinementKey": None},
    {"index": 4, "name": "implement", "approvalKey": None, "refinementKey": "implementationRefinement"},
    {"index": 5, "name": "validate", "approvalKey": None, "refinementKey": None},
    {"index": 6, "name": "finalize", "approvalKey": "fix", "refinementKey": "fixRefinement"},
]


def reset_single_stage(stages: dict, stage_name: str) -> None:
    """Reset a single stage to pending state."""
    if stage_name not in stages:
        return  # Stage doesn't exist, skip
    
    stage = stages[stage_name]
    stage["status"] = "pending"
    stage["output"] = None
    
    # Clear timestamps
    if "startedAt" in stage:
        del stage["startedAt"]
    if "completedAt" in stage:
        del stage["completedAt"]


def reset_approval(stage_approvals: dict, approval_key: str) -> None:
    """Reset an approval to false."""
    if approval_key and approval_key in stage_approvals:
        stage_approvals[approval_key]["approved"] = False


def reset_refinement(data: dict, refinement_key: str) -> None:
    """Reset a refinement counter."""
    if not refinement_key:
        return
    
    refinement = data.get(refinement_key, {})
    if refinement:
        if "iterations" in refinement:
            refinement["iterations"] = 0
        if "attempts" in refinement:
            refinement["attempts"] = 0
        refinement["history"] = []


def reset_to_stage(data: dict, target_index: int) -> list:
    """Reset pipeline to target stage index. Returns list of reset stages."""
    # Get stage order from status file or use default
    stage_order = data.get("stageOrder", DEFAULT_STAGE_ORDER)
    stages = data.get("stages", {})
    stage_approvals = data.get("stageApprovals", {})
    
    reset_stages = []
    
    for stage_info in stage_order:
        if stage_info["index"] >= target_index:
            stage_name = stage_info["name"]
            
            # Reset the stage
            reset_single_stage(stages, stage_name)
            reset_stages.append(stage_name)
            
            # Reset associated approval
            reset_approval(stage_approvals, stage_info.get("approvalKey"))
            
            # Reset associated refinement
            reset_refinement(data, stage_info.get("refinementKey"))
    
    # Update current stage index
    data["currentStageIndex"] = target_index
    
    # Update current stage name
    for stage_info in stage_order:
        if stage_info["index"] == target_index:
            data["currentStage"] = stage_info["name"]
            break
    
    return reset_stages


def main():
    parser = argparse.ArgumentParser(description="Reset pipeline back to a target stage by index")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--target-stage", type=int, required=True, help="Target stage index (1-6)")
    args = parser.parse_args()
    
    if args.target_stage < 1 or args.target_stage > 6:
        print("Error: target-stage must be between 1 and 6")
        exit(1)
    
    try:
        file_path = get_status_file_path(args.file)
        data = safe_read_json(file_path)
        
        # Reset to target stage
        reset_stages = reset_to_stage(data, args.target_stage)
        
        # Update lastUpdated timestamp
        data["lastUpdated"] = get_timestamp()
        
        safe_write_json(file_path, data)
        print(f"Reset pipeline to stage {args.target_stage}")
        print(f"Reset stages: {', '.join(reset_stages)}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()
