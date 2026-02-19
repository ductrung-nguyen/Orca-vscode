#!/usr/bin/env python3
"""Read status file (v3.0).

Returns the full status JSON for inspection.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    validate_schema_v3,
    print_error,
)


def run(*, file, validate=False, section=None, **kwargs):
    """Read status file. Returns result dict.

    If validate=True, validates against v3.0 schema.
    If section is provided, returns only that section.
    """
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    # Validate if requested
    if validate:
        is_valid, errors = validate_schema_v3(data)
        if not is_valid:
            return {
                "valid": False,
                "errors": errors,
                "_exit_code": 1,
            }

    # Extract section if requested
    if section:
        if section in data:
            return {section: data[section]}
        else:
            return {section: None}

    return data


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    # Validation failure
    if "valid" in result and not result["valid"]:
        lines = ["Validation failed:"]
        for err in result.get("errors", []):
            lines.append(f"  - {err}")
        return "\n".join(lines)

    # Section output (single key)
    keys = [k for k in result if not k.startswith("_")]
    if len(keys) == 1 and keys[0] != "pipelineName":
        return json.dumps(result[keys[0]], indent=2)

    # Full status summary
    lines = [
        f"Pipeline: {result.get('pipelineName', 'unknown')} (ID: {result.get('pipelineID', '?')})",
        f"Mode: {result.get('mode', 'unknown')}",
        f"Schema: v{result.get('schemaVersion', '?')}",
        f"Current stage: {result.get('currentStage')} (index: {result.get('currentStageIndex', 0)})",
        f"Started: {result.get('startedAt')}",
        f"Last updated: {result.get('lastUpdated')}",
    ]

    stages = result.get("stages", [])
    if stages:
        lines.append(f"\nStages ({len(stages)}):")
        for s in stages:
            status_icon = "✓" if s.get("status") == "completed" else "○" if s.get("status") == "pending" else "⟳"
            lines.append(f"  {status_icon} {s.get('name')}: {s.get('status')}")

    tasks = result.get("tasks", [])
    if tasks:
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        lines.append(f"\nTasks: {completed}/{len(tasks)} completed")

    errors = result.get("errors", [])
    if errors:
        lines.append(f"\nErrors: {len(errors)}")

    return "\n".join(lines)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Read and display status file")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--validate", action="store_true", 
                        help="Validate against v3.0 schema")
    parser.add_argument("--section", default=None,
                        choices=["stages", "tasks", "git", "source", "files", "errors"],
                        help="Only output specific section")
    parser.add_argument("--format", default="json", choices=["json", "human"],
                        help="Output format (default: json)")
    args = parser.parse_args()

    try:
        result = run(file=args.file, validate=args.validate, section=args.section)

        exit_code = result.pop("_exit_code", 0) if isinstance(result, dict) else 0

        if args.format == "json":
            print(json.dumps(result, indent=2))
        else:
            print(format_human(result))

        if exit_code:
            sys.exit(exit_code)
    except Exception as e:
        if args.format == "json":
            print_error(str(e), "READ_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
