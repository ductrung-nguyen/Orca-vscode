/**
 * Unit tests for OrcaValidator
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { OrcaValidator } from '../../installation/validator';

suite('OrcaValidator Test Suite', () => {
    let validator: OrcaValidator;
    let context: vscode.ExtensionContext;
    
    setup(async () => {
        // Get extension context
        const ext = vscode.extensions.getExtension('ductrung-nguyen.vs-orca');
        if (ext) {
            context = ext.exports?.context || {
                subscriptions: [],
                extensionPath: __dirname,
                extensionUri: vscode.Uri.file(__dirname),
                globalState: {
                    get: () => undefined,
                    update: async () => {},
                    keys: () => [],
                    setKeysForSync: () => {}
                },
                workspaceState: {
                    get: () => undefined,
                    update: async () => {},
                    keys: () => []
                },
                secrets: {} as vscode.SecretStorage,
                extensionMode: vscode.ExtensionMode.Test,
                globalStorageUri: vscode.Uri.file('/tmp/orca-test'),
                logUri: vscode.Uri.file('/tmp/orca-test-log'),
                storageUri: vscode.Uri.file('/tmp/orca-test-storage'),
                asAbsolutePath: (relativePath: string) => relativePath,
                environmentVariableCollection: {} as vscode.GlobalEnvironmentVariableCollection,
                extension: {} as vscode.Extension<unknown>
            } as unknown as vscode.ExtensionContext;
            
            validator = new OrcaValidator(context);
        }
    });
    
    test('Should validate non-existent binary', async () => {
        if (!validator) {
            return;
        }
        
        const result = await validator.quickValidate('/nonexistent/path/orca');
        
        assert.strictEqual(result.success, false, 'Should fail for non-existent binary');
        assert.ok(result.errors.length > 0, 'Should have error messages');
    });
    
    test('Should perform quick validation', async () => {
        if (!validator) {
            return;
        }
        
        const config = vscode.workspace.getConfiguration('orca');
        const binaryPath = config.get<string>('binaryPath', '');
        
        if (binaryPath && binaryPath !== '/opt/orca/orca') {
            const result = await validator.quickValidate(binaryPath);
            
            assert.ok(result !== undefined, 'Should return a result');
            assert.ok(Array.isArray(result.errors), 'Should have errors array');
            assert.ok(Array.isArray(result.warnings), 'Should have warnings array');
        }
    });
    
    test('Should return structured validation result', async () => {
        if (!validator) {
            return;
        }
        
        const result = await validator.quickValidate('/nonexistent/orca');
        
        assert.ok(Object.prototype.hasOwnProperty.call(result, 'success'), 'Should have success property');
        assert.ok(Object.prototype.hasOwnProperty.call(result, 'errors'), 'Should have errors property');
        assert.ok(Object.prototype.hasOwnProperty.call(result, 'warnings'), 'Should have warnings property');
    });
});
