---
name: "tot.validate-issue"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "execute", "edit", "todo", "vscode/askQuestions"]
description: "Validate a GitHub issue, detect if it is a Bug or Feature, and get confirmation from user"
argument-hint: ISSUE_NUMBER=123 AUTO_ANSWER=false
infer: true
---

# tot.validate-issue.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.validate-issue.prompt.md](@/.tot/prompts/tot.validate-issue.prompt.md)**
