#!/usr/bin/env python3
"""
validate-gh-auth.py - Validate GitHub CLI installation and authentication

Usage: ./validate-gh-auth.py [REPO]

Arguments:
  REPO    Optional repository in owner/repo format. If not provided, auto-detects from git remote.

Outputs JSON:
  {
    "authenticated": true|false,
    "repo": "owner/repo" | null,
    "user": "username" | null,
    "error": "error message" | null
  }

Exit codes:
  0 - Success (authenticated and repo detected)
  1 - gh not installed
  2 - gh not authenticated
  3 - Not a git repository or no GitHub remote
"""

import argparse
import json
import re
import subprocess
import sys


def output_json(authenticated: bool, repo, user, error, exit_code: int = 0):
    """Print JSON output and exit."""
    result = {
        "authenticated": authenticated,
        "repo": repo,
        "user": user,
        "error": error
    }
    print(json.dumps(result, indent=2))
    sys.exit(exit_code)


def run_command(args: list[str], check: bool = False) -> tuple[int, str, str]:
    """Run a command and return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            check=check
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except FileNotFoundError:
        return -1, "", f"Command not found: {args[0]}"
    except subprocess.CalledProcessError as e:
        return e.returncode, e.stdout.strip() if e.stdout else "", e.stderr.strip() if e.stderr else ""


def check_gh_installed() -> bool:
    """Check if gh CLI is installed."""
    returncode, _, _ = run_command(["gh", "--version"])
    return returncode == 0


def check_gh_authenticated() -> bool:
    """Check if gh CLI is authenticated."""
    returncode, _, _ = run_command(["gh", "auth", "status"])
    return returncode == 0


def get_authenticated_user() -> str | None:
    """Get the authenticated GitHub username."""
    returncode, stdout, _ = run_command(["gh", "api", "user", "--jq", ".login"])
    if returncode == 0 and stdout:
        return stdout
    return None


def detect_repo_from_git() -> str | None:
    """Detect repository from git remote."""
    # Check if inside a git repository
    returncode, _, _ = run_command(["git", "rev-parse", "--is-inside-work-tree"])
    if returncode != 0:
        return None
    
    # Get origin remote URL
    returncode, remote_url, _ = run_command(["git", "remote", "get-url", "origin"])
    if returncode != 0 or not remote_url:
        return None
    
    # Parse GitHub URL (HTTPS or SSH)
    # HTTPS: https://github.com/owner/repo.git
    # SSH: git@github.com:owner/repo.git
    patterns = [
        r"github\.com[:/]([^/]+)/([^/.]+?)(?:\.git)?$",  # Standard patterns
    ]
    
    for pattern in patterns:
        match = re.search(pattern, remote_url)
        if match:
            owner = match.group(1)
            repo_name = match.group(2)
            return f"{owner}/{repo_name}"
    
    return None


def validate_repo_format(repo: str) -> bool:
    """Validate repository format (owner/repo)."""
    pattern = r"^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$"
    return bool(re.match(pattern, repo))


def main():
    parser = argparse.ArgumentParser(
        description="Validate GitHub CLI installation and authentication"
    )
    parser.add_argument(
        "repo",
        nargs="?",
        default=None,
        help="Repository in owner/repo format (auto-detects if not provided)"
    )
    
    args = parser.parse_args()
    
    # Check if gh is installed
    if not check_gh_installed():
        output_json(
            authenticated=False,
            repo=None,
            user=None,
            error="GitHub CLI (gh) is not installed. Install via: brew install gh (macOS) or see https://cli.github.com/",
            exit_code=1
        )
    
    # Check if gh is authenticated
    if not check_gh_authenticated():
        output_json(
            authenticated=False,
            repo=None,
            user=None,
            error="GitHub CLI is not authenticated. Run: gh auth login",
            exit_code=2
        )
    
    # Get authenticated user
    gh_user = get_authenticated_user()
    
    # Determine repository
    detected_repo = None
    
    if args.repo:
        # Validate provided repo format
        if not validate_repo_format(args.repo):
            output_json(
                authenticated=True,
                repo=None,
                user=gh_user,
                error="Invalid repository format. Expected: owner/repo",
                exit_code=3
            )
        detected_repo = args.repo
    else:
        # Auto-detect from git remote
        detected_repo = detect_repo_from_git()
        
        if detected_repo is None:
            # Check if we're in a git repo at all
            returncode, _, _ = run_command(["git", "rev-parse", "--is-inside-work-tree"])
            if returncode != 0:
                output_json(
                    authenticated=True,
                    repo=None,
                    user=gh_user,
                    error="Not inside a git repository",
                    exit_code=3
                )
            
            # Check for origin remote
            returncode, _, _ = run_command(["git", "remote", "get-url", "origin"])
            if returncode != 0:
                output_json(
                    authenticated=True,
                    repo=None,
                    user=gh_user,
                    error="No origin remote configured",
                    exit_code=3
                )
            
            # Remote exists but isn't GitHub
            output_json(
                authenticated=True,
                repo=None,
                user=gh_user,
                error="Remote is not a GitHub repository",
                exit_code=3
            )
    
    # Success
    output_json(
        authenticated=True,
        repo=detected_repo,
        user=gh_user,
        error=None,
        exit_code=0
    )


if __name__ == "__main__":
    main()
