# VS-ORCA Implementation Plan

## Current Status (Phase 2 - ✅ Complete)

### Delivered Features (Phase 1 + Phase 2)
- ✅ **Language Support**: TextMate grammar, 15 snippets, folding, auto-closing pairs
- ✅ **Execution Engine**: Local job execution, real-time output streaming, process management
- ✅ **Output Parsing**: Convergence detection, energy extraction, optimization status
- ✅ **UI Integration**: Commands, keybindings, status bar, output channel
- ✅ **Output Size Management**: Graceful handling of large files (>50MB) with tail parsing
- ✅ **Error Recovery System**: Smart suggestions for SCF failures, memory errors, optimization failures
- ✅ **Testing Infrastructure**: 23 comprehensive tests with fixtures, pure parsing functions

### Phase 2 Achievements
1. **Robustness**: Extension handles 100MB+ output files without freezing
2. **Test Coverage**: 80%+ coverage of parsing logic with 23 test cases
3. **Error Recovery**: Intelligent suggestions for 3 common failure modes
4. **Code Quality**: Zero compilation errors, zero lint warnings
5. **Maintainability**: Pure functions extracted for easier testing

### Known Limitations
1. **Single Job Constraint**: Can only run one ORCA job at a time (Phase 3 feature)
2. **No Visualization**: Results must be viewed as text (Phase 3 feature)
3. **Local Only**: No remote/HPC execution support (Phase 4 feature)

---

## Phase 2: Robustness & Scale (Priority 1)

### 2.1 Output Size Management
**Problem**: Large ORCA outputs (geometry optimizations with 100+ steps) can freeze VS Code.

**Implementation**:
```typescript
// src/orcaRunner.ts - Add to parseResults()
private checkOutputSize(filePath: string): boolean {
    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);
    const maxSize = this.config.get<number>('maxOutputSize', 50);
    
    if (sizeMB > maxSize) {
        this.outputChannel.appendLine(`⚠️  Output file is ${sizeMB.toFixed(1)}MB (limit: ${maxSize}MB)`);
        this.outputChannel.appendLine('   Parsing final results only. Open .out file for full output.');
        return false; // Skip real-time streaming
    }
    return true;
}
```

**Changes Required**:
- Modify `watchOutputFile()` to check size before streaming
- Add tail-like behavior: only read last N lines for large files
- Update status bar with file size warning

**Testing**: Create synthetic 100MB output file and verify graceful degradation.

**Effort**: 2-3 hours

---

### 2.2 Enhanced Error Recovery
**Problem**: SCF non-convergence, memory errors, and timeout issues require restart.

**Implementation Strategy**:

#### A) Smart Recommendations
```typescript
private suggestRecovery(outputContent: string): void {
    if (content.includes('SCF NOT CONVERGED')) {
        const suggestions = [
            '• Try SlowConv or VerySlowConv',
            '• Increase SCF iterations: %scf MaxIter 250 end',
            '• Use initial Hessian guess for difficult cases'
        ];
        vscode.window.showWarningMessage(
            'SCF did not converge',
            'Show Suggestions',
            'Ignore'
        ).then(response => {
            if (response === 'Show Suggestions') {
                this.outputChannel.appendLine('\n💡 Recovery Suggestions:');
                suggestions.forEach(s => this.outputChannel.appendLine(s));
            }
        });
    }
    
    if (content.includes('Not enough memory')) {
        // Suggest maxcore reduction or fewer processors
    }
}
```

#### B) Automatic Retry Logic (Optional)
- Detect common failure patterns
- Prompt user: "Job failed. Retry with SlowConv?"
- Auto-modify input file with recovery keywords

**Changes Required**:
- New `suggestRecovery()` method in `orcaRunner.ts`
- Pattern library for common ORCA errors
- UI for recovery suggestions (info messages + output panel)

**Testing**: 
- Force SCF failure with difficult geometry
- Test memory overflow scenario
- Verify suggestion quality

**Effort**: 4-6 hours

---

### 2.3 Automated Testing Suite
**Problem**: Manual testing is time-consuming and error-prone.

**Implementation**:

