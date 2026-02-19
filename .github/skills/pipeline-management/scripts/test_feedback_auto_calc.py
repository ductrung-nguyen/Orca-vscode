#!/usr/bin/env python3
"""
Standalone test for get_feedback_file_for_attempt.py auto-calculation feature.
Run without pytest dependency: python3 test_feedback_auto_calc.py
"""

import os
import sys
import json
import tempfile
import shutil
import subprocess

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'

def run_script(script_path, args):
    """Helper to run a script and return results."""
    cmd = ["python3", script_path] + args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout.strip(), result.stderr

def test_auto_calculate_next_attempt():
    """Test 1: Auto-calculation of next attempt (current=2, should return 3)."""
    print(f"\n{BLUE}Test 1: Auto-calculate next attempt (2 → 3){RESET}")
    
    with tempfile.TemporaryDirectory(prefix="test_feedback_") as temp_dir:
        # Create status file with attempt=2
        status_data = {
            "version": "3.0",
            "prdId": "001",
            "featureName": "test-feature",
            "mode": "feature",
            "currentStageIndex": 1,
            "createdAt": "2026-02-07T10:00:00Z",
            "lastUpdated": "2026-02-07T10:00:00Z",
            "stages": [
                {
                    "name": "create-prd",
                    "status": "in-progress",
                    "refinement": {
                        "maxAttempts": 5,
                        "attempt": 2,
                        "feedback": []
                    }
                }
            ],
            "tasks": [],
            "git": {"enabled": False},
            "files": {},
            "errors": []
        }
        
        status_path = os.path.join(temp_dir, "status.json")
        with open(status_path, "w") as f:
            json.dump(status_data, f, indent=2)
        
        script_path = os.path.join(os.path.dirname(__file__), "get_feedback_file_for_attempt.py")
        returncode, stdout, stderr = run_script(
            script_path,
            ["--file", status_path, "--stage", "create-prd", "--format", "json"]
        )
        
        if returncode != 0:
            print(f"{RED}✗ FAILED: Script returned non-zero: {stderr}{RESET}")
            return False
        
        result = json.loads(stdout)
        
        # Verify auto-calculation
        if result["attempt"] == 3:
            print(f"{GREEN}✓ PASSED: Auto-calculated attempt is 3{RESET}")
            return True
        else:
            print(f"{RED}✗ FAILED: Expected attempt 3, got {result['attempt']}{RESET}")
            return False

def test_first_attempt_no_refinement():
    """Test 2: First attempt when no refinement data (should return 1)."""
    print(f"\n{BLUE}Test 2: First attempt with no refinement data{RESET}")
    
    with tempfile.TemporaryDirectory(prefix="test_feedback_") as temp_dir:
        # Create status file without refinement
        status_data = {
            "version": "3.0",
            "prdId": "002",
            "featureName": "new-feature",
            "mode": "feature",
            "currentStageIndex": 1,
            "createdAt": "2026-02-07T10:00:00Z",
            "lastUpdated": "2026-02-07T10:00:00Z",
            "stages": [
                {
                    "name": "create-prd",
                    "status": "in-progress",
                    "refinement": None
                }
            ],
            "tasks": [],
            "git": {"enabled": False},
            "files": {},
            "errors": []
        }
        
        status_path = os.path.join(temp_dir, "status.json")
        with open(status_path, "w") as f:
            json.dump(status_data, f, indent=2)
        
        script_path = os.path.join(os.path.dirname(__file__), "get_feedback_file_for_attempt.py")
        returncode, stdout, stderr = run_script(
            script_path,
            ["--file", status_path, "--stage", "create-prd", "--format", "json"]
        )
        
        if returncode != 0:
            print(f"{RED}✗ FAILED: Script returned non-zero: {stderr}{RESET}")
            return False
        
        result = json.loads(stdout)
        
        if result["attempt"] == 1:
            print(f"{GREEN}✓ PASSED: Defaults to attempt 1{RESET}")
            return True
        else:
            print(f"{RED}✗ FAILED: Expected attempt 1, got {result['attempt']}{RESET}")
            return False

