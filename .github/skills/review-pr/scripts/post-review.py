#!/usr/bin/env python3
"""
post-review.py - Submit a PR review with optional inline comments

Usage: ./post-review.py <PR_NUMBER> <EVENT> [OPTIONS]

Arguments:
  PR_NUMBER   Required. The pull request number.
  EVENT       Required. Review event: COMMENT, APPROVE, or REQUEST_CHANGES

Options:
  --repo REPO           Repository in owner/repo format (auto-detects if not provided)
  --body-file FILE      Path to file containing review body
  --body TEXT           Review body text (use --body-file for multi-line)
  --comments-file FILE  Path to JSON file containing inline comments array
  --dry-run             Output payload without posting
  --max-comments N      Maximum inline comments (default: 10)

Inline comments JSON format:
  [
    {
      "path": "src/file.ts",
      "line": 42,
      "body": "Comment text"
    }
  ]

Outputs JSON:
  {
    "success": true|false,
    "reviewId": "...",
    "url": "https://github.com/...",
    "commentsPosted": 5,
    "commentsCapped": false,
    "dryRun": false,
    "error": null
  }

Exit codes:
  0 - Success
  1 - Invalid arguments
  2 - API error
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def output_json(data: dict, exit_code: int = 0):
    """Print JSON and exit."""
    print(json.dumps(data, indent=2))
    sys.exit(exit_code)


def output_error(error: str, exit_code: int = 1):
    """Print error JSON and exit."""
    output_json({"success": False, "error": error}, exit_code)


def run_command(args: list[str], input_data: str | None = None) -> tuple[int, str, str]:
    """Run a command and return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            input=input_data
        )
        return result.returncode, result.stdout, result.stderr
    except FileNotFoundError:
        return -1, "", f"Command not found: {args[0]}"


def validate_gh_auth(repo: str | None = None) -> str | None:
    """Validate gh auth and get repo."""
    script_dir = Path(__file__).parent
    validate_script = script_dir / "validate-gh-auth.py"
    
    args = ["python3", str(validate_script)]
    if repo:
        args.append(repo)
    
    returncode, stdout, stderr = run_command(args)
    
    if returncode != 0:
        print(stdout if stdout else stderr)
        sys.exit(returncode if returncode in [1, 2, 3] else 2)
    
    try:
        result = json.loads(stdout)
        return result.get("repo")
    except json.JSONDecodeError:
        output_error(f"Failed to parse auth result: {stdout}", 2)
        return None


def get_head_sha(pr_number: int, repo: str) -> str | None:
    """Get the head SHA of a PR."""
    returncode, stdout, stderr = run_command([
        "gh", "pr", "view", str(pr_number),
        "--repo", repo,
        "--json", "headRefOid",
        "--jq", ".headRefOid"
    ])
    
    if returncode != 0:
        output_error(f"Failed to get PR head SHA: {stderr}", 2)
        return None
    
    return stdout.strip()


def main():
    parser = argparse.ArgumentParser(
        description="Submit a PR review with optional inline comments"
    )
    parser.add_argument(
        "pr_number",
        type=str,
        help="The pull request number"
    )
    parser.add_argument(
        "event",
        type=str,
        help="Review event: COMMENT, APPROVE, or REQUEST_CHANGES"
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="Repository in owner/repo format"
    )
    parser.add_argument(
        "--body",
        default=None,
        help="Review body text"
    )
    parser.add_argument(
        "--body-file",
        default=None,
        help="Path to file containing review body"
    )
    parser.add_argument(
        "--comments-file",
        default=None,
        help="Path to JSON file containing inline comments"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Output payload without posting"
    )
    parser.add_argument(
        "--max-comments",
        type=int,
        default=10,
        help="Maximum inline comments (default: 10)"
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
    
    # Validate and normalize event
    event = args.event.upper()
    if event not in ["COMMENT", "APPROVE", "REQUEST_CHANGES"]:
        output_error("EVENT must be COMMENT, APPROVE, or REQUEST_CHANGES", 1)
        return
    
    # Get repo
    repo = validate_gh_auth(args.repo)
    if not repo:
        output_error("Could not detect repository. Provide --repo argument.", 1)
        return
    
    # Get review body
    body = args.body
    if args.body_file:
        body_path = Path(args.body_file)
        if not body_path.exists():
            output_error(f"Body file not found: {args.body_file}", 1)
            return
        body = body_path.read_text()
    
    # Default body if none provided
    if not body:
        if event == "APPROVE":
            body = "Looks good to me! ✅"
        elif event == "REQUEST_CHANGES":
            body = "Please address the following concerns."
        else:
            body = "Review comments attached."
    
    # Get head SHA for inline comments
    head_sha = get_head_sha(pr_number, repo)
    if not head_sha:
        return  # Error already output
    
    # Process inline comments
    comments = []
    comments_capped = False
    comments_count = 0
    
    if args.comments_file:
        comments_path = Path(args.comments_file)
        if not comments_path.exists():
            output_error(f"Comments file not found: {args.comments_file}", 1)
            return
        
        try:
            raw_comments = json.loads(comments_path.read_text())
        except json.JSONDecodeError as e:
            output_error(f"Invalid comments JSON: {e}", 1)
            return
        
        total_comments = len(raw_comments)
        
        # Cap comments if needed
        if total_comments > args.max_comments:
            comments_capped = True
            raw_comments = raw_comments[:args.max_comments]
        
        comments_count = len(raw_comments)
        
        # Transform comments to API format
        comments = [
            {
                "path": c.get("path"),
                "line": c.get("line"),
                "body": c.get("body"),
                "commit_id": head_sha
            }
            for c in raw_comments
        ]
    
    # Build API payload
    payload = {
        "body": body,
        "event": event,
        "commit_id": head_sha,
        "comments": comments
    }
    
    # Dry run mode
    if args.dry_run:
        output_json({
            "success": True,
            "dryRun": True,
            "payload": payload,
            "repo": repo,
            "prNumber": pr_number,
            "commentsCount": comments_count,
            "commentsCapped": comments_capped,
            "error": None
        }, 0)
        return
    
    # Submit the review
    owner, repo_name = repo.split("/")
    api_endpoint = f"/repos/{owner}/{repo_name}/pulls/{pr_number}/reviews"
    
    returncode, stdout, stderr = run_command(
        [
            "gh", "api",
            "--method", "POST",
            "-H", "Accept: application/vnd.github+json",
            api_endpoint,
            "--input", "-"
        ],
        input_data=json.dumps(payload)
    )
    
    if returncode != 0:
        output_error(f"Failed to post review: {stderr}", 2)
        return
    
    # Extract review info
    try:
        response = json.loads(stdout)
        review_id = str(response.get("id", ""))
        review_url = response.get("html_url", "")
    except json.JSONDecodeError:
        output_error(f"Failed to parse response: {stdout}", 2)
        return
    
    output_json({
        "success": True,
        "reviewId": review_id,
        "url": review_url,
        "commentsPosted": comments_count,
        "commentsCapped": comments_capped,
        "dryRun": False,
        "error": None
    }, 0)


if __name__ == "__main__":
    main()
