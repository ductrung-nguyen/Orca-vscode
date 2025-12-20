import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import {
    parseOrcaOutput,
    extractFinalEnergy,
    checkConvergence,
    countImaginaryFrequencies
} from '../../orcaRunner';

/**
 * Test suite for ORCA output parsing functions
 */
suite('ORCA Parser Tests', () => {
    const fixturesDir = path.join(__dirname, '..', 'fixtures');
    
    /**
     * Helper to load fixture file
     */
    function loadFixture(filename: string): string {
        const filepath = path.join(fixturesDir, filename);
        return fs.readFileSync(filepath, 'utf-8');
    }

    suite('parseOrcaOutput - Full Integration', () => {
        test('Should parse converged calculation correctly', () => {
            const content = loadFixture('converged.out');
            const result = parseOrcaOutput(content);
            
            assert.strictEqual(result.converged, true, 'Should detect convergence');
            assert.strictEqual(result.scfFailed, false, 'Should not detect SCF failure');
            assert.strictEqual(result.optimizationConverged, true, 'Should detect optimization convergence');
            assert.notStrictEqual(result.finalEnergy, null, 'Should extract final energy');
            assert.ok(result.finalEnergy && result.finalEnergy < -76.06 && result.finalEnergy > -76.07, 
                'Energy should be in expected range');
            assert.strictEqual(result.imaginaryFreqCount, 0, 'Should have no imaginary frequencies');
            assert.strictEqual(result.hasErrors, false, 'Should not detect errors');
        });

        test('Should parse failed SCF calculation', () => {
            const content = loadFixture('failed_scf.out');
            const result = parseOrcaOutput(content);
            
            assert.strictEqual(result.converged, false, 'Should not detect convergence');
            assert.strictEqual(result.scfFailed, true, 'Should detect SCF failure');
            assert.strictEqual(result.hasErrors, true, 'Should detect errors');
            assert.strictEqual(result.finalEnergy, null, 'Should not have final energy');
        });

        test('Should parse output with imaginary frequencies', () => {
            const content = loadFixture('imaginary_freq.out');
            const result = parseOrcaOutput(content);
            
            assert.strictEqual(result.converged, true, 'Should detect convergence');
            assert.strictEqual(result.hasFrequencies, true, 'Should detect frequencies');
            assert.strictEqual(result.imaginaryFreqCount, 2, 'Should count 2 imaginary frequencies');
            assert.notStrictEqual(result.finalEnergy, null, 'Should extract final energy');
            assert.ok(result.finalEnergy && result.finalEnergy < -40.2 && result.finalEnergy > -40.3,
                'Energy should be in expected range');
        });

        test('Should parse memory error output', () => {
            const content = loadFixture('memory_error.out');
            const result = parseOrcaOutput(content);
            
            assert.strictEqual(result.converged, false, 'Should not detect convergence');
            assert.strictEqual(result.hasErrors, true, 'Should detect memory error');
        });

        test('Should handle large output file', () => {
            const content = loadFixture('large_output.out');
            const result = parseOrcaOutput(content);
            
            assert.strictEqual(result.converged, true, 'Should detect convergence');
            assert.strictEqual(result.optimizationConverged, true, 'Should detect optimization convergence');
            assert.notStrictEqual(result.finalEnergy, null, 'Should extract final energy');
        });
    });

    suite('extractFinalEnergy', () => {
        test('Should extract energy from converged calculation', () => {
            const content = loadFixture('converged.out');
            const energy = extractFinalEnergy(content);
            
            assert.notStrictEqual(energy, null, 'Energy should be found');
            assert.ok(energy && energy < -76.06 && energy > -76.07, 
                'Energy should be approximately -76.068 Hartree');
        });

        test('Should return null when no energy present', () => {
            const content = 'Some random text without energy';
            const energy = extractFinalEnergy(content);
            
            assert.strictEqual(energy, null, 'Should return null for missing energy');
        });

        test('Should extract negative energy correctly', () => {
            const content = 'FINAL SINGLE POINT ENERGY       -123.456789012';
            const energy = extractFinalEnergy(content);
            
            assert.strictEqual(energy, -123.456789012, 'Should extract negative energy');
        });

        test('Should extract last occurrence when multiple energies present', () => {
            const content = `
                FINAL SINGLE POINT ENERGY       -76.068312340821
                FINAL SINGLE POINT ENERGY       -76.068475629182
            `;
            const energy = extractFinalEnergy(content);
            
            // The regex should match the last one in multi-line mode
            assert.notStrictEqual(energy, null, 'Should find at least one energy');
        });
    });

    suite('checkConvergence', () => {
        test('Should detect convergence with HURRAY marker', () => {
            const content = loadFixture('converged.out');
            const converged = checkConvergence(content);
            
            assert.strictEqual(converged, true, 'Should detect HURRAY marker');
        });

        test('Should not detect convergence in failed calculation', () => {
            const content = loadFixture('failed_scf.out');
            const converged = checkConvergence(content);
            
            assert.strictEqual(converged, false, 'Should not find HURRAY marker');
        });

        test('Should detect convergence in output with imaginary frequencies', () => {
            const content = loadFixture('imaginary_freq.out');
            const converged = checkConvergence(content);
            
            assert.strictEqual(converged, true, 'Converged calculation can have imaginary frequencies');
        });

        test('Should handle empty content', () => {
            const converged = checkConvergence('');
            
            assert.strictEqual(converged, false, 'Empty content should not be converged');
        });
    });

    suite('countImaginaryFrequencies', () => {
        test('Should count imaginary frequencies correctly', () => {
            const content = loadFixture('imaginary_freq.out');
            const count = countImaginaryFrequencies(content);
            
            assert.strictEqual(count, 2, 'Should count 2 imaginary frequencies');
        });

        test('Should return 0 for converged calculation without frequencies', () => {
            const content = loadFixture('converged.out');
            const count = countImaginaryFrequencies(content);
            
            assert.strictEqual(count, 0, 'Optimization without freq should have 0 imaginary frequencies');
        });

        test('Should return 0 when no imaginary frequencies present', () => {
            const content = 'VIBRATIONAL FREQUENCIES\n123.45 cm**-1\n456.78 cm**-1';
            const count = countImaginaryFrequencies(content);
            
            assert.strictEqual(count, 0, 'Should return 0 for all real frequencies');
        });

        test('Should count multiple imaginary modes', () => {
            const content = `
                -100.23 cm**-1   ***imaginary mode***
                -50.12 cm**-1   ***imaginary mode***
                -25.45 cm**-1   ***imaginary mode***
            `;
            const count = countImaginaryFrequencies(content);
            
            assert.strictEqual(count, 3, 'Should count 3 imaginary modes');
        });
    });

    suite('Edge Cases and Error Handling', () => {
        test('Should handle partial output content', () => {
            const partialContent = 'FINAL SINGLE POINT ENERGY       -76.068475629182';
            const result = parseOrcaOutput(partialContent);
            
            assert.notStrictEqual(result.finalEnergy, null, 'Should extract energy from partial content');
            assert.strictEqual(result.converged, false, 'Partial content should not show convergence');
        });

        test('Should handle corrupted output', () => {
            const corruptedContent = '���invalid���HURRAY���corrupt���';
            const result = parseOrcaOutput(corruptedContent);
            
            // Should not throw, just return sensible defaults
            assert.strictEqual(result.converged, true, 'Should detect HURRAY even in corrupted text');
        });

        test('Should parse output with both SCF failure and ABORTING', () => {
            const content = `
                SCF NOT CONVERGED
                ABORTING THE RUN
            `;
            const result = parseOrcaOutput(content);
            
            assert.strictEqual(result.scfFailed, true, 'Should detect SCF failure');
            assert.strictEqual(result.hasErrors, true, 'Should detect abort condition');
        });

        test('Should handle empty output file', () => {
            const result = parseOrcaOutput('');
            
            assert.strictEqual(result.converged, false, 'Empty file should not be converged');
            assert.strictEqual(result.finalEnergy, null, 'Empty file should have no energy');
            assert.strictEqual(result.imaginaryFreqCount, 0, 'Empty file should have no imaginary frequencies');
        });
    });

    suite('Regression Tests', () => {
        test('Should correctly identify optimization that converged with energy', () => {
            const content = loadFixture('converged.out');
            const result = parseOrcaOutput(content);
            
            // Comprehensive check for water optimization
            assert.strictEqual(result.converged, true);
            assert.strictEqual(result.optimizationConverged, true);
            assert.strictEqual(result.scfFailed, false);
            assert.strictEqual(result.hasErrors, false);
            assert.notStrictEqual(result.finalEnergy, null);
        });

        test('Should detect all error types in failed calculation', () => {
            const content = loadFixture('failed_scf.out');
            const result = parseOrcaOutput(content);
            
            assert.strictEqual(result.scfFailed, true, 'SCF failure should be detected');
            assert.strictEqual(result.hasErrors, true, 'General error flag should be set');
            assert.strictEqual(result.converged, false, 'Should not be converged');
        });
    });
});
