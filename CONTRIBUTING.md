# Contributing to VS-ORCA

Thank you for your interest in contributing to VS-ORCA! This document provides guidelines for contributing to the project.

## Development Setup

1. **Prerequisites**:
   - Node.js (v20 or higher)
   - VS Code (v1.85.0 or higher)
   - Git

2. **Clone and Install**:
   ```bash
   git clone https://github.com/ductrung-nguyen/Orca-vscode.git
   cd Orca-vscode
   npm install
   ```

3. **Build**:
   ```bash
   npm run compile
   ```

4. **Run Extension**:
   - Press `F5` in VS Code to launch Extension Development Host
   - Open a `.inp` file to test syntax highlighting
   - Configure `orca.binaryPath` to test execution

## Project Structure

```
Orca-vscode/
├── src/
│   ├── extension.ts        # Main extension entry point
│   └── orcaRunner.ts       # ORCA execution and parsing logic
├── syntaxes/
│   └── orca.tmLanguage.json # TextMate grammar for highlighting
├── snippets/
│   └── orca.json           # Code snippet definitions
├── examples/               # Sample ORCA input files
├── package.json            # Extension manifest
└── tsconfig.json           # TypeScript configuration
```

## How to Contribute

### Reporting Bugs

Create an issue on GitHub with:
- VS Code version
- Extension version
- Operating system
- Steps to reproduce
- Expected vs. actual behavior
- Error logs (if any)

### Suggesting Features

Open an issue with:
- Clear description of the feature
- Use case / problem it solves
- Example usage
- Priority (P0/P1/P2) if applicable

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**:
   - Follow existing code style
   - Add comments for complex logic
   - Update README if adding user-facing features

4. **Test thoroughly**:
   - Test syntax highlighting with various input files
   - Test execution with different ORCA versions
   - Ensure no regressions in existing features

5. **Commit with clear messages**:
   ```bash
   git commit -m "Add feature: <description>"
   ```

6. **Push and create Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Guidelines

### TypeScript Style
- Use `const` and `let`, avoid `var`
- Prefer explicit types over `any`
- Use async/await over callbacks
- Add JSDoc comments for public APIs

### Naming Conventions
- Classes: `PascalCase`
- Functions/Methods: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Private members: prefix with `_` or use `private`

### Error Handling
- Always handle errors gracefully
- Show user-friendly error messages via `vscode.window.showErrorMessage`
- Log detailed errors to output channel for debugging

## Adding New Features

### Syntax Highlighting
Edit [syntaxes/orca.tmLanguage.json](syntaxes/orca.tmLanguage.json):
- Add patterns to `repository` section
- Include in main `patterns` array
- Test with various input files

### Code Snippets
Edit [snippets/orca.json](snippets/orca.json):
- Use descriptive `prefix` (what user types)
- Provide numbered placeholders `${1:default}`
- Add dropdown choices with `${1|choice1,choice2|}`
- Include `description` field

### Commands
1. Register in `package.json` under `contributes.commands`
2. Implement handler in `src/extension.ts`
3. Add to context subscriptions
4. Update README with usage instructions

## Testing

### Manual Testing Checklist
- [ ] Syntax highlighting works for all keyword types
- [ ] Snippets expand correctly with Tab
- [ ] F5 runs ORCA job successfully
- [ ] Output streams in real-time
- [ ] Kill command terminates job
- [ ] Status bar updates correctly
- [ ] Configuration settings work
- [ ] Error messages are clear and helpful

### Before Submitting PR
- [ ] Code compiles without errors (`npm run compile`)
- [ ] ESLint passes (`npm run lint`)
- [ ] README updated if needed
- [ ] CHANGELOG.md updated with changes
- [ ] Tested in Extension Development Host

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md` with release notes
3. Commit: `git commit -m "Release v0.x.x"`
4. Tag: `git tag v0.x.x`
5. Push: `git push && git push --tags`
6. Package: `npm run package`
7. Publish to VS Code Marketplace

## Questions?

- Open a discussion on GitHub
- Check existing issues and PRs
- Review the [README](README.md) for documentation

---

**Thank you for contributing to VS-ORCA! 🧪⚛️**
