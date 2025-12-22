# Remaining Task Details - Quick Reference

This document provides concise specifications for the remaining task detail files (TASK-003-004, 005, 007-010, 012-016, 018-029). Each follows the established format with objectives, specifications, and acceptance criteria.

---

## TASK-003-004: Implement Real-time File Writing

**Phase**: Phase 1 - Output File Persistence  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Stream output to file during execution (not just at completion)
- Ensure file is readable while job is running
- Flush writes periodically for visibility
- Handle long-running jobs gracefully

**Key Implementation**:
- Use `fs.WriteStream` with autoFlush
- No buffering (immediate writes)
- Test with long-running ORCA job
- Verify partial output is readable

**Acceptance**: User can `tail -f water_opt.out` during execution and see real-time updates

---

## TASK-003-005: Add Unit Tests for File Writer

**Phase**: Phase 1 - Output File Persistence  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Test OutputFileWriter with all scenarios
- Mock file system operations
- Test error handling paths
- Achieve >90% code coverage

**Key Tests**:
- File creation with valid path
- Write multiple chunks
- Proper file closure
- Disabled state (no writes)
- Directory creation
- Permission errors

**Acceptance**: All tests pass, coverage >90%, no flaky tests

---

## TASK-003-007: Register .out File Association

**Phase**: Phase 2 - Syntax Highlighting & Navigation  
**Priority**: P0  
**Effort**: 1 hour

**Objectives**:
- Register `.out` file type in VS Code
- Associate with ORCA output grammar
- Set appropriate language ID
- Configure file icon (optional)

**Implementation** (package.json):
```json
{
  "contributes": {
    "languages": [{
      "id": "orca-output",
      "aliases": ["ORCA Output"],
      "extensions": [".out"],
      "configuration": "./language-configuration-out.json"
    }],
    "grammars": [{
      "language": "orca-output",
      "scopeName": "text.orca-output",
      "path": "./syntaxes/orca.out.tmLanguage.json"
    }]
  }
}
```

**Acceptance**: Opening `.out` files triggers syntax highlighting automatically

---

## TASK-003-008: Implement Document Symbol Provider

**Phase**: Phase 2 - Syntax Highlighting & Navigation  
**Priority**: P0  
**Effort**: 3 hours

**Objectives**:
- Create `OutDocumentSymbolProvider` class
- Parse output for section headers
- Return hierarchical symbol structure
- Enable Outline view and "Go to Symbol"

**Key Sections to Detect**:
- INPUT FILE
- SCF ITERATIONS
- GEOMETRY OPTIMIZATION CYCLE
- VIBRATIONAL FREQUENCIES
- TIMINGS

**Implementation**:
```typescript
export class OutDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    // Parse sections, return symbols
  }
}
```

**Acceptance**: Outline view shows sections, Ctrl+Shift+O lists symbols

---

## TASK-003-009: Add Open Output File Command

**Phase**: Phase 2 - Syntax Highlighting & Navigation  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Create command `vs-orca.openOutputFile`
- Find corresponding `.out` for active `.inp`
- Open in editor with syntax highlighting
- Add context menu to explorer

**Implementation**:
```typescript
vscode.commands.registerCommand('vs-orca.openOutputFile', async () => {
  const editor = vscode.window.activeTextEditor;
  if (editor?.document.fileName.endsWith('.inp')) {
    const outPath = editor.document.fileName.replace(/\.inp$/i, '.out');
    const doc = await vscode.workspace.openTextDocument(outPath);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  }
});
```

**Acceptance**: Command works from palette, context menu, and keybinding

---

## TASK-003-010: Test Navigation Features

**Phase**: Phase 2 - Syntax Highlighting & Navigation  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Validate all navigation features with real outputs
- Test edge cases and boundary conditions
- Ensure performance is acceptable
- Document any limitations

**Test Scenarios**:
1. Large file (10MB+) symbol parsing performance
2. File with missing sections
3. Malformed section headers
4. Nested sections (if any)
5. Multi-file workspace

**Acceptance**: All navigation features work reliably, <100ms response time

---

## TASK-003-012: Implement SCF Cycle Counter

**Phase**: Phase 3 - Enhanced Parsing  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Parse SCF iteration tables
- Count total cycles to convergence
- Extract iteration details (energy, delta-E, etc.)
- Populate `SCFIteration[]` in results

**Key Patterns**:
```
ITER       Energy         Delta-E        Max-DP      RMS-DP
   0    -76.123456789    0.000000       0.123456    0.012345
   1    -76.234567890   -0.111111       0.023456    0.002345
```

**Acceptance**: Extracts all SCF iterations, counts correctly, handles failures

---

## TASK-003-013: Implement Geometry Step Extractor

