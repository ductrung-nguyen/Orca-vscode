---
agent: "tot.issue-pipeline-orchestrator"
name: "tot.resolve-github-issue"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "execute", "edit", "todo", "vscode/askQuestions"]
description: "GitHub issue pipeline: fetch → validate → detect type → route to feature or bugfix pipeline"
argument-hint: ISSUE=123 AUTO_ANSWER=false LANGUAGE=auto
---

# tot.resolve-github-issue.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.resolve-github-issue.prompt.md](@/.tot/prompts/tot.resolve-github-issue.prompt.md)**
