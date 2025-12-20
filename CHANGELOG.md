# VS-ORCA Extension Changelog

All notable changes to the "VS-ORCA" extension will be documented in this file.

## [0.1.0] - 2025-12-20

### Added - Phase 1 MVP
- **Syntax Highlighting**: Complete TextMate grammar for ORCA input files
  - Keywords (! prefix): functionals, basis sets, job types
  - Blocks (% prefix): %pal, %scf, %geom, etc.
  - Coordinates: xyz, int, gzmt formats with element symbols
  - Comments (#) support
- **Code Snippets**: 15+ production-ready templates
  - Basic jobs: sp, opt, freq, optfreq
  - Advanced: ts, cpcm, tddft, casscf, neb
  - Configuration blocks: pal, scf, geom, basis
- **Execution Engine**: Local ORCA job runner
  - F5 keybinding to run current .inp file
  - Configurable binary path via settings
  - Auto-save before run (configurable)
  - Process management (kill running jobs)
- **Output Streaming**: Real-time output display
  - Dedicated ORCA output channel
  - Live stdout/stderr capture
  - File watching for large output files
- **Result Parsing**: Automated data extraction
  - Convergence detection ("HURRAY" / "SCF NOT CONVERGED")
  - Final energy extraction and status bar display
  - Geometry optimization status
  - Frequency calculation detection
  - Imaginary frequency warnings
- **UI Integration**:
  - Status bar item showing job state
  - Editor toolbar play button
  - Command palette commands
  - Context menu integration

### Configuration Options
- `orca.binaryPath`: Path to ORCA executable
- `orca.mpiProcs`: Default MPI process count
- `orca.autoSaveBeforeRun`: Auto-save before execution
- `orca.clearOutputBeforeRun`: Clear output panel on new job
- `orca.maxOutputSize`: Max output file size (MB)

### Known Issues
- Large output files (>50 MB) may cause performance degradation
- Windows paths with spaces require manual escaping
- Limited keyword coverage in syntax highlighting

## [Unreleased] - Future Phases

### Phase 2: Enhanced Analysis (Planned)
- Side panel with optimization trajectory
- Energy vs. cycle plotting
- Molecular orbital visualization hooks
- CSV/JSON export of results

### Phase 3: Remote Execution (Planned)
- SSH connection management
- SLURM/PBS job submission
- Queue monitoring
- Automatic result retrieval
