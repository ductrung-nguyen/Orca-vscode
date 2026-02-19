#!/usr/bin/env python3
"""
Migrate .tot-docs from flat structure to feature-based folders.

Old structure:
  .tot-docs/prd/0001-feature.md
  .tot-docs/tasks/0001-feature.md
  .tot-docs/pipeline-status/0001-feature.json
  .tot-docs/requirements/0001-feature/
  .tot-docs/tasks-details/0001-feature/

New structure:
  .tot-docs/0001-feature/
    ├── prd.md
    ├── tasks.md
    ├── status.json
    ├── requirements/
    └── task-details/
"""

import os
import shutil
import json
import re
import argparse


TOT_DOCS = ".tot-docs"

def get_feature_id_name(filename: str) -> tuple:
    """Extract prd-id and name from filename like '0001-feature-name.md' or '001-feature-name.md' (legacy)"""
    match = re.match(r'^(\d+)-(.+?)(?:\.md|\.json)?$', filename)
    if match:
        prd_id = match.group(1)
        # Normalize to 4 digits for consistency
        prd_id = f"{int(prd_id):04d}"
        return prd_id, match.group(2)
    return None, None

def migrate_prd_files(dry_run: bool = False):
    """Migrate .tot-docs/prd/*.md → .tot-docs/{id}-{name}/prd.md"""
    prd_dir = os.path.join(TOT_DOCS, "prd")
    if not os.path.exists(prd_dir):
        print("No prd directory found, skipping.")
        return
    
    for filename in os.listdir(prd_dir):
        if not filename.endswith('.md'):
            continue
        
        prd_id, name = get_feature_id_name(filename)
        if not prd_id:
            print(f"  Skipping {filename}: couldn't parse ID")
            continue
        
        old_path = os.path.join(prd_dir, filename)
        new_dir = os.path.join(TOT_DOCS, f"{prd_id}-{name}")
        new_path = os.path.join(new_dir, "prd.md")
        
        if dry_run:
            print(f"  [DRY-RUN] {old_path} → {new_path}")
        else:
            os.makedirs(new_dir, exist_ok=True)
            shutil.move(old_path, new_path)
            print(f"  ✓ {old_path} → {new_path}")

def migrate_tasks_files(dry_run: bool = False):
    """Migrate .tot-docs/tasks/*.md → .tot-docs/{id}-{name}/tasks.md"""
    tasks_dir = os.path.join(TOT_DOCS, "tasks")
    if not os.path.exists(tasks_dir):
        print("No tasks directory found, skipping.")
        return
    
    for filename in os.listdir(tasks_dir):
        if not filename.endswith('.md'):
            continue
        
        prd_id, name = get_feature_id_name(filename)
        if not prd_id:
            print(f"  Skipping {filename}: couldn't parse ID")
            continue
        
        old_path = os.path.join(tasks_dir, filename)
        new_dir = os.path.join(TOT_DOCS, f"{prd_id}-{name}")
        new_path = os.path.join(new_dir, "tasks.md")
        
        if dry_run:
            print(f"  [DRY-RUN] {old_path} → {new_path}")
        else:
            os.makedirs(new_dir, exist_ok=True)
            shutil.move(old_path, new_path)
            print(f"  ✓ {old_path} → {new_path}")

