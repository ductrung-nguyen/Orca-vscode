---
name: "tot.issues-refine-loop"
description: "Controls create-issues → validate → refine loop until PASS or MAX_ATTEMPTS"
model: Claude Sonnet 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit", "vscode/askQuestions"]
argument-hint: PRD_FILE=".tot-docs/prd/..." STATUS_FILE=".tot-docs/..." DRY_RUN=false
---

# tot.issues-refine-loop.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.issues-refine-loop.prompt.md](@/.tot/prompts/tot.issues-refine-loop.prompt.md)**
