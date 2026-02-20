# VS-ORCA Technical Specification

**Version:** 0.8.0  
**Last Updated:** 2026-02-20  
**Status:** Current Release

## 1. Architecture

### 1.1 Technology Stack

**Core Technologies:**
- **Runtime:** Node.js (via VS Code Extension Host)
- **Language:** TypeScript 5.7.2
- **Framework:** VS Code Extension API 1.85.0
- **UI Framework:** Vue 3.5+ (webview dashboard)
- **Component Library:** PrimeVue 4.2+
- **Charting:** Chart.js 4.4+
- **Testing:** Mocha 10.8+, VS Code Test Electron 2.5+
- **Build Tools:** TypeScript Compiler, Vite 6.0+ (webview bundler)

**Dependencies (package.json):**
```json
{
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.19.27",
    "@types/mocha": "^10.0.10",
    "@typescript-eslint/eslint-plugin": "^8.50.0",
    "@typescript-eslint/parser": "^8.50.0",
    "@vscode/test-electron": "^2.5.2",
    "@vscode/vsce": "^3.7.1",
    "concurrently": "^8.2.0",
    "cross-env": "^10.1.0",
    "eslint": "^9.39.2",
    "mocha": "^10.8.2",
    "typescript": "^5.7.2",
    "semantic-release": "^25.0.2",
    "semantic-release-vsce": "^5.7.4",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/git": "^10.0.1"
  }
}
```

**Webview Dependencies (webview-ui/package.json):**
- `vue`: ^3.5+
- `primevue`: ^4.2+
- `chart.js`: ^4.4+
- `vite`: ^6.0+
- `@vitejs/plugin-vue`: ^5.2+

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                   │
├─────────────────────────────────────────────────────────────┤
│  extension.ts (Activation & Registration)                   │
│    ├─ OrcaHoverProvider (Hover documentation)               │
│    ├─ OrcaCodeLensProvider (Run/Stop buttons)               │
│    ├─ OrcaOutputSymbolProvider (Output navigation)          │
│    ├─ OrcaRunner (Job execution)                            │
│    └─ DashboardPanel (Webview manager)                      │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│    ├─ orcaKeywordDefs.ts (Keyword catalog - 967 lines)      │
│    └─ outputParser.ts (Result extraction)                   │
├─────────────────────────────────────────────────────────────┤
│  Language Support                                            │
│    ├─ orca.tmLanguage.json (TextMate grammar)               │
│    ├─ orca-output.tmLanguage.json (Output grammar)          │
│    ├─ language-configuration.json (Brackets, comments)      │
│    └─ snippets/orca.json (15 snippets)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │  External ORCA Process              │
          │  (child_process.spawn)              │
          │  - stdin/stdout/stderr              │
          │  - .out file monitoring             │
          └─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Webview Panel (Dashboard)                      │
├─────────────────────────────────────────────────────────────┤
│  Vue 3 App (webview-ui/)                                    │
│    ├─ App.vue (Root component)                              │
│    ├─ SummarySection.vue                                    │
│    ├─ EnergySection.vue                                     │
│    ├─ ScfSection.vue                                        │
│    └─ shared/                                               │
│         ├─ MetricCard.vue                                   │
│         └─ LineChart.vue                                    │
├─────────────────────────────────────────────────────────────┤
│  Composables                                                 │
│    ├─ useVSCodeApi.ts (Message passing)                     │
│    └─ useWebviewState.ts (State management)                 │
├─────────────────────────────────────────────────────────────┤
│  Build Output (dist/)                                        │
│    ├─ index.js (IIFE bundle)                                │
│    └─ index.css (Theme-aware styles)                        │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**

1. **User Action** → Hover over keyword → VS Code triggers `provideHover()`
2. **Hover Provider** → Extract token → Lookup in `orcaKeywordDefs` → Format Markdown → Return `vscode.Hover`
3. **User Action** → Press F5 → Command triggers `runJob()`
4. **OrcaRunner** → Spawn ORCA process → Stream stdout → Parse output → Update status bar
5. **Output Parsing** → Detect markers → Extract energy/convergence → Post to webview
6. **Webview** → Receive message → Update Vue state → Render dashboard

## 2. Data Models

### 2.1 Keyword Definition Schema (TypeScript)

**File:** `src/orcaHoverProvider.ts`