def migrate_status_files(dry_run: bool = False):
    """Migrate .tot-docs/pipeline-status/*.json → .tot-docs/{id}-{name}/status.json"""
    status_dir = os.path.join(TOT_DOCS, "pipeline-status")
    if not os.path.exists(status_dir):
        print("No pipeline-status directory found, skipping.")
        return
    
    for item in os.listdir(status_dir):
        old_path = os.path.join(status_dir, item)
        
        # Handle JSON files
        if item.endswith('.json'):
            prd_id, name = get_feature_id_name(item)
            if not prd_id:
                print(f"  Skipping {item}: couldn't parse ID")
                continue
            
            new_dir = os.path.join(TOT_DOCS, f"{prd_id}-{name}")
            new_path = os.path.join(new_dir, "status.json")
            
            if dry_run:
                print(f"  [DRY-RUN] {old_path} → {new_path}")
            else:
                os.makedirs(new_dir, exist_ok=True)
                shutil.move(old_path, new_path)
                # Update paths in status file
                update_status_paths(new_path, prd_id, name)
                print(f"  ✓ {old_path} → {new_path}")
        
        # Handle subdirectories (feedback folders)
        elif os.path.isdir(old_path):
            prd_id, name = get_feature_id_name(item)
            if not prd_id:
                continue
            
            new_dir = os.path.join(TOT_DOCS, f"{prd_id}-{name}")
            
            # Move contents of subdir to feature dir
            for subitem in os.listdir(old_path):
                old_subpath = os.path.join(old_path, subitem)
                new_subpath = os.path.join(new_dir, subitem)
                
                if dry_run:
                    print(f"  [DRY-RUN] {old_subpath} → {new_subpath}")
                else:
                    os.makedirs(new_dir, exist_ok=True)
                    shutil.move(old_subpath, new_subpath)
                    print(f"  ✓ {old_subpath} → {new_subpath}")
            
            # Remove empty old subdir
            if not dry_run and os.path.exists(old_path) and not os.listdir(old_path):
                os.rmdir(old_path)

def migrate_requirements(dry_run: bool = False):
    """Migrate .tot-docs/requirements/{id}-{name}/ → .tot-docs/{id}-{name}/requirements/"""
    req_dir = os.path.join(TOT_DOCS, "requirements")
    if not os.path.exists(req_dir):
        print("No requirements directory found, skipping.")
        return
    
    for item in os.listdir(req_dir):
        old_path = os.path.join(req_dir, item)
        if not os.path.isdir(old_path):
            continue
        
        prd_id, name = get_feature_id_name(item)
        if not prd_id:
            print(f"  Skipping {item}: couldn't parse ID")
            continue
        
        new_dir = os.path.join(TOT_DOCS, f"{prd_id}-{name}")
        new_path = os.path.join(new_dir, "requirements")
        
        if dry_run:
            print(f"  [DRY-RUN] {old_path} → {new_path}")
        else:
            os.makedirs(new_dir, exist_ok=True)
            shutil.move(old_path, new_path)
            print(f"  ✓ {old_path} → {new_path}")

def migrate_task_details(dry_run: bool = False):
    """Migrate .tot-docs/tasks-details/{id}-{name}/ → .tot-docs/{id}-{name}/task-details/"""
    details_dir = os.path.join(TOT_DOCS, "tasks-details")
    if not os.path.exists(details_dir):
        print("No tasks-details directory found, skipping.")
        return
    
    for item in os.listdir(details_dir):
        old_path = os.path.join(details_dir, item)
        if not os.path.isdir(old_path):
            continue
        
        prd_id, name = get_feature_id_name(item)
        if not prd_id:
            print(f"  Skipping {item}: couldn't parse ID")
            continue
        
        new_dir = os.path.join(TOT_DOCS, f"{prd_id}-{name}")
        new_path = os.path.join(new_dir, "task-details")
        
        if dry_run:
            print(f"  [DRY-RUN] {old_path} → {new_path}")
        else:
            os.makedirs(new_dir, exist_ok=True)
            shutil.move(old_path, new_path)
            print(f"  ✓ {old_path} → {new_path}")

