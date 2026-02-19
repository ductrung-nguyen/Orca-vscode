---
description: Global instructions when working with skills in this workspace.
applyTo: "**/skills/**/SKILL.md"
---
# How to Create Agent Skills for VS Code Copilot

This guide explains how to define **Agent Skills** for VS Code Copilot. Skills allow you to teach Copilot specialized capabilities, enabling it to perform tasks like testing, debugging, or deployment by following structured workflows.

## 1. Skill vs. Custom Instruction

*   **Agent Skills**: Reusable capabilities (often with scripts or tools) that can be shared and used across different AI tools and workflows (e.g., "Debug GitHub Actions", "Run E2E Tests").
*   **Custom Instructions**: Project-specific rules or conventions (e.g., "Always use TypeScript", "Follow Google Style Guide").

## 2. Directory Structure & Location

Skills are defined in a directory containing a `SKILL.md` file.

*   **Recommended Location**: `.github/skills/` in your workspace.
*   **Each skill needs its own folder**.

**Example Structure:**
```
.github/
  └── skills/
      ├── webapp-testing/
      │   ├── SKILL.md          <-- The definition
      │   └── test-template.js  <-- Helper files (optional)
      └── github-actions-debugging/
          └── SKILL.md
```
We can have more than 1 helper files/scripts. They can be organized in a subfolder if needed.

## 3. File Format (`SKILL.md`)

The `SKILL.md` file defines the metadata and instructions for the skill.

### Structure

1.  **YAML Frontmatter**: Metadata (name, description).
2.  **Body**: Behavior, process, and examples.

```markdown
---
name: skill-name-slug             # Unique slug for the skill
description: Brief description of what this skill does.
---

# Skill Title

## When to use this skill
Describe the specific scenarios where this skill is applicable.

## Process / Instructions
Step-by-step guide on how Copilot should execute this task.
1. Step one...
2. Step two...

## Examples
Provide input/output examples if helpful.
```

## 4. Example: Web App Testing Skill

**Path:** `.github/skills/webapp-testing/SKILL.md`

````markdown
---
name: webapp-testing
description: Guide for testing web applications using Playwright.
---

# Web Application Testing with Playwright

This skill helps you create and run browser-based tests for web applications using Playwright.

## When to use this skill
Use this skill when asked to:
- Create new Playwright tests.
- Debug failing browser tests.
- Set up test infrastructure.

## Creating tests
1. Review the [test template](./test-template.js) for the standard test structure.
2. Identify the user flow to test.
3. Create a new test file in the `tests/` directory.
4. Use Playwright's locators (prefer role-based selectors).
5. Add assertions to verify expected behavior.

## Running tests
To run tests locally:
```bash
npx playwright test
```

## Best practices
- Use `data-testid` attributes for dynamic content.
- Keep tests independent.
````

## 5. Best Practices

*   **Modularity**: Keep skills focused on a single capability.
*   **Include Resources**: Put template files, scripts, or examples in the skill's directory and reference them in `SKILL.md`.
*   **Clear Triggers**:  Explicitly state "When to use this skill" so Copilot knows when to activate it.
*   **Step-by-Step**: Numbered lists help the AI follow a strict procedure.
