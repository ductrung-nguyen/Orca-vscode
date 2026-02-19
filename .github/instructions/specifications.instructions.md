---
description: "Standards for reading and updating project specifications throughout the pipeline"
---

# Specification Handling Instructions

Standards for reading project specifications during discovery and updating them at pipeline completion.

## Specification File Locations

| File | Purpose | When Updated |
|------|---------|--------------|
| `docs/functional-specification.md` | User-facing features, use cases, scenarios | After feature/bugfix completion |
| `docs/technical-specification.md` | API contracts, data models, architecture | After feature/bugfix completion |

## Reading Specifications (Discovery Phase)

During discovery, extract business context from existing specifications:

### What to Extract

1. **Existing Use Cases**: Current user workflows and scenarios
2. **Business Rules**: Documented constraints and validations
3. **Edge Cases**: Known boundary conditions and error handling
4. **Related Features**: Similar functionality for reference
5. **Domain Terminology**: Standard terms used in the project

### Output Format

Write extracted context to `spec-context.md` in the requirements directory:

```markdown
# Specification Context

## Existing Use Cases

| UC-ID | Title | Status | Relevance |
|-------|-------|--------|-----------|
| UC-001 | User Login | Implemented | Related - same auth flow |

## Business Rules

- {Rule 1 from specs}
- {Rule 2 from specs}

## Known Edge Cases

| Scenario | Expected Behavior | Source |
|----------|-------------------|--------|
| {case} | {behavior} | functional-spec §X |

## Domain Terminology

| Term | Definition |
|------|------------|
| {term} | {definition} |

## Related Features

- {Feature 1}: {brief description}
- {Feature 2}: {brief description}
```

---

## Updating Specifications (Pipeline Completion)

After validation passes, update specifications with new business knowledge.

### Use Case Format

Add new use cases to the functional specification:

```markdown
### UC-{ID}: {Use Case Title}

**Actor**: {Primary actor - e.g., Authenticated User, Admin}
**Preconditions**: {Required state before this use case}
**Trigger**: {What initiates this use case}

**Main Flow**:
1. {Step 1}
2. {Step 2}
3. {Step 3}

**Alternative Flows**:
- **{Alt Name}**: {When condition} → {What happens}

**Expected Behavior**:
- {Behavior 1}
- {Behavior 2}

**Edge Cases**:
| Scenario | Expected Behavior |
|----------|-------------------|
| {edge case 1} | {behavior} |
| {edge case 2} | {behavior} |

**Related**: UC-XXX, UC-YYY
```

### Scenario Format

Document specific scenarios within use cases:

```markdown
#### Scenario: {Scenario Name}

**Given**: {Initial context/state}
**When**: {Action taken}
**Then**: {Expected outcome}

**Notes**: {Any additional context}
```

### Update Process

1. **Identify New Use Cases**: Extract from PRD acceptance criteria
2. **Document Scenarios**: From implementation and tests
3. **Add Edge Cases**: From validation findings
4. **Update Existing**: Modify related use cases if behavior changed
5. **Add Changelog Entry**: Document what was added/changed

### Changelog Entry Format

Add to the specification's changelog section:

```markdown
## Specification Changelog

### [{version}] - {date}

#### Added
- UC-XXX: {Use case title}
- Scenario: {scenario name} for UC-YYY

#### Changed
- UC-ZZZ: Updated {what changed} due to {reason}

#### Notes
- {Any deviations from original PRD with rationale}
```

---

## Best Practices

1. **Keep Use Cases Atomic**: One use case = one user goal
2. **Be Specific**: Reference actual component names and behaviors
3. **Include Rationale**: Document why, not just what
4. **Stay Current**: Specs should reflect actual implementation
5. **Link Related Items**: Cross-reference between use cases
