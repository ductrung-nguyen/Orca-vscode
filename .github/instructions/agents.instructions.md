---
description: Global instructions when working in this workspace.
applyTo: "**/*.agent.md"
---
# How to Write a Custom Agent for VS Code Copilot

This guide explains how to write custom agent files (`.agent.md`) for VS Code Copilot. Custom agents allow you to tailor the AI's behavior, tools, and instructions for specific workflows.

## 1. File Location & Naming

*   **Extension:** Must use `.agent.md`.
*   **Workspace Location:** Place in `.github/agents/` within your project root to share with the team.
    *   Example: `.github/agents/planner.agent.md`
*   **User Location:** Place in your user profile folder to use across all workspaces.

## 2. File Structure

A custom agent file consists of two parts:
1.  **YAML Frontmatter:** Configuration (name, description, tools, handoffs).
2.  **Body:** Markdown-based instructions and prompts.

### YAML Frontmatter

Required and optional fields in the header:

```yaml
---
# REQUIRED
name: "Agent Name"                  # Display name in the dropdown
description: "Agent description"    # Description shown to the user

# OPTIONAL
tools:                              # List of tools the agent can use
  - 'SEARCH'
  - 'read_file'
  - 'run_command'
  # Reference specific custom tools or defaults

model: "gpt-4"                      # Specific model to use (if supported)

handoffs:                           # Define transitions to other agents
  - label: "Review Code"            # Button text for the user
    agent: "reviewer"               # Slug/name of the target agent
    prompt: "Review the code."      # Pre-filled prompt for the next agent
    send: false                     # If true, auto-submits the prompt
---
```

### Body (Instructions)

The body contains the system prompt and guidelines for the agent. You can:
*   Define the persona and goal.
*   Provide specific formatting rules.
*   Reference specific tools using `#tool:toolName`.
*   Establish boundaries (e.g., "Do not edit code, only plan").

## 3. Example: Planning Agent

Here is a complete example of a "Planner" agent that focuses on requirements gathering and implementation planning without writing code.

```markdown
---
name: Planner
description: Helps generate detailed implementation plans.
tools:
  - 'search_web'
  - 'read_file'
  - 'list_dir'
handoffs:
  - label: "Start Implementation"
    agent: "developer"
    prompt: "Implement the plan drafted above."
    send: false
---

# Planner Agent Instructions

You are an expert software architect. Your goal is to create comprehensive implementation plans.

## Guidelines
1.  **Analyze Request**: Understand the user's goal.
2.  **Explore Context**: Use available tools to understand the existing codebase.
3.  **Draft Plan**: Create a step-by-step plan.
    *   Do NOT write code. 
    *   Focus on structural changes and logic.
4.  **Verification**: Always include a section on how to verify the changes.

When you have a solid plan, suggest handing off to the 'developer' agent.
```

## 4. Best Practices

*   **Specialization**: Create separate agents for distinct tasks (e.g., Planner, Tester, Reviewer) rather than one "god agent".
*   **Context Isolation**: Be explicit about what context the agent needs.
*   **Clean Transitions**: Use `handoffs` to guide the user through a workflow (Plan -> Implement -> Verify).
*   **Tool Scoping**: Only give the agent the tools it strictly needs to reduce hallucination and improve security.
