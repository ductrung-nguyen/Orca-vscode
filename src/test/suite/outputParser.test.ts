import * as assert from 'assert';
import {
    parseOrcaOutputEnhanced,
    countScfCycles,
    parseScfIterations,
    parseGeometrySteps,
    parseFrequencies,
    parseZeroPointEnergy,
    parseWarnings,
    parseErrors,
    parseTotalRunTime
} from '../../outputParser';

suite('Output Parser Test Suite', () => {
    test('should parse basic convergence status', () => {
        const content = `
            FINAL SINGLE POINT ENERGY      -76.123456789
            ****HURRAY******
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.converged, true);
        assert.strictEqual(result.finalEnergy, -76.123456789);
        assert.strictEqual(result.hasErrors, false);
    });

    test('should detect SCF failure', () => {
        const content = `
            SCF NOT CONVERGED
            ABORTING THE RUN
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.scfFailed, true);
        assert.strictEqual(result.converged, false);
        assert.strictEqual(result.hasErrors, true);
    });

    test('should count SCF cycles', () => {
        const content = `
            SCF ITERATIONS
            --------------
            SCF ITERATIONS
            --------------
            SCF ITERATIONS
            --------------
        `;
        
        const count = countScfCycles(content);
        assert.strictEqual(count, 3);
    });

    test('should parse SCF iterations', () => {
        const content = `
            SCF ITERATIONS
            --------------
            ITER       Energy         Delta-E        Max-DP      RMS-DP
            0   -75.9876543210   0.0000000000   0.0123456   0.0012345
            1   -76.0123456789  -0.0246913579   0.0098765   0.0009876
            2   -76.0234567890  -0.0111111101   0.0001234   0.0000123
            --------------
        `;
        
        const iterations = parseScfIterations(content);
        assert.strictEqual(iterations.length, 3);
        assert.strictEqual(iterations[0].iteration, 0);
        assert.strictEqual(iterations[0].energy, -75.9876543210);
        assert.strictEqual(iterations[2].iteration, 2);
    });

    test('should parse geometry optimization steps', () => {
        const content = `
         *                GEOMETRY OPTIMIZATION CYCLE   1            *
         
               *           SCF CONVERGED AFTER  12 CYCLES          *
               
FINAL SINGLE POINT ENERGY     -76.1234567890

          RMS gradient        0.0075687691            0.0000080000      NO
          MAX gradient        0.0517107625            0.0000300000      NO
          RMS step            0.0192474022            0.0001000000      NO
          MAX step            0.0905289627            0.0002000000      NO

         *                GEOMETRY OPTIMIZATION CYCLE   2            *

               *           SCF CONVERGED AFTER  10 CYCLES          *

FINAL SINGLE POINT ENERGY     -76.2345678901

          RMS gradient        0.0000050000            0.0000080000      YES
          MAX gradient        0.0000200000            0.0000300000      YES
          RMS step            0.0000080000            0.0001000000      YES
          MAX step            0.0000150000            0.0002000000      YES

                      *** THE OPTIMIZATION HAS CONVERGED ***
        `;
        
        const steps = parseGeometrySteps(content);
        assert.strictEqual(steps.length, 2);
        assert.strictEqual(steps[0].stepNumber, 1);
        assert.ok(Math.abs(steps[0].energy! - (-76.1234567890)) < 0.0000001, 'Energy should match');
        assert.ok(Math.abs(steps[0].rmsGradient! - 0.0075687691) < 0.0000001, 'RMS gradient should match');
        assert.ok(Math.abs(steps[0].maxGradient! - 0.0517107625) < 0.0000001, 'MAX gradient should match');
        assert.strictEqual(steps[1].converged, true);
        // Check delta energy calculation
        assert.ok(steps[1].deltaEnergy !== undefined, 'Delta energy should be calculated');
        assert.ok(Math.abs(steps[1].deltaEnergy! - (steps[1].energy! - steps[0].energy!)) < 0.0000001, 'Delta E should be difference');
    });

    test('should parse geometry optimization with SCF Energy format (legacy)', () => {
        const content = `
            GEOMETRY OPTIMIZATION CYCLE 1
            SCF Energy    :    -76.1234567
            
            GEOMETRY OPTIMIZATION CYCLE 2
            SCF Energy    :    -76.2345678
        `;
        
        const steps = parseGeometrySteps(content);
        assert.strictEqual(steps.length, 2);
        assert.strictEqual(steps[0].stepNumber, 1);
        assert.ok(Math.abs(steps[0].energy! - (-76.1234567)) < 0.0000001, 'Energy should match legacy format');
    });

    test('should parse frequency table', () => {
        const content = `
            VIBRATIONAL FREQUENCIES
            -----------------------
            0:         0.00 cm**-1 ***imaginary mode***    0.000
            1:        10.50 cm**-1                          1.234
            2:      3000.25 cm**-1                        100.500
            -----------------------
        `;
        
        const frequencies = parseFrequencies(content);
        assert.strictEqual(frequencies.length, 3);
        assert.strictEqual(frequencies[0].isImaginary, true);
        assert.strictEqual(frequencies[1].frequency, 10.50);
        assert.strictEqual(frequencies[2].intensity, 100.500);
    });

    test('should count imaginary frequencies', () => {
        const content = `
            VIBRATIONAL FREQUENCIES
            -----------------------
            0:         0.00 cm**-1 ***imaginary mode***    0.000
            1:        10.50 cm**-1                          1.234
            2:      -100.00 cm**-1 ***imaginary mode***   10.500
            -----------------------
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.imaginaryFreqCount, 2);
    });

    test('should parse zero point energy', () => {
        const content = `
            Zero point energy           ...     0.123456 Eh
        `;
        
        const zpe = parseZeroPointEnergy(content);
        assert.strictEqual(zpe, 0.123456);
    });

    test('should parse warnings', () => {
        const content = `
            WARNING: Something might be wrong
            Warning: Check your input
            ***imaginary mode***
        `;
        
        const warnings = parseWarnings(content);
        assert.ok(warnings.length >= 2);
        assert.strictEqual(warnings[0].type, 'warning');
    });

    test('should parse errors', () => {
        const content = `
            ERROR: Calculation failed
            SCF NOT CONVERGED
            ABORTING THE RUN
            Not enough memory available
        `;
        
        const errors = parseErrors(content);
        assert.ok(errors.length >= 3);
        assert.strictEqual(errors[0].type, 'error');
    });

    test('should parse total run time', () => {
        const content = `
            TOTAL RUN TIME: 0 days 1 hours 23 minutes 45 seconds 678 msec
        `;
        
        const time = parseTotalRunTime(content);
        assert.ok(time !== null);
        assert.strictEqual(time, 1 * 3600 + 23 * 60 + 45 + 0.678);
    });

    test('should handle optimization convergence', () => {
        const content = `
            THE OPTIMIZATION HAS CONVERGED
            FINAL SINGLE POINT ENERGY      -76.987654321
            HURRAY
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.optimizationConverged, true);
        assert.strictEqual(result.converged, true);
    });

    test('should handle empty content gracefully', () => {
        const result = parseOrcaOutputEnhanced('');
        assert.strictEqual(result.converged, false);
        assert.strictEqual(result.finalEnergy, null);
        assert.strictEqual(result.scfCycles, 0);
        assert.strictEqual(result.geometrySteps.length, 0);
        assert.strictEqual(result.frequencies.length, 0);
    });

    test('should handle partial output', () => {
        const content = `
            SCF ITERATIONS
            --------------
            ITER       Energy         Delta-E
            0   -75.9876543210   0.0000000000
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.scfCycles, 1);
        assert.strictEqual(result.converged, false);
    });

    test('should extract comprehensive results', () => {
        const content = `
            SCF ITERATIONS
            --------------
            ITER       Energy         Delta-E        Max-DP      RMS-DP
            0   -75.9876543210   0.0000000000   0.0123456   0.0012345
            1   -76.1234567890  -0.1358024680   0.0001234   0.0000123
            --------------
            
         *                GEOMETRY OPTIMIZATION CYCLE   1            *

FINAL SINGLE POINT ENERGY     -76.123456789

          RMS gradient        0.0000120000            0.0000080000      YES
          MAX gradient        0.0001230000            0.0000300000      YES

                      *** THE OPTIMIZATION HAS CONVERGED ***
            
            VIBRATIONAL FREQUENCIES
            -----------------------
            0:      3000.00 cm**-1                        100.000
            1:      1500.00 cm**-1                         50.000
            -----------------------
            
            Zero point energy           ...     0.098765 Eh
            
            WARNING: This is a test warning
            
            TOTAL RUN TIME: 0 days 0 hours 5 minutes 30 seconds 123 msec
            
            ****HURRAY******
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        
        // Check all major components
        assert.strictEqual(result.converged, true);
        assert.strictEqual(result.finalEnergy, -76.123456789);
        assert.strictEqual(result.scfCycles, 1);
        assert.strictEqual(result.scfIterations.length, 2);
        assert.strictEqual(result.optimizationConverged, true);
        assert.strictEqual(result.geometrySteps.length, 1);
        assert.strictEqual(result.hasFrequencies, true);
        assert.strictEqual(result.frequencies.length, 2);
        assert.strictEqual(result.zeroPointEnergy, 0.098765);
        assert.strictEqual(result.warnings.length, 1);
        assert.ok(result.totalRunTime !== null);
        assert.strictEqual(result.hasErrors, false);
    });

    test('should handle failed calculation', () => {
        const content = `
            SCF ITERATIONS
            --------------
            ITER       Energy         Delta-E
            0   -75.9876543210   0.0000000000
            50  -75.9876543210   0.0000000000
            --------------
            
            SCF NOT CONVERGED
            ERROR: Maximum number of iterations reached
            ABORTING THE RUN
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.converged, false);
        assert.strictEqual(result.scfFailed, true);
        assert.strictEqual(result.hasErrors, true);
        assert.ok(result.errors.length >= 2);
    });

    test('should parse negative frequencies as imaginary', () => {
        const content = `
            VIBRATIONAL FREQUENCIES
            -----------------------
            0:      -100.00 cm**-1                         10.000
            1:      2000.00 cm**-1                         50.000
            -----------------------
        `;
        
        const frequencies = parseFrequencies(content);
        assert.strictEqual(frequencies.length, 2);
        assert.strictEqual(frequencies[0].isImaginary, true);
        assert.strictEqual(frequencies[1].isImaginary, false);
    });

    test('should handle scientific notation in energies', () => {
        const content = `
            FINAL SINGLE POINT ENERGY      -7.612345678E+01
            
            SCF ITERATIONS
            ==============
            ITER       Energy         Delta-E        Max-DP      RMS-DP      [F,P]     Damp
            0   -7.59876543E+01   0.00000000E+00  0.05201953  0.00298466  0.1848625  0.7000
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.finalEnergy, -76.12345678);
        assert.strictEqual(result.scfIterations.length, 1);
        assert.strictEqual(result.scfIterations[0].energy, -75.9876543);
    });
});

