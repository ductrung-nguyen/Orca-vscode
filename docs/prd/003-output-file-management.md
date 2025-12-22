# PRD: Output File Management and Enhanced Viewing

**Document ID**: PRD-003  
**Feature**: Output File Management  
**Status**: Draft  
**Created**: 2025-12-22  
**Owner**: VS-ORCA Development Team

## Executive Summary

Enhance VS-ORCA extension to persist ORCA execution logs to `.out` files and provide advanced viewing capabilities including syntax highlighting, structured navigation, and a visual results dashboard. This transforms the current ephemeral output channel experience into a persistent, analyzable workflow.

## Problem Statement

### Current Limitations
- **No Persistence**: Execution logs only appear in VS Code output channel and are lost when the channel is cleared or VS Code restarts
- **Poor Readability**: Plain text output in output channel lacks visual structure for 1000+ line ORCA outputs
- **No Navigation**: Users manually scroll through long outputs to find specific sections (geometry, SCF cycles, frequencies)
- **Limited Results Access**: Parsed results (energy, convergence) only visible in status bar; no historical comparison

### User Pain Points
1. **Workflow Disruption**: Users copy-paste output channel content to files manually for archival
2. **Analysis Difficulty**: Locating specific output sections (e.g., "FINAL SINGLE POINT ENERGY") requires manual text search
3. **Results Tracking**: No way to compare energies or geometries across multiple runs without external tools
4. **Collaboration Barriers**: Sharing results requires exporting output channel logs, which lack context

## Goals and Non-Goals

### Goals
1. **Automatic Persistence**: Every ORCA execution writes a timestamped `.out` file
2. **Enhanced Readability**: Syntax highlighting for `.out` files with color-coded sections and data
3. **Structured Navigation**: Table of contents for jumping to key output sections
4. **Visual Results**: Dashboard webview displaying parsed energies, convergence plots, and frequency tables
5. **Seamless Integration**: Commands to open `.out` files with enhancements directly from editor/explorer

### Non-Goals
- Real-time streaming visualization during execution (defer to future release)
- Built-in plotting/graphing (use dashboard for tabular summaries only)
- Output file format conversion (e.g., `.out` to `.json`)
- Multi-file comparison/diff tools (separate feature)

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Adoption Rate | 80% of runs generate `.out` files | Telemetry: file creation events |
| Navigation Usage | 50% of users click TOC entries | Telemetry: TOC click events |
| Dashboard Opens | 30% of runs followed by dashboard open | Command invocation tracking |
| User Satisfaction | 4.5/5 rating for output features | Extension marketplace reviews |

## User Stories

### Story 1: Persistent Output Files
**As a** computational chemist  
**I want** ORCA execution logs automatically saved to `.out` files  
**So that** I can review results after closing VS Code or share outputs with collaborators

**Acceptance Criteria**:
- ✅ `.out` file created in same directory as `.inp` file with matching basename
- ✅ File contains all stdout/stderr from ORCA process
- ✅ File updated in real-time during execution (not just at completion)
- ✅ Setting `orca.saveOutputToFile` (default: `true`) controls behavior

### Story 2: Syntax Highlighted Output
**As a** researcher reviewing ORCA output  
**I want** `.out` files to have syntax highlighting  
**So that** I can quickly identify sections, warnings, and numerical results

**Acceptance Criteria**:
- ✅ TextMate grammar registered for `.out` files
- ✅ Color-coded sections: headers (green), energies (cyan), errors (red), warnings (yellow)
- ✅ Numerical values highlighted distinctly from surrounding text
- ✅ Consistent with ORCA `.inp` file highlighting theme

### Story 3: Table of Contents Navigation
**As a** user analyzing long ORCA outputs  
**I want** a clickable table of contents  
**So that** I can jump to specific sections without scrolling

**Acceptance Criteria**:
- ✅ Document symbol provider detects sections: "INPUT FILE", "SCF ITERATIONS", "GEOMETRY OPTIMIZATION", "VIBRATIONAL FREQUENCIES", "TIMINGS"
- ✅ Breadcrumb navigation shows current section
- ✅ "Go to Symbol in Editor" (`Ctrl+Shift+O` / `Cmd+Shift+O`) lists all sections
- ✅ Outline view shows hierarchical structure

