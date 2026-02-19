---
name: "tot.prd-validator"
description: Quality gate that validates PRD completeness, clarity, and readiness for task planning. Prevents incomplete PRDs from causing rework.
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
model: GPT-5.2-Codex (copilot)
infer: true
---

# tot.prd-validator Agent (Copilot Shim)

**This is a shim file.** Read and follow the full instructions in:

👉 **[@/.tot/agents/tot.prd-validator.agent.md](@/.tot/agents/tot.prd-validator.agent.md)**
