---
agent: "tot.refactor"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit"]
description: "Refactoring pipeline to clean up project structure, remove redundancy, and improve readability/maintainability."
argument-hint: SCOPE="staged|commit|staged+commit|project" AUTO_APPLY=false
---

# tot.refactor.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.refactor.prompt.md](@/.tot/prompts/tot.refactor.prompt.md)**
