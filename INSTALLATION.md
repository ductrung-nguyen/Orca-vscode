# ORCA Installation Guide

This guide explains how to install ORCA computational chemistry software and configure it with VS-ORCA extension.

## Quick Start

### Option 1: Use the Installation Wizard (Recommended)

1. Open VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run command: **"ORCA: Setup ORCA Installation Wizard"**
3. Follow the step-by-step wizard

The wizard will:

- Detect existing ORCA installations
- Provide OS-specific installation instructions
- Validate your installation
- Configure VS-ORCA automatically

### Option 2: Automatic Detection

If you already have ORCA installed:

1. Open Command Palette
2. Run: **"ORCA: Detect ORCA Installations"**
3. Select your ORCA installation from the list
4. VS-ORCA will be configured automatically

### Option 3: Manual Configuration

Set the path to your ORCA binary in VS Code settings:

1. Open Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "orca.binaryPath"
3. Enter the full path to your ORCA executable

---

## Installation Methods

### Conda (Recommended for All Platforms)

**Advantages:**

- Automatic dependency management
- Easy installation and updates
- Cross-platform consistency
- No PATH configuration needed

**Steps:**

1. Install Conda/Miniconda if not present:

   - Download from: https://docs.conda.io/en/latest/miniconda.html

2. Install ORCA:

   ```bash
   conda install -c conda-forge orca
   ```

3. Verify installation:
   ```bash
   conda list orca
   which orca  # Unix/macOS
   where orca  # Windows
   ```

---

### Linux

#### Option A: Conda (Recommended)

See Conda section above.

#### Option B: AUR (Arch Linux Only)

```bash
yay -S orca
# or
paru -S orca
```

#### Option C: Manual Installation

1. **Register and Download:**

   - Visit: https://orcaforum.kofo.mpg.de/
   - Register for academic access
   - Download latest Linux x86-64 release

2. **Extract and Install:**

   ```bash
   tar -xvf orca_5_0_4_linux_x86-64_shared_openmpi411.tar.xz
   sudo mv orca_5_0_4_linux_x86-64_shared_openmpi411 /opt/orca
   ```

3. **Set Permissions:**

   ```bash
   chmod +x /opt/orca/orca
   ```

4. **Configure PATH (Optional):**

   ```bash
   # For bash:
   echo "export PATH=/opt/orca:$PATH" >> ~/.bashrc
   source ~/.bashrc

   # For zsh:
   echo "export PATH=/opt/orca:$PATH" >> ~/.zshrc
   source ~/.zshrc
   ```

5. **Install Dependencies:**

   ```bash
   # Ubuntu/Debian:
   sudo apt-get install openmpi-bin libopenmpi-dev

   # Fedora/CentOS:
   sudo dnf install openmpi openmpi-devel

   # Arch:
   sudo pacman -S openmpi
   ```

---

### macOS

#### Option A: Conda (Recommended)

See Conda section above.

#### Option B: Manual Installation

1. **Check System Architecture:**

   ```bash
   uname -m
   # x86_64 = Intel
   # arm64 = Apple Silicon (M1/M2/M3)
   ```

2. **Install Xcode Command Line Tools:**

   ```bash
   xcode-select --install
   ```

3. **Register and Download:**

   - Visit: https://orcaforum.kofo.mpg.de/
   - Download appropriate version for your architecture

4. **Extract and Install:**

   ```bash
   tar -xvf orca_5_0_4_macos_x86-64.tar.xz
   sudo mv orca_5_0_4_macos_x86-64 /usr/local/orca
   chmod +x /usr/local/orca/orca
   ```

5. **Configure PATH (Optional):**

   ```bash
   # For zsh (default on macOS):
   echo "export PATH=/usr/local/orca:$PATH" >> ~/.zshrc
   source ~/.zshrc

   # For bash:
   echo "export PATH=/usr/local/orca:$PATH" >> ~/.bash_profile
   source ~/.bash_profile
   ```

6. **Gatekeeper Workaround:**
   If macOS blocks ORCA:

   ```bash
   xattr -dr com.apple.quarantine /usr/local/orca
   ```

   Or: System Preferences → Security & Privacy → General → "Allow Anyway"

---

### Windows

#### Option A: Conda (Recommended)

See Conda section above.

#### Option B: Manual Installation

1. **Install Visual C++ Redistributable:**

   - Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Run installer

2. **Register and Download:**

   - Visit: https://orcaforum.kofo.mpg.de/
   - Download Windows x64 release

3. **Extract Archive:**

   - Extract ZIP to: `C:\Program Files\ORCA` or `C:\orca`

4. **Configure PATH (Optional):**

   **GUI Method:**

   - Open: System Properties → Advanced → Environment Variables
   - Edit "Path" under System variables
   - Add: `C:\Program Files\ORCA`

   **PowerShell Method (Run as Administrator):**

   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\ORCA", "Machine")
   ```

5. **Verify:**
   ```cmd
   where orca
   ```

#### Option C: WSL2 (Advanced Users)

For better performance and Unix compatibility:

1. **Install WSL2:**

   ```powershell
   wsl --install -d Ubuntu-22.04
   ```

2. **Follow Linux instructions** inside WSL2 terminal

---

## Validation

After installation, validate with VS-ORCA:

1. Open Command Palette
2. Run: **"ORCA: Validate ORCA Installation"**

This performs:

- Binary existence check
- Version detection
- Test job execution
- Dependency checking

---

## License Requirements

⚠️ **Important:** ORCA is free for academic use only.

**You must:**

- Be affiliated with an academic institution
- Register on ORCA forum to download
- Cite ORCA in publications

**Citation:**

```
Neese, F. (2022) Software update: The ORCA program system—Version 5.0.
WIREs Computational Molecular Science, 12: e1606.
```

**Commercial use requires separate licensing.**

---

## Troubleshooting

### "ORCA binary not found"

1. Run: "ORCA: Detect ORCA Installations"
2. If not found, run: "ORCA: Setup ORCA Installation Wizard"

### "Permission denied" (Linux/macOS)

```bash
chmod +x /path/to/orca
```

### "Version could not be parsed"

- Ensure ORCA 4.0+ is installed
- Try running `orca` directly in terminal to verify

### macOS Gatekeeper blocks ORCA

```bash
xattr -dr com.apple.quarantine /path/to/orca
```

### Test job fails

1. Check dependencies: `ORCA: Check ORCA Health`
2. Install OpenMPI if missing
3. Check available disk space

---

## Multiple ORCA Versions

VS-ORCA supports multiple ORCA installations:

1. Install multiple versions in different directories
2. Run: "ORCA: Detect ORCA Installations"
3. Select which version to use

Switch versions anytime via the status bar or detection command.

---

## Getting Help

1. Check VS-ORCA Output panel for detailed errors
2. Run: "ORCA: Check ORCA Health" for diagnostic information
3. Visit ORCA Forum: https://orcaforum.kofo.mpg.de/
4. Report VS-ORCA issues: https://github.com/ductrung-nguyen/Orca-vscode/issues
