#!/usr/bin/env python3
"""
fetch-pr-context.py - Fetch PR metadata, diff, and changed files

Usage: ./fetch-pr-context.py <PR_NUMBER> [REPO]

Arguments:
  PR_NUMBER   Required. The pull request number to fetch.
  REPO        Optional repository in owner/repo format. Auto-detects if not provided.

Outputs JSON:
  {
    "success": true|false,
    "pr": {
      "number": 123,
      "title": "...",
      "body": "...",
      "state": "OPEN|CLOSED|MERGED",
      "author": "...",
      "baseRef": "main",
      "headRef": "feat/feature",
      "headSha": "abc123...",
      "url": "https://github.com/...",
      "isDraft": false,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "files": [
      { "path": "...", "additions": 10, "deletions": 5, "status": "modified" }
    ],
    "diff": "...",
    "error": null
  }

Exit codes:
  0 - Success
  1 - Invalid arguments
  2 - PR not found
  3 - API error
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def output_error(error: str, exit_code: int = 1):
    """Print error JSON and exit."""
    result = {"success": False, "error": error}
    print(json.dumps(result, indent=2))
    sys.exit(exit_code)


def output_success(pr: dict, files: list, diff: str):
    """Print success JSON and exit."""
    result = {
        "success": True,
        "pr": pr,
        "files": files,
        "diff": diff,
        "error": None
    }
    print(json.dumps(result, indent=2))
    sys.exit(0)


def run_command(args: list[str]) -> tuple[int, str, str]:
    """Run a command and return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(args, capture_output=True, text=True)
        return result.returncode, result.stdout, result.stderr
    except FileNotFoundError:
        return -1, "", f"Command not found: {args[0]}"


def validate_gh_auth(repo: str | None = None) -> str | None:
    """Validate gh auth and get repo. Returns repo or None on error."""
    script_dir = Path(__file__).parent
    validate_script = script_dir / "validate-gh-auth.py"
    
    args = ["python3", str(validate_script)]
    if repo:
        args.append(repo)
    
    returncode, stdout, stderr = run_command(args)
    
    if returncode != 0:
        # Output the error from validate script
        print(stdout if stdout else stderr)
        sys.exit(returncode if returncode in [1, 2, 3] else 3)
    
    try:
        result = json.loads(stdout)
        return result.get("repo")
    except json.JSONDecodeError:
        output_error(f"Failed to parse auth result: {stdout}", 3)
        return None


def fetch_pr_metadata(pr_number: int, repo: str) -> dict | None:
    """Fetch PR metadata using gh pr view."""
    fields = "number,title,body,state,author,baseRefName,headRefName,headRefOid,url,isDraft,createdAt,updatedAt"
    
    returncode, stdout, stderr = run_command([
        "gh", "pr", "view", str(pr_number),
        "--repo", repo,
        "--json", fields
    ])
    
    if returncode != 0:
        if "Could not resolve to a PullRequest" in stderr:
            output_error(f"PR #{pr_number} not found in {repo}", 2)
        else:
            output_error(f"Failed to fetch PR: {stderr}", 3)
        return None
    
    try:
        data = json.loads(stdout)
        # Transform to expected format
        return {
            "number": data.get("number"),
            "title": data.get("title"),
            "body": data.get("body"),
            "state": data.get("state"),
            "author": data.get("author", {}).get("login") if isinstance(data.get("author"), dict) else data.get("author"),
            "baseRef": data.get("baseRefName"),
            "headRef": data.get("headRefName"),
            "headSha": data.get("headRefOid"),
            "url": data.get("url"),
            "isDraft": data.get("isDraft"),
            "createdAt": data.get("createdAt"),
            "updatedAt": data.get("updatedAt")
        }
    except json.JSONDecodeError:
        output_error(f"Failed to parse PR metadata: {stdout}", 3)
        return None


def fetch_pr_files(pr_number: int, repo: str) -> list:
    """Fetch changed files using gh pr view."""
    returncode, stdout, stderr = run_command([
        "gh", "pr", "view", str(pr_number),
        "--repo", repo,
        "--json", "files"
    ])
    
    if returncode != 0:
        output_error(f"Failed to fetch files: {stderr}", 3)
        return []
    
    try:
        data = json.loads(stdout)
        files = data.get("files", [])
        return [
            {
                "path": f.get("path"),
                "additions": f.get("additions"),
                "deletions": f.get("deletions"),
                "status": f.get("status")
            }
            for f in files
        ]
    except json.JSONDecodeError:
        output_error(f"Failed to parse files: {stdout}", 3)
        return []


def fetch_pr_diff(pr_number: int, repo: str) -> str:
    """Fetch PR diff using gh pr diff."""
    returncode, stdout, stderr = run_command([
        "gh", "pr", "diff", str(pr_number),
        "--repo", repo
    ])
    
    if returncode != 0:
        output_error(f"Failed to fetch diff: {stderr}", 3)
        return ""
    
    return stdout


def main():
    parser = argparse.ArgumentParser(
        description="Fetch PR metadata, diff, and changed files"
    )
    parser.add_argument(
        "pr_number",
        type=str,
        help="The pull request number to fetch"
    )
    parser.add_argument(
        "repo",
        nargs="?",
        default=None,
        help="Repository in owner/repo format (auto-detects if not provided)"
    )
    
    args = parser.parse_args()
    
    # Validate PR number
    try:
        pr_number = int(args.pr_number)
        if pr_number <= 0:
            raise ValueError("PR number must be positive")
    except ValueError:
        output_error("PR_NUMBER must be a positive integer", 1)
        return
    
    # Get repo (validate auth and detect if needed)
    repo = validate_gh_auth(args.repo)
    if not repo:
        output_error("Could not detect repository. Provide REPO argument.", 1)
        return
    
    # Fetch PR data
    pr_metadata = fetch_pr_metadata(pr_number, repo)
    if pr_metadata is None:
        return  # Error already output
    
    files = fetch_pr_files(pr_number, repo)
    diff = fetch_pr_diff(pr_number, repo)
    
    output_success(pr_metadata, files, diff)


if __name__ == "__main__":
    main()
