---
agent: "agent"
model: "Claude Sonnet 4.5 (copilot)"
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit"]
description: "Final stage of the pipeline. Generates changelog, release notes, updates documentation, and prepares for deployment."
argument-hint: PRD_FILE="{PIPELINE_DIR}/prd.md" TASK_FILE="{PIPELINE_DIR}/plan.md" VERSION=auto
---

# tot.finalize-release.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.finalize-release.prompt.md](@/.tot/prompts/tot.finalize-release.prompt.md)**
