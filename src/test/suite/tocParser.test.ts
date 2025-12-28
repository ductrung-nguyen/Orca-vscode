/**
 * Unit tests for ORCA output parser - TOC generation
 */
import * as assert from 'assert';
import { parseTocEntries, TocEntry } from '../../outputParser';

suite('TOC Parser Tests', () => {
    test('Single-point calculation - flat structure', () => {
        const content = `
*****************************
*         O   R   C   A      *
*****************************

INPUT FILE
=========

Basis set information
---------------------

SCF ITERATIONS
==============
  0    -76.123456  0.000000e+00  0.000001  0.000002

SCF CONVERGED
-------------

FINAL SINGLE POINT ENERGY    -76.123456

TOTAL RUN TIME: 0 days 0 hours 0 minutes 1 seconds 234 msec
`;

        const toc = parseTocEntries(content);
        
        console.log('\n========== Single-Point TOC ==========');
        console.log(JSON.stringify(toc, null, 2));
        console.log('=======================================\n');
        
        // Should have flat structure with no iterations group
        assert.ok(toc.length > 0, 'Should have TOC entries');
        
        // Find entries
        const orcaHeader = toc.find(e => e.title === 'ORCA Header');
        const scfIter = toc.find(e => e.title === 'SCF Iterations');
        const finalEnergy = toc.find(e => e.title === 'Final Energy');
        
        assert.ok(orcaHeader, 'Should have ORCA Header');
        assert.ok(scfIter, 'Should have SCF Iterations');
        assert.ok(finalEnergy, 'Should have Final Energy');
        
        // Should not have iterations group for single-point (parent node with "N Iterations" title)
        const iterGroup = toc.find(e => e.title.match(/^\d+ Iterations$/));
        assert.ok(!iterGroup, 'Should not have "N Iterations" group for single-point');
    });

    test('Optimization calculation - hierarchical structure', () => {
        const content = `
*****************************
*         O   R   C   A      *
*****************************

GEOMETRY OPTIMIZATION
=====================

***********************GEOMETRY OPTIMIZATION CYCLE   1***********************

SCF ITERATIONS
==============
  0    -76.123456  0.000000e+00  0.000001  0.000002

SCF CONVERGED
-------------

FINAL SINGLE POINT ENERGY    -76.123456

***********************GEOMETRY OPTIMIZATION CYCLE   2***********************

SCF ITERATIONS
==============
  0    -76.234567  0.000000e+00  0.000001  0.000002

SCF CONVERGED
-------------

FINAL SINGLE POINT ENERGY    -76.234567

***********************GEOMETRY OPTIMIZATION CYCLE   3***********************

SCF ITERATIONS
==============
  0    -76.345678  0.000000e+00  0.000001  0.000002

SCF CONVERGED
-------------

FINAL SINGLE POINT ENERGY    -76.345678

THE OPTIMIZATION HAS CONVERGED
`;

        const toc = parseTocEntries(content);
        
        console.log('\n========== TOC Structure ==========');
        console.log(JSON.stringify(toc, null, 2));
        console.log('===================================\n');
        
        // Should have iterations group
        const iterGroup = toc.find(e => e.title.includes('Iterations'));
        assert.ok(iterGroup, 'Should have Iterations group');
        assert.strictEqual(iterGroup?.title, '3 Iterations', 'Should show correct iteration count');
        assert.ok(iterGroup?.isParent, 'Iterations group should be marked as parent');
        assert.ok(iterGroup?.children, 'Iterations group should have children');
        assert.strictEqual(iterGroup?.children?.length, 3, 'Should have 3 iteration children');
        
        // Check first iteration structure
        const iter1 = iterGroup?.children?.[0];
        assert.ok(iter1, 'Should have Iteration 1');
        assert.strictEqual(iter1?.title, 'Iteration 1', 'First child should be Iteration 1');
        assert.ok(iter1?.children, 'Iteration 1 should have children');
        assert.ok(iter1?.children!.length > 0, 'Iteration 1 should have sub-entries');
        
        // Check iteration 1 sub-entries
        const scfIter = iter1?.children?.find(e => e.title === 'SCF Iterations');
        const scfConv = iter1?.children?.find(e => e.title === 'SCF Converged');
        const finalEnergy = iter1?.children?.find(e => e.title === 'Final Energy');
        
        assert.ok(scfIter, 'Iteration 1 should have SCF Iterations');
        assert.ok(scfConv, 'Iteration 1 should have SCF Converged');
        assert.ok(finalEnergy, 'Iteration 1 should have Final Energy');
        
        // Verify line numbers are set
        assert.ok(iter1?.lineNumber > 0, 'Iteration 1 should have valid lineNumber');
        assert.ok(scfIter?.lineNumber > 0, 'SCF Iterations should have valid lineNumber');
        assert.ok(finalEnergy?.lineNumber > 0, 'Final Energy should have valid lineNumber');
        
        // SCF/Final Energy should NOT appear at top level
        const topLevelScf = toc.find(e => e.title === 'SCF Iterations' && !e.id.startsWith('iter-'));
        const topLevelEnergy = toc.find(e => e.title === 'Final Energy' && !e.id.startsWith('iter-'));
        assert.ok(!topLevelScf, 'SCF Iterations should not appear at top level when in cycles');
        assert.ok(!topLevelEnergy, 'Final Energy should not appear at top level when in cycles');
    });

    test('Optimization with mixed patterns', () => {
        const content = `
*****************************
*         O   R   C   A      *
*****************************

INPUT FILE
=========

GEOMETRY OPTIMIZATION
=====================

***********************GEOMETRY OPTIMIZATION CYCLE   1***********************

SCF ITERATIONS
==============
  0    -76.123456  0.000000e+00  0.000001  0.000002

SCF NOT CONVERGED
-----------------

***********************GEOMETRY OPTIMIZATION CYCLE   2***********************

SCF ITERATIONS
==============
  0    -76.234567  0.000000e+00  0.000001  0.000002

SCF CONVERGED
-------------

FINAL SINGLE POINT ENERGY    -76.234567

THE OPTIMIZATION HAS CONVERGED

VIBRATIONAL FREQUENCIES
=======================

HURRAY
`;

        const toc = parseTocEntries(content);
        
        // Should have iterations group
        const iterGroup = toc.find(e => e.title.includes('Iterations'));
        assert.ok(iterGroup, 'Should have Iterations group');
        assert.strictEqual(iterGroup?.children?.length, 2, 'Should have 2 iterations');
        
        // Check cycle 1 has SCF Not Converged
        const iter1 = iterGroup?.children?.[0];
        const scfNotConv = iter1?.children?.find(e => e.title === 'SCF Not Converged');
        assert.ok(scfNotConv, 'Iteration 1 should have SCF Not Converged');
        assert.strictEqual(scfNotConv?.status, 'error', 'SCF Not Converged should have error status');
        
        // Check cycle 2 has SCF Converged and Final Energy
        const iter2 = iterGroup?.children?.[1];
        const scfConv = iter2?.children?.find(e => e.title === 'SCF Converged');
        const finalEnergy = iter2?.children?.find(e => e.title === 'Final Energy');
        assert.ok(scfConv, 'Iteration 2 should have SCF Converged');
        assert.ok(finalEnergy, 'Iteration 2 should have Final Energy');
        
        // Top-level patterns should still appear
        const optConv = toc.find(e => e.title === 'Optimization Converged');
        const freqs = toc.find(e => e.title === 'Vibrational Frequencies');
        const hurray = toc.find(e => e.title === 'HURRAY');
        
        assert.ok(optConv, 'Should have Optimization Converged at top level');
        assert.ok(freqs, 'Should have Vibrational Frequencies at top level');
        assert.ok(hurray, 'Should have HURRAY at top level');
    });

    test('Empty content - no crashes', () => {
        const toc = parseTocEntries('');
        assert.ok(Array.isArray(toc), 'Should return array for empty content');
        assert.strictEqual(toc.length, 0, 'Should have no entries for empty content');
    });

    test('Content without cycles - no iterations group', () => {
        const content = `
ORCA HEADER
INPUT FILE
TOTAL RUN TIME
`;
        const toc = parseTocEntries(content);
        const iterGroup = toc.find(e => e.title.includes('Iterations'));
        assert.ok(!iterGroup, 'Should not create iterations group without cycles');
    });
});
