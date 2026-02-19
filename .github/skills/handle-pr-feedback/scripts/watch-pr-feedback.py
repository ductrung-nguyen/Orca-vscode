#!/usr/bin/env python3
"""
watch-pr-feedback.py - Watch a PR for new feedback with state tracking

Usage: ./watch-pr-feedback.py <PR_NUMBER> [OPTIONS]

Arguments:
  PR_NUMBER   Required. The pull request number to watch.

Options:
  --repo REPO             Repository in owner/repo format. Auto-detects if not provided.
  --timeout MINUTES       Maximum watch duration (default: 30)
  --interval SECONDS      Poll interval (default: 60)
  --state-file FILE       State persistence file (optional)
  --no-new-threshold N    Stop after N consecutive polls with no new feedback (default: 3)
  --once                  Check once and exit (no loop)

Outputs JSON:
  {
    "success": true|false,
    "prNumber": 123,
    "repo": "owner/repo",
    "hasNewFeedback": true|false,
    "newFeedbackItems": [...],
    "summary": {
      "totalNew": 2,
      "pollCount": 5,
      "elapsedMinutes": 10.5,
      "exitReason": "new_feedback|timeout|no_new_threshold|single_poll"
    },
    "state": {
      "lastProcessedAt": "2026-01-06T12:00:00Z",
      "processedFeedbackIds": ["12345", "23456"],
      "loopIterations": 5
    },
    "error": null
  }

Exit codes:
  0 - Success (with or without new feedback)
  1 - Invalid arguments
  2 - PR not found
  3 - API error
  4 - State file error (invalid JSON)

Copilot Review Detection:
  By default, the script monitors the PR timeline for Copilot review activity.
  If Copilot is actively reviewing (copilot_work_started event with no subsequent
  reviewed event), the script will wait. If Copilot hasn't started reviewing
  after --min-wait seconds, it exits early with reason 'copilot_not_reviewing'.
"""

import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
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
    returncode, _, _ = run_command(["git", "rev-parse", "--is-inside-work-tree"])
    if returncode != 0:
        return None
    
    returncode, remote_url, _ = run_command(["git", "remote", "get-url", "origin"])
    if returncode != 0 or not remote_url:
        return None
    
    pattern = r"github\.com[:/]([^/]+)/([^/.]+?)(?:\.git)?$"
    match = re.search(pattern, remote_url.strip())
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    
    return None


def validate_gh_auth_with_script(repo: str | None = None) -> str | None:
    """Try to use validate-gh-auth.py if available."""
    script_dir = Path(__file__).parent
    validate_script = script_dir.parent.parent / "review-pr" / "scripts" / "validate-gh-auth.py"
    
    if not validate_script.exists():
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


def load_state(state_file: str | None) -> dict:
    """Load state from file or return empty state."""
    default_state = {
        "prNumber": None,
        "repo": None,
        "startedAt": None,
        "lastProcessedAt": None,
        "processedFeedbackIds": [],
        "loopIterations": 0
    }
    
    if not state_file:
        return default_state
    
    state_path = Path(state_file)
    if not state_path.exists():
        return default_state
    
    try:
        content = state_path.read_text()
        state = json.loads(content)
        # Ensure required fields exist
        for key in default_state:
            if key not in state:
                state[key] = default_state[key]
        return state
    except json.JSONDecodeError as e:
        output_error(f"State file is invalid JSON: {e}. Delete or repair the file.", 4)
        return default_state  # unreachable


def save_state(state_file: str | None, state: dict):
    """Save state to file if provided."""
    if not state_file:
        return
    
    state_path = Path(state_file)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(state, indent=2))


