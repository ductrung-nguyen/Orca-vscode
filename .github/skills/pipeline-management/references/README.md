# Pipeline Management References

Detailed documentation for pipeline-management scripts. Read these only when you need specific usage details, patterns, or examples.

## Reference Files

| File | Coverage | When to Read |
|------|----------|--------------|
| [init-migration.md](./init-migration.md) | Pipeline initialization, PRD ID generation, schema migration | Starting new pipelines, migrating v2→v3 |
| [stages.md](./stages.md) | Stage lifecycle, status updates, progression control | Managing pipeline phases, advancing stages |
| [tasks.md](./tasks.md) | Task/subtask creation, dependencies, completion tracking | Implementation phase, task management |
| [feedback-files.md](./feedback-files.md) | Feedback file retrieval, refinement iteration workflows | Refine loops, validation cycles |
| [loop-control.md](./loop-control.md) | Loop exit conditions, max attempt handling | Coordinating refine loops, preventing infinite loops |
| [other-scripts.md](./other-scripts.md) | Status reading, GitHub integration, error tracking | Reading pipeline state, tracking issues/PRs |

## Quick Start

**See SKILL.md first** for script signatures and basic usage. Only read these references when you need:
- Detailed parameter explanations
- Output format examples
- Common usage patterns
- Integration examples
- Error handling guidance

## Token Efficiency

These files are intentionally separated to save tokens - don't load them all at once. Read only what you need for your current task.
