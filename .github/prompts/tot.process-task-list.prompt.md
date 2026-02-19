---
agent: "tot.task-implementor"
model: Claude Sonnet 4.5 (copilot)
tools: ["agent/runSubagent", "agent", "read", "todo", "execute", "edit"]
description: "Execute implementation tasks from a plan. Iterates through sub-tasks, triggering impl-refine-loop for each sub-task to implement and validate."
argument-hint: TASK_FILE="{PIPELINE_DIR}/plan.md" AUTO_ANSWER=false PARALLEL=false
---

# tot.process-task-list.prompt.md (Shim)

**This is a shim file.** You MUST read and follow the full instructions in:

👉 **[@/.tot/prompts/tot.process-task-list.prompt.md](@/.tot/prompts/tot.process-task-list.prompt.md)**
