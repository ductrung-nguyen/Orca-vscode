# TASK-DEP-003: Create Feature Branch & Backup

**Phase**: Phase 1 - Preparation & Baseline  
**Priority**: P0 (Must Have)  
**Estimated Effort**: 0.5 hours  
**Assigned To**: TBD  
**Status**: Not Started

---

## Overview

Create an isolated feature branch for dependency updates and backup critical files. This ensures safe experimentation and easy rollback if issues arise.

---

## Dependencies

**Blocked By**:

- TASK-DEP-001 (Baseline Measurement)

**Blocks**:

- All implementation tasks (TASK-DEP-004 through TASK-DEP-024)

---

## Objectives

1. Create feature branch from clean main branch
2. Backup package.json and package-lock.json
3. Create rollback documentation
4. Verify branch protection and workflow

---

## Implementation Steps

### 1. Verify Clean Working Directory

```bash
# Ensure no uncommitted changes
git status

# If changes exist, stash or commit them
git stash save "Pre-dependency-update stash"

# Pull latest changes
git checkout main
git pull origin main
```

**Validation**:

- [ ] Working directory is clean
- [ ] On latest main branch
- [ ] No merge conflicts

---

### 2. Create Feature Branch

```bash
# Create and checkout feature branch
git checkout -b feature/dependency-update

# Push branch to remote
git push -u origin feature/dependency-update
```

**Branch Naming Convention**: `feature/dependency-update`

**Validation**:

- [ ] Branch created successfully
- [ ] Pushed to remote
- [ ] Tracking remote branch

---

### 3. Backup Critical Files

Create backup directory with original files:

```bash
# Create backup directory
mkdir -p .backup-dep-update

# Backup package files
cp package.json .backup-dep-update/package.json.backup
cp package-lock.json .backup-dep-update/package-lock.json.backup

# Backup tsconfig if changes planned
cp tsconfig.json .backup-dep-update/tsconfig.json.backup

# If .eslintrc exists, back it up
if [ -f .eslintrc.json ]; then
  cp .eslintrc.json .backup-dep-update/.eslintrc.json.backup
fi

# List backups
ls -la .backup-dep-update/
```

**Files to Backup**:

- [x] package.json
- [x] package-lock.json
- [x] tsconfig.json
- [x] .eslintrc.json (if exists)

**Validation**:

- [ ] All files backed up successfully
- [ ] Backup directory created in git-ignored location
- [ ] File sizes match originals

---

### 4. Create Rollback Documentation

Create `ROLLBACK.md` with rollback procedures:

```markdown
# Dependency Update Rollback Procedures

**Created**: December 21, 2025  
**Branch**: feature/dependency-update

## Quick Rollback (Full Revert)

If dependency updates cause critical issues:

\`\`\`bash

# Option 1: Restore from backup

cp .backup-dep-update/package.json.backup package.json
cp .backup-dep-update/package-lock.json.backup package-lock.json
npm install
npm test

# Option 2: Git revert

git checkout main -- package.json package-lock.json
npm install
npm test
\`\`\`

## Partial Rollback (Single Package)

To revert specific package:

\`\`\`bash

# Example: Revert ESLint to 8.56.0

npm install eslint@8.56.0 --save-dev
npm test
\`\`\`

## Rollback Checklist

- [ ] Verify package.json restored
- [ ] Verify package-lock.json restored
- [ ] Run \`npm install\` to reinstall dependencies
- [ ] Run \`npm test\` to verify tests pass
- [ ] Run \`npm run compile\` to verify build works
- [ ] Document reason for rollback in Git commit

## Known Working Versions

\`\`\`json
{
"typescript": "^5.3.3",
"eslint": "^8.56.0",
"@typescript-eslint/eslint-plugin": "^6.15.0",
"@typescript-eslint/parser": "^6.15.0",
"mocha": "^10.2.0",
"@vscode/test-electron": "^2.3.8",
"@vscode/vsce": "^2.22.0",
"glob": "^10.3.10",
"@types/node": "^20.x",
"@types/mocha": "^10.0.6",
"@types/vscode": "^1.85.0"
}
\`\`\`
```

