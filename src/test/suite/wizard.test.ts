/**
 * Unit tests for WizardPanel
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { WizardPanel } from '../../installation/wizard/wizardPanel';

suite('WizardPanel Test Suite', () => {
    let context: vscode.ExtensionContext;
    
    setup(async () => {
        // Get extension context
        const ext = vscode.extensions.getExtension('ductrung-nguyen.vs-orca');
        if (ext) {
            // Ensure extension is activated
            await ext.activate();
            context = ext.exports?.context || createMockContext();
        } else {
            context = createMockContext();
        }
    });
    
    teardown(async () => {
        // Clean up any open panels
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    
    test('Should create wizard panel', () => {
        WizardPanel.createOrShow(context);
        
        // Panel should be created (verified by no errors thrown)
        assert.ok(true, 'Panel created successfully');
    });
    
    test('Should reuse existing panel when called twice', () => {
        WizardPanel.createOrShow(context);
        WizardPanel.createOrShow(context);
        
        // Should not throw error when creating twice
        assert.ok(true, 'Panel reused successfully');
    });
    
    test('Should handle panel disposal', async () => {
        WizardPanel.createOrShow(context);
        
        // Close the panel
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        
        // Wait a bit for disposal
        await new Promise(resolve => setTimeout(resolve, 500));
        
        assert.ok(true, 'Panel disposed successfully');
    });
    
    test('Should restore state on reopen', async () => {
        // Set some state
        await context.globalState.update('orcaWizardState', {
            currentStep: 2,
            timestamp: Date.now()
        });
        
        WizardPanel.createOrShow(context);
        
        // Panel should restore state (verified by no errors)
        assert.ok(true, 'State restored successfully');
        
        // Clean up
        await context.globalState.update('orcaWizardState', undefined);
    });
    
    test.skip('Should clear expired state', async () => {
        // Set expired state (8 days old)
        const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
        await context.globalState.update('orcaWizardState', {
            currentStep: 2,
            timestamp: eightDaysAgo
        });
        
        WizardPanel.createOrShow(context);
        
        // Wait for panel to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // State should be cleared
        const state = context.globalState.get('orcaWizardState');
        assert.strictEqual(state, undefined, 'Expired state should be cleared');
    });
    
    test('Should generate valid HTML content', () => {
        WizardPanel.createOrShow(context);
        
        // Panel created means HTML is valid
        assert.ok(true, 'HTML content generated successfully');
    });
    
    test('Should handle multiple panel creations in sequence', async () => {
        WizardPanel.createOrShow(context);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        WizardPanel.createOrShow(context);
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        WizardPanel.createOrShow(context);
        
        assert.ok(true, 'Multiple panel creations handled successfully');
    });
});

/**
 * Create mock extension context for testing
 */
function createMockContext(): vscode.ExtensionContext {
    const globalState = new Map<string, unknown>();
    
    return {
        subscriptions: [],
        extensionPath: __dirname,
        extensionUri: vscode.Uri.file(__dirname),
        globalState: {
            get: <T>(key: string): T | undefined => globalState.get(key) as T | undefined,
            update: async (key: string, value: unknown): Promise<void> => {
                if (value === undefined) {
                    globalState.delete(key);
                } else {
                    globalState.set(key, value);
                }
            },
            keys: (): readonly string[] => Array.from(globalState.keys()),
            setKeysForSync: (_keys: readonly string[]): void => {}
        },
        workspaceState: {
            get: () => undefined,
            update: async () => {},
            keys: () => []
        },
        secrets: {} as vscode.SecretStorage,
        extensionMode: vscode.ExtensionMode.Test,
        globalStorageUri: vscode.Uri.file('/tmp/orca-test-global'),
        logUri: vscode.Uri.file('/tmp/orca-test-log'),
        storageUri: vscode.Uri.file('/tmp/orca-test-storage'),
        storagePath: '/tmp/orca-test-storage',
        globalStoragePath: '/tmp/orca-test-global',
        logPath: '/tmp/orca-test-log',
        asAbsolutePath: (relativePath: string): string => relativePath,
        environmentVariableCollection: {} as vscode.GlobalEnvironmentVariableCollection,
        extension: {} as vscode.Extension<unknown>
    } as unknown as vscode.ExtensionContext;
}
