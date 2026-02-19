---
name: "tot.issue-pipeline-orchestrator"
description: "GitHub issue pipeline: fetch → validate → detect type → route to feature or bugfix pipeline"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "execute", "edit", "todo", "vscode/askQuestions"]
infer: true
---

# tot.issue-pipeline-orchestrator Agent (Copilot Shim)

**This is a shim file.** Read and follow the full instructions in:

👉 **[@/.tot/agents/tot.issue-pipeline-orchestrator.agent.md](@/.tot/agents/tot.issue-pipeline-orchestrator.agent.md)**