#### Test Structure
```
src/
  test/
    suite/
      extension.test.ts     # Command registration, activation
      orcaRunner.test.ts    # Execution engine, parsing
      parser.test.ts        # Output pattern matching
    fixtures/
      water_opt.out         # Sample ORCA outputs
      failed_scf.out        # Error scenarios
      large_output.out      # Performance testing
```

#### Example Test Cases
```typescript
// src/test/suite/parser.test.ts
import * as assert from 'assert';
import { OrcaRunner } from '../../orcaRunner';

suite('Output Parser Test Suite', () => {
    test('Extract final energy from output', () => {
        const mockOutput = `
            FINAL SINGLE POINT ENERGY      -76.12345678
        `;
        const energy = extractEnergy(mockOutput);
        assert.strictEqual(energy, -76.12345678);
    });

    test('Detect convergence success', () => {
        const mockOutput = 'HURRAY\n*** THE OPTIMIZATION HAS CONVERGED ***';
        assert.strictEqual(isConverged(mockOutput), true);
    });

    test('Detect imaginary frequencies', () => {
        const mockOutput = '***imaginary mode***\n***imaginary mode***';
        const count = countImaginaryFreqs(mockOutput);
        assert.strictEqual(count, 2);
    });
});
```

#### Setup Commands
```bash
# Add to package.json scripts
"test": "node ./out/test/runTest.js",
"test:unit": "npm run compile && mocha out/test/suite/*.test.js"
```

**Changes Required**:
- Extract parsing logic to pure functions (easier to test)
- Create `src/test/` structure with VS Code test runner
- Add fixture files with known outputs
- Set up CI/CD with GitHub Actions

**Testing Strategy**:
- Unit tests for parsers (pure functions)
- Integration tests for command execution (mocked ORCA binary)
- UI tests for status bar, output channel updates

**Effort**: 8-12 hours (initial setup + 20+ test cases)

---

## Phase 3: Advanced Features (Priority 2)

### 3.1 Multi-Job Queue System
**Problem**: Users with multiple molecules want to run calculations sequentially.

**Architecture**:
```typescript
class JobQueue {
    private queue: Array<{ filePath: string; priority: number }> = [];
    private currentJob: ChildProcess | null = null;
    
    enqueue(filePath: string, priority: number = 0): void {
        this.queue.push({ filePath, priority });
        this.queue.sort((a, b) => b.priority - a.priority);
        this.processNext();
    }
    
    private processNext(): void {
        if (this.currentJob || this.queue.length === 0) return;
        const next = this.queue.shift()!;
        this.runJob(next.filePath);
    }
}
```

**UI Enhancements**:
- Tree view showing queued jobs
- Right-click menu: "Add to queue", "Run with priority"
- Status bar shows: "Running 2/5 jobs"

**Effort**: 12-16 hours

---

### 3.2 Result Visualization
**Problem**: Users need to visualize geometries and molecular orbitals.

**Options**:
1. **Webview Panel**: Embed 3Dmol.js or NGL Viewer
   - Parse `.xyz` coordinates from output
   - Interactive rotation, atom labeling
   - Display molecular orbitals (if available)

2. **External Tool Integration**: 
   - Launch Avogadro/VMD with output file
   - Configuration: `orca.visualizer.path`

**Implementation (Webview)**:
```typescript
const panel = vscode.window.createWebviewPanel(
    'orcaVisualization',
    'ORCA Structure Viewer',
    vscode.ViewColumn.Two,
    { enableScripts: true }
);

panel.webview.html = getWebviewContent(coordinates);
```

**Effort**: 16-24 hours (webview) or 4-6 hours (external tool)

---

### 3.3 Remote Execution Support
**Problem**: HPC users need to run ORCA on clusters via SSH.

**Implementation**:
- SSH connection settings: host, username, key path
- Upload `.inp` file via SFTP
- Execute via `ssh user@host "cd /scratch && /path/to/orca input.inp"`
- Stream output back via SSH tunnel
- Download result files on completion

**Configuration**:
```json
"orca.remote.enabled": true,
"orca.remote.host": "cluster.university.edu",
"orca.remote.orcaPath": "/opt/orca_5.0.3/orca",
"orca.remote.scratchDir": "/scratch/$USER"
```

**Dependencies**: `ssh2` npm package

**Effort**: 20-30 hours

---

## Phase 4: Polish & Distribution (Priority 3)

