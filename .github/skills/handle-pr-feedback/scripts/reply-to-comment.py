#!/usr/bin/env python3
"""
reply-to-comment.py - Reply to a PR comment (inline or general)

Usage: ./reply-to-comment.py <COMMENT_ID> <COMMENT_TYPE> [OPTIONS]

Arguments:
  COMMENT_ID    Required. The ID of the comment to reply to.
  COMMENT_TYPE  Required. Type of comment: "inline" or "general"

Options:
  --repo REPO           Repository in owner/repo format
  --body TEXT           Reply body text
  --body-file FILE      Path to file containing reply body (recommended)
  --pr-number NUMBER    PR number (REQUIRED for both inline and general comments)
  --dry-run             Output payload without posting

Outputs JSON:
  {
    "success": true|false,
    "replyId": "...",
    "url": "https://github.com/...",
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
import re
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


def detect_repo() -> str | None:
    """Detect repository from git remote (inline detection)."""
    # Check if inside a git repository
    returncode, _, _ = run_command(["git", "rev-parse", "--is-inside-work-tree"])
    if returncode != 0:
        return None
    
    # Get origin remote URL
    returncode, remote_url, _ = run_command(["git", "remote", "get-url", "origin"])
    if returncode != 0 or not remote_url:
        return None
    
    # Parse GitHub URL
    pattern = r"github\.com[:/]([^/]+)/([^/.]+?)(?:\.git)?$"
    match = re.search(pattern, remote_url.strip())
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    
    return None


def validate_gh_auth_with_script(repo: str | None = None) -> str | None:
    """Try to use validate-gh-auth.py if available."""
    script_dir = Path(__file__).parent
    # Look for the script in review-pr skill
    validate_script = script_dir.parent.parent / "review-pr" / "scripts" / "validate-gh-auth.py"
    
    if not validate_script.exists():
        # Fall back to inline detection
        return detect_repo() if repo is None else repo
    
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
        return detect_repo() if repo is None else repo


def resolve_db_id(node_id: str) -> int | None:
    """Resolve a GraphQL node ID to a database integer ID."""
    query = """
    query($id: ID!) {
        node(id: $id) {
            ... on PullRequestReviewComment {
                databaseId
            }
        }
    }
    """
    returncode, stdout, stderr = run_command([
        "gh", "api", "graphql",
        "-f", f"query={query}",
        "-f", f"id={node_id}"
    ])
    
    if returncode != 0:
        return None
        
    try:
        data = json.loads(stdout)
        return data.get("data", {}).get("node", {}).get("databaseId")
    except (json.JSONDecodeError, AttributeError):
        return None


def main():
    parser = argparse.ArgumentParser(
        description="Reply to a PR comment (inline or general)"
    )
    parser.add_argument(
        "comment_id",
        type=str,
        help="The ID of the comment to reply to"
    )
    parser.add_argument(
        "comment_type",
        type=str,
        help="Type of comment: inline or general"
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="Repository in owner/repo format"
    )
    parser.add_argument(
        "--body",
        default=None,
        help="Reply body text"
    )
    parser.add_argument(
        "--body-file",
        default=None,
        help="Path to file containing reply body"
    )
    parser.add_argument(
        "--pr-number",
        type=int,
        default=None,
        help="PR number (required for general comments)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Output payload without posting"
    )
    
    args = parser.parse_args()
    
    # Validate comment ID
    comment_id = args.comment_id
    if not comment_id:
        output_error("COMMENT_ID is required", 1)
        return
    
    # Validate and normalize comment type
    comment_type = args.comment_type.lower()
    if comment_type not in ["inline", "general"]:
        output_error("COMMENT_TYPE must be inline or general", 1)
        return
    
    # Get repo
    repo = validate_gh_auth_with_script(args.repo)
    if not repo:
        output_error("Could not detect repository. Provide --repo argument.", 1)
        return
    
    owner, repo_name = repo.split("/")
    
    # Get reply body
    body = args.body
    if args.body_file:
        body_path = Path(args.body_file)
        if not body_path.exists():
            output_error(f"Body file not found: {args.body_file}", 1)
            return
        body = body_path.read_text()
    
    if not body:
        output_error("Reply body is required. Use --body or --body-file", 1)
        return
    
    # Build payload
    payload = {"body": body}
    
    # Determine API endpoint and payload based on comment type
    if comment_type == "inline":
        if args.pr_number is None:
            output_error("PR_NUMBER is required for inline comment replies (use --pr-number)", 1)
            return
        api_endpoint = f"/repos/{owner}/{repo_name}/pulls/{args.pr_number}/comments"
        # For inline replies, add in_reply_to field
        try:
            reply_to_id = int(comment_id)
        except ValueError:
            # Not an integer, try resolving from GraphQL ID
            reply_to_id = resolve_db_id(comment_id)
            if reply_to_id is None:
                output_error(f"Invalid comment ID format and could not resolve: {comment_id}", 1)
                return
                
        payload["in_reply_to"] = reply_to_id
    else:  # general
        if args.pr_number is None:
            output_error("PR_NUMBER is required for general comment replies (use --pr-number)", 1)
            return
        api_endpoint = f"/repos/{owner}/{repo_name}/issues/{args.pr_number}/comments"
    
    # Dry run mode
    if args.dry_run:
        output_json({
            "success": True,
            "dryRun": True,
            "endpoint": api_endpoint,
            "payload": payload,
            "repo": repo,
            "commentId": comment_id,
            "commentType": comment_type,
            "error": None
        }, 0)
        return
    
    # Post the reply
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
        output_error(f"Failed to post reply: {stderr}", 2)
        return
    
    # Extract reply info
    try:
        response = json.loads(stdout)
        reply_id = str(response.get("id", ""))
        reply_url = response.get("html_url", "")
    except json.JSONDecodeError:
        output_error(f"Failed to parse response: {stdout}", 2)
        return
    
    output_json({
        "success": True,
        "replyId": reply_id,
        "url": reply_url,
        "dryRun": False,
        "error": None
    }, 0)


if __name__ == "__main__":
    main()
