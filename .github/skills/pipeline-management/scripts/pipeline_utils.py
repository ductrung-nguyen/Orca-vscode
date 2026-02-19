"""Pipeline Management Utilities - Schema v3.0

Core utility functions for managing pipeline status files.
"""

import json
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# =============================================================================
# Constants
# =============================================================================

STATUS_SCHEMA_VERSION = "3.0"
TOT_DOCS_BASE = ".tot-docs"

# Valid status values
STAGE_STATUSES = ["pending", "in-progress", "completed", "failed", "skipped"]
TASK_STATUSES = ["pending", "in-progress", "completed", "failed"]


# =============================================================================
# Stage Configuration (Dataclass-based)
# =============================================================================

@dataclass(frozen=True)
class StageConfig:
    """Immutable stage configuration template."""
    name: str
    hasRefinement: bool = False
    maxAttempts: int = 5
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {"name": self.name, "hasRefinement": self.hasRefinement, "maxAttempts": self.maxAttempts}


class Stages:
    """All available stage configurations (defined once, reused everywhere)."""
    # Feature/Full pipeline stages
    DISCOVER = StageConfig("discover")
    CREATE_PRD = StageConfig("create-prd", hasRefinement=True, maxAttempts=5)
    CREATE_ISSUES = StageConfig("create-issues")
    GENERATE_PLAN = StageConfig("generate-plan", hasRefinement=True, maxAttempts=5)
    IMPLEMENT = StageConfig("implement", hasRefinement=True, maxAttempts=5)
    FINALIZE = StageConfig("finalize")
    HANDLE_PR_FEEDBACK = StageConfig("handle-pr-feedback")
    GIT_INIT = StageConfig("git-init")
    
    # Debug/Bugfix pipeline stages
    ANALYZE_BUG = StageConfig("analyze-bug")
    GENERATE_FIX = StageConfig("generate-fix", hasRefinement=True, maxAttempts=3)
    IMPLEMENT_FIX = StageConfig("implement-fix", hasRefinement=True, maxAttempts=3)
    VALIDATE_FIX = StageConfig("validate-fix")
    FINALIZE_FIX = StageConfig("finalize-fix")


# Stage configurations by mode (clean, DRY references)
FEATURE_STAGES: List[StageConfig] = [
    Stages.DISCOVER,
    Stages.CREATE_PRD,
    Stages.CREATE_ISSUES,
    Stages.GENERATE_PLAN,
    Stages.IMPLEMENT,
    Stages.FINALIZE,
    Stages.HANDLE_PR_FEEDBACK,
]

FULL_STAGES: List[StageConfig] = [
    Stages.GIT_INIT,
    Stages.DISCOVER,
    Stages.CREATE_PRD,
    Stages.CREATE_ISSUES,
    Stages.GENERATE_PLAN,
    Stages.IMPLEMENT,
    Stages.FINALIZE,
    Stages.HANDLE_PR_FEEDBACK,
]

DEBUG_STAGES: List[StageConfig] = [
    Stages.ANALYZE_BUG,
    Stages.GENERATE_FIX,
    Stages.IMPLEMENT_FIX,
    Stages.VALIDATE_FIX,
    Stages.FINALIZE_FIX,
]

# =============================================================================
# Stage Helper Functions (v3.0)
# =============================================================================

def find_stage_by_name(stages: List[Dict], name: str) -> Optional[Dict]:
    """Find a stage in the stages array by name.
    
    Args:
        stages: List of stage dictionaries
        name: Stage name to find (e.g., "discover", "create-prd")
    
    Returns:
        Stage dict if found, None otherwise
    
    Example:
        stage = find_stage_by_name(status["stages"], "create-prd")
        if stage:
            print(stage["status"])
    """
    for stage in stages:
        if stage.get("name") == name:
            return stage
    return None


def find_stage_index(stages: List[Dict], name: str) -> int:
    """Get index of a stage in the stages array.
    
    Args:
        stages: List of stage dictionaries
        name: Stage name to find
    
    Returns:
        Index (0-based) if found, -1 otherwise
    """
    for i, stage in enumerate(stages):
        if stage.get("name") == name:
            return i
    return -1


