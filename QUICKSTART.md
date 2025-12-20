# 🚀 VS-ORCA Quick Start Guide

## Installation & First Run

### Step 1: Test the Extension
```bash
# In VS Code, press F5
# Or: Run > Start Debugging
```

### Step 2: Configure ORCA Path
1. Open Settings: `Ctrl/Cmd + ,`
2. Search: `orca.binaryPath`
3. Set to your ORCA location (e.g., `/opt/orca/orca`)

### Step 3: Create Your First Input
1. New file: `test.inp`
2. Type: `opt` + `Tab`
3. Edit the template
4. Press `F5` to run

---

## 🎨 Syntax Highlighting Demo

```orca
# This is a comment - will be grayed out

! B3LYP def2-TZVP Opt TightSCF D3BJ
# Keywords after ! are color-coded

%pal
  nprocs 8
end
# Blocks with % are highlighted differently

* xyz 0 1
  O  0.0  0.0  0.0
  H  0.0  0.0  1.0
* 
# Coordinates have special formatting
```

---

## ⚡ Snippet Cheat Sheet

| Type This | Press Tab | Get This |
|-----------|-----------|----------|
| `sp` | → | Single point calculation |
| `opt` | → | Geometry optimization |
| `freq` | → | Frequency analysis |
| `optfreq` | → | Opt + Freq combined |
| `ts` | → | Transition state search |
| `cpcm` | → | Solvation model |
| `pal` | → | Parallel config block |
| `tddft` | → | Excited states |

---

## 🎮 Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Run ORCA | `F5` | `F5` |
| Command Palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Settings | `Ctrl+,` | `Cmd+,` |
| New File | `Ctrl+N` | `Cmd+N` |
| Save | `Ctrl+S` | `Cmd+S` |

---

## 📊 Status Bar Indicators

| Icon | Meaning |
|------|---------|
| `🧪 ORCA: Ready` | Extension loaded, no job running |
| `⏳ ORCA: Running` | Calculation in progress |
| `✅ ORCA: -76.123456 Eh` | Job complete, energy displayed |
| `❌ ORCA: Failed` | Error occurred |

---

## 🔍 Output Panel Messages

### Success Indicators
```
🎉 Calculation converged successfully!
📊 Final Energy: -76.42371840 Hartree
✨ Geometry optimization converged!
```

### Warnings
```
⚠️ Warning: SCF did not converge
⚠️ Found 2 imaginary frequencies
```

### Errors
```
❌ ORCA job failed with exit code 1
❌ Error starting ORCA: command not found
```

---

## ⚙️ Essential Settings

```json
{
  "orca.binaryPath": "/usr/local/bin/orca",
  "orca.mpiProcs": 8,
  "orca.autoSaveBeforeRun": true,
  "orca.clearOutputBeforeRun": true
}
```

---

## 🆘 Troubleshooting

### "ORCA binary not found"
→ Set `orca.binaryPath` in settings to correct location

### Syntax highlighting not working
→ Ensure file has `.inp` extension

### Snippets not expanding
→ Press `Tab` after typing prefix (not Enter)

### Job won't start
→ Check if file is saved (unsaved files can't execute)

### Output panel empty
→ Check terminal for error messages

---

## 📚 Learn More

- **Full Documentation**: See [README.md](README.md)
- **Test Procedures**: See [TESTING.md](TESTING.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Version History**: See [CHANGELOG.md](CHANGELOG.md)

---

## 🎯 Common Workflows

### Quick Single Point
```orca
! B3LYP def2-SVP
* xyz 0 1
  C 0 0 0
  O 0 0 1.2
* 
```
Press F5 → Get energy in ~seconds

### Full Optimization + Frequency
```orca
! wB97X-D3 def2-TZVP OptFreq
%pal nprocs 4 end
* xyz 0 1
  [your coordinates]
* 
```
Press F5 → Wait for convergence → Check for imaginary frequencies

### Solvated Calculation
```orca
! PBE0 def2-TZVP CPCM
%cpcm smd true
  SMDsolvent "water"
end
* xyz 0 1
  [your coordinates]
* 
```

---

**Happy Computing! 🧪⚛️**

For issues: [GitHub Issues](https://github.com/ductrung-nguyen/Orca-vscode/issues)
