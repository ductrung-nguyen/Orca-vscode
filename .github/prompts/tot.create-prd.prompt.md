---
agent: "tot.prd-creator"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "edit"]
description: "Generate a Product Requirements Document (PRD) from discovery output or direct prompt. Supports both full discovery flow and quick feature requests."
argument-hint: INPUT="..." DISCOVERY_DIR=".tot-docs/requirements/..." PRD_ID=001
---

# tot.create-prd.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.create-prd.prompt.md](@/.tot/prompts/tot.create-prd.prompt.md)**
