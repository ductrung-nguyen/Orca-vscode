---
name: "tot.task-implementor"
model: Claude Sonnet 4.5 (copilot)
description: "Implements a single sub-task following TDD. Two modes: implement (initial) or remediate (fix issues from feedback)."
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit", "web", "search", "vscode/vscodeAPI"]
infer: true
---

# tot.task-implementor Agent (Copilot Shim)

**This is a shim file.** Read and follow the full instructions in:

👉 **[@/.tot/agents/tot.task-implementor.agent.md](@/.tot/agents/tot.task-implementor.agent.md)**