### 4.1 IntelliSense Provider
**Goal**: Context-aware auto-completion beyond snippets.

**Features**:
- Suggest basis sets based on method (e.g., RIJCOSX requires auxiliary basis)
- Validate block keywords (`%pal nprocs` vs `%pal nproc`)
- Show documentation on hover (e.g., hover over B3LYP → "Becke 3-parameter hybrid functional")

**Implementation**:
```typescript
vscode.languages.registerCompletionItemProvider('orca', {
    provideCompletionItems(document, position) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        if (linePrefix.startsWith('%')) {
            return blockCompletions; // %pal, %scf, %geom, etc.
        }
        return methodCompletions; // B3LYP, PBE0, etc.
    }
});
```

**Effort**: 10-15 hours

---

### 4.2 Marketplace Publication
**Steps**:
1. Create publisher account on Visual Studio Marketplace
2. Add high-quality icon and screenshots
3. Write comprehensive README with GIFs/videos
4. Set up GitHub Actions for automated publishing
5. Add badges: version, downloads, rating

**Checklist**:
- [ ] Icon optimized (128x128, PNG)
- [ ] README with demo GIF
- [ ] CHANGELOG.md updated
- [ ] License verified (MIT)
- [ ] Keywords optimized for search
- [ ] Screenshots of features

**Commands**:
```bash
vsce package              # Create .vsix
vsce publish              # Upload to marketplace
vsce publish patch        # Auto-increment version
```

**Effort**: 6-8 hours

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority | Target |
|---------|--------|--------|----------|--------|
| Output Size Limit | High | Low | **P0** | Week 1 |
| Automated Testing | High | High | **P0** | Week 1-2 |
| Error Recovery | Medium | Medium | **P1** | Week 2 |
| Multi-Job Queue | Medium | High | **P2** | Week 3-4 |
| Result Visualization | Low | High | **P3** | Future |
| Remote Execution | Low | Very High | **P3** | Future |
| IntelliSense | Medium | Medium | **P2** | Week 4 |
| Marketplace Publish | High | Low | **P1** | Week 3 |

---

## Next Immediate Actions

### Sprint 1 (Week 1) - ✅ COMPLETED
1. ✅ Create `.github/copilot-instructions.md`
2. ✅ Implement output size checking (2-3h)
3. ✅ Set up testing framework (4-6h)
4. ✅ Write 10 core parser tests (4h) - Actually wrote 23 tests!

### Sprint 2 (Week 2) - ✅ COMPLETED
1. ✅ Add error recovery suggestions (4-6h)
2. ✅ Complete test coverage to 80% (6-8h)
3. ✅ Fix any bugs discovered during testing

### Sprint 3 (Week 3)
1. ⬜ Prepare marketplace assets (icon, README, screenshots)
2. ⬜ Set up CI/CD pipeline
3. ⬜ Publish version 0.2.0 to marketplace

### Sprint 4 (Week 4)
1. ⬜ Implement IntelliSense provider
2. ⬜ Start multi-job queue prototype
3. ⬜ Gather user feedback from marketplace

---

## Decision Points

### Should We Implement?
- **YES**: Output size limit, error recovery, testing suite, marketplace publication
- **MAYBE**: Multi-job queue (depends on user demand), IntelliSense (nice-to-have)
- **NO (for now)**: Remote execution (too complex), visualization (external tools exist)

### Technical Debt to Address
1. Extract parsing logic from `orcaRunner.ts` to separate `parser.ts` module
2. Add TypeScript interfaces for parsed results (`OrcaResult`, `EnergyData`)
3. Replace string-based status with enum (`JobStatus.Running`, etc.)
4. Add logging framework instead of direct `console.log()`

---

## Success Metrics

### Phase 2 Goals
- ✅ No crashes with outputs >100MB
- ✅ Test coverage >80%
- ✅ Error recovery suggestions for top 5 failure modes (implemented 3 most critical)

### Phase 3 Goals
- 🎯 1000+ installs on marketplace within 3 months
- 🎯 4+ star rating average
- 🎯 <5 open bugs at any time

### Long-term Vision
- **Community Standard**: Become the default VS Code extension for ORCA users
- **Feature Parity**: Match functionality of commercial tools (GaussView, ChemCraft)
- **Extensibility**: Plugin system for custom parsers and visualizations