**Phase**: Phase 3 - Enhanced Parsing  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Parse geometry optimization cycles
- Extract step number, energy, forces, displacements
- Populate `GeometryStep[]` in results
- Extract final optimized coordinates

**Key Sections**:
- "GEOMETRY OPTIMIZATION CYCLE N"
- Convergence table with forces/steps
- "FINAL ENERGY EVALUATION"

**Acceptance**: Extracts all geometry steps for optimization jobs, N/A for single-point

---

## TASK-003-014: Implement Frequency Table Parser

**Phase**: Phase 3 - Enhanced Parsing  
**Priority**: P0  
**Effort**: 3 hours

**Objectives**:
- Parse vibrational frequency tables
- Extract mode number, frequency, intensities
- Detect imaginary modes
- Parse zero-point energy and thermal corrections

**Key Patterns**:
```
Mode    Frequency       IR Intensity    Raman Activity
  0     3756.23            45.2              12.3
  1      -123.45           0.0               0.0  ***imaginary mode***
```

**Acceptance**: Parses all frequencies, detects imaginary modes, extracts ZPE

---

## TASK-003-015: Implement Warning/Error Collector

**Phase**: Phase 3 - Enhanced Parsing  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Scan output for WARNING/ERROR/NOTE messages
- Collect full message text
- Categorize by type
- Optionally capture line numbers

**Key Patterns**:
- `WARNING:.*`
- `ERROR:.*`
- `NOTE:.*`

**Acceptance**: Collects all diagnostics, categorizes correctly, no duplicates

---

## TASK-003-016: Create Parser Unit Tests

**Phase**: Phase 3 - Enhanced Parsing  
**Priority**: P0  
**Effort**: 3 hours

**Objectives**:
- Create diverse test fixture files
- Test all parser methods independently
- Test edge cases and malformed outputs
- Achieve >90% coverage

**Fixture Files Needed**:
- `success_opt.out` (complete optimization)
- `failed_scf.out` (SCF failure)
- `frequencies.out` (freq calculation)
- `partial.out` (incomplete run)
- `large_output.out` (performance test)

**Acceptance**: 20+ fixture files, all tests pass, coverage >90%

---

## TASK-003-018: Design Dashboard HTML/CSS UI

**Phase**: Phase 4 - Results Dashboard  
**Priority**: P0  
**Effort**: 3 hours

**Objectives**:
- Create dashboard.html with modern UI
- Use VS Code Webview UI Toolkit
- Design sections for all result types
- Implement responsive layout

**UI Sections**:
1. Summary cards (energy, convergence, time)
2. SCF convergence table
3. Geometry optimization timeline
4. Frequency table with sorting
5. Warnings/Errors panel
6. Action buttons (Export, Refresh, Open)

**Styling**: Use VS Code theme variables for consistency

**Acceptance**: Beautiful, functional UI that adapts to VS Code themes

---

## TASK-003-019: Implement Message Passing System

**Phase**: Phase 4 - Results Dashboard  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Define message protocol between extension and webview
- Handle update, error, export, refresh messages
- Ensure type safety with interfaces
- Add error handling

**Message Types**:
- `update`: Send parsed results to webview
- `error`: Display error message
- `export`: Trigger clipboard export
- `refresh`: Re-parse output file
- `ready`: Webview initialization complete

**Acceptance**: All message types work, no data loss, proper error handling

---

## TASK-003-020: Add FileSystemWatcher for Live Updates

**Phase**: Phase 4 - Results Dashboard  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Watch output file for changes
- Debounce updates (500ms)
- Re-parse and update dashboard automatically
- Handle file deletion

**Implementation**: Already in TASK-003-017, refine and test

**Acceptance**: Dashboard updates within 500ms of file change, no excessive updates

---

## TASK-003-021: Implement Show Dashboard Command

**Phase**: Phase 4 - Results Dashboard  
**Priority**: P0  
**Effort**: 2 hours

**Objectives**:
- Create `vs-orca.showResultsDashboard` command
- Infer output file from active editor
- Handle both `.inp` and `.out` files
- Add to command palette and menus

**Implementation**:
```typescript
vscode.commands.registerCommand('vs-orca.showResultsDashboard', async () => {
  const editor = vscode.window.activeTextEditor;
  let outPath = editor?.document.fileName;
  if (outPath?.endsWith('.inp')) {
    outPath = outPath.replace(/\.inp$/i, '.out');
  }
  DashboardPanel.createOrShow(extensionUri, outPath);
});
```

**Acceptance**: Command works from palette, keybinding, and context menus

---

## TASK-003-022: Add Context Menu Integrations

**Phase**: Phase 4 - Results Dashboard  
**Priority**: P0  
**Effort**: 1 hour

**Objectives**:
- Add "Open ORCA Output" to `.inp` file context menu
- Add "Show Results Dashboard" to `.out` file context menu
- Add to editor title context menu

