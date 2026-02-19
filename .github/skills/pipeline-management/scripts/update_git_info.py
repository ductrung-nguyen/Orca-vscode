#!/usr/bin/env python3
"""Update git branch and PR information (NEW in v3.0).

Updates the git object with branch and PR information.
"""

import argparse
import json
import sys

from pipeline_utils import (
    safe_read_json,
    safe_write_json,
    get_status_file_path,
    get_timestamp,
    print_error,
)


def run(*, file, branch=None, pr_number=None, pr_url=None, **kwargs):
    """Update git branch and PR information. Returns result dict."""
    if not branch and pr_number is None and not pr_url:
        raise ValueError("At least one of --branch, --pr-number, or --pr-url must be provided")

    file_path = get_status_file_path(file)
    data = safe_read_json(file_path)

    # Initialize git object if not exists
    if data.get("git") is None:
        data["git"] = {}

    git = data["git"]
    changes = []

    # Update branch
    if branch:
        git["branch"] = branch
        changes.append(f"branch={branch}")

    # Update PR info
    if pr_number is not None or pr_url:
        if git.get("pr") is None:
            git["pr"] = {}

        if pr_number is not None:
            git["pr"]["number"] = pr_number
            changes.append(f"pr=#{pr_number}")

        if pr_url:
            git["pr"]["url"] = pr_url
            if f"pr=#{pr_number}" not in changes:
                changes.append("pr_url set")

    # Update global lastUpdated
    data["lastUpdated"] = get_timestamp()

    safe_write_json(file_path, data)

    return {
        "success": True,
        "git": git,
        "changes": changes,
    }


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    changes = result.get("changes", [])
    return f"Updated git info: {', '.join(changes)}"


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Update git branch and PR information")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--branch", default=None, help="Branch name")
    parser.add_argument("--pr-number", type=int, default=None, help="PR number")
    parser.add_argument("--pr-url", default=None, help="PR URL")
    parser.add_argument("--output-json", action="store_true", help="Output JSON response")
    args = parser.parse_args()

    try:
        result = run(
            file=args.file,
            branch=args.branch,
            pr_number=args.pr_number,
            pr_url=args.pr_url,
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
            print_error(str(e), "UPDATE_ERROR")
        else:
            print(f"Error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
