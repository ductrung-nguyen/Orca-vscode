#!/usr/bin/env python3
"""Initialize new pipeline with v3.0 schema.

Creates a new pipeline directory with status.json and required subdirectories.
"""

import argparse
import json
import os
import sys

from pipeline_utils import (
    STATUS_SCHEMA_VERSION,
    TOT_DOCS_BASE,
    get_stages_for_mode,
    get_timestamp,
    safe_write_json,
    print_error,
)


def get_next_pipeline_id() -> str:
    """Get next available pipeline ID by scanning existing directories."""
    if not os.path.exists(TOT_DOCS_BASE):
        return "0001"
    
    max_id = 0
    for name in os.listdir(TOT_DOCS_BASE):
        dir_path = os.path.join(TOT_DOCS_BASE, name)
        if os.path.isdir(dir_path):
            # Extract ID from format: {id}-{name}
            parts = name.split('-', 1)
            if parts and parts[0].isdigit():
                max_id = max(max_id, int(parts[0]))
    
    return f"{max_id + 1:04d}"


def create_pipeline(
    name: str,
    mode: str = "feature",
    prd_id: str = None,
    source_type: str = None,
    source_ref: str = None
) -> dict:
    """Create a new pipeline with v3.0 schema.
    
    Args:
        name: Pipeline name slug (e.g., "user-auth")
        mode: Pipeline mode (full, feature, debug)
        prd_id: Pipeline ID (auto-generated if None)
        source_type: Source type (github-issue, user-prompt, spec-file)
        source_ref: Source reference (issue number, file path, etc.)
    
    Returns:
        dict with pipeline info including paths
    """
    # Generate pipeline ID if not provided
    if not prd_id:
        prd_id = get_next_pipeline_id()

    slug = f"{prd_id}-{name}"
    
    # Pipeline directory
    pipeline_dir = os.path.join(TOT_DOCS_BASE, slug)
    
    # Check if directory already exists
    if os.path.exists(pipeline_dir):
        raise ValueError(f"Pipeline directory already exists: {pipeline_dir}")
    
    # Create directories
    os.makedirs(pipeline_dir, exist_ok=True)
    os.makedirs(os.path.join(pipeline_dir, "requirements"), exist_ok=True)
    os.makedirs(os.path.join(pipeline_dir, "tasks"), exist_ok=True)
    
    # Get stages for mode
    stages = get_stages_for_mode(mode)
    
    # Set first stage to in-progress
    if stages:
        stages[0]["status"] = "in-progress"
        stages[0]["startedAt"] = get_timestamp()
    
    # Build status structure
    now = get_timestamp()
    status = {
        "schemaVersion": STATUS_SCHEMA_VERSION,
        "pipelineID": prd_id,
        "pipelineName": name,
        "pipelineSlug": slug,
        "pipelineDir": pipeline_dir,
        "startedAt": now,
        "lastUpdated": now,
        
        "mode": mode,
        "currentStage": stages[0]["name"] if stages else None,
        "currentStageIndex": 0,
        
        "source": None,
        "git": None,
        
        "files": {
            "prd": "prd.md",
            "requirements": "requirements/",
            "tasks": "tasks/"
        },
        
        "stages": stages,
        "tasks": [],
        "errors": []
    }
    
    # Add source if provided
    if source_type:
        status["source"] = {
            "type": source_type,
            "ref": source_ref,
            "url": None
        }
    
    # Write status file
    status_file = os.path.join(pipeline_dir, "status.json")
    safe_write_json(status_file, status)
    
    return {
        "success": True,
        "pipelineID": prd_id,
        "slug": slug,
        "pipelineName": name,
        "pipelineDir": pipeline_dir,
        "statusFile": status_file,
        "mode": mode,
        "firstStage": stages[0]["name"] if stages else None
    }


def run(*, name, mode="feature", prd_id=None, source_type=None, source_ref=None, **kwargs):
    """Create a new pipeline. Returns result dict."""
    return create_pipeline(
        name=name,
        mode=mode,
        prd_id=prd_id,
        source_type=source_type,
        source_ref=source_ref,
    )


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    lines = [
        f"\u2713 Initialized pipeline: {result['pipelineName']}",
        f"  ID: {result['pipelineID']}",
        f"  Directory: {result['pipelineDir']}",
        f"  Mode: {result['mode']}",
        f"  First stage: {result['firstStage']}",
    ]
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Initialize new pipeline with v3.0 schema")
    parser.add_argument("--name", required=True, help="Feature name slug (e.g., 'user-auth')")
    parser.add_argument("--mode", default="feature", choices=["full", "feature", "debug"],
                        help="Pipeline mode (default: feature)")
    parser.add_argument("--prd-id", default=None, help="Pipeline ID (auto-generated if omitted)")
    parser.add_argument("--source-type", default=None, 
                        choices=["github-issue", "user-prompt", "spec-file"],
                        help="Source type")
    parser.add_argument("--source-ref", default=None, help="Source reference (issue number, file path)")
    parser.add_argument("--output-json", action="store_true", 
                        help="Output JSON to stdout instead of messages")
    args = parser.parse_args()
    
    try:
        result = run(
            name=args.name,
            mode=args.mode,
            prd_id=args.prd_id,
            source_type=args.source_type,
            source_ref=args.source_ref,
        )
        
        if args.output_json:
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result))
        
        sys.exit(0)
        
    except ValueError as e:
        if args.output_json:
            print_error(str(e), "VALIDATION_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)
    except Exception as e:
        if args.output_json:
            print_error(str(e), "INIT_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
