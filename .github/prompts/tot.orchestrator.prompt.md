---
agent: "tot.main-orchestrator"
name: "tot.orchestrator"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "execute", "edit", "todo", "vscode/askQuestions"]
description: "Entry point that detects input type and routes to the appropriate pipeline."
argument-hint: INPUT="..." MODE=auto|bugfix|feature|full|issue
---

# tot.orchestrator.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.orchestrator.prompt.md](@/.tot/prompts/tot.orchestrator.prompt.md)**
