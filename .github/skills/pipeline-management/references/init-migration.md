# Init & Migration Reference

## Overview
These scripts handle pipeline initialization, PRD ID generation, and schema migration between versions.

## init_pipeline.py

### Purpose
Creates a new pipeline status.json file with initial structure based on mode.

### Usage
```bash
python <SKILL_FOLDER>/scripts/init_pipeline.py \
  --name "user-authentication" \
  --prd-id 001 \
  --mode feature \
  --output-json
```

### Parameters
- `--name NAME` (required): Feature/project name (kebab-case recommended)
- `--prd-id ID`: PRD number (e.g., "001"). Auto-generated if omitted
- `--mode feature|full|debug`: Pipeline mode (default: feature)
  - `feature`: Standard feature pipeline (discover → create-prd → ... → handle-pr-feedback)
  - `full`: Full project setup (git-init → feature stages)
  - `debug`: Bugfix pipeline (analyze-bug → ... → finalize-fix)
- `--output-json`: Return JSON response instead of human-readable text

### Output Location
Creates: `.tot-docs/pipeline-status/{prd-id}-{name}/status.json`

Example: `.tot-docs/pipeline-status/001-user-authentication/status.json`

### Example Output (JSON)
```json
{
  "success": true,
  "file": ".tot-docs/pipeline-status/001-user-authentication/status.json",
  "prdId": "001",
  "featureName": "user-authentication",
  "mode": "feature"
}
```

### Common Patterns
```bash
# Auto-generate PRD ID
python <SKILL_FOLDER>/scripts/init_pipeline.py --name "payment-gateway"

# Start bugfix pipeline
python <SKILL_FOLDER>/scripts/init_pipeline.py \
  --name "fix-memory-leak" \
  --mode debug

# Full project setup
python <SKILL_FOLDER>/scripts/init_pipeline.py \
  --name "my-new-app" \
  --mode full
```

## get_next_pipeline_id.py (also: pipeline.py init get-next-available-id)

### Purpose
Generates the next available pipeline ID by scanning existing pipeline folders.

### Usage
```bash
python <SKILL_FOLDER>/scripts/pipeline.py init get-next-available-id
python <SKILL_FOLDER>/scripts/pipeline.py init get-next-available-id --docs-dir /path/to/.tot-docs
# Or standalone:
python <SKILL_FOLDER>/scripts/get_next_pipeline_id.py --docs-dir /path/to/.tot-docs
```

### Parameters
- `--docs-dir DIR`: Path to .tot-docs directory (default: .tot-docs)

### Output
Prints the next pipeline ID in 4-digit format: `0001`, `0002`, `0003`, etc.

### Example
```bash
# If 0001, 0002, 0003 exist, returns:
0004
```

### Usage in Scripts
```bash
NEXT_ID=$(python <SKILL_FOLDER>/scripts/pipeline.py init get-next-available-id --format human)
python <SKILL_FOLDER>/scripts/pipeline.py init create --name "new-feature" --prd-id "$NEXT_ID"
```

