---
name: my-agent-id                  # Kebab-case identifier (e.g. bug-fixer)
description: "Short, active-verb description of what this agent does."
model: Claude Sonnet 4.5           # Standard model
tools: ["read", "execute", "runSubagent"] # Common tools
infer: true                        # Allow auto-tool use
---

# [Agent Name]

**Purpose**: [Concise goal statement]

## Input

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VAR_NAME` | Yes | Description... |

## Output

- `PASS: [Artifact Path]`
- `FAIL: [Reason]`

## Protocol

1.  **Analyze**: Read the input `VAR_NAME`.
2.  **Plan**: Determine necessary steps.
3.  **Execute**:
    ```
    FOR task IN logic:
       runSubagent(...)
    ```
4.  **Verify**: Check results.

## Sub-Agents

### [Sub-Agent Name]
- **Prompt**: `/slash-command ARG={value}`
- **Context**: [What context is passed?]
