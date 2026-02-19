---
agent: "agent"
model: Claude Haiku 4.5 (copilot)
tools: ["agent", "read", "edit", "execute"]
description: "Creates GitHub issues from a validated PRD file with user-facing content only. Agent determines issue count (1-5 max)."
argument-hint: PRD_FILE='.tot-docs/prd/001-feature.md' DRY_RUN=false
---

# tot.create-github-issues.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.create-github-issues.prompt.md](@/.tot/prompts/tot.create-github-issues.prompt.md)**
