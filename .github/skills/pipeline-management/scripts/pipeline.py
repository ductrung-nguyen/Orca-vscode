#!/usr/bin/env python3
"""Pipeline Management CLI — Manage pipeline status files (schema v3.0).

Unified entrypoint for all pipeline management operations. Delegates to
individual script modules for business logic.

Usage:
    pipeline.py <group> <command> [args...]

    pipeline.py init create --name my-feature
    pipeline.py stage update --file status.json --stage create-prd --status in-progress
    pipeline.py task add --file status.json --id 1 --title "First task"
    pipeline.py refinement check-loop --file status.json --stage create-prd
    pipeline.py status --file status.json
    pipeline.py meta git-update --file status.json --branch feat/my-feature

Groups:
    init         Initialize pipelines and run migrations
    stage        Manage pipeline stages
    task         Manage tasks and subtasks
    refinement   Record and query refinement attempts, check loop control
    status       Read and validate status files
    meta         Update git info, issues, and errors
"""

import argparse
import json
import sys


__version__ = "3.0"


def _add_file_or_pipeline_args(parser, required=True):
    """Add mutually exclusive --pipeline-id and --file arguments to a parser.

    Args:
        parser: argparse parser or subparser to add arguments to.
        required: Whether one of the options is required (default True).
    """
    group = parser.add_mutually_exclusive_group(required=required)
    group.add_argument(
        "--pipeline-id",
        metavar="ID",
        help="Pipeline ID (e.g., 0001). Resolves to .tot-docs/{ID}-*/status.json",
    )
    group.add_argument(
        "--file",
        metavar="PATH",
        help="Full path to status.json file",
    )


# ---------------------------------------------------------------------------
# Handlers
#
# Each handler returns (result_dict, formatter_function).
# The formatter accepts (result, fmt="human") and returns a string.
# Handlers import run() and format_human() from individual script modules.
# ---------------------------------------------------------------------------


# -- init group placeholders ------------------------------------------------

def handle_init_create(args):
    """Handle 'init create' — delegates to init_pipeline.run()."""
    from init_pipeline import run, format_human
    result = run(
        name=args.name,
        mode=args.mode,
        prd_id=args.prd_id,
        source_type=args.source_type,
        source_ref=args.source_ref,
    )
    return result, format_human


def handle_init_next_id(args):
    """Handle 'init get-next-available-id' — delegates to get_next_pipeline_id.run()."""
    from get_next_pipeline_id import run, format_human
    result = run(docs_dir=args.docs_dir)
    return result, format_human


def handle_init_migrate_v3(args):
    """Handle 'init migrate-v3' — delegates to migrate_v2_to_v3.run()."""
    from migrate_v2_to_v3 import run, format_human
    result = run(
        file=args.file,
        output=args.output,
        dry_run=args.dry_run,
        backup=args.backup,
    )
    return result, format_human


def handle_init_migrate_folders(args):
    """Handle 'init migrate-folders' — delegates to migrate_to_feature_folders.run()."""
    from migrate_to_feature_folders import run, format_human
    result = run(dry_run=args.dry_run, cwd=args.cwd)
    return result, format_human


def handle_init_paths(args):
    """Handle 'init paths' — delegates to get_pipeline_paths.run()."""
    from get_pipeline_paths import run
    paths = run(file=args.file)
    
    # Simple formatter using PipelinePaths methods
    def formatter(result, fmt="human"):
        if fmt == "shell":
            return paths.to_shell()
        else:  # human
            return paths.to_human()
    
    return paths.to_dict(), formatter


# -- stage group placeholders -----------------------------------------------

def handle_stage_current(args):
    """Handle 'stage current' — delegates to get_current_stage.run()."""
    from get_current_stage import run, format_human
    result = run(file=args.file)
    return result, format_human


def handle_stage_status(args):
    """Handle 'stage status' — delegates to get_stage_status.run()."""
    from get_stage_status import run, format_human
    result = run(file=args.file, stage=args.stage)
    return result, format_human


def handle_stage_update(args):
    """Handle 'stage update' — delegates to update_stage.run()."""
    from update_stage import run, format_human
    result = run(
        file=args.file,
        stage=args.stage,
        status=args.status,
        output=args.output,
        agent=args.agent,
    )
    return result, format_human


def handle_stage_complete(args):
    """Handle 'stage complete' — delegates to complete_stage.run()."""
    from complete_stage import run, format_human
    result = run(
        file=args.file,
        stage=args.stage,
        output=args.output,
        agent=args.agent,
    )
    return result, format_human