```typescript
export interface KeywordDefinition {
  name: string;           // Keyword name (e.g., "B3LYP")
  category: string;       // Category label (e.g., "Hybrid DFT Functional")
  description: string;    // 2-3 sentence explanation
  example?: string;       // Usage example (optional)
  seeAlso?: string[];     // Legacy field (not used)
  relatedKeywords?: string[]; // 3-5 related keywords for "See also"
  deprecationNote?: string;   // Warning text for deprecated keywords
}
```

**Example Entry:**
```typescript
'B3LYP': {
  name: 'B3LYP',
  category: 'Hybrid DFT Functional',
  description: 'Becke 3-parameter Lee-Yang-Parr hybrid functional. One of the most widely used DFT methods...',
  example: '! B3LYP def2-TZVP',
  relatedKeywords: ['PBE0', 'CAM-B3LYP', 'wB97X-D3', 'M06-2X']
}
```

### 2.2 Block Definition Schema

```typescript
export interface BlockDefinition {
  name: string;         // Block name (e.g., "scf")
  description: string;  // Block purpose explanation
  commonParams: string[]; // List of common parameters
  example?: string;     // Block usage example (optional)
}
```

**Example Entry:**
```typescript
'scf': {
  name: 'scf',
  description: 'Controls SCF (Self-Consistent Field) convergence parameters, iteration limits, and DIIS settings.',
  commonParams: ['MaxIter', 'TolE', 'Convergence', 'DIISMaxEq'],
  example: '%scf\n  MaxIter 250\n  TolE 1e-7\nend'
}
```

### 2.3 Block Attribute Schema

```typescript
export interface BlockAttributeDefinition {
  name: string;        // Parameter name (e.g., "MaxIter")
  blockName: string;   // Enclosing block (e.g., "scf")
  type: 'integer' | 'float' | 'string' | 'boolean'; // Data type
  default?: string;    // Default value (optional)
  unit?: string;       // Unit specification (optional, e.g., "Hartree")
  description: string; // Parameter explanation
  example?: string;    // Usage example (optional)
}
```

**Example Entry:**
```typescript
{
  name: 'MaxIter',
  blockName: 'scf',
  type: 'integer',
  default: '125',
  description: 'Maximum number of SCF iterations before the calculation is terminated.',
  example: 'MaxIter 250'
}
```

### 2.4 Parsed Output Results

**File:** `src/orcaRunner.ts`

```typescript
interface ParsedResults {
  finalEnergy?: number;       // Single point energy (Hartree)
  scfConverged: boolean;      // SCF convergence status
  iterations: number;         // Total SCF iterations
  warnings: string[];         // List of warnings detected
  errors: string[];           // List of errors detected
  geometryConverged?: boolean; // Geometry optimization status
  thermochemistry?: {         // Frequency calculation results
    zeroPointEnergy?: number;
    enthalpy?: number;
    entropy?: number;
    gibbsFreeEnergy?: number;
  };
}
```

## 3. API Reference

### 3.1 VS Code Extension API

#### 3.1.1 Commands

| Command ID | Title | When Clause |
|------------|-------|-------------|
| `vs-orca.runJob` | Run ORCA Job | `editorLangId == orca` |
| `vs-orca.killJob` | Kill Running ORCA Job | Always |
| `vs-orca.setupOrca` | Setup ORCA Installation Wizard | Always |
| `vs-orca.detectOrca` | Detect ORCA Installations | Always |
| `vs-orca.validateOrca` | Validate ORCA Installation | Always |
| `vs-orca.checkOrcaHealth` | Check ORCA Health | Always |
| `vs-orca.openOutputFile` | Open ORCA Output File | `resourceExtname == .inp` |
| `vs-orca.showResultsDashboard` | Show Results Dashboard | `resourceExtname == .out` |

**Registration Pattern:**
```typescript
// extension.ts
const runCommand = vscode.commands.registerCommand('vs-orca.runJob', async () => {
  // Command implementation
});
context.subscriptions.push(runCommand);
```

#### 3.1.2 Language Providers

**Hover Provider:**
```typescript
vscode.languages.registerHoverProvider(
  { language: 'orca', scheme: 'file' },
  new OrcaHoverProvider()
);
```

**CodeLens Provider:**
```typescript
vscode.languages.registerCodeLensProvider(
  { language: 'orca' },
  new OrcaCodeLensProvider()
);
```

**Document Symbol Provider:**
```typescript
vscode.languages.registerDocumentSymbolProvider(
  { language: 'orca-output' },
  new OrcaOutputSymbolProvider()
);
```

### 3.2 Hover Provider API (Internal)

