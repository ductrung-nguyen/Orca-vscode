---
agent: "tot.impl-refine-loop"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit", "vscode/askQuestions"]
description: "Run implementation validation and remediation in a feedback loop until validation passes or max attempts reached"
argument-hint: PRD_FILE=".tot-docs/prd/001-feature.md" TASK_FILE=".tot-docs/tasks/001-feature.md" PIPELINE_ID="" STATUS_FILE="" MAX_ATTEMPTS=3 AUTO_ANSWER=false
skills: ["pipeline-management", "todo-loop-enforcement"]
---

# tot.impl-refine-loop.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.impl-refine-loop.prompt.md](@/.tot/prompts/tot.impl-refine-loop.prompt.md)**
