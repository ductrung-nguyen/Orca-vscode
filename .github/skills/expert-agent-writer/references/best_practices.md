# Best Practices for Custom Agents

## 1. Economy of Context
- **Eliminate Fluff**: Don't say "Please act as a..."; just say "Act as...".
- **Structured IO**: Use inputs and outputs that are machine-parsable if possible (e.g., `PASS: <reason>`).

## 2. Context Isolation
- **Sub-Agents starts Fresh**: When you call `runSubagent`, usage history is NOT shared.
- **Explicit Handoff**: You must pass all necessary context in the `prompt` argument.
    - *Bad*: `runSubagent(prompt="Fix it")` (What is "it"?)
    - *Good*: `runSubagent(prompt="Fix bug described in {BUG_FILE}")`

## 3. Logic & Loops
- **Pseudo-Code**: LLMs follow pseudo-code better than long paragraphs for logic.
- **State Management**: If you need to remember state between sub-agents (e.g., "Attempt 1 failed"), write it to a file. The main agent has short memory; file system is long-term memory.

## 4. Tools
- **Inference**: usage of `infer: true` is generally preferred for flexibility.
- **Restrictions**: If an agent is DANGEROUS, explicitly restrict tools in `tools: [...]` and set `infer: false`.