### Story 4: Results Dashboard
**As a** user completing an ORCA calculation  
**I want** a visual dashboard showing parsed results  
**So that** I can quickly assess calculation success and extract key values

**Acceptance Criteria**:
- ✅ Webview panel displays:
  - Final single point energy
  - Convergence status (✅/❌)
  - SCF cycles count
  - Geometry optimization steps (if applicable)
  - Frequency table (if applicable) with imaginary modes highlighted
  - Execution time
- ✅ Dashboard refreshes automatically when `.out` file updates
- ✅ "Export Results" button copies data to clipboard as JSON

### Story 5: Quick Open Commands
**As a** developer switching between input and output  
**I want** commands to open related files  
**So that** I can navigate without using file explorer

**Acceptance Criteria**:
- ✅ Command `vs-orca.openOutputFile` opens `.out` for current `.inp` file
- ✅ Command `vs-orca.showResultsDashboard` opens dashboard for active `.out` or `.inp`
- ✅ Context menu in explorer: "Open ORCA Output" for `.inp` files
- ✅ Context menu in editor: "Show Results Dashboard" for `.out` files

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    VS-ORCA Extension                    │
├─────────────────────────────────────────────────────────┤
│  OrcaRunner (Modified)                                  │
│  ├─ stdout/stderr → OutputChannel (existing)            │
│  └─ stdout/stderr → FileStream → {basename}.out (NEW)   │
├─────────────────────────────────────────────────────────┤
│  Language Features (NEW)                                │
│  ├─ orca.out.tmLanguage.json (syntax)                   │
│  ├─ OutDocumentSymbolProvider (TOC)                     │
│  └─ OutDefinitionProvider (section links)               │
├─────────────────────────────────────────────────────────┤
│  Results Dashboard (NEW)                                │
│  ├─ DashboardPanel.ts (webview)                         │
│  ├─ OutputParser.ts (enhanced parsing)                  │
│  └─ dashboard.html (UI template)                        │
└─────────────────────────────────────────────────────────┘
```

### Component Details

#### 1. Output File Writer (`src/outputWriter.ts`)
```typescript
class OutputFileWriter {
  private fileStream: fs.WriteStream;
  
  constructor(inputFilePath: string) {
    const outPath = inputFilePath.replace(/\.inp$/, '.out');
    this.fileStream = fs.createWriteStream(outPath, { flags: 'w' });
  }
  
  write(data: string): void {
    this.fileStream.write(data);
  }
  
  close(): void {
    this.fileStream.end();
  }
}
```

**Integration Point**: `OrcaRunner.runOrcaJob()` instantiates `OutputFileWriter` and pipes stdout/stderr to both output channel and file stream.

#### 2. TextMate Grammar (`syntaxes/orca.out.tmLanguage.json`)
**Key Patterns**:
- Section headers: `^-{50,}$` followed by uppercase text
- Energies: `FINAL SINGLE POINT ENERGY\s+([-\d.]+)`
- Warnings: `WARNING:.*$`
- Errors: `ERROR:.*$`
- Convergence markers: `HURRAY`, `SCF NOT CONVERGED`

**Scopes**:
- `entity.name.section.orca-output` (headers)
- `constant.numeric.energy.orca-output` (energies)
- `invalid.deprecated.warning.orca-output` (warnings)
- `invalid.illegal.error.orca-output` (errors)

#### 3. Document Symbol Provider (`src/outSymbolProvider.ts`)
```typescript
class OutDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    const symbols: vscode.DocumentSymbol[] = [];
    const sectionRegex = /^-{50,}\n([A-Z\s]+)\n-{50,}$/gm;
    
    // Parse document and create symbols for each section
    // Return hierarchical structure for nested sections
    
    return symbols;
  }
}
```

**Detected Sections**:
- INPUT FILE
- SCF ITERATIONS
- GEOMETRY OPTIMIZATION CYCLE
- VIBRATIONAL FREQUENCIES
- TIMINGS

#### 4. Results Dashboard (`src/dashboard/`)

**DashboardPanel.ts**:
```typescript
class DashboardPanel {
  private panel: vscode.WebviewPanel;
  private parser: OutputParser;
  