def handle_stage_reset(args):
    """Handle 'stage reset' — delegates to reset_stage.run()."""
    from reset_stage import run, format_human
    result = run(
        file=args.file,
        stage=args.stage,
        clear_refinement=args.clear_refinement,
    )
    return result, format_human


def handle_stage_set_data(args):
    """Handle 'stage set-data' — delegates to update_stage_data.run()."""
    from update_stage_data import run, format_human
    result = run(
        file=args.file,
        stage=args.stage,
        key=args.key,
        value=args.value,
    )
    return result, format_human


# -- task group placeholders ------------------------------------------------

def handle_task_add(args):
    """Handle 'task add' — delegates to add_task.run()."""
    from add_task import run, format_human
    result = run(
        file=args.file,
        id=args.id,
        title=args.title,
        detail_file=args.detail_file,
        depends_on=args.depends_on,
    )
    return result, format_human


def handle_task_add_subtask(args):
    """Handle 'task add-subtask' — delegates to add_subtask.run()."""
    from add_subtask import run, format_human
    result = run(
        file=args.file,
        task_id=args.task_id,
        subtask_id=args.subtask_id,
        title=args.title,
    )
    return result, format_human


def handle_task_update(args):
    """Handle 'task update' — delegates to update_task.run()."""
    from update_task import run, format_human
    result = run(
        file=args.file,
        task_id=args.task_id,
        status=args.status,
    )
    return result, format_human


def handle_task_update_subtask(args):
    """Handle 'task update-subtask' — delegates to update_subtask.run()."""
    from update_subtask import run, format_human
    result = run(
        file=args.file,
        task_id=args.task_id,
        subtask_id=args.subtask_id,
        status=args.status,
    )
    return result, format_human


def handle_task_status(args):
    """Handle 'task status' — delegates to get_task_status.run()."""
    from get_task_status import run, format_human
    result = run(file=args.file, task_id=args.task_id)
    return result, format_human


def handle_task_pending(args):
    """Handle 'task pending' — delegates to get_pending_tasks.run()."""
    from get_pending_tasks import run, format_human
    result = run(file=args.file, include_blocked=args.include_blocked)
    return result, format_human


def handle_task_next(args):
    """Handle 'task next' — delegates to get_next_task.run()."""
    from get_next_task import run, format_human
    result = run(file=args.file)
    return result, format_human


def handle_task_check_done(args):
    """Handle 'task check-done' — delegates to check_task_completion.run()."""
    from check_task_completion import run, format_human
    result = run(file=args.file)
    return result, format_human


# -- refinement group placeholders ------------------------------------------

def handle_refinement_record(args):
    """Handle 'refinement record' — delegates to record_refinement.run()."""
    from record_refinement import run, format_human
    result = run(
        file=args.file,
        stage=args.stage,
        result=args.result,
        feedback_file=args.feedback_file,
        model=args.model,
    )
    return result, format_human


def handle_refinement_get_feedback(args):
    """Handle 'refinement get-feedback' — delegates to get_feedback_file.run()."""
    from get_feedback_file import run, format_human
    result = run(file=args.file, stage=args.stage, attempt=args.attempt)
    return result, format_human


def handle_refinement_next_feedback_path(args):
    """Handle 'refinement next-feedback-path' — delegates to get_feedback_file_for_attempt.run()."""
    from get_feedback_file_for_attempt import run, format_human
    result = run(file=args.file, stage=args.stage, attempt=args.attempt)
    return result, format_human


def handle_refinement_check_loop(args):
    """Handle 'refinement check-loop' — delegates to check_loop.run()."""
    from check_loop import run, format_human
    result = run(file=args.file, stage=args.stage)
    return result, format_human


# -- status (flat) placeholder ----------------------------------------------

def handle_status(args):
    """Handle 'status' — delegates to read_status.run()."""
    from read_status import run, format_human
    result = run(
        file=args.file,
        validate=args.validate,
        section=args.section,
    )
    return result, format_human


# -- meta group placeholders ------------------------------------------------

def handle_meta_git_update(args):
    """Handle 'meta git-update' — delegates to update_git_info.run()."""
    from update_git_info import run, format_human
    result = run(
        file=args.file,
        branch=args.branch,
        pr_number=args.pr_number,
        pr_url=args.pr_url,
    )
    return result, format_human


