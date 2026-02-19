---
applyTo: "**/prompts/**/*.md,**/agents/**/*.md"
---
# Skill Script Invocation Standards

## Parameter Case Sensitivity

Scripts use **lowercase** for enum values:
- ✅ `--result passed` or `--result approved`
- ❌ `--result PASSED` or `--result APPROVED`

## Valid Values Reference

| Script | Parameter | Valid Values |
|--------|-----------|--------------|
| `record_refinement.py` | `--result` | `passed`, `failed`, `approved`, `rejected` |
| `update_stage.py` | `--status` | `pending`, `in-progress`, `completed`, `failed` |

| `get_feedback_file_for_attempt.py` | `--format` | `json`, `human`, `path` (no --create-dir flag!) |

## Verification Before Documenting Script Calls

1. Check valid options: `python script.py --help`
2. Confirm file extension: `.py` vs `.sh`
3. Use exact lowercase for enum values
