# VS-ORCA Functional Specification

**Version:** 0.8.0  
**Last Updated:** 2026-02-20  
**Status:** Current Release

## 1. Project Overview

VS-ORCA (Virtual Studio for ORCA Chemistry) is a comprehensive VS Code extension that provides an integrated development environment for ORCA computational chemistry. The extension combines syntax highlighting, intelligent code assistance, job execution, and automated output parsing into a unified workflow.

**Target Users:**
- Computational chemistry researchers
- Graduate students learning ORCA
- Research groups running quantum chemistry calculations
- Academic institutions teaching computational chemistry

**Core Value Proposition:**
- Write ORCA input files with IntelliSense and syntax highlighting
- Learn ORCA syntax directly in the editor via hover documentation
- Execute calculations and monitor progress in real-time
- Parse and visualize results automatically

## 2. Technology Stack

**Platform:** VS Code Extension API  
**Languages:** TypeScript, Vue 3  
**UI Framework:** PrimeVue (for webview dashboard)  
**Testing:** Mocha, VS Code Extension Test Framework  
**Build Tools:** TypeScript Compiler, Vite (for webview)

## 3. Features

### 3.1 Syntax Highlighting *(Implemented — v0.1.0)*

**Status:** ✅ Implemented

Provides comprehensive syntax highlighting for ORCA input files (`.inp`) and output files (`.out`) using TextMate grammars.

**Capabilities:**
- Simple input line keywords (`!` lines) with method/basis/job type recognition
- Block directives (`%block ... end`) with nested structure support
- Comment syntax (`#` and `//`)
- Numeric values, coordinates, and special characters
- Output file parsing markers (energies, convergence, warnings)

**Configuration:**
- `orca.outputSyntaxHighlighting` — Enable/disable syntax highlighting for `.out` files
- `orca.maxSyntaxFileSize` — Maximum file size (MB) for syntax highlighting (default: 5 MB)

### 3.2 Code Snippets *(Implemented — v0.1.0)*

**Status:** ✅ Implemented

15 production-ready snippets with dropdown choices for common ORCA calculation types.

**Snippet Categories:**
- Job types: `opt`, `freq`, `sp`, `optfreq`
- Method templates: `dft`, `mp2`, `ccsd`
- Block templates: `scf`, `geom`, `pal`, `coords`

**User Workflow:**
1. Type snippet prefix (e.g., `opt`)
2. Press Tab to expand
3. Use Tab to navigate placeholders
4. Select from dropdown choices (methods, basis sets, etc.)

### 3.3 Hover Documentation *(Implemented — v0.8.0)*

**Status:** ✅ Implemented

Inline hover provider displays comprehensive definitions and descriptions when users hover over keywords, providing instant documentation without context switching.

**Coverage:**
- **50+ simple keywords:** DFT functionals, wave function methods, basis sets, job types, auxiliary options
- **12+ block directives:** `%scf`, `%geom`, `%pal`, `%maxcore`, `%tddft`, `%basis`, `%method`, `%coords`, `%casscf`, `%cpcm`, `%freq`, `%neb`, `%output`
- **30+ block attributes:** Context-aware parameter documentation with type, default, unit, and description

**Hover Content Structure:**

*Simple Keywords:*
```markdown
**KEYWORD_NAME** — Category

Description (2-3 sentences with educational context).

*Example:* `code example`
*See also:* `related1`, `related2`, `related3`
```

*Block Directives:*
```markdown
**%blockname** — Block Directive

Description of block purpose.

*Common parameters:* `param1`, `param2`, `param3`
*Example:*
```
%blockname
  param value
end
```
```

*Block Attributes:*
```markdown
**AttributeName** *(in %blockname)*

Description of parameter.

- **Type:** integer|float|string|boolean
- **Default:** value
- **Unit:** unit (if applicable)
*Example:* `param value`
```

**Intelligence Features:**
- Case-insensitive keyword matching
- Context-aware block attribute resolution (same parameter name in different blocks shows different docs)
- "See also" sections with 3-5 related keywords
- Deprecation warnings for old ORCA keywords

**User Workflow:**
1. Hover cursor over keyword, block name, or block attribute
2. Popup appears within ~100ms showing inline documentation
3. Read description, type info, usage examples
4. Explore related keywords via "See also" section

**Example Use Cases:**

*US-1: Learn DFT Functional*
- User hovers over `B3LYP` in `! B3LYP def2-TZVP`
- Sees: "Becke 3-parameter Lee-Yang-Parr hybrid functional. One of the most widely used DFT methods..."
- Related: `PBE0`, `CAM-B3LYP`, `wB97X-D3`

*US-5: Understand Block Attribute*
- User hovers over `MaxIter` inside `%scf` block
- Sees: "Maximum number of SCF iterations. Type: integer, Default: 125"
- Distinct from `MaxIter` in `%geom` block (geometry optimization iterations)

