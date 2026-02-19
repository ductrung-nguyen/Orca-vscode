---
agent: "agent"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit"]
description: "External LLM validation sub-agent that invokes an external LLM (e.g., Gemini) for second-opinion validation on PRDs, plans, and implementations."
argument-hint: ARTIFACT_PATH="..." ARTIFACT_TYPE=prd|plan|implementation EXTERNAL_MODEL=gemini-3.0-pro
---

# tot.llm-validate.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.llm-validate.prompt.md](@/.tot/prompts/tot.llm-validate.prompt.md)**