def test_explicit_override():
    """Test 3: Explicit --attempt overrides auto-calculation."""
    print(f"\n{BLUE}Test 3: Explicit --attempt overrides auto-calculation{RESET}")
    
    with tempfile.TemporaryDirectory(prefix="test_feedback_") as temp_dir:
        status_data = {
            "version": "3.0",
            "prdId": "003",
            "featureName": "test-feature",
            "mode": "feature",
            "currentStageIndex": 1,
            "createdAt": "2026-02-07T10:00:00Z",
            "lastUpdated": "2026-02-07T10:00:00Z",
            "stages": [
                {
                    "name": "create-prd",
                    "status": "in-progress",
                    "refinement": {
                        "maxAttempts": 5,
                        "attempt": 2,
                        "feedback": []
                    }
                }
            ],
            "tasks": [],
            "git": {"enabled": False},
            "files": {},
            "errors": []
        }
        
        status_path = os.path.join(temp_dir, "status.json")
        with open(status_path, "w") as f:
            json.dump(status_data, f, indent=2)
        
        script_path = os.path.join(os.path.dirname(__file__), "get_feedback_file_for_attempt.py")
        returncode, stdout, stderr = run_script(
            script_path,
            ["--file", status_path, "--stage", "create-prd", "--attempt", "7", "--format", "json"]
        )
        
        if returncode != 0:
            print(f"{RED}✗ FAILED: Script returned non-zero: {stderr}{RESET}")
            return False
        
        result = json.loads(stdout)
        
        if result["attempt"] == 7:
            print(f"{GREEN}✓ PASSED: Explicit attempt 7 used{RESET}")
            return True
        else:
            print(f"{RED}✗ FAILED: Expected attempt 7, got {result['attempt']}{RESET}")
            return False

def test_format_path():
    """Test 4: --format path returns only absolute path."""
    print(f"\n{BLUE}Test 4: Format path returns absolute path only{RESET}")
    
    with tempfile.TemporaryDirectory(prefix="test_feedback_") as temp_dir:
        status_data = {
            "version": "3.0",
            "prdId": "004",
            "featureName": "test",
            "mode": "feature",
            "currentStageIndex": 0,
            "createdAt": "2026-02-07T10:00:00Z",
            "lastUpdated": "2026-02-07T10:00:00Z",
            "stages": [
                {
                    "name": "create-prd",
                    "status": "in-progress",
                    "refinement": {
                        "maxAttempts": 5,
                        "attempt": 1,
                        "feedback": []
                    }
                }
            ],
            "tasks": [],
            "git": {"enabled": False},
            "files": {},
            "errors": []
        }
        
        status_path = os.path.join(temp_dir, "status.json")
        with open(status_path, "w") as f:
            json.dump(status_data, f, indent=2)
        
        script_path = os.path.join(os.path.dirname(__file__), "get_feedback_file_for_attempt.py")
        returncode, stdout, stderr = run_script(
            script_path,
            ["--file", status_path, "--stage", "create-prd", "--format", "path"]
        )
        
        if returncode != 0:
            print(f"{RED}✗ FAILED: Script returned non-zero: {stderr}{RESET}")
            return False
        
        expected_path = os.path.join(temp_dir, "create-prd-feedback-2.md")
        
        if stdout == expected_path:
            print(f"{GREEN}✓ PASSED: Path format returns absolute path only{RESET}")
            return True
        else:
            print(f"{RED}✗ FAILED: Expected '{expected_path}', got '{stdout}'{RESET}")
            return False

def main():
    """Run all tests."""
    print(f"\n{BLUE}{'='*60}")
    print("Testing get_feedback_file_for_attempt.py auto-calculation")
    print(f"{'='*60}{RESET}")
    
    tests = [
        test_auto_calculate_next_attempt,
        test_first_attempt_no_refinement,
        test_explicit_override,
        test_format_path
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"{RED}✗ EXCEPTION: {e}{RESET}")
            failed += 1
    
    print(f"\n{BLUE}{'='*60}")
    print(f"Results: {GREEN}{passed} passed{RESET}, {RED if failed > 0 else GREEN}{failed} failed{RESET}")
    print(f"{'='*60}{RESET}\n")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
