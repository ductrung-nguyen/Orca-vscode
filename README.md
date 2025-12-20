# VS-ORCA (Virtual Studio for ORCA Chemistry)

A comprehensive Visual Studio Code extension that transforms VS Code into a unified development environment for **ORCA computational chemistry** calculations. Streamline your workflow with intelligent input editing, one-click execution, and automated output parsing.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Problem Solved

Computational chemists using ORCA face a **fragmented workflow**:
- **Input Creation**: Text files prone to syntax errors (keyword typos, wrong multiplicity)
- **Execution**: Constant context switching to terminal for manual command execution
- **Analysis**: Massive output files (10k+ lines) requiring manual grep/scrolling to find energies

**VS-ORCA unifies this workflow** by bringing intelligent editing, execution, and automated parsing into VS Code.

---

## ✨ Features

### 📝 Module A: Intelligent Input Editor

| Feature | Description | Status |
|---------|-------------|--------|
| **Syntax Highlighting** | Color-coded ORCA keywords (`!`), blocks (`%`), coordinates, and comments | ✅ |
| **Smart Snippets** | Type `opt` → full optimization block, `freq` → frequency template | ✅ |
| **Auto-completion** | Common functionals (B3LYP, wB97X-D3), basis sets (def2-TZVP), job types | ✅ |

**Example:**
```orca
! B3LYP def2-TZVP Opt TightSCF    # Auto-highlighted
%pal nprocs 8 end                  # Block syntax
* xyz 0 1                          # Coordinates highlighted
  C  0.0  0.0  0.0
* 
```

### 🚀 Module B: Execution Engine

| Feature | Description | Status |
|---------|-------------|--------|
| **One-Click Run** | Press `F5` or click "Run ORCA" to execute the current `.inp` file | ✅ |
| **Path Configuration** | Settings UI to define ORCA binary location | ✅ |
| **Live Output** | Real-time streaming of calculation output to VS Code panel | ✅ |
| **Process Control** | Kill/terminate running jobs from GUI | ✅ |

**Workflow:**
1. Open any `.inp` file
2. Press `F5` (or click the ▶️ icon in the editor toolbar)
3. Output streams live to the **ORCA** output panel
4. Status bar shows real-time progress

### 📊 Module C: Automated Analyst (Phase 2)

| Feature | Description | Status |
|---------|-------------|--------|
| **Convergence Check** | Auto-detect "HURRAY" or "SCF NOT CONVERGED" with toast notifications | ✅ |
| **Energy Extraction** | Display final energy in status bar instantly | ✅ |
| **Optimization Status** | Detect geometry convergence and imaginary frequencies | ✅ |

---

## 🛠️ Installation

### Prerequisites
- **Visual Studio Code** 1.85.0 or higher
- **ORCA** (installed on your system)

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
```bash
code --install-extension vs-orca-0.1.0.vsix
```

---

## ⚙️ Configuration

Open **Settings** (`Ctrl/Cmd + ,`) and search for "ORCA":

| Setting | Description | Default |
|---------|-------------|---------|
| `orca.binaryPath` | Full path to ORCA executable | `/opt/orca/orca` |
| `orca.mpiProcs` | Default number of cores for parallel runs | `4` |
| `orca.autoSaveBeforeRun` | Save file before executing | `true` |
| `orca.clearOutputBeforeRun` | Clear output panel before new job | `true` |
| `orca.maxOutputSize` | Max output size (MB) for live streaming | `50` |

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

| Prefix | Description |
|--------|-------------|
| `sp` | Single point energy calculation |
| `opt` | Geometry optimization |
| `freq` | Frequency calculation |
| `optfreq` | Combined opt + freq |
| `ts` | Transition state optimization |
| `cpcm` | Solvation (CPCM/SMD) |
| `pal` | Parallel configuration block |
| `scf` | SCF convergence parameters |
| `geom` | Geometry optimization settings |
| `tddft` | TD-DFT excited states |

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

| Command | Keybinding | Description |
|---------|------------|-------------|
| **Run ORCA Job** | `F5` | Execute the current `.inp` file |
| **Kill Running ORCA Job** | - | Terminate the active calculation |

**Access via:**
- Command Palette (`Ctrl/Cmd + Shift + P`) → "ORCA: Run Job"
- Right-click editor → "Run ORCA Job"
- Editor toolbar icon (▶️)

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

### ✅ Phase 1: MVP (Current - v0.1.0)
- Syntax highlighting
- Code snippets
- Local execution
- Output streaming
- Basic parsing

### 🔄 Phase 2: Enhanced Parsing (v0.2.0)
- Side panel with optimization trajectory
- Energy vs. cycle plots
- Molecular orbital viewer integration
- Export results to CSV/JSON

### 🚀 Phase 3: Remote Execution (v0.3.0)
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

**Happy Computing! 🧪⚛️**