# =============================================================================
# Task Helper Functions (v3.0)
# =============================================================================

def find_task_by_id(tasks: List[Dict], task_id: str) -> Optional[Dict]:
    """Find a task in the tasks array by ID.
    
    Args:
        tasks: List of task dictionaries
        task_id: Task ID to find (e.g., "1", "2")
    
    Returns:
        Task dict if found, None otherwise
    """
    for task in tasks:
        if task.get("id") == task_id:
            return task
    return None


def find_subtask(task: Dict, subtask_id: str) -> Optional[Dict]:
    """Find a subtask within a task.
    
    Args:
        task: Parent task dictionary
        subtask_id: Subtask ID (e.g., "1.1", "1.2")
    
    Returns:
        Subtask dict if found, None otherwise
    """
    for subtask in task.get("subtasks", []):
        if subtask.get("id") == subtask_id:
            return subtask
    return None


# =============================================================================
# Stage Factory Functions
# =============================================================================

def create_stage(config) -> Dict:
    """Create a stage object from config.
    
    Args:
        config: Stage configuration - either StageConfig dataclass or dict
                with 'name', 'hasRefinement', 'maxAttempts'
    
    Returns:
        Initialized stage dictionary
    """
    # Handle both StageConfig and Dict
    if isinstance(config, StageConfig):
        name = config.name
        has_refinement = config.hasRefinement
        max_attempts = config.maxAttempts
    else:
        name = config["name"]
        has_refinement = config.get("hasRefinement", False)
        max_attempts = config.get("maxAttempts", 5)
    
    stage = {
        "name": name,
        "status": "pending",
        "agent": None,  # Track which AI model executed this stage
        "startedAt": None,
        "completedAt": None,
        "output": None,
        "data": None,
    }
    
    if has_refinement:
        stage["refinement"] = {
            "maxAttempts": max_attempts,
            "attempt": 0,
            "feedback": []
        }
    else:
        stage["refinement"] = None
    
    return stage


def get_stages_for_mode(mode: str) -> List[Dict]:
    """Get initialized stages for pipeline mode.
    
    Args:
        mode: Pipeline mode ('full', 'feature', 'debug')
    
    Returns:
        List of initialized stage dictionaries
    
    Raises:
        ValueError: If mode is invalid
    """
    if mode == "full":
        configs = FULL_STAGES
    elif mode == "feature":
        configs = FEATURE_STAGES
    elif mode == "debug":
        configs = DEBUG_STAGES
    else:
        raise ValueError(f"Invalid mode: {mode}. Must be full, feature, or debug")
    
    return [create_stage(c) for c in configs]


# =============================================================================
# Schema Validation (v3.0)
# =============================================================================

def validate_schema_v3(data: Dict) -> Tuple[bool, List[str]]:
    """Validate status.json against v3.0 schema.
    
    Returns:
        Tuple of (is_valid, list_of_errors)
    
    Checks:
        - schemaVersion == "3.0"
        - stages is array
        - tasks is array
        - Required top-level keys exist
        - Each stage has required keys
        - Each task has required keys
    """
    errors = []
    
    # Required top-level keys
    required = [
        "schemaVersion", "pipelineID", "pipelineName", "pipelineDir",
        "mode", "currentStage", "currentStageIndex", "stages", "tasks"
    ]
    for key in required:
        if key not in data:
            errors.append(f"Missing required key: {key}")
    
    # Schema version check
    if data.get("schemaVersion") != "3.0":
        errors.append(f"Invalid schemaVersion: {data.get('schemaVersion')}, expected 3.0")
    
    # Type checks
    if not isinstance(data.get("stages"), list):
        errors.append("stages must be an array")
    if not isinstance(data.get("tasks"), list):
        errors.append("tasks must be an array")
    
    # Stage structure
    stage_required = ["name", "status"]
    for i, stage in enumerate(data.get("stages", [])):
        for key in stage_required:
            if key not in stage:
                errors.append(f"Stage[{i}] missing: {key}")
        # Validate status value
        if stage.get("status") not in STAGE_STATUSES:
            errors.append(f"Stage[{i}] invalid status: {stage.get('status')}")
    
    # Task structure
    task_required = ["id", "title", "status"]
    for i, task in enumerate(data.get("tasks", [])):
        for key in task_required:
            if key not in task:
                errors.append(f"Task[{i}] missing: {key}")
        # Validate status value
        if task.get("status") not in TASK_STATUSES:
            errors.append(f"Task[{i}] invalid status: {task.get('status')}")
    
    return len(errors) == 0, errors


