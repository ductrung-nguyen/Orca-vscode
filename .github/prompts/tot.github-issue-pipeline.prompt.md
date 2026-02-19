---
agent: "tot.issue-pipeline-orchestrator"
name: "tot.github-issue-pipeline"
model: Claude Opus 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "execute", "edit", "todo", "vscode/askQuestions"]
description: "GitHub issue pipeline: fetch → validate → detect type → route to feature or bugfix pipeline"
argument-hint: ISSUE=123 AUTO_ANSWER=false LANGUAGE=auto
infer: true
---

# tot.github-issue-pipeline.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.github-issue-pipeline.prompt.md](@/.tot/prompts/tot.github-issue-pipeline.prompt.md)**
