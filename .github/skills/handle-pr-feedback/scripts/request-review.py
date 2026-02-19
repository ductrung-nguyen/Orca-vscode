#!/usr/bin/env python3
"""
request-review.py - Request a review from a GitHub user on a PR

Usage: ./request-review.py <PR_NUMBER> <REVIEWER> [OPTIONS]

Arguments:
  PR_NUMBER   Required. The pull request number.
  REVIEWER    Required. GitHub username to request review from (e.g., 'copilot').

Options:
  --repo REPO    Repository in owner/repo format. Auto-detects if not provided.
  --dry-run      Output payload without posting.

Outputs JSON:
  {
    "success": true|false,
    "prNumber": 123,
    "reviewer": "copilot",
    "repo": "owner/repo",
    "requestedReviewers": ["copilot"],
    "dryRun": false,
    "error": null
  }

Exit codes:
  0 - Success
  1 - Invalid arguments
  2 - PR not found or reviewer not found
  3 - API error (e.g., rate limit, permission denied)
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
    """Detect repository from git remote."""
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
        sys.exit(returncode if returncode in [1, 2, 3] else 3)
    
    try:
        result = json.loads(stdout)
        return result.get("repo")
    except json.JSONDecodeError:
        return detect_repo() if repo is None else repo


def request_reviewer(owner: str, repo_name: str, pr_number: int, reviewer: str, dry_run: bool = False) -> dict:
    """Request a review from a GitHub user on a PR.
    
    For re-review of regular users: First removes the reviewer, then re-adds them.
    This triggers a fresh review request even if they've already reviewed.
    
    For Copilot: Skips the DELETE step since Copilot reviews are configured
    automatically via repository settings (copilot_code_review ruleset) and
    cannot be re-added via API once removed. For Copilot re-reviews, push new
    commits to trigger the `review_on_push` behavior.
    
    Note: This script does NOT trigger a fresh Copilot re-review - it only
    preserves the automatic Copilot assignment that was set when the PR opened.
    """
    api_endpoint = f"/repos/{owner}/{repo_name}/pulls/{pr_number}/requested_reviewers"
    payload = {"reviewers": [reviewer]}
    
    # Check if this is a Copilot reviewer (case-insensitive)
    # Verified username from GitHub timeline API: "login": "Copilot" (user.type: "Bot")
    # See: /repos/{owner}/{repo}/issues/{pr}/timeline -> copilot_work_started event
    is_copilot = reviewer.lower() in ["copilot", "github-copilot", "copilot[bot]", "github-copilot[bot]"]
    
    # Dry run mode
    if dry_run:
        return {
            "success": True,
            "prNumber": pr_number,
            "reviewer": reviewer,
            "repo": f"{owner}/{repo_name}",
            "requestedReviewers": [reviewer],
            "dryRun": True,
            "endpoint": api_endpoint,
            "payload": payload,
            "skipDelete": is_copilot,
            "error": None
        }
    
    # Step 1: Remove the reviewer first (to enable re-review)
    # SKIP for Copilot - removing Copilot loses the automatic review permanently
    # For regular users, this is safe - if they're not a reviewer, DELETE succeeds silently
    if not is_copilot:
        returncode, _, _ = run_command(
            [
                "gh", "api",
                "--method", "DELETE",
                "-H", "Accept: application/vnd.github+json",
                api_endpoint,
                "--input", "-"
            ],
            input_data=json.dumps(payload)
        )
        # Ignore errors from DELETE - reviewer might not be requested yet
    
    # Step 2: Add the reviewer (fresh request)
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
        error_msg = stderr.strip()
        # Check for common error cases
        if "Not Found" in error_msg or "404" in error_msg:
            return {
                "success": False,
                "prNumber": pr_number,
                "reviewer": reviewer,
                "repo": f"{owner}/{repo_name}",
                "error": f"PR #{pr_number} not found or reviewer '{reviewer}' not found"
            }
        elif "422" in error_msg or "Unprocessable" in error_msg:
            # Could be: reviewer is PR author, reviewer already requested, etc.
            # For Copilot: treat "already requested" as success since our goal
            # is to preserve the automatic assignment, not trigger a re-review
            if is_copilot and ("already" in error_msg.lower() or "requested" in error_msg.lower()):
                return {
                    "success": True,
                    "prNumber": pr_number,
                    "reviewer": reviewer,
                    "repo": f"{owner}/{repo_name}",
                    "requestedReviewers": [reviewer],
                    "dryRun": False,
                    "note": "Copilot already assigned (automatic review preserved)",
                    "error": None
                }
            return {
                "success": False,
                "prNumber": pr_number,
                "reviewer": reviewer,
                "repo": f"{owner}/{repo_name}",
                "error": f"Cannot request review from '{reviewer}': {error_msg}"
            }
        else:
            return {
                "success": False,
                "prNumber": pr_number,
                "reviewer": reviewer,
                "repo": f"{owner}/{repo_name}",
                "error": f"API error: {error_msg}"
            }
    
    # Parse response
    try:
        response = json.loads(stdout)
        # Note: requested_reviewers may be empty for bot accounts like Copilot
        # The request still succeeds and triggers the review
        requested = [u.get("login", "") for u in response.get("requested_reviewers", [])]
        return {
            "success": True,
            "prNumber": pr_number,
            "reviewer": reviewer,
            "repo": f"{owner}/{repo_name}",
            "requestedReviewers": requested if requested else [reviewer],  # Report as requested even if empty
            "dryRun": False,
            "error": None
        }
    except json.JSONDecodeError:
        return {
            "success": False,
            "prNumber": pr_number,
            "reviewer": reviewer,
            "repo": f"{owner}/{repo_name}",
            "error": f"Failed to parse API response: {stdout}"
        }


def main():
    parser = argparse.ArgumentParser(
        description="Request a review from a GitHub user on a PR"
    )
    parser.add_argument(
        "pr_number",
        type=str,
        help="The pull request number"
    )
    parser.add_argument(
        "reviewer",
        type=str,
        help="GitHub username to request review from (e.g., 'copilot')"
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="Repository in owner/repo format (auto-detects if not provided)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Output payload without posting"
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
    
    # Validate reviewer
    reviewer = args.reviewer.strip()
    if not reviewer:
        output_error("REVIEWER is required", 1)
        return
    
    # Remove @ prefix if present
    if reviewer.startswith("@"):
        reviewer = reviewer[1:]
    
    # Get repo
    repo = validate_gh_auth_with_script(args.repo)
    if not repo:
        output_error("Could not detect repository. Provide --repo argument.", 1)
        return
    
    owner, repo_name = repo.split("/")
    
    # Request the review
    result = request_reviewer(owner, repo_name, pr_number, reviewer, args.dry_run)
    
    # Output result
    exit_code = 0
    if not result.get("success"):
        error = result.get("error", "")
        if "not found" in error.lower():
            exit_code = 2
        else:
            exit_code = 3
    
    output_json(result, exit_code)


if __name__ == "__main__":
    main()
