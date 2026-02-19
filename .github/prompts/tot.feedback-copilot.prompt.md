---
agent: "agent"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute"]
description: "Review and provide feedback on any artifact in the pipeline. Supports stage-specific review criteria."
argument-hint: FILE="..." STAGE=discovery|prd|plan|implementation|validation
---

# tot.feedback-copilot.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.feedback-copilot.prompt.md](@/.tot/prompts/tot.feedback-copilot.prompt.md)**
