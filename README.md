# VS-ORCA (Virtual Studio for ORCA Chemistry)

A comprehensive Visual Studio Code extension that transforms VS Code into a unified development environment for **ORCA computational chemistry** calculations. Streamline your workflow with intelligent input editing, one-click execution, automated output parsing, and interactive results visualization.

[![CI](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/ci.yml)
[![Release](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/release.yml/badge.svg)](https://github.com/ductrung-nguyen/Orca-vscode/actions/workflows/release.yml)
![Version](https://img.shields.io/badge/version-0.3.1-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

[![Buy Me A Beer](https://img.shields.io/badge/Buy%20Me%20A%20Beer-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/ductrungnguyen)

## 🎯 Problem Solved

Computational chemists using ORCA face a **fragmented workflow**:

- **Input Creation**: Text files prone to syntax errors (keyword typos, wrong multiplicity)
- **Execution**: Constant context switching to terminal for manual command execution
- **Analysis**: Massive output files (10k+ lines) requiring manual grep/scrolling to find energies

**VS-ORCA unifies this workflow** by bringing intelligent editing, execution, and automated parsing into VS Code.

![Dashboard](https://raw.githubusercontent.com/ductrung-nguyen/Orca-vscode/main/docs/screenshots/input1-running.gif)

---

## ✨ Features

### 📝 Intelligent Input Editor

| Feature                 | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| **Syntax Highlighting** | Color-coded ORCA keywords (`!`), blocks (`%`), coordinates, and comments |
| **Smart Snippets**      | Type `opt` → full optimization block, `freq` → frequency template        |
| **Auto-completion**     | Common functionals (B3LYP, wB97X-D3), basis sets (def2-TZVP), job types  |

**Example:**

```orca
! B3LYP def2-TZVP Opt TightSCF    # Auto-highlighted
%pal nprocs 8 end                  # Block syntax
* xyz 0 1                          # Coordinates highlighted
  C  0.0  0.0  0.0
*
```

![Input with snippets](https://raw.githubusercontent.com/ductrung-nguyen/Orca-vscode/main/docs/screenshots/input-w-snippets.gif)

### 🚀 Execution Engine

| Feature                | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| **One-Click Run**      | Press `F5` or click "Run ORCA" to execute the current `.inp` file |
| **Path Configuration** | Settings UI to define ORCA binary location                        |
| **Live Output**        | Real-time streaming of calculation output to VS Code panel        |
| **Process Control**    | Kill/terminate running jobs from GUI                              |
| **CodeLens Actions**   | Click "Run ORCA" directly in the editor above your input file     |

**Workflow:**

1. Open any `.inp` file
2. Press `F5` (or click the ▶️ icon in the editor toolbar)
3. Output streams live to the **ORCA** output panel
4. Status bar shows real-time progress

![How to run](https://raw.githubusercontent.com/ductrung-nguyen/Orca-vscode/main/docs/screenshots/input1.png)

### 📊 Output File Management & Analysis

| Feature                   | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| **Auto-Save Outputs**     | Every ORCA job automatically creates a `.out` file                |
| **Syntax Highlighting**   | Color-coded output sections (headers, energies, warnings, errors) |
| **Structured Navigation** | Outline view and Go to Symbol for quick section jumping           |
| **Results Dashboard**     | Interactive webview with parsed results and visual tables         |
| **TOC Navigation**        | Interactive Table of Contents sidebar for quick section jumping   |
| **Enhanced Parsing**      | Extract SCF iterations, geometry steps, frequencies, diagnostics  |
| **Live Updates**          | Dashboard auto-refreshes when output file changes                 |
| **Export Capability**     | Copy parsed results as JSON to clipboard                          |
| **Convergence Detection** | Auto-detect "HURRAY" or "SCF NOT CONVERGED" with notifications    |
| **Energy Extraction**     | Display final energy in status bar instantly                      |
| **Optimization Tracking** | Step-by-step geometry optimization progress                       |
| **Frequency Analysis**    | Detect and highlight imaginary frequencies                        |
| **CodeLens Dashboard**    | One-click "Open Dashboard" action at top of `.out` files          |

![Output](https://raw.githubusercontent.com/ductrung-nguyen/Orca-vscode/main/docs/screenshots/output1-dashboard.gif)

**Other Capabilities:**

- **Automatic Output Persistence**: All calculation output saved to `.out` files
- **Syntax Highlighted Output**: Open `.out` files with color-coded sections
- **Interactive Dashboard**: Visual results with tables, metrics, and diagnostics
- **TOC Sidebar**: Collapsible Table of Contents with one-click navigation to sections
- **Quick Navigation**: Use Outline view or Ctrl+Shift+O to jump to sections
- **CodeLens Actions**: Click "Open Dashboard" at the top of any `.out` file for instant access
- **Smart Diagnostics**: Warnings and errors collected with line numbers
- **Scroll Preservation**: Dashboard context maintained during TOC navigation

---

## 🛠️ Installation

### Prerequisites

- **Visual Studio Code** 1.85.0 or higher
- **ORCA** (computational chemistry software)

### Quick Start

1. **Install the Extension:**
   - Clone repository or install from marketplace
2. **Install ORCA:**

   - **Option 1:** Use the built-in Installation Wizard

     - Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
     - Run: **"ORCA: Setup ORCA Installation Wizard"**
     - Follow guided steps

   - **Option 2:** Automatic Detection

     - Run: **"ORCA: Detect ORCA Installations"**
     - Select from detected installations

   - **Option 3:** Manual Configuration
     - Open Settings and set `orca.binaryPath`
     - Example: `/opt/orca/orca` (Linux/macOS) or `C:\orca\orca.exe` (Windows)

3. **Verify Installation:**
   - Run: **"ORCA: Validate ORCA Installation"**

📖 **Detailed installation instructions:** See [INSTALLATION.md](INSTALLATION.md)

### Install from Source

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ductrung-nguyen/Orca-vscode.git
   cd Orca-vscode
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Compile the extension:**

   ```bash
   npm run compile
   ```

4. **Open in VS Code and press F5** to launch the extension in a new window.

### Install from VSIX (Coming Soon)

You can download the VSIX file from the Release page of this repository, then run the following command:

```bash
code --install-extension vs-orca-0.1.0.vsix
```

---

## ⚙️ Configuration

Open **Settings** (`Ctrl/Cmd + ,`) and search for "ORCA":

| Setting                     | Description                               | Default          |
| --------------------------- | ----------------------------------------- | ---------------- |
| `orca.binaryPath`           | Full path to ORCA executable              | `/opt/orca/orca` |
| `orca.mpiProcs`             | Default number of cores for parallel runs | `4`              |
| `orca.autoSaveBeforeRun`    | Save file before executing                | `true`           |
| `orca.clearOutputBeforeRun` | Clear output panel before new job         | `true`           |
| `orca.maxOutputSize`        | Max output size (MB) for live streaming   | `50`             |

**Example settings.json:**

```json
{
  "orca.binaryPath": "/usr/local/orca/orca",
  "orca.mpiProcs": 8
}
```

---

## 🚀 Usage

### Basic Workflow

1. **Create a new file** with `.inp` extension (e.g., `water.inp`)
2. **Type a snippet:** `opt` + `Tab` to expand to optimization template
3. **Edit your input:**

   ```orca
   ! B3LYP def2-TZVP Opt TightSCF

   * xyz 0 1
     O  0.0  0.0  0.0
     H  0.0  0.0  1.0
     H  0.0  1.0  0.0
   *
   ```

4. **Press F5** to run the calculation
5. **View output** in the **ORCA** panel (auto-opens)
6. **Check status bar** for final energy and convergence status

### Available Snippets

| Prefix    | Description                     |
| --------- | ------------------------------- |
| `sp`      | Single point energy calculation |
| `opt`     | Geometry optimization           |
| `freq`    | Frequency calculation           |
| `optfreq` | Combined opt + freq             |
| `ts`      | Transition state optimization   |
| `cpcm`    | Solvation (CPCM/SMD)            |
| `pal`     | Parallel configuration block    |
| `scf`     | SCF convergence parameters      |
| `geom`    | Geometry optimization settings  |
| `tddft`   | TD-DFT excited states           |

**Tip:** Type the prefix and press `Tab` to expand.

---

## 🎨 Syntax Highlighting

The extension recognizes:

- **Keywords** (starting with `!`): `B3LYP`, `def2-TZVP`, `Opt`, etc.
- **Blocks** (starting with `%`): `%pal`, `%scf`, `%geom`, etc.
- **Coordinates**: Element symbols and numeric values
- **Comments**: Lines starting with `#`

**Color Scheme Example:**

- 🟢 Functionals: `B3LYP`, `wB97X-D3`
- 🔵 Basis sets: `def2-TZVP`, `cc-pVTZ`
- 🟡 Job types: `Opt`, `Freq`, `OptTS`
- 🟣 Blocks: `%pal`, `%scf`

---

## 📋 Commands

All commands are available via Command Palette (`Ctrl/Cmd + Shift + P`):

### Execution Commands

| Command                   | Keybinding | Description                      |
| ------------------------- | ---------- | -------------------------------- |
| **Run ORCA Job**          | `F5`       | Execute the current `.inp` file  |
| **Kill Running ORCA Job** | -          | Terminate the active calculation |

### Installation & Configuration Commands

| Command                            | Description                            |
| ---------------------------------- | -------------------------------------- |
| **Setup ORCA Installation Wizard** | Guided installation wizard for ORCA    |
| **Detect ORCA Installations**      | Automatically find ORCA on your system |
| **Validate ORCA Installation**     | Run comprehensive validation tests     |
| **Check ORCA Health**              | Quick health check of configured ORCA  |

**Access via:**

- Command Palette (`Ctrl/Cmd + Shift + P`) → "ORCA: ..."
- Open input file, and click "▶️ Run ORCA" at the top of the file
- Editor toolbar icon (▶️) for Run
- Status bar (click to detect installations)

---

## 🔍 Output Parsing

After job completion, VS-ORCA automatically extracts:

- ✅ **Convergence status** ("HURRAY" or "SCF NOT CONVERGED")
- 📊 **Final energy** (displayed in status bar)
- ✨ **Geometry optimization convergence**
- 🎵 **Frequency calculation results**
- ⚠️ **Imaginary frequencies** (for transition states)

**Example Output:**

```
═══════════════════════════════════════════════════════
✅ ORCA job completed successfully
🎉 Calculation converged successfully!
📊 Final Energy: -76.42371840 Hartree
✨ Geometry optimization converged!
🎵 Frequency calculation completed
═══════════════════════════════════════════════════════
```

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (v0.1.0)

- Syntax highlighting
- Code snippets
- Local execution
- Output streaming
- Basic parsing

### ✅ Phase 2: Installation Capability (v0.2.0)

- Interactive installation wizard
- Automatic ORCA detection
- Validation and health checks
- OS-specific installation strategies
- Multi-version support

### ✅ Phase 3: Output File Management (Current - v0.3.0)

- Automatic output file persistence
- Syntax highlighting for output files
- Structured navigation (Outline, Go to Symbol)
- Interactive results dashboard
- Enhanced parsing (SCF, geometry, frequencies)
- JSON export capability

### 🔄 Phase 4: Real-time Visualization (v0.4.0)

- Live streaming visualization during execution
- Energy vs. cycle plots
- Convergence graphs
- Molecular orbital viewer integration

### 🚀 Phase 5: Remote Execution (v0.5.0)

- SSH integration for cluster submission
- SLURM/PBS job management
- Queue monitoring
- Auto-download results

---

## 🐛 Known Issues

- Large output files (>50 MB) may slow down real-time streaming
- Windows paths with spaces require proper escaping in `orca.binaryPath`
- Syntax highlighting doesn't cover all obscure ORCA keywords (contributions welcome!)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **ORCA** by Frank Neese and colleagues at the Max Planck Institute
- Inspired by the computational chemistry community's need for better tooling
- Built with TypeScript and the VS Code Extension API

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ductrung-nguyen/Orca-vscode/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ductrung-nguyen/Orca-vscode/discussions)

---

## 💖 Support the Project

If you find this extension helpful, consider buying me a beer! Your support helps maintain and improve VS-ORCA.

[![Buy Me A Beer](https://img.shields.io/badge/Buy%20Me%20A%20Beer-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/ductrungnguyen)

---

**Happy Computing! 🧪⚛️**
