---
name: expert-prompt-writer
description: Helps users author high-quality GitHub Copilot Prompt Files (`.prompt.md`) and Antigravity Workflows. Use this skill when the user wants to create a reusable prompt template, standard operating procedure, or workflow.
---

# Expert Prompt Writer

Follow this process to help the user author a high-quality `.prompt.md` file (or Antigravity workflow).

## Phase 1: Context Gathering

1.  **Identify the Goal**: Ask what specific task the prompt should accomplish (e.g., "Refactor Code", "Generate Unit Tests", "Analyze Security").
2.  **Determine Inputs**: What information does the LLM need? (e.g., selected code, specific files, language version).
3.  **Define Outputs**: What should the result look like? (e.g., code block, markdown report, list of suggestions).
4.  **Tools**: Does the prompt need to use specific tools (e.g., `github`, `terminal`, `browser`)?

## Phase 2: Drafting

1.  **Select Template**: Read `references/prompt_template.md` to get the base structure.
2.  **Customize Sections**:
    - **Frontmatter**: Set `agent`, `model`, and `description`.
    - **Purpose**: Write a clear, active-verb statement.
    - **Context/Input**: Define variables using the `input` section or strict argument hints.
    - **Instructions**: Write step-by-step instructions. Use "Chain of Thought" if logical reasoning is required.
    - **Examples**: (Optional) Add examples of good inputs/outputs (Few-Shot Prompting).

## Phase 3: Validation

Critique the draft using this checklist:

- [ ] **Frontmatter**: Is it valid YAML? Does it include `agent`, `model`, `description`?
- [ ] **Clarity**: Are instructions imperative and unambiguous?
- [ ] **Context**: Does it reference the correct context (e.g., `#file`, `#selection`)?
- [ ] **Modularity**: Is the task small enough to be reliable? If not, suggest breaking it down.
- [ ] **File Extension**: Ensure the file ends in `.prompt.md` (for Copilot) or `.md` (for Workflows).

## Tools
- `read_file` on `references/prompt_template.md` for the starting structure.
