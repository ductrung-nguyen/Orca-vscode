import os
import json
import subprocess
import shutil

SKILLS_DIR = ".github/skills/pipeline-management"
TEMP_DIR = ".tmp_test_pipeline"
STATUS_FILE = os.path.join(TEMP_DIR, "status.json")

def run_script(script_name, args):
    cmd = ["python3", os.path.join(SKILLS_DIR, script_name)] + args
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"FAILED: {result.stderr}")
        return None
    return result.stdout.strip()

def test_pipeline():
    # Setup
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR)
    
    # 1. Init Pipeline
    print("\n--- Test 1: Init Pipeline ---")
    run_script("init_pipeline.py", ["--prd-id", "0099", "--name", "test-feat", "--out-dir", TEMP_DIR])
    
    # Verify file created
    real_file = os.path.join(TEMP_DIR, "0099-test-feat.json")
    if not os.path.exists(real_file):
        print("FAIL: Status file not created")
        return
    # Rename to standard for easier testing
    os.rename(real_file, STATUS_FILE)
    print("PASS: Init")

    # 2. Update Stage
    print("\n--- Test 2: Update Stage ---")
    run_script("update_stage.py", ["--file", STATUS_FILE, "--stage", "discover", "--status", "in-progress", "--agent", "test-agent"])
    # Verify
    out = run_script("read_status.py", ["--file", STATUS_FILE, "--stage", "discover"])
    data = json.loads(out)
    if data["status"] == "in-progress" and data.get("agent") == "test-agent":
        print("PASS: Update Stage")
    else:
        print(f"FAIL: Update Stage data mismatch: {data}")

    # 3. Complete Stage
    print("\n--- Test 3: Complete Stage ---")
    run_script("complete_stage.py", ["--file", STATUS_FILE, "--stage", "discover", "--output", "found-requirements"])
    # Check discover completed and create-prd in-progress
    out_discover = json.loads(run_script("read_status.py", ["--file", STATUS_FILE, "--stage", "discover"]))
    out_next = json.loads(run_script("read_status.py", ["--file", STATUS_FILE, "--stage", "create-prd"]))
    
    if out_discover["status"] == "completed" and out_discover["output"] == "found-requirements" and out_next["status"] == "in-progress":
        print("PASS: Complete Stage")
    else:
        print(f"FAIL: Complete Stage logic. Discover: {out_discover}, Next: {out_next}")

    # 4. Record Refinement
    print("\n--- Test 4: Record Refinement ---")
    feedback_path = os.path.join(TEMP_DIR, "feedback.md")
    with open(feedback_path, "w") as f:
        f.write("# Feedback\nFix this.")
        
    run_script("record_refinement.py", ["--file", STATUS_FILE, "--phase", "prd", "--result", "FAIL", "--feedback-file", feedback_path])
    
    # Verify via get_feedback_file
    fb_path = run_script("get_feedback_file.py", ["--file", STATUS_FILE, "--phase", "prd"])
    if fb_path == feedback_path or fb_path.endswith("feedback.md"):
        print(f"PASS: Get Feedback File. Got: {fb_path}")
    else:
        print(f"FAIL: Get Feedback File. Expected {feedback_path}, Got: {fb_path}")
        
    # Verify read_feedback
    fb_content = run_script("read_feedback.py", ["--file", STATUS_FILE, "--phase", "prd"])
    if "# Feedback" in fb_content:
        print("PASS: Read Feedback")
    else:
        print(f"FAIL: Read Feedback content: {fb_content}")

    # 5. Get Current Stage
    print("\n--- Test 5: Get Current Stage ---")
    curr = json.loads(run_script("get_current_stage.py", ["--file", STATUS_FILE]))
    if curr["stage"] == "create-prd" and curr["status"] == "in-progress":
        print("PASS: Get Current Stage")
    else:
        print(f"FAIL: Get Current Stage: {curr}")

    # Cleanup
    # shutil.rmtree(TEMP_DIR)
    print("\nALL TESTS COMPLETED")

if __name__ == "__main__":
    test_pipeline()