def fetch_feedback(pr_number: int, repo: str) -> tuple[list[dict], str | None]:
    """
    Fetch all feedback from a PR using fetch-pr-feedback.py.
    
    Returns:
        Tuple of (feedback_items, error_message)
        - On success: (items, None)
        - On rate limit: ([], "rate_limited")
        - On other error: ([], error_message)
    """
    script_dir = Path(__file__).parent
    fetch_script = script_dir / "fetch-pr-feedback.py"
    
    if not fetch_script.exists():
        return [], f"fetch-pr-feedback.py not found at {fetch_script}"
    
    returncode, stdout, stderr = run_command([
        "python3", str(fetch_script), str(pr_number), repo
    ])
    
    if returncode != 0:
        # Check for rate limiting
        if "rate limit" in stderr.lower() or "403" in stderr:
            return [], "rate_limited"
        # Check for specific exit codes
        if returncode == 2:
            return [], f"PR #{pr_number} not found"
        return [], f"Failed to fetch feedback: {stderr or stdout}"
    
    try:
        result = json.loads(stdout)
        if not result.get("success"):
            error = result.get("error", "Unknown error")
            if "rate limit" in error.lower():
                return [], "rate_limited"
            return [], error
        return result.get("feedbackItems", []), None
    except json.JSONDecodeError:
        return [], f"Failed to parse feedback response: {stdout}"


def filter_new_feedback(
    all_feedback: list[dict],
    last_processed_at: str | None,
    processed_ids: list[str]
) -> list[dict]:
    """Filter feedback to only new items based on timestamp and ID."""
    new_items = []
    
    for item in all_feedback:
        item_id = str(item.get("id", ""))
        item_created = item.get("createdAt", "")
        
        # Skip if already processed
        if item_id in processed_ids:
            continue
        
        # If we have a last processed timestamp, check if item is newer
        if last_processed_at and item_created:
            if item_created <= last_processed_at:
                continue
        
        new_items.append(item)
    
    return new_items


