import argparse
import sys
from pipeline_utils import safe_read_json, safe_write_json, get_timestamp, get_status_file_path

def main():
    parser = argparse.ArgumentParser(description="Check and update stage approval status")
    parser.add_argument("--file", required=True, help="Path to pipeline status file")
    parser.add_argument("--stage", required=True, choices=["prd", "plan", "impl", "fix"],
                        help="Stage to check approval for")
    parser.add_argument("--auto", type=str, default="false", 
                        help="Whether auto-approve is enabled (true/false)")
    parser.add_argument("--approve", action="store_true",
                        help="Mark stage as approved")
    args = parser.parse_args()
    
    try:
        file_path = get_status_file_path(args.file)
        data = safe_read_json(file_path)
        
        # Ensure stageApprovals exists
        if "stageApprovals" not in data:
            data["stageApprovals"] = {
                "prd": {"autoApprove": False, "approved": False, "approvedAt": None},
                "plan": {"autoApprove": False, "approved": False, "approvedAt": None},
                "impl": {"autoApprove": False, "approved": False, "approvedAt": None},
                "fix": {"autoApprove": False, "approved": False, "approvedAt": None}
            }
        
        stage_approval = data["stageApprovals"].get(args.stage, {})
        auto_approve = args.auto.lower() == "true"
        
        # If --approve flag is set, mark as approved
        if args.approve:
            data["stageApprovals"][args.stage]["approved"] = True
            data["stageApprovals"][args.stage]["approvedAt"] = get_timestamp()
            data["lastUpdated"] = get_timestamp()
            safe_write_json(file_path, data)
            print("APPROVED")
            return
        
        # Update autoApprove setting if provided
        if auto_approve != stage_approval.get("autoApprove", False):
            data["stageApprovals"][args.stage]["autoApprove"] = auto_approve
            data["lastUpdated"] = get_timestamp()
            safe_write_json(file_path, data)
            stage_approval = data["stageApprovals"][args.stage]
        
        # Check approval status
        if stage_approval.get("autoApprove", False):
            print("APPROVED")
        elif stage_approval.get("approved", False):
            print("APPROVED")
        else:
            print("NEEDS_APPROVAL")
            
    except FileNotFoundError as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        exit(1)
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        exit(1)

if __name__ == "__main__":
    main()
