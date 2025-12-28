# VS-ORCA Extension Development Guide

## Architecture Overview

**VS-ORCA** is a VS Code extension that provides an integrated development environment for ORCA computational chemistry. The extension follows a **three-module architecture**:

1. **Language Support Module** (`syntaxes/`, `snippets/`, `language-configuration.json`)

   - TextMate grammar for syntax highlighting (`.tmLanguage.json`)
   - 15 production snippets with dropdown choices (`orca.json`)
   - Language configuration for comments, brackets, and folding

2. **Execution Engine Module** (`src/orcaRunner.ts`)

   - Spawns ORCA as child process with `child_process.spawn()`
   - Real-time stdout/stderr capture and output panel streaming
   - File watcher pattern for monitoring `.out` files
   - Output parser using regex patterns for energy extraction and convergence detection

3. **Dashboard UI Module** (`webview-ui/`) - Vue3 + PrimeVue
   - Vue3 SFC components for results visualization
   - PrimeVue DataTable, Tree, and Chart components
   - Chart.js for interactive energy/gradient plots
   - VS Code theme integration via CSS variables
   - State persistence via VS Code webview API

**Key Insight**: The extension treats `.inp` files as the primary document type, auto-saves before execution, and displays results in both a dedicated "ORCA" output channel and the Vue-powered dashboard panel.

## Critical Development Workflows

### Build & Test

```bash
npm run compile         # Compile TypeScript to out/
npm run watch           # Auto-recompile extension on changes
npm run build:webview   # Build Vue app for production
npm run watch:webview   # Vite dev server with HMR
npm run watch:all       # Run both watchers in parallel
npm run lint            # ESLint validation
```

**Debug**: Press `F5` to launch Extension Development Host. The extension auto-activates when opening `.inp` files.

### Webview Development

```bash
cd webview-ui
npm run dev             # Vite dev server (standalone preview)
npm run build           # Production build to dist/
npm run test            # Run Vitest unit tests
npm run type-check      # vue-tsc type checking
```

### Extension Entry Points

- `src/extension.ts`: Registers commands (`vs-orca.runJob`, `vs-orca.killJob`) and handles activation
- `src/orcaRunner.ts`: Core logic for job execution, output parsing, and status management
- `src/dashboard/dashboardPanel.ts`: Webview panel that loads the Vue app

**Command Registration Pattern**:

```typescript
const runCommand = vscode.commands.registerCommand('vs-orca.runJob', async () => { ... });
context.subscriptions.push(runCommand); // Always push to context for disposal
```

### Testing Checklist

1. Open `examples/water_opt.inp` to verify syntax highlighting
2. Type `opt` + Tab to test snippet expansion
3. Press `F5` with ORCA path configured to test execution
4. Use `vs-orca.killJob` to verify process termination
5. Open a `.out` file and verify dashboard renders correctly

## Project-Specific Conventions

### File Structure Patterns

```
src/
├── extension.ts           # VS Code activation
├── orcaRunner.ts          # ORCA process management
├── outputParser.ts        # Parse ORCA output to JSON
└── dashboard/
    └── dashboardPanel.ts  # Webview host (~220 lines)

webview-ui/                # Vue3 + PrimeVue app
├── src/
│   ├── main.ts            # Vue entry point
│   ├── App.vue            # Root component
│   ├── components/        # Section components
│   │   ├── SummarySection.vue
│   │   ├── EnergySection.vue
│   │   ├── ScfSection.vue
│   │   └── shared/
│   │       ├── MetricCard.vue
│   │       └── LineChart.vue
│   ├── composables/       # Vue composables
│   │   ├── useVSCodeApi.ts
│   │   └── useWebviewState.ts
│   ├── types/             # TypeScript interfaces
│   └── styles/            # PrimeVue theme overrides
├── vite.config.ts         # Vite IIFE build config
└── dist/                  # Build output (index.js, index.css)
```

### Configuration Schema

All settings use `orca.*` prefix in `package.json` contributions:

```typescript
const config = vscode.workspace.getConfiguration("orca");
const binaryPath = config.get<string>("binaryPath", "/opt/orca/orca");
```

**Critical Settings**:

- `orca.binaryPath`: Must be validated with `fs.existsSync()` before spawning
- `orca.autoSaveBeforeRun`: Controls pre-execution save behavior
- `orca.maxOutputSize`: Performance limit for large outputs (not yet enforced)