  constructor(outputFilePath: string) {
    this.panel = vscode.window.createWebviewPanel(
      'orcaResults',
      'ORCA Results',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );
    
    this.panel.webview.html = this.getWebviewContent();
    this.updateResults(outputFilePath);
  }
  
  private async updateResults(filePath: string): Promise<void> {
    const results = await this.parser.parseOutputFile(filePath);
    this.panel.webview.postMessage({ type: 'update', data: results });
  }
}
```

**OutputParser.ts** (Enhanced):
```typescript
interface ParsedResults {
  finalEnergy?: number;
  converged: boolean;
  scfCycles: number;
  geometrySteps?: number;
  frequencies?: FrequencyData[];
  imaginaryModes: number;
  executionTime: string;
  warnings: string[];
  errors: string[];
}

class OutputParser {
  parseOutputFile(filePath: string): Promise<ParsedResults> {
    // Extend existing parseOrcaOutput with:
    // - SCF cycle counting
    // - Geometry step extraction
    // - Frequency table parsing
    // - Warning/error collection
  }
}
```

**dashboard.html** (Webview UI):
- Uses VS Code Webview UI Toolkit (`@vscode/webview-ui-toolkit`)
- Sections:
  - Summary cards (energy, convergence, timing)
  - SCF Convergence table
  - Geometry Optimization timeline (if applicable)
  - Frequency table with sortable columns
  - Warnings/Errors panel
- "Export" button copies JSON to clipboard

#### 5. Commands (`package.json` contributions)
```json
{
  "commands": [
    {
      "command": "vs-orca.openOutputFile",
      "title": "Open ORCA Output File",
      "category": "ORCA"
    },
    {
      "command": "vs-orca.showResultsDashboard",
      "title": "Show Results Dashboard",
      "category": "ORCA"
    }
  ],
  "menus": {
    "explorer/context": [
      {
        "command": "vs-orca.openOutputFile",
        "when": "resourceExtname == .inp",
        "group": "navigation"
      }
    ],
    "editor/context": [
      {
        "command": "vs-orca.showResultsDashboard",
        "when": "resourceExtname == .out",
        "group": "navigation"
      }
    ]
  }
}
```

### Data Flow

#### Execution → Output File
```
User triggers run (F5)
  → OrcaRunner.runOrcaJob()
    → OutputFileWriter created
    → spawn() ORCA process
      → stdout/stderr events
        → data → OutputChannel.append()
        → data → OutputFileWriter.write()
      → close event
        → OutputFileWriter.close()
```

#### Output File → Dashboard
```
User opens .inp or .out
  → Command: vs-orca.showResultsDashboard
    → DashboardPanel created
      → OutputParser.parseOutputFile()
        → Read .out file
        → Extract: energy, convergence, frequencies, etc.
        → Return ParsedResults
      → Webview renders results
      → FileSystemWatcher monitors .out
        → On change → re-parse → update webview
