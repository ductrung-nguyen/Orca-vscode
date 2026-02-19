---
agent: "tot.plan-validator"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit"]
description: "Validation gate that ensures implementation plan is complete, correctly sequenced, and covers all PRD requirements before task execution begins."
argument-hint: PLAN_FILE="{PIPELINE_DIR}/plan.md" PRD_FILE="{PIPELINE_DIR}/prd.md" EXTERNAL_VALIDATE=true
---

# tot.validate-plan.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.validate-plan.prompt.md](@/.tot/prompts/tot.validate-plan.prompt.md)**
