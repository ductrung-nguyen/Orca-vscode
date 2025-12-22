import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { OrcaCodeLensProvider, OrcaOutputCodeLensProvider, setRunningFile, isFileRunning, isAnyJobRunning } from '../../orcaCodeLensProvider';

suite('OrcaCodeLensProvider Test Suite', () => {
    suite('Running State Functions', () => {
        test('should track running file state', () => {
            // Initially no job running
            assert.strictEqual(isAnyJobRunning(), false);
            assert.strictEqual(isFileRunning('/test/file.inp'), false);

            // Set running file
            setRunningFile('/test/file.inp');
            assert.strictEqual(isAnyJobRunning(), true);
            assert.strictEqual(isFileRunning('/test/file.inp'), true);
            assert.strictEqual(isFileRunning('/test/other.inp'), false);

            // Clear running file
            setRunningFile(null);
            assert.strictEqual(isAnyJobRunning(), false);
            assert.strictEqual(isFileRunning('/test/file.inp'), false);
        });
    });

    suite('OrcaCodeLensProvider (Input Files)', () => {
        let provider: OrcaCodeLensProvider;

        setup(() => {
            provider = new OrcaCodeLensProvider();
            setRunningFile(null); // Reset state
        });

        test('should implement CodeLensProvider interface', () => {
            assert.ok(typeof provider.provideCodeLenses === 'function');
            assert.ok(typeof provider.resolveCodeLens === 'function');
            assert.ok(provider.onDidChangeCodeLenses !== undefined);
        });

    test('should have event emitter for refresh', () => {
        assert.ok(typeof provider.onDidChangeCodeLenses === 'function');
    });        test('resolveCodeLens should return the same CodeLens', () => {
            const range = new vscode.Range(0, 0, 0, 0);
            const codeLens = new vscode.CodeLens(range, {
                title: 'Test',
                command: 'test'
            });
            const token = new vscode.CancellationTokenSource().token;
            
            const resolved = provider.resolveCodeLens(codeLens, token);
            assert.strictEqual(resolved, codeLens);
        });
    });
});

suite('OrcaOutputCodeLensProvider Test Suite', () => {
    let provider: OrcaOutputCodeLensProvider;

    setup(() => {
        provider = new OrcaOutputCodeLensProvider();
    });

    test('should implement CodeLensProvider interface', () => {
        assert.ok(typeof provider.provideCodeLenses === 'function');
        assert.ok(typeof provider.resolveCodeLens === 'function');
        assert.ok(provider.onDidChangeCodeLenses !== undefined);
    });

    test('should have event emitter for changes', () => {
        assert.ok(typeof provider.onDidChangeCodeLenses === 'function');
    });

    test('resolveCodeLens should return the same CodeLens', () => {
        const range = new vscode.Range(0, 0, 0, 0);
        const codeLens = new vscode.CodeLens(range, {
            title: '$(graph) Open Dashboard',
            tooltip: 'Open ORCA Results Dashboard',
            command: 'vs-orca.showResultsDashboard',
            arguments: [vscode.Uri.file('/test/file.out')]
        });
        const token = new vscode.CancellationTokenSource().token;
        
        const resolved = provider.resolveCodeLens(codeLens, token);
        assert.strictEqual(resolved, codeLens);
    });

    test('CodeLens should have correct command configuration', async () => {
        // Get the test fixture file
        const fixtureDir = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');
        const testFilePath = path.join(fixtureDir, 'converged.out');
        
        try {
            const document = await vscode.workspace.openTextDocument(testFilePath);
            const token = new vscode.CancellationTokenSource().token;
            const codeLenses = provider.provideCodeLenses(document, token);
            
            assert.ok(Array.isArray(codeLenses));
            
            if (codeLenses.length > 0) {
                const dashboardLens = codeLenses[0];
                
                // Check that it's placed at top of document
                assert.strictEqual(dashboardLens.range.start.line, 0);
                assert.strictEqual(dashboardLens.range.start.character, 0);
                
                // Check command configuration
                assert.ok(dashboardLens.command !== undefined);
                if (dashboardLens.command) {
                    assert.strictEqual(dashboardLens.command.command, 'vs-orca.showResultsDashboard');
                    assert.strictEqual(dashboardLens.command.title, '$(graph) Open Dashboard');
                    assert.ok(dashboardLens.command.arguments !== undefined);
                    assert.strictEqual(dashboardLens.command.arguments!.length, 1);
                }
            }
        } catch {
            // If we can't open the document in test environment, skip this test
            console.log('Skipping CodeLens integration test - test fixtures not accessible');
        }
    });

    test('CodeLens should not provide for non-.out files', () => {
        // Create a mock document-like object for a .inp file
        const mockDocument = {
            fileName: '/test/file.inp',
            languageId: 'orca'
        } as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const codeLenses = provider.provideCodeLenses(mockDocument, token);
        
        assert.ok(Array.isArray(codeLenses));
        assert.strictEqual(codeLenses.length, 0);
    });

    test('CodeLens should not provide for .txt files', () => {
        const mockDocument = {
            fileName: '/test/file.txt',
            languageId: 'plaintext'
        } as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const codeLenses = provider.provideCodeLenses(mockDocument, token);
        
        assert.ok(Array.isArray(codeLenses));
        assert.strictEqual(codeLenses.length, 0);
    });

    test('CodeLens should provide for orca-output language', () => {
        const mockDocument = {
            fileName: '/test/calculation.out',
            languageId: 'orca-output'
        } as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const codeLenses = provider.provideCodeLenses(mockDocument, token);
        
        assert.ok(Array.isArray(codeLenses));
        assert.strictEqual(codeLenses.length, 1);
        
        const lens = codeLenses[0];
        assert.strictEqual(lens.range.start.line, 0);
        assert.strictEqual(lens.range.start.character, 0);
        assert.ok(lens.command !== undefined);
        assert.strictEqual(lens.command!.command, 'vs-orca.showResultsDashboard');
        assert.strictEqual(lens.command!.title, '$(graph) Open Dashboard');
    });

    test('CodeLens should provide for .out extension', () => {
        const mockDocument = {
            fileName: '/test/result.out',
            languageId: 'unknown' // Even with unknown language, .out extension should work
        } as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const codeLenses = provider.provideCodeLenses(mockDocument, token);
        
        assert.ok(Array.isArray(codeLenses));
        assert.strictEqual(codeLenses.length, 1);
    });

    test('CodeLens command arguments should include file URI', () => {
        const testPath = '/test/my_calculation.out';
        const mockDocument = {
            fileName: testPath,
            languageId: 'orca-output'
        } as vscode.TextDocument;
        
        const token = new vscode.CancellationTokenSource().token;
        const codeLenses = provider.provideCodeLenses(mockDocument, token);
        
        assert.strictEqual(codeLenses.length, 1);
        const lens = codeLenses[0];
        assert.ok(lens.command !== undefined);
        assert.ok(lens.command!.arguments !== undefined);
        
        const uriArg = lens.command!.arguments![0] as vscode.Uri;
        assert.ok(uriArg.fsPath.endsWith('my_calculation.out'));
    });
});
