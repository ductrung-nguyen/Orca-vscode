---
agent: "tot.pr-reviewer"
model: Claude Opus 4.5 (copilot)
tools: ["agent", "read", "edit", "execute", "vscode/vscodeAPI", "todo", "search", "web"]
description: "Review a GitHub Pull Request and optionally post review feedback with inline comments"
argument-hint: PR_NUMBER=123 POST_REVIEW=false
---

# tot.review-pr.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.review-pr.prompt.md](@/.tot/prompts/tot.review-pr.prompt.md)**
