---
name: "tot.bug-discovery-loop"
description: "Controls discovery phase loop: explorer → auditor → record result until DONE or MAX_REACHED"
model: Claude Sonnet 4.5 (copilot)
tools: ["agent/runSubagent", "read", "execute", "edit", "todo", "vscode/askQuestions"]
argument-hint: BUG="description" STATUS_FILE=".tot-docs/..." PIPELINE_DIR=".tot-docs/..." AUTO_ANSWER=false
infer: true
---

# tot.bug-discovery-loop.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.bug-discovery-loop.prompt.md](@/.tot/prompts/tot.bug-discovery-loop.prompt.md)**