```

### Configuration Schema
```json
{
  "orca.saveOutputToFile": {
    "type": "boolean",
    "default": true,
    "description": "Automatically save ORCA output to .out files"
  },
  "orca.dashboardAutoOpen": {
    "type": "boolean",
    "default": false,
    "description": "Automatically open results dashboard after job completion"
  },
  "orca.outputSyntaxHighlighting": {
    "type": "boolean",
    "default": true,
    "description": "Enable syntax highlighting for .out files"
  }
}
```

## Implementation Plan

### Phase 1: Output File Persistence (Week 1)
- [ ] Create `OutputFileWriter` class
- [ ] Integrate with `OrcaRunner` for dual output (channel + file)
- [ ] Add `orca.saveOutputToFile` configuration
- [ ] Unit tests for file writing
- [ ] Update documentation

### Phase 2: Syntax Highlighting & Navigation (Week 2)
- [ ] Create `orca.out.tmLanguage.json` grammar
- [ ] Register `.out` file association in `package.json`
- [ ] Implement `OutDocumentSymbolProvider`
- [ ] Test TOC with example outputs
- [ ] Add command `vs-orca.openOutputFile`

### Phase 3: Enhanced Parsing (Week 3)
- [ ] Extend `OutputParser` with new extraction methods:
  - SCF cycle counting
  - Geometry step extraction
  - Frequency table parsing
  - Warning/error collection
- [ ] Define `ParsedResults` interface
- [ ] Unit tests for all parsers with fixture files
- [ ] Validate against 20+ real ORCA outputs

### Phase 4: Results Dashboard (Week 4)
- [ ] Create `DashboardPanel` webview component
- [ ] Design `dashboard.html` UI with Webview Toolkit
- [ ] Implement message passing for data updates
- [ ] Add `FileSystemWatcher` for live updates
- [ ] Command `vs-orca.showResultsDashboard`
- [ ] Context menu integrations
- [ ] Export to clipboard functionality

### Phase 5: Testing & Polish (Week 5)
- [ ] End-to-end testing with 50+ ORCA calculations
- [ ] Performance testing with large outputs (10MB+ files)
- [ ] Accessibility audit (keyboard navigation, screen reader)
- [ ] Documentation: user guide, examples
- [ ] Marketplace assets (screenshots, demo GIF)

## Testing Strategy

### Unit Tests
- `OutputFileWriter`: File creation, write, close, error handling
- `OutputParser`: Energy extraction, convergence detection, frequency parsing
- `OutDocumentSymbolProvider`: Section detection, symbol hierarchy

### Integration Tests
- Full execution cycle: `.inp` → run → `.out` creation → parsing
- Dashboard updates when `.out` file changes
- Command execution from different contexts (editor, explorer)

### Manual Testing Scenarios
1. **Basic Optimization**: `water_opt.inp` → verify `.out` + dashboard
2. **Frequency Calculation**: `methane_freq.inp` → verify frequency table rendering
3. **Failed Job**: Trigger SCF failure → verify error display in dashboard
4. **Large Output**: 10MB+ output file → test performance, syntax highlighting
5. **Multi-file Workspace**: Run multiple jobs → verify correct file associations

### Test Fixtures
Create `src/test/fixtures/outputs/`:
- `success_opt.out` (converged optimization)
- `failed_scf.out` (SCF not converged)
- `frequencies.out` (with vibrational modes)
- `large_output.out` (10MB+ for performance testing)

## Dependencies

### New Dependencies
- `@vscode/webview-ui-toolkit` (v1.x): Webview UI components
- `@types/node` (existing, ensure fs.WriteStream types)

### VS Code API Usage
- `vscode.window.createWebviewPanel`: Dashboard UI
- `vscode.workspace.fs`: File operations
- `vscode.languages.registerDocumentSymbolProvider`: TOC
- `vscode.workspace.createFileSystemWatcher`: Live updates

## Security & Performance

### Security Considerations
- **File Overwrite**: Always warn if `.out` file exists (prevent data loss)
- **Path Injection**: Validate file paths to prevent directory traversal
- **Webview CSP**: Use strict Content Security Policy for dashboard

### Performance Optimizations
- **Streaming Writes**: Use `fs.WriteStream` to avoid buffering entire output
- **Lazy Parsing**: Parse `.out` files only when dashboard opens (not on every edit)
- **Debouncing**: Debounce file watcher updates (500ms) to prevent excessive re-parsing
- **Symbol Caching**: Cache document symbols, invalidate on file change
- **Large File Handling**: Truncate syntax highlighting for files >5MB (setting: `orca.maxSyntaxFileSize`)

## Documentation Requirements

### User-Facing Documentation
1. **README.md**: Add "Output Management" section with screenshots
2. **QUICKSTART.md**: Include dashboard usage example
3. **FAQ**: Address common questions:
   - "Where are output files saved?"
   - "Can I disable automatic file creation?"
   - "How do I export results?"

### Developer Documentation
1. **DEVELOPER_GUIDE.md**: Add "Output Parser Extension" guide
2. **API.md**: Document `OutputParser` methods, `ParsedResults` schema
3. **TESTING.md**: Update with new test cases

## Open Questions

1. **File Naming Strategy**: Should we support timestamped outputs (e.g., `water_opt_20251222_143052.out`) or always overwrite?
   - **Recommendation**: Default overwrite, add `orca.outputFileTimestamp` setting for power users
   
2. **Dashboard Persistence**: Should dashboard state persist across VS Code sessions?
   - **Recommendation**: No persistence in Phase 1; defer to future feature

3. **Multi-File Comparison**: Should dashboard support comparing multiple `.out` files?
   - **Non-Goal for v1**: Too complex; consider separate feature

4. **Output Format Support**: Should we support parsing `.log` or `.hess` files?
   - **Out of Scope**: Focus on `.out` files only; extensible for future

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Large `.out` files (100MB+) crash syntax highlighting | High | Medium | Implement `orca.maxSyntaxFileSize` limit (default 5MB) |
| Complex ORCA outputs break parser | High | Low | Use defensive parsing with fallbacks; extensive fixture testing |
| Webview performance issues | Medium | Low | Debounce updates, lazy load data, pagination for large tables |
| User confusion with multiple output files | Low | Medium | Clear documentation, settings UI, file naming conventions |

## Release Plan

### Version 0.3.0 (Target: Q1 2026)
- **Includes**: Phases 1-4 (output persistence, syntax, dashboard)
- **Breaking Changes**: None
- **Migration**: Automatic; existing workflows unaffected

### Marketing Points
- 🎯 "Never lose ORCA output again – automatic `.out` file persistence"
- 🎨 "Beautiful syntax highlighting makes large outputs readable"
- 📊 "Visual dashboard extracts key results at a glance"
- ⚡ "Jump to any section with intelligent table of contents"

## Appendix

### Example Output Sections
```
INPUT FILE
================================================================================
! B3LYP def2-SVP Opt
...