**Class:** `OrcaHoverProvider`  
**File:** `src/orcaHoverProvider.ts`

#### Methods:

##### `provideHover(document, position, token): vscode.ProviderResult<vscode.Hover>`

Main entry point for hover requests.

**Algorithm:**
1. Try extracting simple input line token → Lookup → Format → Return
2. Try extracting block directive name → Lookup → Format → Return
3. Resolve block context → Extract attribute token → Lookup → Format → Return
4. Return `undefined` (no hover)

##### `extractSimpleLineToken(document, position): string | null` (Private)

Extract token from lines starting with `!`.

**Implementation:**
```typescript
const line = document.lineAt(position.line);
const lineText = line.text.trim();
if (!lineText.startsWith('!')) return null;

const wordRange = document.getWordRangeAtPosition(position, /[\w\-\+\*\/]+/);
if (!wordRange) return null;

return document.getText(wordRange);
```

##### `resolveBlockContext(document, position): string | null` (Private)

Scan upward max 50 lines to find enclosing block.

**Algorithm:**
1. Start from current line, scan upward
2. Match pattern `^\s*%(\w+)` for block start
3. If `end` keyword found first, return null (outside block)
4. Stop after 50 lines (performance limit)
5. Return block name or null

**Performance:** O(n) where n ≤ 50

##### `formatSimpleKeyword(definition): vscode.MarkdownString` (Private)

Format keyword definition as Markdown.

**Template:**
```markdown
**{name}** — {category}

{description}

*Example:* `{example}`
*See also:* `{related1}`, `{related2}`, `{related3}`
```

**CSP Compliance:** All Markdown uses `untrusted` defaults (no command URIs, no inline scripts).

### 3.3 Webview Message Protocol

**Extension → Webview:**
```typescript
panel.webview.postMessage({
  type: 'updateData',
  data: {
    finalEnergy: -76.1234,
    scfConverged: true,
    iterations: 12,
    // ... parsed results
  }
});
```

**Webview → Extension:**
```typescript
vscode.postMessage({
  command: 'goToLine',
  lineNumber: 42
});
```

**Webview State Persistence:**
```typescript
// Get previous state
const previousState = vscode.getState();

// Save new state
vscode.setState({ data: parsedResults });
```

## 4. Testing

### 4.1 Test Structure

```
src/test/
├── suite/
│   ├── extension.test.ts              # Extension activation
│   ├── orcaHoverProvider.test.ts      # Hover provider (650 lines)
│   ├── orcaCodeLensProvider.test.ts   # CodeLens provider
│   └── orcaOutputSymbolProvider.test.ts # Symbol provider
└── runTest.ts                          # Test runner
```

### 4.2 Hover Provider Test Coverage

**File:** `src/test/suite/orcaHoverProvider.test.ts` (650 lines)

**Test Categories:**
1. **Token Extraction Tests:** Simple line tokens, block names, block attributes
2. **Lookup Tests:** Case-insensitive matching, unknown tokens, context-aware attributes
3. **Context Resolution Tests:** Block detection, upward scan, malformed blocks
4. **Formatting Tests:** Markdown structure, CSP compliance, deprecation warnings
5. **Related Keywords Tests:** "See also" rendering, plain-text verification
6. **Integration Tests:** End-to-end hover workflow

**Mock Document Pattern:**
```typescript
const mockDocument = {
  lineAt: (line: number) => ({
    text: lines[line],
    range: new vscode.Range(line, 0, line, lines[line].length)
  }),
  getWordRangeAtPosition: (pos, regex) => { /* ... */ },
  getText: (range) => { /* ... */ }
} as any as vscode.TextDocument;
```

**Coverage Target:** ≥80% code coverage (achieved)

### 4.3 Test Execution

**Commands:**
```bash
npm run pretest      # Compile TypeScript + copy fixtures
npm run test         # Run Mocha tests in VS Code Extension Host
npm run lint         # ESLint validation
```

**CI Integration:** Tests run on git push via GitHub Actions (if configured).

## 5. Build & Deployment

### 5.1 Build Process

**Extension Build:**
```bash
npm run compile      # TypeScript → out/
npm run watch        # Auto-recompile on changes
```

**Webview Build:**
```bash
cd webview-ui
npm run build        # Vite → dist/index.js (IIFE), dist/index.css
npm run dev          # Vite dev server with HMR
```

**Combined Watch:**
```bash
npm run watch:all    # Concurrent watch for extension + webview
```

