import argparse
import os
import sys
from pipeline_utils import safe_read_json, get_status_file_path

def main():
    parser = argparse.ArgumentParser(description="Read content of feedback file")
    parser.add_argument("--file", required=True, help="Path to status JSON file")
    parser.add_argument("--phase", choices=["prd", "plan", "impl"], help="Phase (prd, plan, impl)")
    parser.add_argument("--task-id", help="Task ID (required for impl phase task specific feedback)")
    parser.add_argument("--file-path", help="Direct path to feedback file (optional override)")
    
    args = parser.parse_args()
    
    try:
        feedback_path = args.file_path
        
        if not feedback_path:
            # Resolve from status file
            file_path = get_status_file_path(args.file)
            data = safe_read_json(file_path)
            
            # Logic similar to get_feedback_file but we want the content
            # Simplified: just use the resolve logic here or call the other script?
            # Better to duplicate simple logic or import if complex.
            
            if args.phase == "impl" and args.task_id:
                 # Construct standard path: .tot-docs/pipeline-status/{prdId}-{feature}/impl-feedback-{taskId}.md
                 # Or use what's in JSON history?
                 # Agents usually write to a deterministic path.
                 base_dir = os.path.dirname(file_path)
                 prd_id = data.get("prdId")
                 feature_name = data.get("featureName")
                 
                 # Per agent 'impl-refine-loop.agent.md':
                 # .tot-docs/pipeline-status/{prd-id}-task-{TASK_ID}-feedback.md
                 # Note: It seems to be flat in pipeline-status folder in that agent doc?
                 # "Location: .tot-docs/pipeline-status/{prd-id}-task-{TASK_ID}-feedback.md"
                 
                 # But our plan proposed: .tot-docs/pipeline-status/{prd-id}-{name}/impl-feedback-{attempt}.md
                 # We must respect the agent doc IF IT EXISTS, but we are designing the system.
                 # Let's align with the Agent Doc for 'impl' phase as that is likely running.
                 # Agent doc says: .tot-docs/pipeline-status/{prd-id}-task-{TASK_ID}-feedback.md
                 fname = f"{prd_id}-task-{args.task_id}-feedback.md"
                 # It might be in the feature subdir or not. Let's check both or standard.
                 # Given the plan said to organize, but agent MD says flat...
                 # We should support what acts. check flat first.
                 p1 = os.path.join(base_dir, fname)
                 if os.path.exists(p1):
                     feedback_path = p1
                 else:
                     # Check subdir
                     p2 = os.path.join(base_dir, f"{prd_id}-{feature_name}", fname)
                     if os.path.exists(p2):
                         feedback_path = p2
            
            elif args.phase:
                # Check JSON history for PRD/Plan
                key = f"{args.phase}Refinement"
                refinement = data.get(key, {})
                history = refinement.get("history", [])
                if history:
                    # Get latest
                    last = history[-1]
                    f = last.get("feedbackFile") or last.get("issues") # 'issues' was used in old schema
                    if f:
                        # resolve relative path
                        if not os.path.isabs(f):
                            # Assume relative to workspace root typically?
                            # If it starts with .tot-docs, it's relative to workspace root.
                            # We need to find workspace root.
                            # Hack: assume status file is 2 dirs deep from root if in .tot-docs/pipeline-status
                            if ".tot-docs" in file_path:
                                root = file_path.split(".tot-docs")[0]
                                feedback_path = os.path.join(root, f)
                            else:
                                # Fallback: try relative to CWD or use as is
                                feedback_path = f
                        else:
                            feedback_path = f
                            
        if not feedback_path or not os.path.exists(feedback_path):
             print(f"Feedback file not found.", file=sys.stderr)
             # Return empty to not break agents? Or error? 
             # Error is better so they know to look elsewhere or failed.
             exit(1)
             
        with open(feedback_path, 'r', encoding='utf-8') as f:
            print(f.read())
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        exit(1)

if __name__ == "__main__":
    main()
