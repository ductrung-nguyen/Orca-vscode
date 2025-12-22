# Context Analysis: Feature 004 - Out File CodeLens Dashboard

## Codebase Structure

### Relevant Source Files

| File                                                                     | Purpose                                              | Relevance                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------- |
| [src/extension.ts](../../src/extension.ts)                               | Extension entry point, command/provider registration | **High** - Register new provider here       |
| [src/orcaCodeLensProvider.ts](../../src/orcaCodeLensProvider.ts)         | Existing CodeLens for .inp files                     | **High** - Pattern to follow, add new class |
| [src/dashboard/dashboardPanel.ts](../../src/dashboard/dashboardPanel.ts) | Results dashboard webview                            | **Medium** - Target of CodeLens action      |
| [src/outputParser.ts](../../src/outputParser.ts)                         | Parses .out file content                             | **Low** - Used by dashboard                 |
| [package.json](../../package.json)                                       | Extension manifest                                   | **Low** - No changes needed                 |

### Language Configuration

From `package.json`:

```json
{
  "id": "orca-output",
  "aliases": ["ORCA Output", "orca-output"],
  "extensions": [".out"]
}
```

### Existing Command

```json
{
  "command": "vs-orca.showResultsDashboard",
  "title": "Show Results Dashboard",
  "category": "ORCA",
  "icon": "$(graph)"
}
```

## Architecture Patterns

### CodeLens Provider Pattern

The existing `OrcaCodeLensProvider` demonstrates:

1. Implements `vscode.CodeLensProvider`
2. Uses `EventEmitter` for refresh triggers
3. Places CodeLens at `Range(0, 0, 0, 0)` (top of file)
4. Returns fully resolved CodeLens with command

### Provider Registration Pattern

```typescript
context.subscriptions.push(
  vscode.languages.registerCodeLensProvider({ language: "orca", scheme: "file" }, new OrcaCodeLensProvider())
);
```

### Command Invocation Pattern

The `vs-orca.showResultsDashboard` command already accepts:

- `vscode.Uri` parameter for specific file
- No parameter (uses active editor)

## Key Observations

1. **No changes to package.json needed** - Command already exists
2. **Minimal extension.ts changes** - Just add provider registration
3. **Follow existing pattern** - OrcaCodeLensProvider is a good template
4. **Language ID is `orca-output`** - Use this in document selector
