import os
import argparse
import re


def get_next_prd_id(docs_dir: str) -> str:
    """Scans existing feature/bug folders and returns next available ID (e.g. '0022').
    
    Handles both legacy 3-digit (001) and new 4-digit (0001) formats.
    Always returns 4-digit format.
    """
    if not os.path.exists(docs_dir):
        return "0001"
        
    entries = os.listdir(docs_dir)
    # Match folders starting with 3 or 4 digits for backward compatibility
    pattern = re.compile(r"^(\d{3,4})-.*$")
    
    max_id = 0
    for entry in entries:
        entry_path = os.path.join(docs_dir, entry)
        # Only check directories (feature folders)
        if not os.path.isdir(entry_path):
            continue
            
        match = pattern.match(entry)
        if match:
            try:
                current_id = int(match.group(1))
                if current_id > max_id:
                    max_id = current_id
            except ValueError:
                continue
                
    next_id = max_id + 1
    return f"{next_id:04d}"

def run(*, docs_dir, **kwargs):
    """Get next available PRD ID. Returns result dict."""
    docs_dir_abs = os.path.abspath(docs_dir)
    next_id = get_next_prd_id(docs_dir_abs)
    return {"nextId": next_id}


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return result["nextId"]


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get next available PRD ID")
    parser.add_argument("--docs-dir", required=True, help="Directory containing feature/bug folders (e.g., .tot-docs)")
    args = parser.parse_args()
    
    try:
        result = run(docs_dir=args.docs_dir)
        print(format_human(result))
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()
