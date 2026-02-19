---
agent: "tot.impl-validator"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit"]
description: "Validation gate that compares implementation against PRD requirements. Ensures all acceptance criteria are met before release."
argument-hint: PRD_FILE="{PIPELINE_DIR}/prd.md" TASK_FILE="{PIPELINE_DIR}/plan.md" EXTERNAL_VALIDATE=true
---

# tot.validate-implementation.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.validate-implementation.prompt.md](@/.tot/prompts/tot.validate-implementation.prompt.md)**