def update_status_paths(status_file: str, prd_id: str, name: str):
    """Update paths in status.json to reflect new structure."""
    try:
        with open(status_file, 'r') as f:
            data = json.load(f)
        
        feature_dir = f".tot-docs/{prd_id}-{name}"
        
        # Update schema version
        data["schemaVersion"] = "2.1"
        
        # Add new path fields
        data["featureDir"] = feature_dir
        data["prdFile"] = f"{feature_dir}/prd.md"
        data["taskFile"] = f"{feature_dir}/tasks.md"
        data["requirementsDir"] = f"{feature_dir}/requirements"
        
        # Update stage outputs if they reference old paths
        if "stages" in data:
            for stage_key, stage_data in data["stages"].items():
                if stage_data.get("output"):
                    output = stage_data["output"]
                    if isinstance(output, str):
                        # Update old paths to new paths
                        output = output.replace(f".tot-docs/prd/{prd_id}-{name}.md", f"{feature_dir}/prd.md")
                        output = output.replace(f".tot-docs/tasks/{prd_id}-{name}.md", f"{feature_dir}/tasks.md")
                        output = output.replace(f".tot-docs/requirements/{prd_id}-{name}", f"{feature_dir}/requirements")
                        stage_data["output"] = output
        
        with open(status_file, 'w') as f:
            json.dump(data, f, indent=4)
            f.write('\n')
        
    except Exception as e:
        print(f"  Warning: Could not update {status_file}: {e}")

def cleanup_empty_dirs(dry_run: bool = False):
    """Remove old empty directories after migration."""
    old_dirs = [
        os.path.join(TOT_DOCS, "prd"),
        os.path.join(TOT_DOCS, "tasks"),
        os.path.join(TOT_DOCS, "pipeline-status"),
        os.path.join(TOT_DOCS, "requirements"),
        os.path.join(TOT_DOCS, "tasks-details"),
    ]
    
    for dir_path in old_dirs:
        if os.path.exists(dir_path) and os.path.isdir(dir_path):
            if not os.listdir(dir_path):
                if dry_run:
                    print(f"  [DRY-RUN] Would remove empty: {dir_path}")
                else:
                    os.rmdir(dir_path)
                    print(f"  ✓ Removed empty: {dir_path}")
            else:
                print(f"  ⚠ Not empty, keeping: {dir_path}")

def run(*, dry_run=False, cwd=".", **kwargs):
    """Migrate .tot-docs to feature-based folder structure. Returns result dict."""
    import io
    import contextlib

    original_cwd = os.getcwd()
    os.chdir(cwd)

    try:
        if not os.path.exists(TOT_DOCS):
            return {
                "success": False,
                "message": f"No {TOT_DOCS} directory found in {os.getcwd()}",
            }

        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            print(f"{'[DRY-RUN] ' if dry_run else ''}Migrating .tot-docs to feature-based structure...")
            print()
            print("1. Migrating PRD files...")
            migrate_prd_files(dry_run)
            print()
            print("2. Migrating tasks files...")
            migrate_tasks_files(dry_run)
            print()
            print("3. Migrating pipeline status files...")
            migrate_status_files(dry_run)
            print()
            print("4. Migrating requirements...")
            migrate_requirements(dry_run)
            print()
            print("5. Migrating task details...")
            migrate_task_details(dry_run)
            print()
            print("6. Cleaning up empty directories...")
            cleanup_empty_dirs(dry_run)
            print()
            print("Migration complete!" if not dry_run else "[DRY-RUN] Migration preview complete.")

        return {
            "success": True,
            "dryRun": dry_run,
            "output": output.getvalue(),
        }
    finally:
        os.chdir(original_cwd)


def format_human(result, fmt="human"):
    """Format result for human-readable output."""
    if not result.get("success"):
        return result.get("message", "Migration failed")
    return result.get("output", "").rstrip()


def main():
    """Standalone CLI entrypoint (backward compatibility)."""
    parser = argparse.ArgumentParser(description="Migrate .tot-docs to feature-based structure")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--cwd", default=".", help="Working directory (default: current)")
    args = parser.parse_args()

    try:
        result = run(dry_run=args.dry_run, cwd=args.cwd)
        print(format_human(result))
    except Exception as e:
        print(f"Error: {e}")
        import sys
        sys.exit(1)


if __name__ == "__main__":
    main()