# =============================================================================
# Feature-Based Path Resolution
# =============================================================================

def get_feature_dir(prd_id: str, name: str) -> str:
    """Returns the feature folder path: .tot-docs/{prd-id}-{name}/"""
    return os.path.join(TOT_DOCS_BASE, f"{prd_id}-{name}")

def get_prd_path(prd_id: str, name: str) -> str:
    """Returns PRD file path: .tot-docs/{prd-id}-{name}/prd.md"""
    return os.path.join(get_feature_dir(prd_id, name), "prd.md")

def get_tasks_dir(prd_id: str, name: str) -> str:
    """Returns tasks directory path: .tot-docs/{prd-id}-{name}/tasks/"""
    return os.path.join(get_feature_dir(prd_id, name), "tasks")

def get_status_path(prd_id: str, name: str) -> str:
    """Returns status file path: .tot-docs/{prd-id}-{name}/status.json"""
    return os.path.join(get_feature_dir(prd_id, name), "status.json")

def get_requirements_dir(prd_id: str, name: str) -> str:
    """Returns requirements folder: .tot-docs/{prd-id}-{name}/requirements/"""
    return os.path.join(get_feature_dir(prd_id, name), "requirements")

def ensure_feature_dir(prd_id: str, name: str) -> str:
    """Creates feature directory if it doesn't exist and returns path."""
    feature_dir = get_feature_dir(prd_id, name)
    os.makedirs(feature_dir, exist_ok=True)
    return feature_dir


# =============================================================================
# Legacy/Compatibility Functions
# =============================================================================

def resolve_pipeline_id(pipeline_id: str, docs_dir: str = None) -> str:
    """Resolve pipeline ID to absolute status.json path.

    Scans the docs directory for directories matching ``{pipeline_id}-*``
    and returns the absolute path to ``status.json`` within the match.

    Args:
        pipeline_id: 3-4 digit pipeline ID (e.g., ``'0001'``, ``'042'``).
        docs_dir: Directory containing pipeline folders.
                  Defaults to ``.tot-docs`` in the current working directory.

    Returns:
        Absolute path to the ``status.json`` file.

    Raises:
        ValueError: If the ID format is invalid, no match is found,
                    or multiple directories match.
        FileNotFoundError: If the matched directory exists but
                          ``status.json`` is missing.

    Example::

        >>> resolve_pipeline_id('0001')
        '/project/.tot-docs/0001-user-auth/status.json'
    """
    import re

    if docs_dir is None:
        docs_dir = TOT_DOCS_BASE

    docs_dir = os.path.abspath(docs_dir)

    # Validate pipeline ID format (3-4 digits)
    if not re.match(r'^\d{3,4}$', pipeline_id):
        raise ValueError(
            f"Invalid pipeline ID format: '{pipeline_id}'. "
            f"Expected 3-4 digits (e.g., '001', '0042')"
        )

    if not os.path.exists(docs_dir):
        raise ValueError(
            f"Pipeline directory not found: {docs_dir}. "
            f"No pipelines have been initialized yet."
        )

    # Scan for matching directories
    pattern = re.compile(rf'^{re.escape(pipeline_id)}-.*$')
    matches = []

    for entry in os.listdir(docs_dir):
        entry_path = os.path.join(docs_dir, entry)
        if os.path.isdir(entry_path) and pattern.match(entry):
            matches.append(entry)

    if len(matches) == 0:
        raise ValueError(
            f"Pipeline ID '{pipeline_id}' not found in {docs_dir}. "
            f"No directories matching pattern '{pipeline_id}-*'"
        )

    if len(matches) > 1:
        raise ValueError(
            f"Ambiguous pipeline ID '{pipeline_id}'. "
            f"Multiple matches found: {', '.join(sorted(matches))}"
        )

    status_path = os.path.join(docs_dir, matches[0], "status.json")

    if not os.path.exists(status_path):
        raise FileNotFoundError(
            f"Pipeline directory '{matches[0]}' exists but "
            f"status.json not found at: {status_path}"
        )

    return os.path.abspath(status_path)