**Production Package:**
```bash
npm run vscode:prepublish   # Build webview + compile extension
vsce package                 # Create .vsix
```

### 5.2 Release Process (Semantic Release)

**Automated Versioning:**
- Uses `semantic-release` with `semantic-release-vsce`
- Parses conventional commits to determine version bump
- Generates CHANGELOG.md automatically
- Publishes to VS Code marketplace

**Configuration:** `.releaserc.json`

**Commit Convention:**
- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump

## 6. Configuration

### 6.1 VS Code Settings Schema

**File:** `package.json` → `contributes.configuration.properties`

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `orca.binaryPath` | string | `/opt/orca/orca` | Full path to ORCA executable |
| `orca.mpiProcs` | number | 4 | Default number of MPI processes (1-128) |
| `orca.autoSaveBeforeRun` | boolean | true | Auto-save input file before execution |
| `orca.clearOutputBeforeRun` | boolean | true | Clear output panel before new job |
| `orca.maxOutputSize` | number | 50 | Max output file size (MB) for real-time display |
| `orca.saveOutputToFile` | boolean | true | Auto-save ORCA output to .out files |
| `orca.outputSyntaxHighlighting` | boolean | true | Enable syntax highlighting for .out files |
| `orca.maxSyntaxFileSize` | number | 5 | Max file size (MB) for syntax highlighting |
| `orca.dashboardAutoOpen` | boolean | true | Auto-open results dashboard after job completion |
| `orca.autoDetectOnStartup` | boolean | false | Auto-detect ORCA installation on startup |
| `orca.installationWizardCompleted` | boolean | false | Wizard completion flag (internal) |
| `orca.licenseAcknowledged` | boolean | false | License acknowledgement flag (internal) |

**Access Pattern:**
```typescript
const config = vscode.workspace.getConfiguration('orca');
const binaryPath = config.get<string>('binaryPath', '/opt/orca/orca');
```

## 7. File Structure

```
Orca-vscode/
├── src/                            # Extension source code
│   ├── extension.ts                # Main entry point (activation)
│   ├── orcaHoverProvider.ts        # Hover provider (365 lines)
│   ├── orcaCodeLensProvider.ts     # CodeLens provider
│   ├── orcaOutputSymbolProvider.ts # Symbol provider
│   ├── orcaRunner.ts               # Job execution engine
│   ├── data/
│   │   └── orcaKeywordDefs.ts      # Keyword catalog (967 lines)
│   ├── dashboard/
│   │   └── dashboardPanel.ts       # Webview panel manager
│   └── test/
│       ├── suite/
│       │   ├── orcaHoverProvider.test.ts  # Hover tests (650 lines)
│       │   ├── orcaCodeLensProvider.test.ts
│       │   └── extension.test.ts
│       └── runTest.ts              # Test runner
├── webview-ui/                     # Vue3 dashboard app
│   ├── src/
│   │   ├── main.ts                 # Vue entry point
│   │   ├── App.vue                 # Root component
│   │   ├── components/             # Section components
│   │   │   ├── SummarySection.vue
│   │   │   ├── EnergySection.vue
│   │   │   ├── ScfSection.vue
│   │   │   └── shared/
│   │   │       ├── MetricCard.vue
│   │   │       └── LineChart.vue
│   │   ├── composables/
│   │   │   ├── useVSCodeApi.ts
│   │   │   └── useWebviewState.ts
│   │   ├── types/
│   │   │   └── ParsedResults.ts
│   │   └── styles/
│   │       └── main.css
│   ├── dist/                       # Build output (gitignored)
│   │   ├── index.js                # IIFE bundle
│   │   └── index.css
│   ├── vite.config.ts              # Vite configuration
│   └── package.json
├── syntaxes/                       # TextMate grammars
│   ├── orca.tmLanguage.json        # Input file grammar
│   └── orca-output.tmLanguage.json # Output file grammar
├── snippets/
│   └── orca.json                   # 15 code snippets
├── language-configuration.json     # Brackets, comments, folding
├── docs/                           # Documentation
│   ├── functional-specification.md
│   ├── technical-specification.md
│   └── AUTOMATED_INSTALLATION.md
├── examples/                       # Sample input files
│   ├── water_opt.inp
│   └── ...
├── out/                            # Compiled JavaScript (gitignored)
│   ├── extension.js
│   ├── orcaHoverProvider.js
│   └── ...
├── package.json                    # Extension manifest
├── tsconfig.json                   # TypeScript configuration
└── README.md
```

