---
name: expert-skill-writer
description: Helps users author high-quality agentic skills. Use this skill when the user wants to create a new skill, update an existing one, or needs guidance on skill structure and best practices. Provides step-by-step guidance from scoping to validation.
---

# Expert Skill Writer

Follow this process to author a high-quality skill.

## Phase 1: Scoping
1.  **Identify the Trigger**: Ask "What specific user intent should trigger this skill?"
2.  **Identify the Actions**: Ask "What exact steps or tools will the agent need to execute?"
3.  **Determine Complexity**:
    - *Low*: Simple text instructions.
    - *High*: Requires scripts (`scripts/`) or heavy documentation (`references/`).

## Phase 2: Architecture
Propose a file structure based on complexity.
- Always include `SKILL.md`.
- **If** logic is deterministic and complex/fragile -> Recommend a **Script**. Prefer python script.
- **If** documentation > 1 page -> Recommend a **Reference** file.

## Phase 3: Drafting
Write the content.
1.  **Draft Frontmatter**: Write a `description` that clearly defines the "When to use" trigger.
2.  **Draft Body**: Write concise imperative instructions.
3.  **Draft Resources**: Create necessary scripts/references.

*Refer to [best_practices.md](references/best_practices.md) for detailed rules on conciseness and formatting.*

## Phase 4: Validation
Critique the draft against the **Economy of Context** principles:
- [ ] Is the description a clear trigger?
- [ ] Is `SKILL.md` under 500 lines?
- [ ] are large docs moved to `references/`?
- [ ] Are there any "user-facing" docs (READMEs) that should be removed?

## Tools
- `read_file` on `references/best_practices.md` to check specific rules.
