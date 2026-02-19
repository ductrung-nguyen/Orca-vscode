# Git Repository Initialization - Testing Guide

This document provides manual testing procedures for the git-repo-init skill and prompt.

## Test Cases

### Test Case 1: Empty Directory, Full Setup

**Scenario:** New project with no existing git repository.

**Setup:**
```bash
mkdir /tmp/test-git-init-empty
cd /tmp/test-git-init-empty
```

**Execute:**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Git repository initialized with `main` branch
- [x] `.github/workflows/ci.yml` created
- [x] `.github/workflows/release.yml` created
- [x] `.releaserc.json` created
- [x] `commitlint.config.js` created
- [x] Commit-msg hook installed (fallback shell script)

**Verification:**
```bash
# Check git is initialized
git status

# Check workflows exist
ls .github/workflows/

# Check configs exist
ls .releaserc.json commitlint.config.js

# Check hook is installed
ls -la .git/hooks/commit-msg

# Test hook works (should fail)
echo "bad commit" > .git/COMMIT_EDITMSG
.git/hooks/commit-msg .git/COMMIT_EDITMSG  # Should fail

# Test hook works (should pass)
echo "feat: add initial feature" > .git/COMMIT_EDITMSG
.git/hooks/commit-msg .git/COMMIT_EDITMSG  # Should pass
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-empty
```

---

### Test Case 2: Existing Git Repo, Add CI Only

**Scenario:** Project already has git initialized but no CI.

**Setup:**
```bash
mkdir /tmp/test-git-init-existing
cd /tmp/test-git-init-existing
git init
git branch -M main
echo "# Test" > README.md
git add .
git commit -m "feat: initial commit"
```

**Execute:**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Reports "Git already initialized"
- [x] Does NOT re-run `git init`
- [x] CI workflow created
- [x] Other configs created

**Verification:**
```bash
git log --oneline  # Should still have only 1 commit
ls .github/workflows/ci.yml
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-existing
```

---

### Test Case 3: Existing Workflows, Should Skip

**Scenario:** Project already has CI workflow configured.

**Setup:**
```bash
mkdir -p /tmp/test-git-init-skip/.github/workflows
cd /tmp/test-git-init-skip
git init
git branch -M main
echo "name: CI" > .github/workflows/ci.yml
echo "name: Release" > .github/workflows/release.yml
echo '{}' > .releaserc.json
```

**Execute:**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Reports "CI workflow already exists"
- [x] Reports "Semantic release already configured"
- [x] Does NOT overwrite existing files
- [x] Summary shows items as "skipped"

**Verification:**
```bash
# Check files were NOT modified
cat .github/workflows/ci.yml  # Should still be "name: CI" only
cat .releaserc.json           # Should still be "{}"
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-skip
```

---

### Test Case 4: Non-GitHub Remote

**Scenario:** Repository has a remote pointing to GitLab or other host.

**Setup:**
```bash
mkdir /tmp/test-git-init-gitlab
cd /tmp/test-git-init-gitlab
git init
git branch -M main
git remote add origin git@gitlab.com:user/repo.git
```

**Execute:**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Detects non-GitHub remote
- [x] Reports "Remote points to non-GitHub host"
- [x] Skips GitHub Actions setup
- [x] Skips semantic-release setup
- [x] Still offers git hooks setup

**Verification:**
```bash
ls .github/workflows/  # Should be empty or not exist
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-gitlab
```

---

### Test Case 5: Re-run After Setup (Idempotency)

**Scenario:** Run git-repo-init twice on the same repository.

**Setup:**
```bash
mkdir /tmp/test-git-init-idempotent
cd /tmp/test-git-init-idempotent
git init
git branch -M main
```

**Execute (First Run):**
```
/git-repo-init AUTO_ANSWER=true
```

**Capture State:**
```bash
# Record file contents/checksums
md5 .github/workflows/ci.yml > /tmp/first-run.md5
md5 .releaserc.json >> /tmp/first-run.md5
```

**Execute (Second Run):**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Summary shows "No changes needed" or all items skipped
- [x] No files were modified
- [x] No duplicate hooks installed

