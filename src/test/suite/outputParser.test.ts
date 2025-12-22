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
            GEOMETRY OPTIMIZATION CYCLE 1
            Energy = -76.1234567
            MAX gradient = 0.012345
            RMS gradient = 0.001234
            MAX step = 0.023456
            RMS step = 0.002345
            
            GEOMETRY OPTIMIZATION CYCLE 2
            Energy = -76.2345678
            MAX gradient = 0.001234
            RMS gradient = 0.000123
            MAX step = 0.012345
            RMS step = 0.001234
            Geometry convergence ... YES
        `;
        
        const steps = parseGeometrySteps(content);
        assert.strictEqual(steps.length, 2);
        assert.strictEqual(steps[0].stepNumber, 1);
        assert.strictEqual(steps[0].energy, -76.1234567);
        assert.strictEqual(steps[1].converged, true);
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
            FINAL SINGLE POINT ENERGY      -76.123456789
            
            SCF ITERATIONS
            --------------
            ITER       Energy         Delta-E        Max-DP      RMS-DP
            0   -75.9876543210   0.0000000000   0.0123456   0.0012345
            1   -76.1234567890  -0.1358024680   0.0001234   0.0000123
            --------------
            
            GEOMETRY OPTIMIZATION CYCLE 1
            Energy = -76.123456789
            MAX gradient = 0.000123
            RMS gradient = 0.000012
            Geometry convergence ... YES
            
            THE OPTIMIZATION HAS CONVERGED
            
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
            --------------
            ITER       Energy         Delta-E
            0   -7.59876543E+01   0.00000000E+00
            --------------
        `;
        
        const result = parseOrcaOutputEnhanced(content);
        assert.strictEqual(result.finalEnergy, -76.12345678);
        assert.strictEqual(result.scfIterations.length, 1);
    });
});
