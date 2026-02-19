#!/usr/bin/env python3
"""
fetch-pr-feedback.py - Fetch all feedback from a PR (reviews, inline comments, general comments)
using GraphQL to include thread IDs for resolution.

Usage: ./fetch-pr-feedback.py <PR_NUMBER> [REPO]

Arguments:
  PR_NUMBER   Required. The pull request number.
  REPO        Optional repository in owner/repo format. Auto-detects if not provided.

Outputs JSON:
  {
    "success": true|false,
    "prNumber": 123,
    "repo": "owner/repo",
    "feedbackItems": [
      {
        "id": "...",
        "type": "review|inline|general",
        "threadId": "PRRT_..." (only for inline),
        "isResolved": true|false (only for inline),
        "author": "...",
        "createdAt": "...",
        "updatedAt": "...",
        "state": "...",
        "body": "...",
        "file": "...",
        "line": 123,
        "url": "..."
      }
    ],
    "summary": {
      "totalItems": 10,
      "reviews": 2,
      "inlineComments": 5,
      "generalComments": 3,
      "authors": ["user1", "user2"]
    },
    "error": null
  }
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
        sys.exit(returncode if returncode in [1, 2, 3] else 3)
    
    try:
        result = json.loads(stdout)
        return result.get("repo")
    except json.JSONDecodeError:
        return detect_repo() if repo is None else repo


def fetch_pr_data_graphql(owner: str, name: str, pr_number: int) -> dict:
    """Fetch PR data including reviews, threads, and comments via GraphQL."""
    query = """
    query($owner: String!, $name: String!, $pr_number: Int!) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $pr_number) {
          id
          
          # General PR Comments
          comments(first: 100) {
            nodes {
              id
              body
              createdAt
              updatedAt
              url
              author { login }
            }
          }
          
          # Reviews (Top-level)
          reviews(first: 100) {
            nodes {
              id
              body
              state
              createdAt
              updatedAt
              url
              author { login }
            }
          }
          
          # Review Threads (Inline Comments)
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              path
              line
              originalLine
              comments(first: 100) {
                nodes {
                  id
                  body
                  createdAt
                  updatedAt
                  url
                  author { login }
                  path
                  line
                  originalLine
                }
              }
            }
          }
        }
      }
    }
    """
    
    returncode, stdout, stderr = run_command([
        "gh", "api", "graphql",
        "-f", f"query={query}",
        "-F", f"owner={owner}",
        "-F", f"name={name}",
        "-F", f"pr_number={pr_number}"
    ])
    
    if returncode != 0:
        output_error(f"GraphQL query failed: {stderr}", 3)
        return {}
        
    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        output_error(f"Failed to parse GraphQL response: {stdout}", 3)
        return {}


def process_feedback(pr_data: dict) -> list:
    """Process and normalize the GraphQL response into flat feedback items."""
    pr = pr_data.get("data", {}).get("repository", {}).get("pullRequest")
    if not pr:
        output_error("PR not found or no access", 2)
        return []
    
    items = []
    
    # 1. Process General Comments
    for comment in pr.get("comments", {}).get("nodes", []):
        items.append({
            "id": comment.get("id"),
            "type": "general",
            "author": comment.get("author", {}).get("login") if comment.get("author") else "ghost",
            "createdAt": comment.get("createdAt"),
            "updatedAt": comment.get("updatedAt"),
            "state": None,
            "body": comment.get("body"),
            "file": None,
            "line": None,
            "url": comment.get("url")
        })
        
    # 2. Process Reviews (Top-level)
    for review in pr.get("reviews", {}).get("nodes", []):
        # Skip empty reviews that just serve as containers for comments if they have no body
        if not review.get("body") and review.get("state") == "COMMENTED":
            continue
            
        items.append({
            "id": review.get("id"),
            "type": "review",
            "author": review.get("author", {}).get("login") if review.get("author") else "ghost",
            "createdAt": review.get("createdAt"),
            "updatedAt": review.get("updatedAt"),
            "state": review.get("state"),
            "body": review.get("body"),
            "file": None,
            "line": None,
            "url": review.get("url")
        })
        
    # 3. Process Review Threads (Inline Comments)
    for thread in pr.get("reviewThreads", {}).get("nodes", []):
        thread_id = thread.get("id")
        is_resolved = thread.get("isResolved")
        
        # We only care about the *last* comment in the thread for "feedback" purposes usually,
        # or all of them? Typically we want each comment.
        # But for resolving, we use the thread ID.
        # Let's emit each comment in the thread as an item, attached to the thread ID.
        
        for comment in thread.get("comments", {}).get("nodes", []):
            items.append({
                "id": comment.get("id"),
                "type": "inline",
                "threadId": thread_id,         # Critical for resolution
                "isResolved": is_resolved,     # Critical for filtering
                "author": comment.get("author", {}).get("login") if comment.get("author") else "ghost",
                "createdAt": comment.get("createdAt"),
                "updatedAt": comment.get("updatedAt"),
                "state": None,
                "body": comment.get("body"),
                "file": comment.get("path") or thread.get("path"),
                "line": comment.get("line") or thread.get("line") or comment.get("originalLine") or thread.get("originalLine"),
                "url": comment.get("url")
            })
            
    return items


def main():
    parser = argparse.ArgumentParser(
        description="Fetch all feedback from a PR"
    )
    parser.add_argument(
        "pr_number",
        type=str,
        help="The pull request number"
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
    
    # Get repo
    repo = validate_gh_auth_with_script(args.repo)
    if not repo:
        output_error("Could not detect repository. Provide REPO argument.", 1)
        return
    
    owner, repo_name = repo.split("/")
    
    # Fetch data
    pr_data = fetch_pr_data_graphql(owner, repo_name, pr_number)
    
    # Process items
    all_items = process_feedback(pr_data)
    
    # Sort by creation date
    all_items.sort(key=lambda x: x.get("createdAt") or "")
    
    # Calculate summary
    reviews_count = sum(1 for i in all_items if i["type"] == "review")
    inline_count = sum(1 for i in all_items if i["type"] == "inline")
    general_count = sum(1 for i in all_items if i["type"] == "general")
    
    # Get unique authors
    authors = sorted(set(
        item.get("author", "")
        for item in all_items
        if item.get("author")
    ))
    
    output_json({
        "success": True,
        "prNumber": pr_number,
        "repo": repo,
        "feedbackItems": all_items,
        "summary": {
            "totalItems": len(all_items),
            "reviews": reviews_count,
            "inlineComments": inline_count,
            "generalComments": general_count,
            "authors": authors
        },
        "error": None
    }, 0)


if __name__ == "__main__":
    main()
