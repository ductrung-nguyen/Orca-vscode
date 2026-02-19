---
agent: "agent"
model: Claude Sonnet 4.5 (copilot)
tools: ["agent", "read", "edit", "execute", "todo", "vscode/runCommand"]

description: "Fetches a GitHub issue by ID and saves it as a structured markdown file. Optionally starts the orchestrator pipeline."
argument-hint: ISSUE_ID=123 REPO=owner/repo START_PIPELINE=false PREVIEW=false
---

# tot.fetch-github-issue.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.fetch-github-issue.prompt.md](@/.tot/prompts/tot.fetch-github-issue.prompt.md)**
