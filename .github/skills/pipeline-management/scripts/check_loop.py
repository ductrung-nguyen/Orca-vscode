#!/usr/bin/env python3
"""Check if refinement loop should continue.

Returns single-word status to minimize output and prevent context rot.

Usage:
    check_loop.py --file STATUS_FILE --stage STAGE

Output:
    CONTINUE     - Should iterate again
    DONE         - Passed, proceed to next stage
    MAX_REACHED  - Failed, max attempts exhausted
"""

import argparse
import sys

from pipeline_utils import (
    safe_read_json,
    get_status_file_path,
    find_stage_by_name,
)


def run(*, file, stage, **kwargs):
    """Check refinement loop status. Never raises — catches all errors.

    Returns result dict with 'status' key: 'CONTINUE', 'DONE', or 'MAX_REACHED'.
    """
    try:
        file_path = get_status_file_path(file)
        data = safe_read_json(file_path)

        stages = data.get("stages", [])
        stage_obj = find_stage_by_name(stages, stage)

        if not stage_obj:
            return {"status": "CONTINUE", "stage": stage, "nextAttempt": 1}

        refinement = stage_obj.get("refinement")
        if not refinement:
            st = stage_obj.get("status", "pending")
            if st == "completed":
                return {"status": "DONE", "stage": stage}
            else:
                return {"status": "CONTINUE", "stage": stage, "nextAttempt": 1}

        attempt = refinement.get("attempt", 0)
        max_attempts = refinement.get("maxAttempts", 5)
        feedback = refinement.get("feedback", [])

        # Check last result
        if feedback:
            last_result = feedback[-1].get("result", "").lower()
            if last_result in ["passed", "approved", "done", "pass"]:
                return {"status": "DONE", "stage": stage, "attempt": attempt}

        # Check max attempts
        if attempt >= max_attempts:
            return {
                "status": "MAX_REACHED",
                "stage": stage,
                "attempt": attempt,
                "maxAttempts": max_attempts,
            }

        return {"status": "CONTINUE", "stage": stage, "nextAttempt": attempt + 1}

    except Exception:
        # On error, default to CONTINUE (safer than blocking)
        return {"status": "CONTINUE", "stage": stage, "nextAttempt": 1}


def format_human(result, fmt="human"):
    """Format result for human-readable output. Reproduces exact CLI output."""
    status = result.get("status")
    if status == "DONE":
        return "DONE"
    elif status == "MAX_REACHED":
        return "MAX_REACHED"
    else:
        stg = result.get("stage", "unknown")
        next_attempt = result.get("nextAttempt", 1)
        return "CONTINUE - Next attempt for stage '{}' is {}".format(stg, next_attempt)


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(
        description="Check refinement loop status (minimal output)"
    )
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--stage", required=True, help="Stage name to check")
    args = parser.parse_args()

    result = run(file=args.file, stage=args.stage)
    print(format_human(result))


if __name__ == "__main__":
    main()
