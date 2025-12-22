# Output File Management - User Guide

## Overview

The VS-ORCA extension automatically saves all ORCA execution output to `.out` files and provides enhanced viewing capabilities including syntax highlighting, structured navigation, and an interactive results dashboard.

## Features

### 1. Automatic Output File Persistence

Every ORCA job execution automatically creates a corresponding `.out` file:

```
water_opt.inp  →  water_opt.out
methane.inp    →  methane.out
```

**Configuration:**
- `orca.saveOutputToFile` (default: `true`) - Enable/disable automatic output file creation
- Files are created in the same directory as the input file
- Real-time writing during job execution
- Complete stdout and stderr capture

### 2. Syntax Highlighting for Output Files

Open any `.out` file to see color-coded sections:

**Highlighted Elements:**
- 🟦 **Section Headers** - Main calculation sections (SCF, Optimization, Frequencies)
- 🟩 **Energy Values** - Final energies and SCF energies
- ✅ **Success Markers** - HURRAY, convergence messages
- ⚠️ **Warnings** - Caution messages, imaginary frequencies
- ❌ **Errors** - SCF failures, aborting messages

**Configuration:**
- `orca.outputSyntaxHighlighting` (default: `true`) - Enable/disable syntax highlighting
- `orca.maxSyntaxFileSize` (default: `5` MB) - Maximum file size for syntax highlighting

### 3. Structured Navigation

#### Outline View (Sidebar)

Open the Outline view (Ctrl+Shift+O or View → Outline) to see the document structure:

```
📦 ORCA Program Header
📁 Input File
📊 Cartesian Coordinates
⚙️  SCF Iterations
  ✓ SCF Converged
⚙️  Geometry Optimization
  ✓ Optimization Converged
🎵 Vibrational Frequencies
📈 Final Single Point Energy (-76.123456 Eh)
✓ Calculation Successful
⏱️  Timing Information
```

#### Go to Symbol

Press `Ctrl+Shift+O` to quickly jump to any section:
- Type section name (e.g., "frequencies", "energy", "scf")
- Navigate with arrow keys and Enter

#### Breadcrumbs

Enable breadcrumbs (View → Show Breadcrumbs) for quick navigation through sections.

### 4. Opening Output Files

**Method 1: From Input File**
1. Open or select an `.inp` file
2. Right-click in explorer or editor
3. Select "Open ORCA Output File"

**Method 2: Command Palette**
1. Open an `.inp` file
2. Press `Ctrl+Shift+P`
3. Type "ORCA: Open ORCA Output File"

**Method 3: Direct Open**
- Simply open the `.out` file from the file explorer

### 5. Results Dashboard

The Results Dashboard provides a visual, interactive view of calculation results.

#### Opening the Dashboard

**Method 1: From Output File**
1. Open a `.out` file
2. Click the graph icon (📊) in the editor title bar
3. Or right-click and select "Show Results Dashboard"

**Method 2: From Input File**
1. After running an ORCA job
2. The dashboard can auto-open (if configured)
3. Or use Command Palette: "ORCA: Show Results Dashboard"

**Method 3: Context Menu**
- Right-click any `.out` file in explorer
- Select "Show Results Dashboard"

#### Dashboard Features

**Summary Section:**
- ✓ Overall calculation status (Converged/Failed/Incomplete)
- Final energy value in Hartree
- Number of SCF cycles
- Warning count

**Energy Section:**
- Final Single Point Energy (high precision)
- Zero Point Energy (if available)

**SCF Convergence:**
- Total iteration count
- Last 10 iterations table with:
  - Energy progression
  - Delta E (energy change)
  - Max density change
  - RMS density change

**Geometry Optimization:**
- Convergence status
- Step-by-step table with:
  - Energy at each step
  - Gradient values
  - Convergence indicators

**Vibrational Frequencies:**
- Total mode count
- ⚠️ Imaginary frequency warnings
- Complete frequency table with:
  - Mode numbers
  - Frequencies (cm⁻¹)
  - Intensities
  - Imaginary mode indicators

**Diagnostics:**
- All errors with line numbers
- All warnings with line numbers
- Color-coded by severity

**Timing:**
- Total run time (hours, minutes, seconds)

#### Dashboard Actions