**Technical Details:**
- Provider registered via `vscode.languages.registerHoverProvider()`
- Static keyword catalog (~967 lines) bundled with extension
- CSP-compliant Markdown rendering
- No external dependencies or network calls
- Response time: <100ms (average), <200ms (P95)

### 3.4 Job Execution *(Implemented — v0.2.0)*

**Status:** ✅ Implemented

Execute ORCA calculations directly from VS Code with real-time output monitoring.

**Capabilities:**
- Run ORCA jobs with F5 keyboard shortcut or command palette
- Auto-save input file before execution
- Real-time stdout/stderr capture in dedicated "ORCA" output channel
- Kill running jobs with stop command
- Status bar shows job state and final energy

**Configuration:**
- `orca.binaryPath` — Full path to ORCA executable (required)
- `orca.mpiProcs` — Default number of MPI processes (default: 4)
- `orca.autoSaveBeforeRun` — Auto-save before execution (default: true)
- `orca.clearOutputBeforeRun` — Clear output panel before new job (default: true)

**User Workflow:**
1. Open `.inp` file
2. Press F5 or click "Run ORCA Job" icon
3. Monitor progress in output panel
4. View final energy in status bar
5. Open result dashboard when complete

### 3.5 Output Parsing *(Implemented — v0.3.0)*

**Status:** ✅ Implemented

Automated parsing of ORCA output files to extract key computational results.

**Extracted Data:**
- Final single point energies
- SCF convergence status
- Geometry optimization progress
- Frequency calculation results
- Thermochemistry data
- Warning and error detection

**Parsing Strategy:**
- Marker-based detection (e.g., "HURRAY" for convergence, "SCF NOT CONVERGED" for failures)
- Regex patterns for energy values, iterations, gradients
- Line-by-line scanning for specific keywords

### 3.6 Results Dashboard *(Implemented — v0.4.0)*

**Status:** ✅ Implemented

Vue3-powered webview panel for visualization of ORCA calculation results.

**Webview Components:**
- **Summary Section:** Job overview, calculation method, final energy
- **Energy Section:** Energy convergence plots, SCF iteration table
- **SCF Section:** Convergence history with Chart.js visualization
- **Metric Cards:** Key statistics in summary cards

**UI Framework:**
- Vue3 SFC (Single File Components)
- PrimeVue DataTable, Tree, Panel, Button
- Chart.js for interactive plots
- CSS variable-based theming (light/dark mode support)

**Activation:**
- Auto-open after job completion (configurable)
- Manual trigger from `.out` file context menu
- Command palette: "Show Results Dashboard"

### 3.7 Installation Wizard *(Implemented — v0.6.0)*

**Status:** ✅ Implemented

Guided setup process for first-time users to configure ORCA installation.

**Wizard Steps:**
1. Detect existing ORCA installations (common paths on macOS, Linux, Windows)
2. Validate ORCA binary (run version check)
3. Check license acknowledgement
4. Configure parallel settings (MPI processes)
5. Save configuration to workspace settings

**Commands:**
- `vs-orca.setupOrca` — Launch installation wizard
- `vs-orca.detectOrca` — Scan for ORCA installations
- `vs-orca.validateOrca` — Validate current configuration
- `vs-orca.checkOrcaHealth` — Health check diagnostic

**Configuration Tracking:**
- `orca.installationWizardCompleted` — Wizard completion flag
- `orca.licenseAcknowledged` — License terms acknowledgement

## 4. User Flows

### 4.1 First-Time Setup

1. Install VS-ORCA extension from marketplace
2. Extension detects no ORCA configuration
3. Wizard prompt appears: "Set up ORCA installation?"
4. User follows wizard steps (detect, validate, configure)
5. Extension ready for use

**Error Handling:**
- If ORCA not found: Provide download link to official site
- If validation fails: Show diagnostic output and troubleshooting tips
- If license not acknowledged: Block job execution until accepted

### 4.2 Writing an Input File with Hover Assistance

1. Create new `.inp` file
2. Type `!` and method name (e.g., `B3LYP`)
3. Hover over method to see definition, category, related methods
4. Type basis set (e.g., `def2-TZVP`)
5. Hover to verify basis set details
6. Add block directive `%scf`
7. Hover to see block purpose and common parameters
8. Inside block, type parameter (e.g., `MaxIter`)
9. Hover to see type, default value, and description
10. Complete input file with full understanding of each keyword

**Learning Outcome:** User learns ORCA syntax inline without leaving editor.

### 4.3 Running a Calculation

1. Open `.inp` file
2. Press F5 (or click run icon)
3. Extension auto-saves file
4. ORCA process spawns
5. Real-time output streams to panel
6. User monitors SCF convergence messages
7. Job completes ("HURRAY" detected)
8. Dashboard auto-opens with results
9. View energy plots, convergence history, thermochemistry

