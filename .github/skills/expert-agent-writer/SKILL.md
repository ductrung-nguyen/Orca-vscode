---
name: expert-agent-writer
description: Helps users author high-quality declarative agents (`.agent.md`). Use this skill when the user wants to create a new agent, update an existing one, or needs guidance on agent structure and patterns (loops, sub-agents, etc.).
---

# Expert Agent Writer

Follow this process to help the user author a high-quality `.agent.md` file.

## Phase 1: Context Gathering

1.  **Understand the Goal**: Ask what specific workflow the agent should orchestrate (e.g., "Refine a PRD", "Fix a Bug", "Review Code").
2.  **Determine Scope**: Is it a simple single-pass agent or a complex loop?
    - *Simple*: Standard prompt.
    - *Complex*: Needs defined protocol loop (FOR/WHILE), sub-agents, and state management.

## Phase 2: Drafting

1.  **Select Template**: Read `references/agent_template.md` to get the base structure.
2.  **Define Contract**:
    - **Input**: What variables MUST affect the agent? (e.g., `FILE`, `BUG`).
    - **Output**: What signals success? (`PASS`, `FAIL`).
3.  **Write Protocol**:
    - Use pseudo-code for logic.
    - Use `runSubagent` for context isolation.
4.  **Review Best Practices**: Check against `references/best_practices.md`.

## Phase 3: Validation

Critique the draft:
- [ ] **Conciseness**: Is the system prompt free of "fluff"?
- [ ] **Isolation**: Are sub-agents called with explicit arguments?
- [ ] **Tools**: Are correct tools listed in frontmatter?
- [ ] **Model**: Is `Claude Sonnet 3.5` (or latest) used?

## Tools
- `read_file` on `references/agent_template.md` for structure.
- `read_file` on `references/best_practices.md` for rules.
