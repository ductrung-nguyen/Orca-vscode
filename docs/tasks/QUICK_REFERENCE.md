# ORCA Installation Capability - Quick Reference

**Feature**: ORCA Installation Capability  
**Status**: Planning Phase - Ready for Implementation  
**Last Updated**: December 20, 2025

---

## 🎯 Quick Stats

- **Total Tasks**: 42
- **Estimated Effort**: 94-113 hours
- **Phases**: 4 (+ post-implementation)
- **Priority P0 Tasks**: 34 (81%)
- **Recommended Team**: 2 developers, 10 weeks

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| [`docs/tasks/orca-installation-capability.md`](./orca-installation-capability.md) | Main task breakdown (42 tasks) |
| [`docs/tasks-details/TASK-*.md`](../tasks-details/) | Detailed specifications |
| [`docs/task-generation-summary.md`](../task-generation-summary.md) | Overview & statistics |
| [`docs/PRD-ORCA-Installation-Capability.md`](../PRD-ORCA-Installation-Capability.md) | Source requirements |

---

## 🚀 Quick Start

### For Developers

```bash
# 1. Read your assigned task
cat docs/tasks-details/TASK-002.md

# 2. Check dependencies
# See "Blocked By" section in task file

# 3. Create branch
git checkout -b feature/task-002-detector

# 4. Implement following the task steps
# Each task has numbered implementation steps

# 5. Run tests
npm test

# 6. Commit using convention
git commit -m "feat: implement ORCA detector module (TASK-002)"

# 7. Create PR with task checklist
# Copy acceptance criteria to PR description
```

### For Project Managers

```bash
# View task hierarchy
cat docs/tasks/orca-installation-capability.md

# Check pipeline status
cat docs/pipeline-status.json

# View summary
cat docs/task-generation-summary.md
```

---

## 📋 Phase Overview

### Phase 1: Foundation (Week 1) - START HERE
```
TASK-001 → TASK-002 → TASK-004 → TASK-005 → TASK-007
         ↘ TASK-003 → TASK-006 ↗
```
**Goal**: Working detection and validation

### Phase 2: Platforms (Week 2)
```
TASK-008 → [TASK-009, TASK-010, TASK-011] → TASK-012
                                           ↘ TASK-013
                                           ↘ TASK-014
                                           ↘ TASK-015
                                           ↘ TASK-016
```
**Goal**: OS-specific installation strategies

### Phase 3: UI (Week 3)
```
TASK-017 → TASK-018 → TASK-019 → [TASK-020..024] → TASK-025
                                                   ↘ TASK-026
                                                   ↘ TASK-027
                                                   ↘ TASK-028
```
**Goal**: Installation wizard webview

### Phase 4: Integration (Week 4)
```
[TASK-029..033] → TASK-034 → [TASK-035, TASK-036] → TASK-037 → TASK-038 → TASK-039
```
**Goal**: Commands, docs, and QA

---

## 🔑 Critical Path (P0 Tasks)

Must complete in order:

1. **TASK-001**: Project structure (1h) - BLOCKS EVERYTHING
2. **TASK-002**: Detector module (4-5h) - BLOCKS detection features
3. **TASK-003**: Validator module (4-5h) - BLOCKS validation features
4. **TASK-007**: runJob integration (2-3h) - ENABLES auto-detection
5. **TASK-008**: Base strategy (2h) - BLOCKS installer strategies
6. **TASK-009-011**: OS strategies (15-18h) - BLOCKS wizard instructions
7. **TASK-017**: Wizard panel (3-4h) - BLOCKS wizard UI
8. **TASK-029**: Setup command (2h) - ENABLES user workflow
9. **TASK-037**: Documentation (3-4h) - REQUIRED for release
10. **TASK-038-039**: Testing & QA (7-9h) - REQUIRED for release

---

## 🏗️ Architecture Overview

```
src/
├── extension.ts                    # Main entry (TASK-007, 029-032)
├── orcaRunner.ts                   # Existing (unchanged)
└── installation/
    ├── types.ts                    # Interfaces (TASK-001)
    ├── detector.ts                 # Detection (TASK-002)
    ├── validator.ts                # Validation (TASK-003)
    ├── strategies/
    │   ├── base.ts                # Interface (TASK-008)
    │   ├── linuxInstaller.ts      # Linux (TASK-009)
    │   ├── macosInstaller.ts      # macOS (TASK-010)
    │   └── windowsInstaller.ts    # Windows (TASK-011)
    └── wizard/
        ├── wizardPanel.ts         # Controller (TASK-017)
        ├── wizard.html            # Template (TASK-018)
        ├── wizard.js              # Client logic (TASK-019)
        └── wizard.css             # Styles (TASK-027)
```

