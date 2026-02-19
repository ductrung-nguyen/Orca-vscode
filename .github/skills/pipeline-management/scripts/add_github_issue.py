#!/usr/bin/env python3
"""Add GitHub issue to create-issues stage output (v3.0).

Embeds issue information in the create-issues stage's output.issues array.
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


def run(*, file, number, url, title, type="feature", **kwargs):
    """Add GitHub issue to create-issues stage output. Returns result dict."""
    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    stages = data.get("stages", [])
    stage = find_stage_by_name(stages, "create-issues")

    if not stage:
        raise ValueError("Stage 'create-issues' not found")

    # Initialize output.issues if needed
    if stage.get("output") is None:
        stage["output"] = {"summary": "", "issues": []}
    elif not isinstance(stage.get("output"), dict):
        old_output = stage["output"]
        stage["output"] = {"summary": str(old_output), "issues": []}

    if "issues" not in stage["output"]:
        stage["output"]["issues"] = []

    # Create issue object
    issue = {
        "number": number,
        "url": url,
        "title": title,
        "type": type,
        "createdAt": get_timestamp()
    }

    # Check for duplicate
    for existing in stage["output"]["issues"]:
        if existing.get("number") == number:
            raise ValueError(f"Issue #{number} already exists")

    # Append issue
    stage["output"]["issues"].append(issue)

    # Update summary
    issue_count = len(stage["output"]["issues"])
    stage["output"]["summary"] = f"Created {issue_count} GitHub issue{'s' if issue_count != 1 else ''}"

    # Update global lastUpdated
    data["lastUpdated"] = get_timestamp()

    safe_write_json(file_path, data)

    return {
        "success": True,
        "issue": issue,
        "totalIssues": issue_count,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    issue = result.get("issue", {})
    return f"Added issue #{issue.get('number')}: {issue.get('title')}"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Add GitHub issue to create-issues stage")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--number", type=int, required=True, help="Issue number")
    parser.add_argument("--url", required=True, help="Issue URL")
    parser.add_argument("--title", required=True, help="Issue title")
    parser.add_argument("--type", default="feature", 
                        choices=["feature", "bug", "task", "enhancement"],
                        help="Issue type (default: feature)")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()

    try:
        result = run(
            file=args.file,
            number=args.number,
            url=args.url,
            title=args.title,
            type=args.type,
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
            print_error(str(e), "ADD_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
