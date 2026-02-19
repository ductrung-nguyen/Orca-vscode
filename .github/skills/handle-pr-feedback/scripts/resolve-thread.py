#!/usr/bin/env python3
"""
resolve-thread.py - Resolve or unresolve PR review threads

Usage: ./resolve-thread.py <THREAD_ID> [OPTIONS]

Arguments:
  THREAD_ID    Required. The GraphQL node ID of the review thread (starts with PRRT_)

Options:
  --unresolve      Unresolve the thread instead of resolving
  --dry-run        Output payload without executing

Outputs JSON:
  {
    "success": true|false,
    "threadId": "PRRT_...",
    "resolved": true|false,
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


def main():
    parser = argparse.ArgumentParser(
        description="Resolve or unresolve a PR review thread"
    )
    parser.add_argument(
        "thread_id",
        type=str,
        help="The GraphQL node ID of the review thread (PRRT_...)"
    )
    parser.add_argument(
        "--unresolve",
        action="store_true",
        help="Unresolve the thread instead of resolving"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Output payload without executing"
    )
    
    args = parser.parse_args()
    
    thread_id = args.thread_id
    if not thread_id:
        output_error("THREAD_ID is required", 1)
        return
    
    if not thread_id.startswith("PRRT_"):
        output_error("THREAD_ID must be a GraphQL node ID starting with PRRT_", 1)
        return
    
    # Build mutation
    if args.unresolve:
        mutation = """
        mutation($threadId: ID!) {
          unresolveReviewThread(input: {threadId: $threadId}) {
            thread {
              id
              isResolved
            }
          }
        }
        """
        result_key = "unresolveReviewThread"
    else:
        mutation = """
        mutation($threadId: ID!) {
          resolveReviewThread(input: {threadId: $threadId}) {
            thread {
              id
              isResolved
            }
          }
        }
        """
        result_key = "resolveReviewThread"
    
    # Dry run mode
    if args.dry_run:
        output_json({
            "success": True,
            "dryRun": True,
            "threadId": thread_id,
            "action": "unresolve" if args.unresolve else "resolve",
            "mutation": mutation.strip(),
            "error": None
        }, 0)
        return
    
    # Execute mutation
    returncode, stdout, stderr = run_command(
        [
            "gh", "api", "graphql",
            "-f", f"query={mutation}",
            "-f", f"threadId={thread_id}"
        ]
    )
    
    if returncode != 0:
        output_error(f"Failed to resolve thread: {stderr}", 2)
        return
    
    # Parse response
    try:
        response = json.loads(stdout)
        if "errors" in response:
            output_error(f"GraphQL error: {response['errors']}", 2)
            return
        
        thread_data = response.get("data", {}).get(result_key, {}).get("thread", {})
        resolved = thread_data.get("isResolved", not args.unresolve)
    except json.JSONDecodeError:
        output_error(f"Failed to parse response: {stdout}", 2)
        return
    
    output_json({
        "success": True,
        "threadId": thread_id,
        "resolved": resolved,
        "dryRun": False,
        "error": None
    }, 0)


if __name__ == "__main__":
    main()