**Refresh Button (🔄):**
- Manually refresh dashboard content
- Useful if file changed externally

**Copy JSON Button (📋):**
- Export all parsed results to clipboard
- JSON format for easy integration
- Contains all numerical data

**Auto-Update:**
- Dashboard automatically updates when `.out` file changes
- Live updates during running calculations (if file is being written)

### 6. Configuration Options

Access via File → Preferences → Settings → Extensions → ORCA

| Setting | Default | Description |
|---------|---------|-------------|
| `orca.saveOutputToFile` | `true` | Automatically save ORCA output to .out files |
| `orca.outputSyntaxHighlighting` | `true` | Enable syntax highlighting for .out files |
| `orca.maxSyntaxFileSize` | `5` MB | Maximum file size for syntax highlighting |
| `orca.dashboardAutoOpen` | `false` | Auto-open dashboard after job completion |
| `orca.maxOutputSize` | `50` MB | Maximum output size for real-time display |

### 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F5` | Run ORCA job (when .inp file is open) |
| `Ctrl+Shift+O` | Go to Symbol / Quick navigation |
| `Ctrl+Shift+P` → "ORCA" | Access all ORCA commands |

### 8. Tips and Best Practices

**Performance with Large Files:**
- Files >5 MB won't have syntax highlighting by default
- Dashboard still works for any file size
- Increase `maxSyntaxFileSize` if needed, but may slow editor

**Workspace Organization:**
```
project/
├── calculations/
│   ├── water_opt.inp
│   ├── water_opt.out      ← Auto-created
│   ├── methane_freq.inp
│   └── methane_freq.out   ← Auto-created
```

**Multiple Calculations:**
- Each `.inp` file gets its own `.out` file
- Dashboard can show different `.out` files side by side
- Use "Split Editor" (Ctrl+\\) to compare results

**Debugging Failed Jobs:**
1. Open the `.out` file
2. Use Outline view to jump to error sections
3. Check Diagnostics in dashboard
4. Review warnings before errors

**Exporting Results:**
- Copy JSON from dashboard for data analysis
- Use syntax highlighted `.out` for reporting
- Print `.out` files with color preservation

### 9. Troubleshooting

**Output file not created:**
- Check `orca.saveOutputToFile` is enabled
- Verify ORCA job actually started
- Check disk space and write permissions

**Syntax highlighting not working:**
- File may exceed `maxSyntaxFileSize` limit
- Check file is recognized as `.out` (look at language mode in status bar)
- Try closing and reopening the file

**Dashboard shows "Error":**
- Verify the `.out` file exists and is readable
- Check file isn't locked by another process
- Try refreshing with 🔄 button

**Dashboard not updating:**
- Ensure file watcher is active (close/reopen dashboard)
- Check file is actually being modified
- Try manual refresh

**Navigation not working:**
- Ensure Outline view is enabled (View → Outline)
- Check the `.out` file is recognized (language mode should be "ORCA Output")
- Verify file has recognizable sections

### 10. Examples

#### Example 1: Water Geometry Optimization

```bash
# 1. Create input file
water_opt.inp:
! B3LYP def2-SVP Opt
* xyz 0 1
O  0.0  0.0  0.0
H  0.0  0.0  1.0
H  0.0  1.0  0.0
*

# 2. Run job (F5)
# → water_opt.out created automatically

# 3. View results:
#    - Open water_opt.out (syntax highlighted)
#    - Use Outline to jump to optimization convergence
#    - Open dashboard to see step-by-step progress
```

#### Example 2: Frequency Calculation

```bash
# 1. Create and run freq calculation
# 2. Open dashboard
# 3. Navigate to "Vibrational Frequencies" section
# 4. Check for imaginary frequencies (⚠️ highlighted)
# 5. Copy frequency table JSON for plotting
```

#### Example 3: Debugging SCF Failure

```bash
# 1. Job fails to converge
# 2. Open .out file
# 3. Press Ctrl+Shift+O → type "error"
# 4. Jump to error section
# 5. Open dashboard → check Diagnostics
# 6. Review SCF iterations table for divergence pattern
```

## Support

For issues or feature requests:
- GitHub: https://github.com/ductrung-nguyen/Orca-vscode
- Report bugs with sample `.out` files when possible

## Version

This guide is for VS-ORCA v0.3.0 and later.
