---
agent: "tot.prd-validator"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read"]
description: "Validation gate that ensures PRD is complete and ready for task planning. Prevents incomplete PRDs from causing rework later."
argument-hint: PRD_FILE="{PIPELINE_DIR}/prd.md" EXTERNAL_VALIDATE=true
---

# tot.validate-prd.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.validate-prd.prompt.md](@/.tot/prompts/tot.validate-prd.prompt.md)**
