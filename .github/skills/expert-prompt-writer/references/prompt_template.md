---
agent: "agent"                        # Default agent
model: "Claude Sonnet 3.5"            # Recommended model
tools: ["read", "runSubagent"]        # Common tools
description: "Short description of what this prompt does."
---

# [Title of the Prompt/Workflow]

**Purpose**: [Concise goal statement - e.g., "Generate Unit Tests for Python Functions"]

## Input

| Variable | Description |
| :--- | :--- |
| `selected_code` | The code to operate on (usually implicit via selection) |
| `additional_context` | Any specific requirements (e.g., testing framework) |

## Output

- [Description of expected output - e.g., "A set of pytest functions"]

## Instructions

1.  **Analyze Context**:
    - Read the selected code.
    - Identify key logic/dependencies.

2.  **[Step Name]**:
    - [Specific instruction]
    - [Specific instruction]

3.  **Generate Output**:
    - Produce the final response in [Format].

## Examples (Optional)

**Input:**
```python
def add(a, b): return a + b
```

**Output:**
```python
def test_add():
    assert add(1, 2) == 3
```