SCF ITERATIONS
================================================================================
ITER       Energy         Delta-E        Max-DP      RMS-DP
...

FINAL SINGLE POINT ENERGY      -76.382934718263

GEOMETRY OPTIMIZATION CYCLE 5
================================================================================
...

VIBRATIONAL FREQUENCIES
================================================================================
Mode    Frequency    Intensity
  0       3756.23        45.2
  1       3652.11        78.3
  2       1595.44       156.7
```

### Dashboard Mockup (Text Representation)
```
╔══════════════════════════════════════════════════════╗
║           ORCA Results Dashboard                     ║
║           water_opt.out                              ║
╠══════════════════════════════════════════════════════╣
║  Final Energy: -76.382934718263 Eh                   ║
║  Status: ✅ Converged                                ║
║  SCF Cycles: 12                                      ║
║  Geometry Steps: 5                                   ║
║  Execution Time: 00:02:34                            ║
╠══════════════════════════════════════════════════════╣
║  Frequencies (cm⁻¹)        Intensity                 ║
║  ─────────────────────────────────────────────       ║
║  3756.23                      45.2                   ║
║  3652.11                      78.3                   ║
║  1595.44                     156.7                   ║
║  ✅ No imaginary modes                               ║
╠══════════════════════════════════════════════════════╣
║  [Export Results] [Refresh] [Open .out File]         ║
╚══════════════════════════════════════════════════════╝
```

### References
- [VS Code Document Symbols API](https://code.visualstudio.com/api/language-extensions/programmatic-language-features#show-all-symbol-definitions-in-file)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [TextMate Grammar Guide](https://macromates.com/manual/en/language_grammars)
- [ORCA Manual (Output Format)](https://orcaforum.kofo.mpg.de/)

---

**Approval Sign-Off**:
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] QA Lead
- [ ] Documentation Team

**Revision History**:
- 2025-12-22: Initial draft (v1.0)