## 8. Environment Variables

**No runtime environment variables required.**

All configuration is managed via VS Code settings (stored in `.vscode/settings.json` or user settings).

## 9. Security

### 9.1 Content Security Policy (Webview)

**CSP Header:**
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none';
    script-src ${cspSource} 'unsafe-inline';
    style-src ${cspSource} 'unsafe-inline';
    img-src ${cspSource} https:;
    font-src ${cspSource};" />
```

**Restrictions:**
- No external scripts or styles
- No `eval()` or `Function()` constructors
- All resources bundled with extension
- Vue3 runtime-only build (no template compilation at runtime)

### 9.2 Process Execution Security

**ORCA Spawning:**
```typescript
spawn(binaryPath, [inputFilePath], {
  cwd: fileDir,
  shell: false   // CRITICAL: Prevents shell injection
});
```

**Security Rules:**
- Never use `shell: true` (prevents injection attacks)
- Validate `binaryPath` with `fs.existsSync()` before spawning
- Input file paths are workspace-relative (no arbitrary paths)
- Kill jobs with `SIGTERM` first, then `SIGKILL` (clean shutdown)

### 9.3 Markdown Security (Hover Provider)

```typescript
const markdown = new vscode.MarkdownString(content);
// Do NOT enable command URIs (default is disabled)
// markdown.isTrusted = false; // Default, explicit not needed
```

**Enforced Restrictions:**
- No command URIs (`command:` links are disabled)
- No inline HTML
- No external resources
- Static text only in "See also" sections (no clickable links)

## 10. Performance Optimization

### 10.1 Hover Provider Performance

**Latency Targets:**
- Average: <100ms
- P95: <200ms

**Optimizations:**
1. **Hash Map Lookups:** O(1) keyword lookup via `Record<string, Definition>`
2. **Limited Upward Scan:** Block context resolution stops after 50 lines
3. **Early Returns:** Token extraction returns null immediately if context doesn't match
4. **Static Catalog:** No runtime file I/O, all data bundled
5. **No Regex in Hot Path:** Simple string operations preferred

**Measurement Protocol:**
- Test with 20 random keyword hovers in 100-line `.inp` file
- Run in Extension Development Host on macOS
- Measure end-to-end latency (trigger to popup display)

**Results (from testing):**
- Average latency: ~50ms
- P95 latency: ~120ms
- ✅ Target achieved

### 10.2 Syntax Highlighting Performance

**File Size Limits:**
- Output files >5 MB: syntax highlighting disabled
- Configurable via `orca.maxSyntaxFileSize`

**Rationale:** Large output files (>100k lines) can freeze TextMate engine.

### 10.3 Webview Rendering

**Optimizations:**
- Virtualized tables for large datasets (PrimeVue DataTable)
- Chart.js with animation disabled for large datasets
- Lazy loading of chart data
- CSS variables for theme switching (no runtime recalculation)

## 11. Known Limitations

1. **Single Job Per Workspace:** Only one ORCA job can run at a time per workspace
2. **Block Context Scan Depth:** Limited to 50 lines upward (malformed blocks may not be detected)
3. **No Auto-Completion Integration:** Hover provider is separate from autocomplete (future feature)
4. **ORCA Version Agnostic:** Keyword definitions target ORCA 6.0 but don't switch based on detected version
5. **No Multi-Language Support:** All hover content is English only
6. **No External Documentation Links:** "See also" keywords are plain text, not clickable links

## 12. Future Enhancements

- **Auto-Completion Provider:** Integrate keyword catalog with IntelliSense
- **Go-to-Definition:** Navigate from keyword to definition source
- **Code Actions:** Quick fixes for common errors (e.g., missing basis set)
- **Multi-Job Support:** Run multiple ORCA jobs in parallel
- **Remote ORCA Execution:** SSH integration for HPC clusters
- **Output Diff Viewer:** Compare results from different calculations
- **Clickable "See Also" Links:** Navigate between related keywords

## 13. Specification Changelog

### v0.8.0 - 2026-02-20

**Added:**
- Hover provider technical documentation
- Keyword catalog schema and data models
- API reference for hover provider methods
- Test coverage details (650 lines, ≥80% coverage)
- Performance optimization details and latency measurements
- Security analysis for CSP, process execution, and Markdown rendering

**Updated:**
- Architecture diagram to include hover provider
- File structure to reflect current codebase
- Technology stack versions (Vue 3.5+, TypeScript 5.7.2)