def get_current_timestamp() -> str:
    """Get current timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_copilot_review_status(pr_number: int, repo: str) -> dict:
    """
    Check if Copilot is currently reviewing the PR by examining the timeline.
    
    Returns:
        {
            "status": "reviewing" | "completed" | "not_started" | "unknown",
            "lastEventAt": timestamp or None,
            "error": error message or None
        }
    
    Logic:
        - Count copilot_work_started events and reviewed events from Copilot
        - If starts > completed → still reviewing
        - If starts == completed and starts > 0 → completed  
        - If no Copilot events → not_started
    """
    owner, repo_name = repo.split("/")
    api_endpoint = f"/repos/{owner}/{repo_name}/issues/{pr_number}/timeline"
    
    returncode, stdout, stderr = run_command([
        "gh", "api", "--paginate",
        "-H", "Accept: application/vnd.github+json",
        api_endpoint
    ])
    
    if returncode != 0:
        return {
            "status": "unknown",
            "lastEventAt": None,
            "error": f"Failed to fetch timeline: {stderr}"
        }
    
    try:
        events = json.loads(stdout)
    except json.JSONDecodeError:
        return {
            "status": "unknown",
            "lastEventAt": None,
            "error": "Failed to parse timeline JSON"
        }
    
    # Count Copilot events
    # Track latest event timestamps
    last_started_at = None
    last_reviewed_at = None
    
    for event in events:
        event_type = event.get("event", "")
        created_at = event.get("created_at", "")
        
        if event_type == "copilot_work_started":
            if not last_started_at or created_at > last_started_at:
                last_started_at = created_at
        
        # Check for reviewed event from Copilot
        if event_type == "reviewed":
            user = event.get("user", {})
            if user.get("login", "").lower() == "copilot" or user.get("type") == "Bot":
                submitted_at = event.get("submitted_at", created_at)
                if not last_reviewed_at or submitted_at > last_reviewed_at:
                    last_reviewed_at = submitted_at
    
    # Determine status based on timestamps
    if not last_started_at:
        # Never started (or event not found)
        status = "not_started"
    elif not last_reviewed_at:
        # Started but never reviewed
        status = "reviewing"
    elif last_started_at > last_reviewed_at:
        # Started AFTER the last review
        status = "reviewing"
    else:
        # Last review is newer than last start
        status = "completed"
    
    # Determine last event time
    last_event_at = last_started_at
    if last_reviewed_at:
        if not last_event_at or last_reviewed_at > last_event_at:
            last_event_at = last_reviewed_at

    return {
        "status": status,
        "lastEventAt": last_event_at,
        "copilotStartedAt": last_started_at,
        "copilotReviewedAt": last_reviewed_at,
        "error": None
    }


def poll_for_feedback(
    pr_number: int,
    repo: str,
    state: dict,
    timeout_minutes: float,
    interval_seconds: float,
    no_new_threshold: int,
    once: bool,
    detect_copilot: bool = True,
    min_wait_seconds: float = 60.0
) -> dict:
    """
    Poll for new feedback until timeout, no-new-threshold, or new feedback found.
    
    With detect_copilot=True (default):
      - Checks if Copilot is actively reviewing via timeline API
      - If Copilot isn't reviewing after min_wait_seconds, exits early
      - If Copilot is reviewing, continues waiting until review completes
    
    Returns result dict with all information.
    """
    start_time = time.time()
    deadline_seconds = timeout_minutes * 60
    poll_count = 0
    consecutive_no_new = 0
    all_new_items: list[dict] = []
    rate_limit_backoff = 30  # Initial backoff in seconds
    max_rate_limit_backoff = 300  # Max 5 minutes
    copilot_status_info: dict = {}  # Track Copilot status for reporting
    checked_copilot_after_min_wait = False
    
    # Initialize state if not set
    if not state.get("startedAt"):
        state["startedAt"] = get_current_timestamp()
    if state.get("prNumber") is None:
        state["prNumber"] = pr_number
    if state.get("repo") is None:
        state["repo"] = repo
    
    while True:
        poll_count += 1
        state["loopIterations"] = state.get("loopIterations", 0) + 1
        
        # Fetch current feedback (with rate limit handling - FR-21)
        all_feedback, fetch_error = fetch_feedback(pr_number, repo)
        
        # Handle fetch errors
        if fetch_error:
            if fetch_error == "rate_limited":
                # FR-21: Back off and continue until timeout
                elapsed = time.time() - start_time
                if elapsed + rate_limit_backoff >= deadline_seconds:
                    exit_reason = "timeout"
                    break
                # Exponential backoff with max cap
                time.sleep(rate_limit_backoff)
                rate_limit_backoff = min(rate_limit_backoff * 2, max_rate_limit_backoff)
                continue
            elif "not found" in fetch_error.lower():
                # PR not found - fail fast (FR-22)
                output_error(fetch_error, 2)
                return {"success": False, "error": fetch_error}
            else:
                # Other API error - back off and retry
                elapsed = time.time() - start_time
                if elapsed + interval_seconds >= deadline_seconds:
                    exit_reason = "timeout"
                    break
                time.sleep(interval_seconds)
                continue
        
        # Reset rate limit backoff on successful fetch
        rate_limit_backoff = 30
        
        # Filter to new items
        new_items = filter_new_feedback(
            all_feedback,
            state.get("lastProcessedAt"),
            state.get("processedFeedbackIds", [])
        )
        
        if new_items:
            # Found new feedback
            all_new_items.extend(new_items)
            
            # Update state with new items
            newest_timestamp = max(
                (item.get("createdAt", "") for item in new_items),
                default=get_current_timestamp()
            )
            state["lastProcessedAt"] = newest_timestamp
            # Deterministic: maintain sorted order for reproducibility (NFR-3)
            existing_ids = set(state.get("processedFeedbackIds", []))
            new_ids = [str(item.get("id", "")) for item in new_items]
            all_ids = existing_ids.union(new_ids)
            state["processedFeedbackIds"] = sorted(all_ids)
            
            exit_reason = "new_feedback"
            break
        else:
            consecutive_no_new += 1
        
        # Check exit conditions
        if once:
            exit_reason = "single_poll"
            break
        
        # Check Copilot status periodically (not just once after min-wait)
        elapsed = time.time() - start_time
        if detect_copilot and elapsed >= min_wait_seconds:
            copilot_status_info = get_copilot_review_status(pr_number, repo)
            copilot_status = copilot_status_info.get("status")
            

            if copilot_status == "not_started" and not checked_copilot_after_min_wait:
                # Copilot hasn't started after min-wait - no point waiting
                checked_copilot_after_min_wait = True
                exit_reason = "copilot_not_reviewing"
                break
            
            # If Copilot is actively reviewing, DON'T exit on no-new-threshold
            # Keep waiting until Copilot completes or timeout
            if copilot_status == "reviewing":
                # Reset consecutive count - we expect feedback is coming
                consecutive_no_new = 0
            elif copilot_status == "completed":
                # Copilot finished - apply normal threshold
                if consecutive_no_new >= no_new_threshold:
                    exit_reason = "no_new_threshold"
                    break
        else:
            # Copilot detection disabled or before min-wait
            if consecutive_no_new >= no_new_threshold:
                exit_reason = "no_new_threshold"
                break
        
        elapsed = time.time() - start_time
        if elapsed >= deadline_seconds:
            exit_reason = "timeout"
            break
        
        # Wait for next poll
        time.sleep(interval_seconds)
    
    elapsed_minutes = (time.time() - start_time) / 60
    
    return {
        "success": True,
        "prNumber": pr_number,
        "repo": repo,
        "hasNewFeedback": len(all_new_items) > 0,
        "newFeedbackItems": all_new_items,
        "summary": {
            "totalNew": len(all_new_items),
            "pollCount": poll_count,
            "elapsedMinutes": round(elapsed_minutes, 2),
            "exitReason": exit_reason,
            "copilotStatus": copilot_status_info.get("status") if copilot_status_info else None
        },
        "state": {
            "prNumber": pr_number,
            "repo": repo,
            "startedAt": state.get("startedAt"),
            "lastProcessedAt": state.get("lastProcessedAt"),
            "processedFeedbackIds": state.get("processedFeedbackIds", []),
            "loopIterations": state.get("loopIterations", 0)
        },
        "error": None
    }


def main():
    parser = argparse.ArgumentParser(
        description="Watch a PR for new feedback with state tracking"
    )
    parser.add_argument(
        "pr_number",
        type=str,
        help="The pull request number to watch"
    )
    parser.add_argument(
        "--repo",
        default=None,
        help="Repository in owner/repo format (auto-detects if not provided)"
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="Maximum watch duration in minutes (default: 30)"
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=60.0,
        help="Poll interval in seconds (default: 60)"
    )
    parser.add_argument(
        "--state-file",
        default=None,
        help="State persistence file (optional)"
    )
    parser.add_argument(
        "--no-new-threshold",
        type=int,
        default=3,
        help="Stop after N consecutive polls with no new feedback (default: 3)"
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Check once and exit (no loop)"
    )
    parser.add_argument(
        "--detect-copilot",
        action="store_true",
        default=True,
        help="Enable smart Copilot review detection (default: true)"
    )
    parser.add_argument(
        "--no-detect-copilot",
        action="store_false",
        dest="detect_copilot",
        help="Disable Copilot review detection"
    )
    parser.add_argument(
        "--min-wait",
        type=float,
        default=60.0,
        help="Minimum seconds before checking Copilot status (default: 60)"
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
    
    # Validate timeout
    if args.timeout <= 0:
        output_error("Timeout must be positive", 1)
        return
    
    # Validate interval
    if args.interval <= 0:
        output_error("Interval must be positive", 1)
        return
    
    # Validate threshold
    if args.no_new_threshold <= 0:
        output_error("No-new-threshold must be positive", 1)
        return
    
    # Get repo
    repo = validate_gh_auth_with_script(args.repo)
    if not repo:
        output_error("Could not detect repository. Provide --repo argument.", 1)
        return
    
    # Load state
    state = load_state(args.state_file)
    
    # Run polling
    result = poll_for_feedback(
        pr_number=pr_number,
        repo=repo,
        state=state,
        timeout_minutes=args.timeout,
        interval_seconds=args.interval,
        no_new_threshold=args.no_new_threshold,
        once=args.once,
        detect_copilot=args.detect_copilot,
        min_wait_seconds=args.min_wait
    )
    
    # Save state if file provided
    save_state(args.state_file, result.get("state", {}))
    
    # Output result
    output_json(result, 0)


if __name__ == "__main__":
    main()
