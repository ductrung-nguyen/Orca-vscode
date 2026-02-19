---
description: "Orchestrate PRD creation and validation in a feedback loop until PRD passes or max attempts reached."
argument-hint: DISCOVERY_FOLDER=".tot-docs/requirements/..." or REQUIREMENT="..." [MAX_ATTEMPTS=5] [AUTO_ANSWER=false]
model: Raptor mini (Preview) (copilot)
name: "tot.prd-refine-loop"
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit", "vscode/askQuestions"]
skills: ["pipeline-management", "todo-loop-enforcement"]
---

# tot.prd-refine-loop.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.prd-refine-loop.prompt.md](@/.tot/prompts/tot.prd-refine-loop.prompt.md)**
