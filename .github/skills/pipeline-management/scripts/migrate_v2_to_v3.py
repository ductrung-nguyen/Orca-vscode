#!/usr/bin/env python3
"""Migrate v2.1 status to v3.0 format.

Converts existing pipeline status files from schema v2.1 to v3.0.
"""

import argparse
import json
import sys
from typing import Dict, List

from pipeline_utils import (
    safe_read_json,
    safe_write_json,
    get_status_file_path,
    FEATURE_STAGES,
    FULL_STAGES,
    DEBUG_STAGES,
    print_error,
)


def get_stage_order_for_mode(mode: str) -> List[str]:
    """Get stage names for a mode."""
    if mode == "full":
        return [s["name"] for s in FULL_STAGES]
    elif mode == "debug":
        return [s["name"] for s in DEBUG_STAGES]
    else:
        return [s["name"] for s in FEATURE_STAGES]


def get_refinement_key(stage_name: str) -> str:
    """Map stage name to v2.1 refinement key."""
    mapping = {
        "create-prd": "prdRefinement",
        "validate-prd": "prdRefinement",
        "generate-plan": "planRefinement",
        "validate-plan": "planRefinement",
        "implement": "implementationRefinement",
        "validate-impl": "implementationRefinement",
        "generate-fix": "fixRefinement",
        "implement-fix": "fixRefinement",
    }
    return mapping.get(stage_name)


def migrate_refinement(v2_refinement: Dict) -> Dict:
    """Convert v2.1 refinement to v3.0 format."""
    if not v2_refinement:
        return None
    
    feedback = []
    for entry in v2_refinement.get("history", []):
        feedback.append({
            "file": entry.get("feedbackFile"),
            "result": entry.get("result", "").lower(),
            "model": None,
            "startedAt": entry.get("timestamp"),
            "completedAt": entry.get("timestamp"),
        })
    
    return {
        "maxAttempts": v2_refinement.get("maxAttempts", 5),
        "attempt": v2_refinement.get("attempts", 0),
        "feedback": feedback
    }


def migrate_v2_to_v3(v2_data: Dict) -> Dict:
    """Migrate v2.1 status to v3.0 format."""
    
    mode = v2_data.get("mode", "feature")
    stage_order = get_stage_order_for_mode(mode)
    
    # 1. Rename top-level fields
    v3_data = {
        "schemaVersion": "3.0",
        "pipelineID": v2_data.get("prdId"),
        "pipelineName": v2_data.get("featureName"),
        "pipelineDir": v2_data.get("featureDir"),
        "startedAt": v2_data.get("started"),
        "lastUpdated": v2_data.get("lastUpdated"),
        "mode": mode,
        "currentStage": v2_data.get("currentStage"),
        "currentStageIndex": 0,
    }
    
    # 2. Convert stages dict to array
    stages_dict = v2_data.get("stages", {})
    v3_stages = []
    
    for i, stage_name in enumerate(stage_order):
        stage_data = stages_dict.get(stage_name, {})
        
        v3_stage = {
            "name": stage_name,
            "status": stage_data.get("status", "pending"),
            "startedAt": stage_data.get("startedAt"),
            "completedAt": stage_data.get("completedAt"),
            "output": stage_data.get("output"),
            "refinement": None,
            "data": None,
        }
        
        # Migrate refinement from top-level to stage
        refinement_key = get_refinement_key(stage_name)
        if refinement_key and refinement_key in v2_data:
            v3_stage["refinement"] = migrate_refinement(v2_data[refinement_key])
        
        # Migrate GitHub issues to create-issues output
        if stage_name == "create-issues" and "githubIssues" in v2_data:
            issues = v2_data["githubIssues"]
            v3_stage["output"] = {
                "summary": f"Migrated {len(issues)} issues",
                "issues": issues
            }
        
        v3_stages.append(v3_stage)
        
        if stage_name == v3_data["currentStage"]:
            v3_data["currentStageIndex"] = i
    
    v3_data["stages"] = v3_stages
    
    # 3. Convert tasks dict to array
    tasks_dict = v2_data.get("tasks", {})
    v3_tasks = []
    
    for task_id in sorted(tasks_dict.keys()):
        task_data = tasks_dict[task_id]
        v3_task = {
            "id": task_id,
            "title": task_data.get("title", task_data.get("name", f"Task {task_id}")),
            "status": task_data.get("status", "pending"),
            "detailFile": f"tasks/{task_id}.md",
            "dependsOn": [],
            "startedAt": task_data.get("startedAt"),
            "completedAt": task_data.get("completedAt"),
            "subtasks": [],
        }
        v3_tasks.append(v3_task)
    
    v3_data["tasks"] = v3_tasks
    
    # 4. Set file references (relative paths)
    v3_data["files"] = {
        "prd": "prd.md",
        "requirements": "requirements/",
        "tasks": "tasks/"
    }
    
    # 5. Initialize remaining fields
    v3_data["source"] = None
    v3_data["git"] = None
    v3_data["errors"] = v2_data.get("errors", [])
    
    return v3_data


