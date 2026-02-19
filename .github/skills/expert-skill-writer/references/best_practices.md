# Best Practices for Antigravity Skills

## 1. Core Philosophy: Economy of Context
Your skill shares the context window with the system prompt, conversation history, and other skills. Every token you use is a token *not* available for the user's actual task.

- **Conciseness**: if a sentence doesn't change the agent's behavior, delete it.
- **Progressive Disclosure**:
    - **Metadata (Frontmatter)**: Always loaded. Must be tiny (<100 words).
    - **Body (SKILL.md)**: Loaded on trigger. Keep under 500 lines. Focus on *procedure*.
    - **Resources**: Loaded on demand. Move all heavy documentation here.

## 2. Structure
```
skill-name/
├── SKILL.md                 # Entry point
├── scripts/                 # Deterministic tools (Python/Bash)
├── references/              # Knowledge paths (Markdown)
└── assets/                  # Output templates
```

## 3. Writing `SKILL.md`

### Frontmatter
The `description` is the **trigger**.
- **BAD**: "A skill for git."
- **GOOD**: "Use this skill when the user wants to initialize a repository, manage branches, or debug git conflicts."

### Body
- Use **Imperative Mood**: "Do X. Then do Y."
- **Degrees of Freedom**:
    - Use text for flexible planning ("Research the error...").
    - Use scripts for fragile execution ("Run `scripts/fix_db.py`").

## 4. Resource Management
- **Scripts**: Prefer python scripts for multi-step logic.
    - *Example*: `scripts/init_project.py` is better than 20 lines of "Run mkdir, then touch...".
- **References**:
    - *Don't*: Put a 200-line API schema in `SKILL.md`.
    - *Do*: Put it in `references/api.md` and link it: "For API details, read `references/api.md`".

## 5. Anti-Patterns
- **No User Docs**: Do not include READMEs, Installation Guides, or Changelogs in the skill. The skill is for the *Agent*, not the User.
- **No Theory**: Don't explain *why* the skill works, just *how* to use it.
- **No Duplication**: If it's in a reference file, don't summarize it in the body.