**Validation**:

- [ ] ROLLBACK.md created
- [ ] Procedures tested (dry run)
- [ ] Known versions documented

---

### 5. Add Backup to .gitignore

Ensure backup directory is not committed:

```bash
# Add to .gitignore if not already present
echo ".backup-dep-update/" >> .gitignore

# Verify
cat .gitignore | grep backup
```

**Validation**:

- [ ] .backup-dep-update/ in .gitignore
- [ ] Backup files not tracked by git

---

### 6. Create Initial Commit

```bash
# Commit baseline and rollback docs
git add .baseline/ ROLLBACK.md .gitignore
git commit -m "chore: prepare for dependency update

- Add baseline measurements from TASK-DEP-001
- Create rollback documentation
- Set up backup procedures
- Baseline build time: 1.86s
- Baseline test time: ~12s
- Current test pass rate: 61.5% (24/39)

Related: TASK-DEP-003"

# Push to remote
git push origin feature/dependency-update
```

**Commit Message Structure**:

- Type: `chore` (maintenance work)
- Scope: Dependency update preparation
- Body: Key baseline metrics
- Footer: Task reference

**Validation**:

- [ ] Commit created successfully
- [ ] Pushed to remote
- [ ] Contains baseline and rollback docs

---

## Acceptance Criteria

- [ ] Feature branch `feature/dependency-update` created
- [ ] Branch pushed to remote and tracking
- [ ] package.json and package-lock.json backed up
- [ ] ROLLBACK.md created with clear procedures
- [ ] .gitignore updated to exclude backups
- [ ] Initial commit includes baseline data
- [ ] Rollback procedures tested (dry run)
- [ ] Team notified of feature branch creation

---

## Rollback Test (Dry Run)

Before proceeding, test rollback procedure:

```bash
# 1. Make a dummy change
echo "# test" >> package.json

# 2. Test rollback from backup
cp .backup-dep-update/package.json.backup package.json

# 3. Verify restoration
git diff package.json  # Should show no changes

# 4. Test git rollback
echo "# test" >> package.json
git checkout HEAD -- package.json

# 5. Verify restoration again
git diff package.json  # Should show no changes
```

**Validation**:

- [ ] Backup restoration works
- [ ] Git checkout restoration works
- [ ] Files restored correctly

---

## Deliverables

1. **Feature Branch**: `feature/dependency-update`
2. **Backup Directory**: `.backup-dep-update/` (git-ignored)
3. **Rollback Documentation**: `ROLLBACK.md`
4. **Initial Commit**: With baseline and rollback docs

---

## Commands Reference

```bash
# Full setup sequence
git status
git checkout main
git pull origin main
git checkout -b feature/dependency-update
git push -u origin feature/dependency-update

mkdir -p .backup-dep-update
cp package.json .backup-dep-update/package.json.backup
cp package-lock.json .backup-dep-update/package-lock.json.backup
cp tsconfig.json .backup-dep-update/tsconfig.json.backup

echo ".backup-dep-update/" >> .gitignore

# Create ROLLBACK.md (use editor)

git add .baseline/ ROLLBACK.md .gitignore
git commit -m "chore: prepare for dependency update"
git push origin feature/dependency-update
```

---

## Validation

- [ ] Branch exists locally and remotely
- [ ] Backups created and verified
- [ ] Rollback documentation clear and accurate
- [ ] .gitignore updated correctly
- [ ] Initial commit pushed successfully
- [ ] Ready to proceed with updates

---

## Notes

- Keep backup directory throughout all update phases
- Update ROLLBACK.md if new rollback scenarios discovered
- Test rollback procedures at each major update phase
- Document any branch-specific configuration

---

## Related Files

- `.backup-dep-update/` - Backup directory
- `ROLLBACK.md` - Rollback procedures
- `.gitignore` - Git ignore patterns
- `.baseline/` - Baseline measurements

---

**Created**: December 21, 2025  
**Last Updated**: December 21, 2025