def get_status_file_path(path: str) -> str:
    """Validates and returns the absolute path to the status file."""
    if not path.endswith('.json'):
        raise ValueError("Status file must be a JSON file")
    return os.path.abspath(path)

def safe_read_json(file_path: str) -> Dict[str, Any]:
    """Safely reads a JSON file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {file_path}: {str(e)}")
    except Exception as e:
        raise Exception(f"Error reading {file_path}: {str(e)}")

def safe_write_json(file_path: str, data: Dict[str, Any]) -> None:
    """Safely writes data to a JSON file."""
    try:
        # Create directory if it doesn't exist
        dir_path = os.path.dirname(file_path)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')  # trailing newline
    except Exception as e:
        raise Exception(f"Error writing to {file_path}: {str(e)}")

def get_timestamp() -> str:
    """Returns current UTC timestamp in ISO 8601 format."""
    return datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')


# =============================================================================
# Error Output Helpers
# =============================================================================

def print_error(message: str, code: str = None) -> None:
    """Print error in JSON format and exit with code 1."""
    import sys
    error = {"error": True, "message": message}
    if code:
        error["code"] = code
    print(json.dumps(error))
    sys.exit(1)


def print_success(data: Dict) -> None:
    """Print success response in JSON format."""
    print(json.dumps(data, indent=2))


# =============================================================================
# Validation Helpers
# =============================================================================

def validate_stage_status(status: str) -> str:
    """Validate stage status value."""
    if status not in STAGE_STATUSES:
        raise ValueError(f"Invalid status: {status}. Must be one of: {STAGE_STATUSES}")
    return status


def validate_task_status(status: str) -> str:
    """Validate task status value."""
    if status not in TASK_STATUSES:
        raise ValueError(f"Invalid status: {status}. Must be one of: {TASK_STATUSES}")
    return status


def validate_stage_exists(stages: List[Dict], name: str) -> Dict:
    """Validate stage exists and return it."""
    stage = find_stage_by_name(stages, name)
    if not stage:
        raise ValueError(f"Stage '{name}' not found")
    return stage


def validate_task_exists(tasks: List[Dict], task_id: str) -> Dict:
    """Validate task exists and return it."""
    task = find_task_by_id(tasks, task_id)
    if not task:
        raise ValueError(f"Task '{task_id}' not found")
    return task


# =============================================================================
# Feedback Path Helpers (v3.0)
# =============================================================================

def get_feedback_path(pipeline_dir: str, stage_name: str, attempt: int) -> str:
    """Generates standard feedback file path (relative to pipeline dir).
    
    Pattern: {stage-name}-feedback-{attempt}.md
    Example: create-prd-feedback-1.md
    """
    return f"{stage_name}-feedback-{attempt}.md"


def resolve_feedback_path(status_file_path: str, stage_name: str, attempt: int) -> str:
    """Resolves full path for feedback file based on status file location.
    
    Returns absolute path: {pipeline-dir}/{stage-name}-feedback-{attempt}.md
    """
    pipeline_dir = os.path.dirname(os.path.abspath(status_file_path))
    filename = f"{stage_name}-feedback-{attempt}.md"
    return os.path.join(pipeline_dir, filename)
