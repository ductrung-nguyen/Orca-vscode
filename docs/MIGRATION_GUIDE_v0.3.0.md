# Migration Guide: v0.2.x to v0.3.0

## Overview

VS-ORCA v0.3.0 is **fully backward compatible** with v0.2.x. No breaking changes have been introduced, and all existing workflows continue to function exactly as before.

## What's New in v0.3.0

Version 0.3.0 introduces **Output File Management** features:

- Automatic `.out` file creation for all ORCA executions
- Syntax highlighting for output files
- Structured navigation (Outline, Go to Symbol)
- Interactive results dashboard
- Enhanced output parsing
- JSON export capability

## Do I Need to Migrate?

**No!** If you're happy with your current workflow, you don't need to change anything. All new features are **additive** and **optional**.

## What Happens After Upgrade?

### Automatic Changes (Enabled by Default)

After upgrading to v0.3.0, the following features are **automatically enabled**:

1. **Output File Persistence** (`orca.saveOutputToFile: true`)

   - Every ORCA job will now create a `.out` file automatically
   - Location: Same directory as your `.inp` file
   - Naming: Matches input file basename (e.g., `water.inp` → `water.out`)

2. **Syntax Highlighting** (`orca.outputSyntaxHighlighting: true`)

   - Opening `.out` files shows color-coded sections
   - Performance protection: Files >5 MB skip highlighting by default

3. **Structured Navigation**
   - Outline view automatically shows document structure
   - Go to Symbol (`Ctrl+Shift+O`) works immediately
   - Breadcrumbs enabled for section context

### Features Requiring Activation

The following features require **manual activation**:

1. **Interactive Dashboard**

   - Click the 📊 icon in editor title bar
   - Or: Command Palette → "ORCA: Show Results Dashboard"
   - Or: Right-click `.out` file → "Show Results Dashboard"

2. **Auto-Open Dashboard** (`orca.dashboardAutoOpen: false` by default)
   - Set to `true` if you want dashboard to open automatically after each job

## Configuration Options

### Default Settings (No Action Needed)

```json
{
  "orca.saveOutputToFile": true,
  "orca.outputSyntaxHighlighting": true,
  "orca.maxSyntaxFileSize": 5,
  "orca.dashboardAutoOpen": false
}
```

These settings provide the **optimal experience** for most users. No changes needed!

### Customization Options

#### Disable Automatic Output Files

If you prefer the old behavior (output only in Output Channel):

```json
{
  "orca.saveOutputToFile": false
}
```

**Why you might want this:**

- You manage output files manually
- You have limited disk space
- You prefer using only the Output Channel

**Note**: Dashboard and navigation features require `.out` files to exist.

#### Disable Syntax Highlighting

If you prefer plain text output:

```json
{
  "orca.outputSyntaxHighlighting": false
}
```

**Why you might want this:**

- You find colors distracting
- You have performance concerns
- You prefer using external text editors

#### Adjust File Size Limit

If you work with very large outputs:

```json
{
  "orca.maxSyntaxFileSize": 10 // or higher, in MB
}
```

**Why you might want this:**

- You regularly have outputs >5 MB
- You have a powerful computer
- You want highlighting on all files

**Warning**: Large files may slow down the editor. Start with 10 MB and increase if needed.

#### Enable Auto-Open Dashboard

If you want the dashboard to open automatically:

```json
{
  "orca.dashboardAutoOpen": true
}
```

**Why you might want this:**

- You check results immediately after each job
- You prefer visual analysis over text output
- You want the fastest workflow

**Note**: Dashboard opens in a side panel, doesn't disrupt your editor.

## Workflow Examples

### Example 1: Minimal Changes (Recommended)

**What**: Keep all defaults, use new features only when needed

**Configuration**: None (use defaults)

**Workflow**:

1. Run jobs as before (press F5)
2. Notice `.out` files are created automatically
3. Open `.out` files when needed (with highlighting)
4. Use dashboard occasionally for visual analysis

**Best for**: Users who want new features available but not intrusive

### Example 2: Visual-First Workflow

**What**: Maximize use of new visual features

**Configuration**:

