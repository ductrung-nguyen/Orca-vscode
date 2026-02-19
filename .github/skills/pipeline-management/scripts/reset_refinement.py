#!/usr/bin/env python3
"""
Reset refinement counters for a phase.

Usage:
    python reset_refinement.py --file STATUS.json --phase plan

This script:
- Resets attempts/iterations counter to 0
- Clears history array
- Preserves maxAttempts/maxIterations setting
"""

import argparse
from pipeline_utils import safe_read_json, safe_write_json, get_status_file_path, get_timestamp

# Phase to refinement key mapping
PHASE_REFINEMENT_MAP = {
    "discovery": "discoveryRefinement",
    "prd": "prdRefinement",
    "plan": "planRefinement",
    "implementation": "implementationRefinement",
    "fix": "fixRefinement",
}


def reset_refinement(data: dict, phase: str) -> None:
    """Reset refinement counters for a phase."""
    refinement_key = PHASE_REFINEMENT_MAP.get(phase)
    
    if not refinement_key:
        raise ValueError(f"Unknown phase '{phase}'. Valid phases: {', '.join(PHASE_REFINEMENT_MAP.keys())}")
    
    refinement = data.get(refinement_key, {})
    
    if not refinement:
        # Initialize if not present
        if phase == "discovery":
            refinement = {
                "maxIterations": 5,
                "iterations": 0,
                "history": []
            }
        else:
            refinement = {
                "maxAttempts": 5,
                "attempts": 0,
                "history": []
            }
        data[refinement_key] = refinement
    else:
        # Reset counters but preserve max setting
        if "iterations" in refinement:
            refinement["iterations"] = 0
        if "attempts" in refinement:
            refinement["attempts"] = 0
        refinement["history"] = []


def main():
    parser = argparse.ArgumentParser(description="Reset refinement counters for a phase")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--phase", required=True, help="Phase name (discovery, prd, plan, implementation, fix)")
    args = parser.parse_args()
    
    try:
        file_path = get_status_file_path(args.file)
        data = safe_read_json(file_path)
        
        # Reset the refinement
        reset_refinement(data, args.phase)
        
        # Update lastUpdated timestamp
        data["lastUpdated"] = get_timestamp()
        
        safe_write_json(file_path, data)
        print(f"Reset refinement counters for phase '{args.phase}'")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()