// Import parseTocEntries for TOC tests
import { parseTocEntries } from '../../outputParser';

suite('TOC Parser Test Suite', () => {
    test('should parse single point calculation TOC entries', () => {
        const content = `
                                                 *****************
                                                 * O   R   C   A *
                                                 *****************

                         INPUT FILE
                         ==========
    ! B3LYP def2-SVP

                         SCF ITERATIONS
                         ---------------

                         ****************
                         * SCF CONVERGED *
                         ****************

                         FINAL SINGLE POINT ENERGY      -76.123456789

                         ****HURRAY******

                         TOTAL RUN TIME: 0 days 0 hours 0 minutes 5 seconds 0 msec
        `;

        const entries = parseTocEntries(content);
        
        // Should find at least: ORCA Header, Input File, SCF Iterations, SCF Converged, Final Energy, HURRAY, Total Run Time
        assert.ok(entries.length >= 5, `Expected at least 5 entries, got ${entries.length}`);
        
        // Check specific entries exist
        const entryTitles = entries.map(e => e.title);
        assert.ok(entryTitles.includes('ORCA Header'), 'Should detect ORCA Header');
        assert.ok(entryTitles.includes('Input File'), 'Should detect Input File');
        assert.ok(entryTitles.includes('SCF Iterations'), 'Should detect SCF Iterations');
        assert.ok(entryTitles.includes('Final Energy'), 'Should detect Final Energy');
        assert.ok(entryTitles.includes('HURRAY'), 'Should detect HURRAY');
    });

    test('should detect geometry optimization sections', () => {
        const content = `
            GEOMETRY OPTIMIZATION
            ---------------------

            THE OPTIMIZATION HAS CONVERGED
        `;

        const entries = parseTocEntries(content);
        const entryTitles = entries.map(e => e.title);
        
        assert.ok(entryTitles.includes('Geometry Optimization'), 'Should detect Geometry Optimization');
        assert.ok(entryTitles.includes('Optimization Converged'), 'Should detect Optimization Converged');
    });

    test('should detect frequency calculation sections', () => {
        const content = `
            VIBRATIONAL FREQUENCIES
            -----------------------

            THERMOCHEMISTRY
            ---------------
        `;

        const entries = parseTocEntries(content);
        const entryTitles = entries.map(e => e.title);
        
        assert.ok(entryTitles.includes('Vibrational Frequencies'), 'Should detect Vibrational Frequencies');
        assert.ok(entryTitles.includes('Thermochemistry'), 'Should detect Thermochemistry');
    });

    test('should detect failed calculation sections', () => {
        const content = `
            SCF NOT CONVERGED
            
            ABORTING THE RUN
        `;

        const entries = parseTocEntries(content);
        const entryTitles = entries.map(e => e.title);
        
        assert.ok(entryTitles.includes('SCF Not Converged'), 'Should detect SCF Not Converged');
        assert.ok(entryTitles.includes('Aborting'), 'Should detect Aborting');
        
        // Check status is error
        const scfNotConverged = entries.find(e => e.title === 'SCF Not Converged');
        const aborting = entries.find(e => e.title === 'Aborting');
        
        assert.strictEqual(scfNotConverged?.status, 'error', 'SCF Not Converged should have error status');
        assert.strictEqual(aborting?.status, 'error', 'Aborting should have error status');
    });

    test('should return empty array for empty file', () => {
        const entries = parseTocEntries('');
        assert.strictEqual(entries.length, 0);
    });

    test('should have accurate line numbers', () => {
        const content = `Line 1
Line 2
                         FINAL SINGLE POINT ENERGY      -76.123456789
Line 4
                         ****HURRAY******
Line 6`;

        const entries = parseTocEntries(content);
        
        const energyEntry = entries.find(e => e.title === 'Final Energy');
        const hurrayEntry = entries.find(e => e.title === 'HURRAY');
        
        assert.strictEqual(energyEntry?.lineNumber, 3, 'Final Energy should be at line 3');
        assert.strictEqual(hurrayEntry?.lineNumber, 5, 'HURRAY should be at line 5');
    });

    test('should have unique IDs for each entry', () => {
        const content = `
            SCF ITERATIONS
            SCF ITERATIONS
            SCF ITERATIONS
        `;

        const entries = parseTocEntries(content);
        const ids = entries.map(e => e.id);
        const uniqueIds = new Set(ids);
        
        assert.strictEqual(ids.length, uniqueIds.size, 'All entry IDs should be unique');
    });

    test('should set correct icons for sections', () => {
        const content = `
                                                 *****************
                                                 * O   R   C   A *
                                                 *****************
            SCF ITERATIONS
            VIBRATIONAL FREQUENCIES
            THERMOCHEMISTRY
        `;

        const entries = parseTocEntries(content);
        
        const headerEntry = entries.find(e => e.title === 'ORCA Header');
        const scfEntry = entries.find(e => e.title === 'SCF Iterations');
        const freqEntry = entries.find(e => e.title === 'Vibrational Frequencies');
        const thermoEntry = entries.find(e => e.title === 'Thermochemistry');
        
        assert.strictEqual(headerEntry?.icon, '📋', 'ORCA Header should have 📋 icon');
        assert.strictEqual(scfEntry?.icon, '🔄', 'SCF Iterations should have 🔄 icon');
        assert.strictEqual(freqEntry?.icon, '🎵', 'Vibrational Frequencies should have 🎵 icon');
        assert.strictEqual(thermoEntry?.icon, '🌡️', 'Thermochemistry should have 🌡️ icon');
    });

    test('should set success status for converged sections', () => {
        const content = `
            SCF CONVERGED
            THE OPTIMIZATION HAS CONVERGED
            HURRAY
        `;

        const entries = parseTocEntries(content);
        
        entries.forEach(entry => {
            if (['SCF Converged', 'Optimization Converged', 'HURRAY'].includes(entry.title)) {
                assert.strictEqual(entry.status, 'success', `${entry.title} should have success status`);
            }
        });
    });

    test('should include tocEntries in ParsedResults', () => {
        const content = `
            FINAL SINGLE POINT ENERGY      -76.123456789
            ****HURRAY******
        `;

        const result = parseOrcaOutputEnhanced(content);
        
        assert.ok(Array.isArray(result.tocEntries), 'tocEntries should be an array');
        assert.ok(result.tocEntries.length > 0, 'tocEntries should not be empty for valid content');
    });
});
