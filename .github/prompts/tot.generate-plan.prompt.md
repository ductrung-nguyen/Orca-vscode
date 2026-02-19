---
agent: "tot.plan-generator"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit"]
description: "Generate a detailed implementation plan with task breakdown from a validated PRD. Creates actionable tasks for junior developers following TDD practices."
argument-hint: PRD_FILE="{PIPELINE_DIR}/prd.md" OUTPUT_FILE="{PIPELINE_DIR}/plan.md"
---

# tot.generate-plan.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.generate-plan.prompt.md](@/.tot/prompts/tot.generate-plan.prompt.md)**
