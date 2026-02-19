import os
import argparse
import re

TOT_DOCS_BASE = ".tot-docs"

def get_next_pipeline_id(docs_dir: str = None) -> str:
    """Scans existing pipeline folders and returns next available ID (e.g. '0001').
    
    Args:
        docs_dir: Directory containing pipeline folders. Defaults to .tot-docs
        
    Returns:
        Next available ID as zero-padded 4-digit string (e.g. '0001', '0022')
    """
    if docs_dir is None:
        docs_dir = TOT_DOCS_BASE
        
    if not os.path.exists(docs_dir):
        return "0001"
        
    entries = os.listdir(docs_dir)
    # Match folders starting with 3-4 digits, e.g. "021-something" or "0021-something"
    pattern = re.compile(r"^(\d{3,4})-.*$")
    
    max_id = 0
    for entry in entries:
        entry_path = os.path.join(docs_dir, entry)
        if os.path.isdir(entry_path):
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

def run(*, docs_dir=None, **kwargs):
    """Get next available pipeline ID. Returns result dict."""
    if docs_dir is None:
        docs_dir = TOT_DOCS_BASE
    docs_dir_abs = os.path.abspath(docs_dir)
    next_id = get_next_pipeline_id(docs_dir_abs)
    return {"nextId": next_id}


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    return result["nextId"]


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Get next available pipeline ID")
    parser.add_argument("--docs-dir", default=TOT_DOCS_BASE, 
                        help=f"Directory containing pipeline folders (default: {TOT_DOCS_BASE})")
    args = parser.parse_args()
    
    try:
        result = run(docs_dir=args.docs_dir)
        print(format_human(result))
    except Exception as e:
        print(f"Error: {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()