def handle_meta_issue_add(args):
    """Handle 'meta issue-add' — delegates to add_github_issue.run()."""
    from add_github_issue import run, format_human
    result = run(
        file=args.file,
        number=args.number,
        url=args.url,
        title=args.title,
        type=args.type,
    )
    return result, format_human


def handle_meta_error_add(args):
    """Handle 'meta error-add' — delegates to add_error.run()."""
    from add_error import run, format_human
    result = run(
        file=args.file,
        message=args.message,
        stage=args.stage,
        task_id=args.task_id,
        code=args.code,
    )
    return result, format_human


# ---------------------------------------------------------------------------
# Parser construction
# ---------------------------------------------------------------------------

def _build_init_group(groups):
    """Register the 'init' command group and its subcommands."""
    init_group = groups.add_parser(
        "init",
        help="Initialize pipelines and run migrations",
        description="Initialize pipelines and run migrations",
    )
    init_cmds = init_group.add_subparsers(dest="command", required=True)

    # -- init create --------------------------------------------------------
    p = init_cmds.add_parser(
        "create",
        help="Create a new pipeline with v3.0 schema",
        description=(
            "Create a new pipeline directory with status.json and required "
            "subdirectories (requirements/, tasks/)"
        ),
    )
    p.add_argument(
        "--name", required=True,
        help="Feature name slug (e.g., 'user-auth')",
    )
    p.add_argument(
        "--prd-id", default=None,
        help="Pipeline ID (auto-generated if omitted)",
    )
    p.add_argument(
        "--mode", default="feature",
        choices=["full", "feature", "debug"],
        help="Pipeline mode (default: feature)",
    )
    p.add_argument(
        "--source-type", default=None,
        choices=["github-issue", "user-prompt", "spec-file"],
        help="Source type",
    )
    p.add_argument(
        "--source-ref", default=None,
        help="Source reference (issue number, file path)",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_init_create)

    # -- init get-next-available-id ------------------------------------------
    p = init_cmds.add_parser(
        "get-next-available-id",
        help="Get next available pipeline ID (4-digit)",
        description=(
            "Scan existing pipeline folders and return next available "
            "pipeline ID in 4-digit format (e.g., 0001)"
        ),
    )
    p.add_argument(
        "--docs-dir", default=".tot-docs",
        help="Directory containing pipeline folders (default: .tot-docs)",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_init_next_id)

    # -- init migrate-v3 ----------------------------------------------------
    p = init_cmds.add_parser(
        "migrate-v3",
        help="Migrate v2.1 status file to v3.0 format",
        description=(
            "Convert existing pipeline status files from schema v2.1 to v3.0"
        ),
    )
    p.add_argument(
        "--file", required=True,
        help="Path to v2.1 status JSON file",
    )
    p.add_argument(
        "--output", default=None,
        help="Output path (default: overwrite input file)",
    )
    p.add_argument(
        "--dry-run", action="store_true",
        help="Print migrated JSON without saving",
    )
    p.add_argument(
        "--backup", action="store_true",
        help="Create .backup file before overwriting",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_init_migrate_v3)

    # -- init migrate-folders -----------------------------------------------
    p = init_cmds.add_parser(
        "migrate-folders",
        help="Migrate .tot-docs to feature-based folder structure",
        description=(
            "Migrate .tot-docs from flat structure to feature-based folders"
        ),
    )
    p.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be done without making changes",
    )
    p.add_argument(
        "--cwd", default=".",
        help="Working directory (default: current)",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_init_migrate_folders)

    # -- init paths ---------------------------------------------------------
    p = init_cmds.add_parser(
        "paths",
        help="Get pipeline paths from status file",
        description=(
            "Return commonly needed paths: pipelineDir, requirementsDir, "
            "prdFile, tasksDir"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--format", choices=["json", "human", "shell"], default="json",
        help=(
            "Output format (default: json). "
            "'shell' outputs key=value pairs for sourcing"
        ),
    )
    p.set_defaults(func=handle_init_paths)


def _build_stage_group(groups):
    """Register the 'stage' command group and its subcommands."""
    stage_group = groups.add_parser(
        "stage",
        help="Manage pipeline stages",
        description="Manage pipeline stages",
    )
    stage_cmds = stage_group.add_subparsers(dest="command", required=True)

    # -- stage current ------------------------------------------------------
    p = stage_cmds.add_parser(
        "current",
        help="Get current stage name and index",
        description="Return the current stage name, index, and status",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--format", choices=["json", "human", "name"], default="json",
        help=(
            "Output format (default: json). "
            "'name' outputs bare stage name"
        ),
    )
    p.set_defaults(func=handle_stage_current)

    # -- stage status -------------------------------------------------------
    p = stage_cmds.add_parser(
        "status",
        help="Get detailed status of a specific stage",
        description="Return detailed status information for a specific stage",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_stage_status)

    # -- stage update -------------------------------------------------------
    p = stage_cmds.add_parser(
        "update",
        help="Update stage status",
        description=(
            "Update stage status with proper timestamps and index management"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name (e.g., create-prd)",
    )
    p.add_argument(
        "--status", required=True,
        help="New status (pending, in-progress, completed, failed, skipped)",
    )
    p.add_argument(
        "--output", default=None,
        help="Output value (file path or result string or JSON)",
    )
    p.add_argument(
        "--agent", default=None,
        help="Agent name/model that performed the action",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_stage_update)

    # -- stage complete -----------------------------------------------------
    p = stage_cmds.add_parser(
        "complete",
        help="Complete stage and advance to next",
        description=(
            "Mark current stage as completed and advance to the next "
            "stage in the array"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage to explicitly complete",
    )
    p.add_argument(
        "--output", required=True,
        help="Output of the completed stage",
    )
    p.add_argument(
        "--agent", default=None,
        help="Agent/model that completed this stage",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_stage_complete)

    # -- stage reset --------------------------------------------------------
    p = stage_cmds.add_parser(
        "reset",
        help="Reset a stage to pending",
        description=(
            "Reset a stage status and optionally clear its refinement"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name to reset",
    )
    p.add_argument(
        "--clear-refinement", action="store_true",
        help="Also reset refinement counter and feedback",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_stage_reset)

    # -- stage set-data -----------------------------------------------------
    p = stage_cmds.add_parser(
        "set-data",
        help="Set a key-value pair in stage data",
        description="Update a key-value pair in a stage's data object",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name",
    )
    p.add_argument(
        "--key", required=True,
        help="Data key (e.g., 'depth', 'brainstormMode')",
    )
    p.add_argument(
        "--value", required=True,
        help="Value (parsed as JSON if valid, else string)",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_stage_set_data)


def _build_task_group(groups):
    """Register the 'task' command group and its subcommands."""
    task_group = groups.add_parser(
        "task",
        help="Manage tasks and subtasks",
        description="Manage tasks and subtasks",
    )
    task_cmds = task_group.add_subparsers(dest="command", required=True)

    # -- task add -----------------------------------------------------------
    p = task_cmds.add_parser(
        "add",
        help="Add a new task to the pipeline",
        description=(
            "Add a task to the tasks array with optional dependencies "
            "and detail file"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--id", required=True,
        help="Task ID (e.g., '1', '2')",
    )
    p.add_argument(
        "--title", required=True,
        help="Task title",
    )
    p.add_argument(
        "--detail-file", default=None,
        help="Path to detail file (relative to pipelineDir)",
    )
    p.add_argument(
        "--depends-on", default=None,
        help="Comma-separated task IDs (e.g., '1,2')",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_add)

    # -- task add-subtask ---------------------------------------------------
    p = task_cmds.add_parser(
        "add-subtask",
        help="Add a subtask to an existing task",
        description="Append a subtask to a task's subtasks array",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--task-id", required=True,
        help="Parent task ID",
    )
    p.add_argument(
        "--subtask-id", required=True,
        help="Subtask ID (e.g., '1.1')",
    )
    p.add_argument(
        "--title", required=True,
        help="Subtask title",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_add_subtask)

    # -- task update --------------------------------------------------------
    p = task_cmds.add_parser(
        "update",
        help="Update task status",
        description="Update task status with proper timestamps",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--task-id", required=True,
        help="Task ID",
    )
    p.add_argument(
        "--status", required=True,
        help="New status (pending, in-progress, completed, failed)",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_update)

    # -- task update-subtask ------------------------------------------------
    p = task_cmds.add_parser(
        "update-subtask",
        help="Update subtask status",
        description="Update the status of a subtask within a task",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--task-id", required=True,
        help="Parent task ID",
    )
    p.add_argument(
        "--subtask-id", required=True,
        help="Subtask ID",
    )
    p.add_argument(
        "--status", required=True,
        help="New status (pending, in-progress, completed, failed)",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_update_subtask)

    # -- task status --------------------------------------------------------
    p = task_cmds.add_parser(
        "status",
        help="Get task status with subtask summary",
        description="Return task status with subtask summary",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--task-id", required=True,
        help="Task ID",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_status)

    # -- task pending -------------------------------------------------------
    p = task_cmds.add_parser(
        "pending",
        help="List pending tasks with dependency info",
        description="Return list of pending tasks with dependency status",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--include-blocked", action="store_true",
        help="Include tasks blocked by dependencies",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_pending)

    # -- task next ----------------------------------------------------------
    p = task_cmds.add_parser(
        "next",
        help="Get next available task (deps resolved)",
        description=(
            "Return the next task that is pending and has all "
            "dependencies completed"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_next)

    # -- task check-done ----------------------------------------------------
    p = task_cmds.add_parser(
        "check-done",
        help="Check if all tasks are completed",
        description="Check if all tasks and subtasks are completed",
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_task_check_done)


def _build_refinement_group(groups):
    """Register the 'refinement' command group and its subcommands."""
    ref_group = groups.add_parser(
        "refinement",
        help="Record and query refinement attempts, check loop control",
        description=(
            "Record and query refinement attempts, check loop control"
        ),
    )
    ref_cmds = ref_group.add_subparsers(dest="command", required=True)

    # -- refinement record --------------------------------------------------
    p = ref_cmds.add_parser(
        "record",
        help="Record a refinement attempt result",
        description=(
            "Record a refinement attempt with embedded refinement "
            "in the stage"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name (e.g., 'create-prd', 'generate-plan', 'implement')",
    )
    p.add_argument(
        "--result", required=True,
        choices=["passed", "failed", "approved", "rejected"],
        help="Result of validation",
    )
    p.add_argument(
        "--feedback-file", default=None,
        help="Path to feedback file (relative to pipeline dir)",
    )
    p.add_argument(
        "--model", default=None,
        help="Model/agent that performed validation",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_refinement_record)

    # -- refinement get-feedback --------------------------------------------
    p = ref_cmds.add_parser(
        "get-feedback",
        help="Get path to existing feedback file for a stage",
        description=(
            "Return the path to the latest feedback file from a stage's "
            "embedded refinement"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name",
    )
    p.add_argument(
        "--attempt", type=int, default=None,
        help="Specific attempt number (default: latest)",
    )
    p.add_argument(
        "--format", choices=["json", "human", "path"], default="json",
        help=(
            "Output format (default: json). "
            "'path' outputs bare absolute path"
        ),
    )
    p.set_defaults(func=handle_refinement_get_feedback)

    # -- refinement next-feedback-path --------------------------------------
    p = ref_cmds.add_parser(
        "next-feedback-path",
        help="Generate path for next feedback file to write",
        description=(
            "Return the path where a feedback file should be written"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name",
    )
    p.add_argument(
        "--attempt", type=int, default=None,
        help="Attempt number (default: auto-calculate next attempt)",
    )
    p.add_argument(
        "--format", choices=["json", "human", "path"], default="json",
        help=(
            "Output format (default: json). "
            "'path' outputs bare absolute path"
        ),
    )
    p.set_defaults(func=handle_refinement_next_feedback_path)

    # -- refinement check-loop ----------------------------------------------
    p = ref_cmds.add_parser(
        "check-loop",
        help="Check refinement loop status (CONTINUE/DONE/MAX_REACHED)",
        description=(
            "Check if refinement loop should continue. Returns minimal "
            "single-word status to minimize output and prevent context rot"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--stage", required=True,
        help="Stage name to check",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_refinement_check_loop)


def _build_status_command(groups):
    """Register the 'status' flat command (no subcommands)."""
    status_cmd = groups.add_parser(
        "status",
        help="Read and validate status files",
        description="Read and validate status files",
    )
    _add_file_or_pipeline_args(status_cmd)
    status_cmd.add_argument(
        "--validate", action="store_true",
        help="Validate status file against v3.0 schema",
    )
    status_cmd.add_argument(
        "--section", default=None,
        choices=["stages", "tasks", "git", "source", "files", "errors"],
        help="Read only a specific section",
    )
    status_cmd.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    status_cmd.set_defaults(func=handle_status)


def _build_meta_group(groups):
    """Register the 'meta' command group and its subcommands."""
    meta_group = groups.add_parser(
        "meta",
        help="Update git info, issues, and errors",
        description="Update git info, issues, and errors",
    )
    meta_cmds = meta_group.add_subparsers(dest="command", required=True)

    # -- meta git-update ----------------------------------------------------
    p = meta_cmds.add_parser(
        "git-update",
        help="Update git branch and PR information",
        description=(
            "Update the git object with branch and PR information"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--branch", default=None,
        help="Branch name",
    )
    p.add_argument(
        "--pr-number", type=int, default=None,
        help="PR number",
    )
    p.add_argument(
        "--pr-url", default=None,
        help="PR URL",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_meta_git_update)

    # -- meta issue-add -----------------------------------------------------
    p = meta_cmds.add_parser(
        "issue-add",
        help="Add a GitHub issue reference",
        description=(
            "Add GitHub issue to create-issues stage output"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--number", type=int, required=True,
        help="Issue number",
    )
    p.add_argument(
        "--url", required=True,
        help="Issue URL",
    )
    p.add_argument(
        "--title", required=True,
        help="Issue title",
    )
    p.add_argument(
        "--type", default="feature",
        choices=["feature", "bug", "task", "enhancement"],
        help="Issue type (default: feature)",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_meta_issue_add)

    # -- meta error-add -----------------------------------------------------
    p = meta_cmds.add_parser(
        "error-add",
        help="Record a pipeline error",
        description=(
            "Append an error entry with timestamp and optional context"
        ),
    )
    _add_file_or_pipeline_args(p)
    p.add_argument(
        "--message", required=True,
        help="Error message",
    )
    p.add_argument(
        "--stage", default=None,
        help="Stage where error occurred",
    )
    p.add_argument(
        "--task-id", default=None,
        help="Task ID where error occurred",
    )
    p.add_argument(
        "--code", default=None,
        help="Error code",
    )
    p.add_argument(
        "--format", choices=["json", "human"], default="json",
        help="Output format (default: json)",
    )
    p.set_defaults(func=handle_meta_error_add)


def build_parser():
    """Build the complete argparse parser tree.

    Returns the top-level ``ArgumentParser`` with 6 command groups:
    init, stage, task, refinement, status (flat), meta.
    """
    parser = argparse.ArgumentParser(
        prog="pipeline.py",
        description=(
            "Pipeline Management CLI — "
            "Manage pipeline status files (schema v3.0)"
        ),
    )
    parser.add_argument(
        "--version", action="version",
        version=f"%(prog)s {__version__}",
    )

    groups = parser.add_subparsers(
        dest="group", required=True,
        metavar="{init,stage,task,refinement,status,meta}",
    )

    _build_init_group(groups)
    _build_stage_group(groups)
    _build_task_group(groups)
    _build_refinement_group(groups)
    _build_status_command(groups)
    _build_meta_group(groups)

    return parser


# ---------------------------------------------------------------------------
# Dispatch and error handling
# ---------------------------------------------------------------------------

def dispatch(args):
    """Call handler, format output, exit with correct code.

    The handler returns ``(result_dict, formatter_function)``.
    ``formatter_func`` has signature ``(result, fmt="human") -> str``.

    If *result* contains an ``_exit_code`` key it is popped and used as
    the process exit code (default ``0``).  JSON output never includes
    ``_exit_code``.
    """
    # Resolve --pipeline-id to --file if provided
    if getattr(args, 'pipeline_id', None) is not None:
        from pipeline_utils import resolve_pipeline_id
        try:
            args.file = resolve_pipeline_id(args.pipeline_id)
        except (ValueError, FileNotFoundError) as e:
            handle_error(e, args, "PIPELINE_RESOLUTION_ERROR")

    result, formatter = args.func(args)

    fmt = getattr(args, "format", "json")
    exit_code = result.pop("_exit_code", 0)

    if fmt == "json":
        print(json.dumps(result, indent=2))
    else:
        print(formatter(result, fmt=fmt))

    sys.exit(exit_code)


def handle_error(error, args, code):
    """Format and print an error, then ``sys.exit(1)``."""
    fmt = getattr(args, "format", "json")
    if fmt == "json":
        print(json.dumps({"error": str(error), "code": code}, indent=2))
    else:
        print(f"Error: {error}")
    sys.exit(1)


def main():
    parser = build_parser()
    args = parser.parse_args()

    try:
        dispatch(args)
    except ValueError as e:
        handle_error(e, args, "VALIDATION_ERROR")
    except FileNotFoundError as e:
        handle_error(e, args, "FILE_NOT_FOUND")
    except Exception as e:
        handle_error(e, args, "ERROR")


if __name__ == "__main__":
    main()
