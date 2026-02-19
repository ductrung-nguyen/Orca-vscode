---
name: "tot.prd-creator"
description: Generate a Product Requirements Document (PRD) from discovery output or direct requirement. Supports both creation and refinement modes.
tools:
  [
    "vscode/vscodeAPI",
    "vscode/extensions",
    "execute/getTerminalOutput",
    "read/problems",
    "read/readFile",
    "read/terminalLastCommand",
    "edit/createFile",
    "edit/editFiles",
    "search/codebase",
    "search/searchResults",
    "search/usages",
    "web",
    "agent",
    "todo",
  ]
model: Claude Opus 4.5 (copilot)
infer: true
---

# tot.prd-creator Agent (Copilot Shim)

**This is a shim file.** Read and follow the full instructions in:

👉 **[@/.tot/agents/tot.prd-creator.agent.md](@/.tot/agents/tot.prd-creator.agent.md)**