### Output Parsing Patterns

The extension uses **marker-based detection** rather than full parsing:

```typescript
if (content.includes("HURRAY")) {
  /* converged */
}
if (content.includes("SCF NOT CONVERGED")) {
  /* failed */
}
const energyMatch = content.match(/FINAL SINGLE POINT ENERGY\s+([-\d.]+)/);
```

**Rationale**: ORCA output is semi-structured. Regex patterns target specific markers like "HURRAY", "FINAL SINGLE POINT ENERGY", and "**_imaginary mode_**" for reliable extraction without full parsing.

## TextMate Grammar Insights

The `orca.tmLanguage.json` uses a **keyword-first pattern** where `!` triggers recognition:

```json
"match": "!\\s*[A-Za-z0-9_\\-/+]+",
"patterns": [
  { "name": "entity.name.function.method.orca", "match": "(?i)\\b(B3LYP|PBE|...)\\b" }
]
```

**Block folding** is enabled via `language-configuration.json`:

```json
"folding": { "markers": { "start": "^\\s*%", "end": "^\\s*end" } }
```

When adding new ORCA keywords, update **both** the grammar patterns and snippet choices for consistency.

## Integration Points

### VS Code API Usage

- **Commands**: Two commands registered in `package.json` with keybindings (F5 for run)
- **Output Channel**: Dedicated channel created with `vscode.window.createOutputChannel('ORCA')`
- **Status Bar**: Single persistent item showing job state and final energy
- **Configuration**: Uses VS Code's built-in settings UI (no custom webviews)

### External Dependencies

- **ORCA Binary**: Spawned directly via absolute path (no shell wrapping)
- **File System**: Uses Node.js `fs` module for file operations and `fs.watch()` for output monitoring
- **Vue3**: Runtime-only build for CSP compliance (no eval/Function())
- **PrimeVue**: Component library for DataTable, Tree, Panel, Button
- **Chart.js**: Interactive energy/gradient plots with tooltips

### Process Management

```typescript
this.currentProcess = spawn(binaryPath, [inputFilePath], { cwd: fileDir, shell: false });
```

**Termination Strategy**: SIGTERM first, then SIGKILL after 5s timeout. Always clean up `fileWatcher` in `dispose()`.

## Common Pitfalls

1. **Shell Injection**: Never use `shell: true` when spawning ORCA—input files can contain arbitrary paths
2. **File Watcher Cleanup**: Always call `fileWatcher.close()` on job completion to prevent resource leaks
3. **Status Bar Icon State**: Use `$(loading~spin)` for running state, static icons otherwise
4. **Config Defaults**: The default path `/opt/orca/orca` is a placeholder—prompt users to configure on first run
5. **Case Sensitivity**: ORCA keywords are case-insensitive; use `(?i)` flag in regex patterns
6. **CSP in Webview**: Never use inline scripts without nonce; always use pre-compiled Vue templates

## Extending the Extension

### Adding New Dashboard Sections

Create a new SFC in `webview-ui/src/components/`:

```vue
<script setup lang="ts">
import type { ParsedResults } from "@/types/ParsedResults";
defineProps<{ data: ParsedResults }>();
</script>
<template>
  <section><!-- Your content --></section>
</template>
```

Then add to `App.vue`:

```vue
<NewSection v-if="hasNewData" :data="data" />
```

### Adding New Snippets

Edit `snippets/orca.json` with dropdown choices:

```json
"body": ["! ${1|B3LYP,PBE0,wB97X-D3|} ${2|def2-SVP,def2-TZVP|}"]
```

### Adding Output Parsers

Add patterns to `parseResults()` in `orcaRunner.ts`:

```typescript
const newMatch = content.match(/YOUR_PATTERN/);
if (newMatch) {
  this.outputChannel.appendLine("✨ Result: ...");
}
```

### VS Code ↔ Vue Communication

Extension sends data to webview:

```typescript
this._panel.webview.postMessage({ type: "updateData", data: results });
```

Vue receives via message listener:

```typescript
window.addEventListener("message", (event) => {
  if (event.data.type === "updateData") {
    data.value = event.data.data;
  }
});
```

Vue sends commands to extension:

```typescript
const { vscode } = useVSCodeApi();
vscode.postMessage({ command: "goToLine", lineNumber: 42 });
```

### Package for Distribution

```bash
npm run package  # Builds webview + extension, creates .vsix
```
