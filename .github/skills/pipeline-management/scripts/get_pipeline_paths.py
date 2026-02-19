#!/usr/bin/env python3
"""Get pipeline paths from status file.

Returns commonly needed paths: pipelineDir, requirementsDir, prdFile, tasksDir.
"""

import argparse
import json
import os
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    print_error,
)


class PipelinePaths:
    """Container for pipeline artifact paths with formatting capabilities."""

    def __init__(self, pipeline_dir: str, status_file: str, files: dict):
        """Initialize pipeline paths from status file data.
        
        Args:
            pipeline_dir: Absolute path to pipeline directory
            status_file: Absolute path to status.json file
            files: Files dict from status.json
        """
        self.pipelineDir = os.path.abspath(pipeline_dir)
        self.statusFile = status_file
        
        # Extract relative paths with defaults
        prd_file = files.get("prd", "prd.md")
        plan_file = files.get("plan", "plan.md")
        requirements_dir = files.get("requirements", "requirements/")
        tasks_dir = files.get("tasks", "tasks/")
        task_details_dir = files.get("taskDetails", "task-details/")
        discovery_file = files.get("discovery", os.path.join(requirements_dir, "discovery-summary.md"))
        
        # Build absolute paths
        self.prdFile = os.path.join(self.pipelineDir, prd_file)
        self.planFile = os.path.join(self.pipelineDir, plan_file)
        self.discoveryFile = os.path.join(self.pipelineDir, discovery_file)
        self.requirementsDir = os.path.join(self.pipelineDir, requirements_dir)
        self.tasksDir = os.path.join(self.pipelineDir, tasks_dir)
        self.taskDetailsDir = os.path.join(self.pipelineDir, task_details_dir)
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "pipelineDir": self.pipelineDir,
            "statusFile": self.statusFile,
            "prdFile": self.prdFile,
            "planFile": self.planFile,
            "discoveryFile": self.discoveryFile,
            "requirementsDir": self.requirementsDir,
            "tasksDir": self.tasksDir,
            "taskDetailsDir": self.taskDetailsDir,
        }
    
    def to_json(self, indent: int = 2) -> str:
        """Format as JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
    
    def to_human(self) -> str:
        """Format as human-readable text."""
        lines = [
            f"Pipeline directory: {self.pipelineDir}",
            f"Status file:        {self.statusFile}",
            f"PRD file:           {self.prdFile}",
            f"Plan file:          {self.planFile}",
            f"Discovery file:     {self.discoveryFile}",
            f"Requirements dir:   {self.requirementsDir}",
            f"Tasks dir:          {self.tasksDir}",
            f"Task details dir:   {self.taskDetailsDir}",
        ]
        return "\n".join(lines)
    
    def to_shell(self) -> str:
        """Format as shell variables for sourcing."""
        lines = [
            f'PIPELINE_DIR="{self.pipelineDir}"',
            f'STATUS_FILE="{self.statusFile}"',
            f'PRD_FILE="{self.prdFile}"',
            f'PLAN_FILE="{self.planFile}"',
            f'DISCOVERY_FILE="{self.discoveryFile}"',
            f'REQUIREMENTS_DIR="{self.requirementsDir}"',
            f'TASKS_DIR="{self.tasksDir}"',
            f'TASK_DETAILS_DIR="{self.taskDetailsDir}"',
        ]
        return "\n".join(lines)


def run(*, file, **kwargs) -> PipelinePaths:
    """Get pipeline paths from status file. Returns PipelinePaths instance."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    pipeline_dir = data.get("pipelineDir", os.path.dirname(file_path))
    files = data.get("files", {})

    return PipelinePaths(pipeline_dir, file_path, files)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get pipeline paths from status file")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--format", default="json", choices=["json", "human", "shell"],
                        help="Output format (default: json). 'shell' outputs key=value pairs")
    args = parser.parse_args()

    try:
        paths = run(file=args.file)
        
        if args.format == "json":
            print(paths.to_json())
        elif args.format == "shell":
            print(paths.to_shell())
        else:
            print(paths.to_human())
    except ValueError as e:
        if args.format == "json":
            print_error(str(e), "VALIDATION_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)
    except Exception as e:
        if args.format == "json":
            print_error(str(e), "READ_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
