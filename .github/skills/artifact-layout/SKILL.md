---
name: artifact-layout
description: Define the standard directory structure and file naming conventions for all pipeline artifacts. Use this skill when (1) creating new pipeline artifacts, (2) determining file paths for PRDs/tasks/status files, (3) organizing discovery outputs, (4) archiving completed pipeline artifacts, or (5) resolving file paths across stages.
---

# Artifact Layout

Standard directory structure and file naming conventions for pipeline artifacts.

## Core Directory Structure

```
your-project/
├── .tot-docs/                          # All AI pipeline artifacts
│   ├── requirements/                 # Discovery output (discover stage)
│   │   └── [feature-slug]/
│   ├── prd/                          # Product Requirements (create-prd)
│   │   └── [id]-[feature-name].md
│   ├── tasks/                        # Implementation plans (generate-plan)
│   │   └── [id]-[feature-name].md
│   ├── tasks-details/                # Detailed task specs (implement)
│   │   └── [id]-[feature-name]/
│   ├── pipeline-status/              # Pipeline state (per PRD)
│   │   └── [id]-[feature-name].json
│   └── releases/                     # Release notes (finalize)
│       └── v[version].md
```

## Naming Conventions

### PRD ID Format

**Pattern:** `[3-digit-number]-[kebab-case-feature-name]`

**Examples:**
- `001-user-authentication`
- `002-payment-integration`

### File Naming Patterns

| File Type     | Pattern                      | Example                |
| ------------- | ---------------------------- | ---------------------- |
| PRD           | `[id]-[feature].md`          | `001-user-auth.md`     |
| Task List     | `[id]-[feature].md`          | `001-user-auth.md`     |
| Status File   | `[id]-[feature].json`        | `001-user-auth.json`   |
| Feedback File | `[id]-[feature]-feedback.md` | `001-user-auth-feedback.md` |
| Discovery Dir | `[feature-slug]/`            | `user-authentication/` |

## Path Construction

```javascript
function getPrdPath(id, featureName) {
  return `.tot-docs/prd/${id}-${featureName}.md`;
}

function getStatusPath(id, featureName) {
  return `.tot-docs/pipeline-status/${id}-${featureName}.json`;
}

function getTaskPath(id, featureName) {
  return `.tot-docs/tasks/${id}-${featureName}.md`;
}
```

## File Lifecycle

| File        | Created By      | Updated By       | Permanent? |
| ----------- | --------------- | ---------------- | ---------- |
| PRD         | create-prd      | create-prd       | Yes        |
| Task List   | generate-plan   | generate-plan    | Yes        |
| Status File | orchestrator    | All stages       | No         |
| Feedback    | Validators      | Validators       | No         |

## Path Rules

- All paths are relative to workspace root
- Use kebab-case for feature names
- IDs are sequential 3-digit numbers