**Error Handling:**
- SCF not converged: Show error in output panel, no dashboard
- ORCA binary not found: Prompt to run setup wizard
- File not saved: Auto-save or prompt depending on setting

### 4.4 Visualizing Results

1. Job completes or user opens existing `.out` file
2. Click "Show Results Dashboard" icon/command
3. Webview panel opens beside editor
4. Summary section shows method, basis, final energy
5. Energy section displays convergence plot
6. User interacts with Chart.js plot (zoom, tooltip)
7. Close dashboard or keep open for reference

## 5. Business Rules

### 5.1 File Type Rules

- Input files: `.inp` or `.orca` extensions trigger ORCA language mode
- Output files: `.out` extension triggers ORCA output language mode
- Hover provider: Active only for `language: 'orca'` files
- Syntax highlighting: Disabled for output files >5 MB (configurable)

### 5.2 Execution Rules

- ORCA binary path must be validated before first run
- Input file must be saved (auto or manual) before execution
- Only one ORCA job per workspace at a time (jobs are workspace-scoped)
- Kill job sends SIGTERM, then SIGKILL after 5s timeout
- Output channel dedicated to ORCA (not shared with other extensions)

### 5.3 Hover Provider Rules

- Keywords are case-insensitive (`b3lyp` == `B3LYP`)
- Block context scans upward max 50 lines (performance limit)
- Unknown tokens return no hover (graceful degradation)
- Markdown is CSP-compliant (no inline scripts, no command URIs)
- "See also" keywords are plain text (not clickable links)
- Deprecation warnings appear when `deprecationNote` metadata exists

### 5.4 Configuration Rules

- Default ORCA path `/opt/orca/orca` is placeholder (requires user setup)
- MPI processes: 1-128 valid range (default: 4)
- Output file size limits are soft limits (not enforced for manual opens)
- Dashboard auto-open can be disabled per-user preference

## 6. Data Entities

### 6.1 Keyword Definition (Hover Provider)

User-visible structure in hover popups:

| Field | Type | Description |
|-------|------|-------------|
| name | string | Keyword name (e.g., "B3LYP") |
| category | string | Category label (e.g., "Hybrid DFT Functional") |
| description | string | 2-3 sentence explanation |
| example | string (optional) | Usage example |
| relatedKeywords | string[] (optional) | 3-5 related keywords for "See also" |
| deprecationNote | string (optional) | Warning text for deprecated keywords |

### 6.2 Block Definition (Hover Provider)

| Field | Type | Description |
|-------|------|-------------|
| name | string | Block name (e.g., "scf") |
| description | string | Block purpose explanation |
| commonParams | string[] | List of common parameters |
| example | string (optional) | Block usage example |

### 6.3 Block Attribute (Hover Provider)

| Field | Type | Description |
|-------|------|-------------|
| name | string | Parameter name (e.g., "MaxIter") |
| blockName | string | Enclosing block (e.g., "scf") |
| type | enum | `integer | float | string | boolean` |
| default | string (optional) | Default value |
| unit | string (optional) | Unit specification (e.g., "Hartree") |
| description | string | Parameter explanation |
| example | string (optional) | Usage example |

### 6.4 Parsed Output Results

| Field | Type | Description |
|-------|------|-------------|
| finalEnergy | number (optional) | Single point energy (Hartree) |
| scfConverged | boolean | SCF convergence status |
| iterations | number | Total SCF iterations |
| warnings | string[] | List of warnings detected |
| errors | string[] | List of errors detected |

## 7. Accessibility

- All UI uses text-based content (no critical information in images)
- Hover popups use semantic Markdown (headings, lists)
- Screen reader compatible via VS Code's accessibility support
- Keyboard navigation supported (Ctrl+K Ctrl+I to trigger hover)
- Color-blind friendly (no color-coded critical information)

## 8. Security & Privacy

- No telemetry data collected
- No network calls (fully offline extension)
- ORCA binary path stored in workspace settings (not synced)
- CSP-compliant webview (no eval, no inline scripts)
- File system access limited to workspace directories
- No external resources loaded in hover Markdown

## 9. Performance

- Hover response time: <100ms average, <200ms P95 (measured with 20 random keyword hovers)
- Syntax highlighting: Disabled for files >5 MB to prevent UI freeze
- Output parsing: Marker-based detection instead of full parsing for speed
- Dashboard rendering: Virtualized tables for large datasets

## 10. Specification Changelog

### v0.8.0 - 2026-02-20

**Added:**
- Hover provider feature with 50+ simple keywords, 12+ block directives, 30+ block attributes
- Context-aware block attribute resolution
- "See also" sections with related keywords
- Deprecation warning support

**Updated:**
- Functional specification created to document all implemented features
- Technical specification created to reflect current architecture
