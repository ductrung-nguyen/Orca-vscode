# VS-ORCA v0.3.1 Release Notes

**Release Date**: December 22, 2025  
**Version**: 0.3.1  
**Type**: Minor Feature Release  
**Previous Version**: 0.3.0

---

## 🎉 Executive Summary

**VS-ORCA v0.3.1** enhances the output file experience by adding CodeLens support to `.out` files. This minor release improves feature discoverability by providing a one-click "Open Dashboard" action directly in the editor, making the Results Dashboard more accessible than ever.

### What's Changed?

**Before v0.3.1**: Users had to:

- Use the command palette to open the dashboard
- Click the editor title bar icon
- Use the context menu (right-click)
- **Result**: Dashboard feature not immediately visible when opening `.out` files

**After v0.3.1**: Users get:

- ✅ "Open Dashboard" CodeLens at the top of `.out` files
- ✅ Single-click dashboard access directly in the editor
- ✅ Consistent experience with `.inp` file CodeLens pattern
- ✅ **Result**: Instant dashboard access, no extra navigation needed

---

## ✨ Key Features

### CodeLens for Output Files 🔍

When you open any `.out` file, a CodeLens action appears at the top of the document:

```
$(graph) Open Dashboard    ← Click to open Results Dashboard
─────────────────────────────────────────────────
                      |
                      |  ORCA output content...
                      |
```

**How It Works:**

1. Open any `.out` file in the editor
2. Click the "$(graph) Open Dashboard" CodeLens at line 1
3. Results Dashboard opens in a side panel
4. Analyze your results with visual tables and metrics

**Benefits:**

- 🎯 **Improved Discoverability**: Feature is visible immediately when opening `.out` files
- ⚡ **Reduced Clicks**: One-click access vs. multiple steps with menus
- 🔄 **Consistent UX**: Matches the CodeLens pattern used in `.inp` files
- 📍 **In-Context**: Access dashboard without leaving the editor area

**Technical Details:**

- CodeLens appears at position (0, 0) - top of document
- Uses `$(graph)` codicon for visual consistency
- Invokes existing `vs-orca.showResultsDashboard` command
- Automatically passes the file URI for correct file display

---

## 🆕 New Features

| Feature                       | Description                                           | Status |
| ----------------------------- | ----------------------------------------------------- | ------ |
| **Output File CodeLens**      | "Open Dashboard" action at top of `.out` files        | ✅ New |
| **Dashboard Discoverability** | Feature visible immediately when opening output files | ✅ New |

---

## 🔄 Changes from v0.3.0

### Added

- `OrcaOutputCodeLensProvider` class for `.out` file CodeLens
- CodeLens registration for `orca-output` language
- Unit tests for CodeLens provider functionality

### Unchanged

- All v0.3.0 features remain fully functional
- Results Dashboard functionality unchanged
- Output file syntax highlighting unchanged
- Structured navigation unchanged

---

## 📊 Dashboard Access Methods

With v0.3.1, there are now **four ways** to access the Results Dashboard:

| Method              | Access Point       | Steps        |
| ------------------- | ------------------ | ------------ |
| **CodeLens** ⭐     | Top of `.out` file | 1 click      |
| **Title Bar Icon**  | Editor title bar   | 1 click      |
| **Context Menu**    | Right-click file   | 2 clicks     |
| **Command Palette** | `Ctrl+Shift+P`     | Type + Enter |

**Recommendation**: Use the CodeLens for the fastest access when viewing `.out` files.

---

## 🧪 Testing

### Unit Tests Added

- `OrcaOutputCodeLensProvider` class tests
- CodeLens position verification (line 0)
- CodeLens title and command verification
- File type filtering tests

### Manual Testing Checklist

- [x] CodeLens appears when opening `.out` files
- [x] CodeLens does not appear for other file types
- [x] Clicking CodeLens opens Results Dashboard
- [x] Dashboard displays correct file data
- [x] CodeLens uses correct icon (`$(graph)`)
- [x] Works with large `.out` files

---

## 📥 Installation

### From Previous Version

If you're upgrading from v0.3.0:

1. Update the extension (VS Code will prompt automatically)
2. Open any `.out` file
3. The CodeLens will appear automatically

No configuration changes required.

### Fresh Installation

1. Install VS-ORCA extension
2. Configure ORCA binary path
3. Run a calculation
4. Open the generated `.out` file
5. Click "Open Dashboard" CodeLens

---

## ⚙️ Configuration

No new configuration options in this release. The CodeLens is enabled by default and uses existing settings.

Existing relevant settings:

| Setting                  | Default | Description                              |
| ------------------------ | ------- | ---------------------------------------- |
| `orca.dashboardAutoOpen` | `false` | Auto-open dashboard after job completion |

---

## 🐛 Known Issues

None specific to this release.

---

## 🔮 Future Enhancements

Potential improvements for future releases:

- Multiple CodeLens actions (e.g., "Compare Results", "Export PDF")
- CodeLens preview showing quick result summary
- Conditional CodeLens based on calculation type

---

## 📚 Documentation

- Updated [OUTPUT_FILE_MANAGEMENT_GUIDE.md](OUTPUT_FILE_MANAGEMENT_GUIDE.md) with CodeLens method
- Updated [CHANGELOG.md](../CHANGELOG.md) with v0.3.1 changes
- Updated [README.md](../README.md) with CodeLens feature

---

## 🙏 Acknowledgments

Thank you to the computational chemistry community for feedback on dashboard accessibility.

---

## 📝 Full Changelog

See [CHANGELOG.md](../CHANGELOG.md) for the complete list of changes.
