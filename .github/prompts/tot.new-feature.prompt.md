---
agent: "tot.feature-orchestrator"
name: "tot.new-feature"
model: Claude Sonnet 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit", "vscode/askQuestions"]
description: "New feature pipeline: discovery → PRD → issues → plan → implement → validate → finalize → PR feedback"
argument-hint: INPUT="description" AUTO_ANSWER=false INTERACTION_MODE=rich VALIDATE_ISSUES=false
---

# tot.new-feature.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.new-feature.prompt.md](@/.tot/prompts/tot.new-feature.prompt.md)**
