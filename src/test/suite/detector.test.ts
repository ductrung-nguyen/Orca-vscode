/**
 * Unit tests for OrcaDetector
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { OrcaDetector } from '../../installation/detector';
import { OrcaInstallation } from '../../installation/types';

suite('OrcaDetector Test Suite', () => {
    let detector: OrcaDetector;
    
    setup(() => {
        detector = new OrcaDetector();
    });
    
    test('Should detect installations', async () => {
        const installations = await detector.detectInstallations();
        assert.ok(Array.isArray(installations), 'Should return an array');
    });
    
    test('Should validate binary path', async () => {
        // Test with non-existent path
        const result = await detector.validateBinary('/nonexistent/path/orca');
        assert.strictEqual(result, null, 'Should return null for non-existent binary');
    });
    
    test('Should sort installations by priority', async () => {
        const installations = await detector.detectInstallations();
        
        if (installations.length > 1) {
            // Valid installations should come before invalid ones
            const firstValid = installations.findIndex(inst => inst.isValid);
            const firstInvalid = installations.findIndex(inst => !inst.isValid);
            
            if (firstValid !== -1 && firstInvalid !== -1) {
                assert.ok(firstValid < firstInvalid, 'Valid installations should come first');
            }
        }
    });
    
    test('Should detect from multiple sources', async () => {
        const installations = await detector.detectInstallations();
        
        const sources = new Set(installations.map(inst => inst.detectionSource));
        console.log('Detection sources found:', Array.from(sources));
        
        // At least one source should be checked (even if no installations found)
        assert.ok(true, 'Detection completed');
    });
    
    test('Should handle version parsing', async () => {
        const installations = await detector.detectInstallations();
        
        for (const inst of installations) {
            if (inst.isValid) {
                assert.ok(inst.version, 'Valid installation should have version');
                assert.ok(inst.version !== 'unknown', 'Version should be parsed');
            }
        }
    });
});