**Implementation** (package.json):
```json
{
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

**Acceptance**: Context menu items appear in correct locations, commands execute

---

## TASK-003-023: Implement Export to Clipboard (P1)

**Phase**: Phase 4 - Results Dashboard  
**Priority**: P1 (Nice-to-Have)  
**Effort**: 2 hours

**Objectives**:
- Add export button to dashboard
- Format results as JSON
- Copy to clipboard
- Show confirmation notification

**Implementation**: Already stubbed in TASK-003-017, complete implementation

**Acceptance**: Export works, JSON is valid, notification shows

---

## TASK-003-024: End-to-End Testing with ORCA Jobs

**Phase**: Phase 5 - Testing & Polish  
**Priority**: P0  
**Effort**: 4 hours

**Objectives**:
- Run 50+ diverse ORCA calculations
- Test complete workflow: run → file → parse → dashboard
- Validate all features with real data
- Document any issues

**Test Types**:
- Single-point energy
- Geometry optimization
- Frequency calculation
- Failed convergence
- Large systems (500+ atoms)

**Acceptance**: All features work end-to-end, no crashes, accurate parsing

---

## TASK-003-025: Performance Testing Large Files

**Phase**: Phase 5 - Testing & Polish  
**Priority**: P0  
**Effort**: 3 hours

**Objectives**:
- Test with 10MB, 50MB, 100MB output files
- Measure parsing time, syntax highlighting lag
- Identify bottlenecks
- Implement optimizations if needed

**Performance Targets**:
- Parse 10MB file: <2s
- Syntax highlight 5MB file: no visible lag
- Dashboard open: <500ms

**Acceptance**: All targets met, no crashes with large files

---

## TASK-003-026: Accessibility Audit (P1)

**Phase**: Phase 5 - Testing & Polish  
**Priority**: P1 (Nice-to-Have)  
**Effort**: 2 hours

**Objectives**:
- Test keyboard navigation in dashboard
- Verify screen reader compatibility
- Check color contrast ratios
- Add ARIA labels where needed

**Tools**: VS Code's built-in accessibility features, NVDA/JAWS

**Acceptance**: Dashboard fully accessible, WCAG 2.1 Level AA compliance

---

## TASK-003-027: Create User Documentation

**Phase**: Phase 5 - Testing & Polish  
**Priority**: P0  
**Effort**: 3 hours

**Objectives**:
- Update README.md with new features
- Create user guide with screenshots
- Document all commands and settings
- Add troubleshooting section

**Sections to Add**:
1. Output File Management
2. Viewing Results
3. Using the Dashboard
4. Configuration Options
5. Troubleshooting

**Acceptance**: Documentation complete, accurate, with visual examples

---

## TASK-003-028: Create Developer Documentation (P1)

**Phase**: Phase 5 - Testing & Polish  
**Priority**: P1 (Nice-to-Have)  
**Effort**: 2 hours

**Objectives**:
- Document parser extension points
- Explain dashboard architecture
- Provide examples for extending features
- Update DEVELOPER_GUIDE.md

**Topics**:
- Adding new parser methods
- Customizing dashboard sections
- Creating new TextMate grammar patterns

**Acceptance**: Developers can extend parser and dashboard with documentation

---

## TASK-003-029: Prepare Marketplace Assets (P1)

**Phase**: Phase 5 - Testing & Polish  
**Priority**: P1 (Nice-to-Have)  
**Effort**: 2 hours

**Objectives**:
- Create demo GIFs showing features
- Take high-quality screenshots
- Write compelling feature descriptions
- Update CHANGELOG.md

**Assets Needed**:
- Dashboard overview GIF
- Syntax highlighting screenshot
- Navigation demo GIF
- Before/after comparison

**Acceptance**: All assets ready for marketplace listing, CHANGELOG updated

---

## Task Sequencing Summary

### Can Start Immediately (No Dependencies)
- TASK-003-001, 003-003, 003-006

### Sequential Dependencies
- Phase 1: 001 → 002 → 004 → 005
- Phase 2: 006 → 007 → 008 → 009 → 010
- Phase 3: 011 → {012, 013, 014, 015} → 016
- Phase 4: 017 → 018 → 019 → {020, 021, 022, 023}
- Phase 5: {All previous} → {024, 025, 026, 027, 028, 029}

### Can Parallelize
- Phase 2 and Phase 3 (after Phase 1 complete)
- TASK-003-012 to 003-015 (all parse different things)
- Phase 5 tasks (after all features complete)

---

**Notes**:
- P0 tasks are mandatory for v0.3.0 release
- P1 tasks can be deferred to v0.3.1 or v0.4.0
- Estimated total effort: 61 hours (~5 weeks with testing buffer)
- Critical path: Phase 1 → Phase 3 → Phase 4 → Phase 5