def run(*, file, output=None, dry_run=False, backup=False, **kwargs):
    """Migrate v2.1 status to v3.0 format. Returns result dict."""
    file_path = get_status_file_path(file)
    v2_data = safe_read_json(file_path)
    
    # Check if already v3.0
    if v2_data.get("schemaVersion") == "3.0":
        return {"success": True, "alreadyV3": True, "message": "File is already v3.0 format"}
    
    # Check version
    version = v2_data.get("schemaVersion", "unknown")
    warning = None
    if not version.startswith("2"):
        warning = f"Unexpected schema version: {version}"
    
    # Migrate
    v3_data = migrate_v2_to_v3(v2_data)
    
    if dry_run:
        return {
            "success": True,
            "dryRun": True,
            "migrated": v3_data,
            "stageCount": len(v3_data.get("stages", [])),
            "taskCount": len(v3_data.get("tasks", [])),
            "warning": warning,
        }
    
    output_path = output or file_path
    
    # Create backup if requested
    backup_path = None
    if backup and output_path == file_path:
        backup_path = file_path + ".backup"
        with open(backup_path, 'w') as f:
            json.dump(v2_data, f, indent=2)
    
    safe_write_json(output_path, v3_data)
    
    return {
        "success": True,
        "outputPath": output_path,
        "stageCount": len(v3_data.get("stages", [])),
        "taskCount": len(v3_data.get("tasks", [])),
        "backupPath": backup_path,
        "warning": warning,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    if result.get("alreadyV3"):
        return "File is already v3.0 format"
    if result.get("dryRun"):
        return json.dumps(result["migrated"], indent=2)
    lines = []
    if result.get("warning"):
        lines.append(f"Warning: {result['warning']}")
    if result.get("backupPath"):
        lines.append(f"Created backup: {result['backupPath']}")
    lines.append(f"Migrated to v3.0: {result['outputPath']}")
    lines.append(f"  Stages: {result['stageCount']}")
    lines.append(f"  Tasks: {result['taskCount']}")
    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Migrate v2.1 status to v3.0 format")
    parser.add_argument("--file", required=True, help="Path to v2.1 status JSON file")
    parser.add_argument("--output", default=None, 
                        help="Output path (default: overwrite input file)")
    parser.add_argument("--dry-run", action="store_true", 
                        help="Print migrated JSON without saving")
    parser.add_argument("--backup", action="store_true", 
                        help="Create .backup file before overwriting")
    args = parser.parse_args()
    
    try:
        result = run(
            file=args.file,
            output=args.output,
            dry_run=args.dry_run,
            backup=args.backup,
        )
        print(format_human(result))
    except Exception as e:
        print_error(str(e), "MIGRATION_ERROR")


if __name__ == "__main__":
    main()