```json
{
  "orca.dashboardAutoOpen": true,
  "orca.maxSyntaxFileSize": 10
}
```

**Workflow**:

1. Run jobs (press F5)
2. Dashboard opens automatically showing results
3. Review visual tables and metrics
4. Export JSON if needed for further analysis

**Best for**: Users who prioritize quick visual analysis

### Example 3: Traditional Workflow

**What**: Preserve v0.2.x behavior exactly

**Configuration**:

```json
{
  "orca.saveOutputToFile": false
}
```

**Workflow**:

1. Run jobs (press F5)
2. View output in Output Channel (as before)
3. Manually copy-paste or save output (as before)

**Best for**: Users who prefer the old workflow or have specific requirements

## Common Questions

### Q: Will my existing `.inp` files still work?

**A**: Yes! No changes to input file handling. All existing files work identically.

### Q: What happens to my old workflow?

**A**: Your old workflow continues to work exactly as before. The Output Channel still shows real-time output, status bar still shows final energy, all commands still work.

### Q: Do I need to learn new commands?

**A**: No! New commands are optional. Your existing keyboard shortcuts (F5 to run) work unchanged.

### Q: Will `.out` files clutter my workspace?

**A**: `.out` files are created alongside `.inp` files, following standard ORCA convention. You can:

- Add `*.out` to `.gitignore` if using version control
- Disable with `orca.saveOutputToFile: false`
- Organize into subdirectories as needed

### Q: Will large output files slow down VS Code?

**A**: No! Syntax highlighting is automatically disabled for files >5 MB. Dashboard parsing is fast (<2 seconds for 10 MB files). FileSystemWatcher has minimal overhead.

### Q: Can I use v0.3.0 features on old output files?

**A**: Yes! Any existing `.out` files can be opened with syntax highlighting. Dashboard works with any ORCA output file.

### Q: What if I don't want the new features?

**A**: Set `orca.saveOutputToFile: false` and continue using v0.3.0 exactly like v0.2.x. All new features are optional.

## Troubleshooting

### Issue: `.out` files not being created

**Solution**:

1. Check setting: `orca.saveOutputToFile` should be `true`
2. Check file permissions: Ensure write access to directory
3. Check disk space: Ensure sufficient space available

### Issue: Syntax highlighting not working

**Solution**:

1. Check setting: `orca.outputSyntaxHighlighting` should be `true`
2. Check file size: File must be <5 MB (or increase `orca.maxSyntaxFileSize`)
3. Reload window: Command Palette → "Developer: Reload Window"

### Issue: Dashboard shows "No data available"

**Solution**:

1. Ensure `.out` file exists
2. Ensure calculation completed (check for "ORCA TERMINATED NORMALLY")
3. Try refreshing dashboard (click 🔄 button)

### Issue: Navigation (Outline) not working

**Solution**:

1. Ensure file is recognized as `.out` type
2. Check bottom-right corner: Should show "ORCA Output" language
3. If showing "Plain Text", manually select "ORCA Output" language

## Rollback (If Needed)

If you encounter issues with v0.3.0, you can rollback to v0.2.1:

1. Open Extensions view (`Ctrl+Shift+X`)
2. Find "VS-ORCA"
3. Click gear icon → "Install Another Version"
4. Select "0.2.1"

**Note**: Rollback is rarely needed. Try adjusting settings first!

## Getting Help

If you encounter issues during migration:

1. Check this guide first
2. Review [OUTPUT_FILE_MANAGEMENT_GUIDE.md](OUTPUT_FILE_MANAGEMENT_GUIDE.md)
3. Check [Known Issues](release-notes-v0.3.0.md#-known-issues--limitations)
4. Open an issue on [GitHub](https://github.com/ductrung-nguyen/Orca-vscode/issues)

## Summary

**Key Takeaway**: v0.3.0 is **completely backward compatible**. Upgrade with confidence!

- ✅ All existing workflows continue unchanged
- ✅ New features are optional and configurable
- ✅ No breaking changes
- ✅ Default settings are optimized for most users
- ✅ Easy to customize or disable new features

**Recommended Action**: Upgrade and keep default settings. Try new features as needed!

---

**Happy Computing! 🧪⚛️**