**Verification:**
```bash
# Compare checksums
md5 .github/workflows/ci.yml > /tmp/second-run.md5
md5 .releaserc.json >> /tmp/second-run.md5
diff /tmp/first-run.md5 /tmp/second-run.md5  # Should be identical

# Check hooks weren't duplicated
cat .git/hooks/commit-msg | grep -c "Commit Message Hook"  # Should be 1
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-idempotent
rm /tmp/first-run.md5 /tmp/second-run.md5
```

---

### Test Case 6: Node Project with package.json

**Scenario:** JavaScript/TypeScript project with package.json.

**Setup:**
```bash
mkdir /tmp/test-git-init-node
cd /tmp/test-git-init-node
git init
git branch -M main
echo '{ "name": "test-project", "version": "1.0.0" }' > package.json
npm init -y
```

**Execute:**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Detects package.json
- [x] Offers Husky setup (or uses it if already installed)
- [x] Creates commitlint.config.js
- [x] Documents npm install commands needed

**Verification:**
```bash
ls commitlint.config.js  # Should exist
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-node
```

---

### Test Case 7: Non-Node Project (Go, Python, etc.)

**Scenario:** Project without package.json.

**Setup:**
```bash
mkdir /tmp/test-git-init-go
cd /tmp/test-git-init-go
git init
git branch -M main
echo "module example.com/test" > go.mod
echo 'package main' > main.go
```

**Execute:**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Detects no package.json
- [x] Uses fallback shell hook for commit validation
- [x] Hook script is executable
- [x] Hook validates conventional commit format

**Verification:**
```bash
# Check hook is installed and executable
ls -la .git/hooks/commit-msg  # Should have +x

# Test hook validation
echo "bad message" > /tmp/test-msg
.git/hooks/commit-msg /tmp/test-msg  # Should exit 1

echo "feat: add feature" > /tmp/test-msg
.git/hooks/commit-msg /tmp/test-msg  # Should exit 0
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-go
rm /tmp/test-msg
```

---

### Test Case 8: Nested Repository Detection

**Scenario:** Trying to init inside a subdirectory of another git repo.

**Setup:**
```bash
mkdir -p /tmp/test-git-init-outer
cd /tmp/test-git-init-outer
git init
mkdir inner
cd inner
```

**Execute:**
```
/git-repo-init AUTO_ANSWER=true
```

**Expected Results:**
- [x] Detects we're inside another git repo
- [x] Reports error: "Cannot initialize nested repository"
- [x] Shows outer repo path
- [x] Does NOT run git init

**Verification:**
```bash
ls -la .git  # Should NOT exist in /tmp/test-git-init-outer/inner/
```

**Cleanup:**
```bash
rm -rf /tmp/test-git-init-outer
```

---

## Integration Test: Full Pipeline

**Scenario:** Run complete pipeline with MODE=full to verify git-repo-init integrates correctly.

**Setup:**
```bash
mkdir /tmp/test-full-pipeline
cd /tmp/test-full-pipeline
```

**Execute:**
```
/orchestrator INPUT="Create a simple CLI tool" MODE=full AUTO_ANSWER=true
```

**Expected Behavior:**
1. Stage 0 (Init Specs) runs
2. **Stage 0.1 (git-repo-init) runs** ← This is what we're testing
3. Stage 0.5 (Create Branch) runs
4. Remaining stages proceed normally

**Verify:**
- Git is initialized before feature branch creation
- CI workflow exists
- Commit validation is active

---

## Edge Cases to Test Manually

1. **Git not installed:** Should show clear error message
2. **No write permissions:** Should fail gracefully
3. **Interrupted setup:** Re-run should resume cleanly
4. **Very long repo names:** Should handle path limits
5. **Special characters in paths:** Should escape properly
6. **Existing Husky setup:** Should integrate with existing hooks
7. **Existing Lefthook setup:** Should configure via lefthook.yml

---

## Regression Checklist

After any changes to git-repo-init, verify:

- [ ] Empty directory setup works
- [ ] Existing git repo detection works
- [ ] Idempotency (no changes on re-run)
- [ ] Non-GitHub remotes handled correctly
- [ ] Shell hook fallback works for non-Node projects
- [ ] Templates are valid YAML/JSON
- [ ] Orchestrator integration works in MODE=full
