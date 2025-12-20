# VS-ORCA Testing Guide

This document provides testing instructions for the VS-ORCA extension.

## Quick Start Test

1. **Open Extension Development Host**:
   - Press `F5` in VS Code (or Run > Start Debugging)
   - A new VS Code window will open with the extension loaded

2. **Test Syntax Highlighting**:
   - Open `examples/water_opt.inp`
   - Verify colors:
     - `!` keywords should be highlighted (B3LYP, def2-TZVP, Opt)
     - `%pal` block header should be distinct
     - Coordinates should show element symbols in different colors
     - Comments (`#`) should be grayed out

3. **Test Code Snippets**:
   - Create new file: `test.inp`
   - Type `opt` and press `Tab` → should expand to optimization template
   - Type `freq` and press `Tab` → should expand to frequency template
   - Try other snippets: `sp`, `ts`, `cpcm`, `pal`

4. **Test Execution** (requires ORCA installed):
   - Configure ORCA path:
     - Open Settings (`Ctrl/Cmd + ,`)
     - Search for "orca.binaryPath"
     - Set to your ORCA installation path
   - Open `examples/water_opt.inp`
   - Press `F5` or click the ▶️ button in editor toolbar
   - Verify:
     - Output panel opens automatically
     - Job status appears in status bar
     - Output streams in real-time
     - Status bar shows final energy when complete

5. **Test Process Management**:
   - Start a long-running job
   - Open Command Palette (`Ctrl/Cmd + Shift + P`)
   - Type "ORCA: Kill Running ORCA Job"
   - Verify job terminates

## Detailed Test Cases

### Syntax Highlighting

| Test Case | Expected Result |
|-----------|----------------|
| Open `.inp` file | Language detected as "ORCA" in status bar |
| `! B3LYP` keyword | Highlighted as method |
| `! def2-TZVP` keyword | Highlighted as basis set |
| `%pal ... end` block | Block header distinct from content |
| `* xyz 0 1` | Coordinate header highlighted |
| Element symbols (C, H, O) | Distinct color from numbers |
| `# comment` | Grayed out/italicized |

### Code Snippets

| Snippet | Trigger | Expected Expansion |
|---------|---------|-------------------|
| Single Point | `sp` + Tab | Full SP template with placeholders |
| Optimization | `opt` + Tab | Optimization block with geometry |
| Frequency | `freq` + Tab | Frequency calculation template |
| Transition State | `ts` + Tab | OptTS with Hessian calculation |
| Solvation | `cpcm` + Tab | CPCM/SMD block with solvent list |
| PAL Block | `pal` + Tab | Parallel configuration |

### Execution Engine

| Test Case | Expected Result |
|-----------|----------------|
| Run without ORCA configured | Warning message with "Open Settings" button |
| Run with invalid path | Error: "ORCA binary not found" |
| Run unsaved file | Prompt to save (if autoSave=false) |
| Run valid job | Output panel opens, status bar updates |
| Kill running job | Process terminates, status updated |
| Multiple runs | Second run prompts to kill first |

### Output Parsing

| Pattern in Output | Expected Detection |
|------------------|-------------------|
| "HURRAY" | "🎉 Calculation converged successfully!" |
| "SCF NOT CONVERGED" | "⚠️ Warning: SCF did not converge" |
| "FINAL SINGLE POINT ENERGY -76.123" | Status bar shows "-76.123000 Eh" |
| "THE OPTIMIZATION HAS CONVERGED" | "✨ Geometry optimization converged!" |
| "***imaginary mode***" | "⚠️ Found 1 imaginary frequency" |

## Manual Testing Checklist

Before submitting a PR or release:

- [ ] Extension compiles without errors (`npm run compile`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Extension activates in development host
- [ ] Syntax highlighting works for all keywords
- [ ] All snippets expand correctly
- [ ] Configuration settings appear in Settings UI
- [ ] Run command executes ORCA successfully
- [ ] Output streams to panel in real-time
- [ ] Kill command terminates job
- [ ] Status bar updates correctly
- [ ] Error messages are user-friendly
- [ ] Keybindings work (`F5`)
- [ ] Editor toolbar button visible for `.inp` files
- [ ] README is accurate and complete
- [ ] Examples run without errors

## Known Limitations

1. **Icon**: Currently using SVG placeholder (needs PNG conversion)
2. **Windows**: Paths with spaces need manual escaping
3. **Large Files**: Output >50MB may cause performance issues
4. **Remote**: SSH execution not yet implemented (Phase 3)

## Automated Testing (Future)

To be implemented:
- Unit tests for parsing functions
- Integration tests for command execution
- Grammar validation tests
- Snippet expansion tests

## Reporting Issues

If tests fail:
1. Check VS Code version (requires 1.85.0+)
2. Verify Node.js version (requires 20+)
3. Check for console errors (Help > Toggle Developer Tools)
4. Capture logs from ORCA output panel
5. Create GitHub issue with reproduction steps
