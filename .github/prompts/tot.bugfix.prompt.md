---
agent: "tot.bugfix"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit", "vscode/askQuestions"]
description: "Bugfix pipeline: discovery → planning → approval → implementing → validating → finalizing"
argument-hint: BUG="description" AUTO_APPROVE_PLAN=false INTERACTION_MODE=rich
---

# tot.bugfix.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.bugfix.prompt.md](@/.tot/prompts/tot.bugfix.prompt.md)**
