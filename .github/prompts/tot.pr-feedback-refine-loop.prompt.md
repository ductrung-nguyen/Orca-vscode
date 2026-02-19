---
name: "tot.pr-feedback-refine-loop"
description: "Handles PR feedback with review justification, code fixes, clarifying comments, and implementation validation"
model: Gemini 3 Pro (Preview) (copilot)
tools: ["agent/runSubagent", "agent", "read", "execute", "edit"]
argument-hint: PR_NUMBER=123 STATUS_FILE=".tot-docs/..." AUTO_ANSWER=false
---

# tot.pr-feedback-refine-loop.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.pr-feedback-refine-loop.prompt.md](@/.tot/prompts/tot.pr-feedback-refine-loop.prompt.md)**