---

## 🧪 Testing Checklist

### Phase 1 Tests
- [ ] Detector finds ORCA in standard locations
- [ ] Validator runs test job successfully
- [ ] Version parser handles ORCA 4.x-6.x
- [ ] runJob shows detection prompt

### Phase 2 Tests
- [ ] Linux instructions correct for Ubuntu/Fedora/Arch
- [ ] macOS instructions work on Intel and Apple Silicon
- [ ] Windows instructions include all prerequisites
- [ ] License acknowledgment enforced

### Phase 3 Tests
- [ ] Wizard opens and navigates between steps
- [ ] State persists across VS Code restarts
- [ ] Copy-to-clipboard works
- [ ] Validation step runs test job

### Phase 4 Tests
- [ ] All commands work from Command Palette
- [ ] Status bar shows active version
- [ ] Health check runs on startup
- [ ] Documentation reflects new feature

---

## ⚠️ Common Pitfalls

1. **Don't skip TASK-001** - Creates required structure
2. **Test on all 3 OSes** - Platform-specific issues
3. **Always clean up test files** - TASK-003 validator
4. **Use extension storage for tests** - Not system temp
5. **Never auto-modify shell configs** - Security risk
6. **Parse version from stderr** - ORCA 4.x-5.x behavior
7. **Set timeouts on all spawns** - Prevent hangs
8. **Validate paths before spawning** - Security
9. **Use shell: false** - Prevent injection
10. **State must be serializable** - JSON only

---

## 📊 Acceptance Criteria Summary

Each task must meet:
- ✅ All specified acceptance criteria checked
- ✅ Code compiles without errors
- ✅ Tests pass (80%+ coverage for P0 tasks)
- ✅ No security vulnerabilities
- ✅ JSDoc comments on public methods
- ✅ Manual testing completed
- ✅ Git commit with proper message

---

## 🔐 Security Requirements

All tasks must ensure:
- No arbitrary code execution
- No shell injection (`shell: false`)
- Path validation before file operations
- Timeouts on all spawned processes
- No automatic shell config modification
- Extension storage for temporary files
- CSP configured for webviews

---

## 📈 Progress Tracking

### Current Status
- Phase 1: 0/7 tasks (0%)
- Phase 2: 0/9 tasks (0%)
- Phase 3: 0/12 tasks (0%)
- Phase 4: 0/11 tasks (0%)
- Post-Impl: 0/3 tasks (0%)

**Overall**: 0/42 tasks (0%)

### Next Milestone
**Phase 1 Complete** when:
- Detection works on 2+ platforms
- Validation runs test job successfully
- runJob command integrated
- All unit tests passing

---

## 🆘 Need Help?

### Task Questions
- Check [`tasks-details/TASK-*.md`](../tasks-details/) for specifications
- Review PRD section references in task files
- Check integration points in task files

### Technical Questions
- Detector/Validator: See TASK-002, TASK-003
- Wizard: See TASK-017 through TASK-028
- Commands: See TASK-029 through TASK-032

### Process Questions
- Dependencies: See main task file dependency graph
- Timeline: See task-generation-summary.md
- Priorities: See task priority field (P0/P1/P2/P3)

---

## 🎉 Definition of Done

Feature is complete when:
- ✅ All P0 tasks completed
- ✅ All P1 tasks completed (or deferred)
- ✅ Integration tests passing
- ✅ Manual testing on Linux, macOS, Windows
- ✅ Documentation updated
- ✅ Code reviewed
- ✅ User acceptance testing passed
- ✅ Performance targets met (<2s detection, <30s validation)
- ✅ Zero critical bugs
- ✅ CHANGELOG.md updated

---

## 📝 Commit Message Convention

```
<type>: <description> (TASK-XXX)

Examples:
feat: implement ORCA detector module (TASK-002)
fix: handle timeout in validator test job (TASK-003)
docs: update README with wizard instructions (TASK-037)
test: add unit tests for version parser (TASK-005)
refactor: extract common installer logic (TASK-008)
style: format wizard CSS (TASK-027)
```

---

## 🔗 Quick Links

- **Main Task File**: [orca-installation-capability.md](./orca-installation-capability.md)
- **Task Details**: [tasks-details/](../tasks-details/)
- **Summary**: [task-generation-summary.md](../task-generation-summary.md)
- **PRD**: [PRD-ORCA-Installation-Capability.md](../PRD-ORCA-Installation-Capability.md)
- **README**: [README.md](./README.md)

---

**Ready to Start?** → Begin with [TASK-001: Project Structure Setup](../tasks-details/TASK-001.md)
