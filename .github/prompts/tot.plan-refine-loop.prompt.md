---
description: "Orchestrate plan generation and validation in a feedback loop until plan passes or max attempts reached."
argument-hint: PRD_FILE=".tot-docs/prd/001-feature.md" [PIPELINE_ID=...] [MAX_ATTEMPTS=10] [AUTO_ANSWER=false]
model: Raptor mini (Preview) (copilot)
name: "tot.plan-refine-loop"
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit", "vscode/askQuestions"]
skills: ["pipeline-management", "todo-loop-enforcement"]
---

# tot.plan-refine-loop.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.plan-refine-loop.prompt.md](@/.tot/prompts/tot.plan-refine-loop.prompt.md)**
