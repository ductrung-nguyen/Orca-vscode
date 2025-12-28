/**
 * Mock VS Code API for standalone development and testing
 * Uses localStorage as a fallback for state persistence
 */

const STORAGE_KEY = 'vscode-mock-state';

/**
 * Create a mock VS Code API that works outside of VS Code webview
 * Useful for development with `npm run dev` and unit testing
 */
export function createMockVSCodeApi(): VsCodeApi {
  let state: unknown = null;

  // Try to restore state from localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
    }
  } catch (e) {
    // Ignore parse errors
  }

  return {
    postMessage(message: unknown) {
      console.log('[Mock VS Code] postMessage:', message);
      
      // Simulate some responses for development
      if (typeof message === 'object' && message !== null) {
        const msg = message as { command?: string };
        switch (msg.command) {
          case 'refresh':
            console.log('[Mock VS Code] Would refresh data');
            break;
          case 'copyToClipboard':
            console.log('[Mock VS Code] Would copy to clipboard');
            break;
          case 'openOutputFile':
            console.log('[Mock VS Code] Would open output file');
            break;
          case 'goToLine':
            console.log('[Mock VS Code] Would go to line');
            break;
        }
      }
    },

    getState() {
      return state;
    },

    setState(newState: unknown) {
      state = newState;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        // Ignore storage errors (e.g., private browsing mode)
      }
    }
  };
}

/**
 * Clear the mock state from localStorage
 */
export function clearMockState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Get mock test data for development
 */
export function getMockParsedResults() {
  return {
    fileName: 'water_opt.out',
    calculationType: 'Geometry Optimization',
    method: 'B3LYP',
    basis: 'def2-SVP',
    charge: 0,
    multiplicity: 1,
    finalEnergy: -76.343567890123,
    converged: true,
    hasImaginaryFrequencies: false,
    scfIterations: [
      { iteration: 1, energy: -76.000000, deltaE: 0, rmsDp: 0.1, maxDp: 0.2, converged: false },
      { iteration: 2, energy: -76.200000, deltaE: -0.2, rmsDp: 0.05, maxDp: 0.1, converged: false },
      { iteration: 3, energy: -76.300000, deltaE: -0.1, rmsDp: 0.01, maxDp: 0.02, converged: false },
      { iteration: 4, energy: -76.340000, deltaE: -0.04, rmsDp: 0.001, maxDp: 0.002, converged: false },
      { iteration: 5, energy: -76.343567, deltaE: -0.003567, rmsDp: 0.0001, maxDp: 0.0002, converged: true }
    ],
    optimizationCycles: [
      { cycle: 1, energy: -76.300000, deltaE: 0, rmsGrad: 0.05, maxGrad: 0.1, rmsStep: 0.1, maxStep: 0.2, converged: false },
      { cycle: 2, energy: -76.330000, deltaE: -0.03, rmsGrad: 0.02, maxGrad: 0.04, rmsStep: 0.05, maxStep: 0.1, converged: false },
      { cycle: 3, energy: -76.340000, deltaE: -0.01, rmsGrad: 0.005, maxGrad: 0.01, rmsStep: 0.01, maxStep: 0.02, converged: false },
      { cycle: 4, energy: -76.343567, deltaE: -0.003567, rmsGrad: 0.0001, maxGrad: 0.0002, rmsStep: 0.001, maxStep: 0.002, converged: true }
    ],
    frequencies: [
      { mode: 1, frequency: 1648.5, intensity: 67.3, isImaginary: false },
      { mode: 2, frequency: 3657.2, intensity: 5.8, isImaginary: false },
      { mode: 3, frequency: 3756.8, intensity: 45.2, isImaginary: false }
    ],
    warnings: [],
    timing: {
      totalTime: '00:05:32',
      sections: [
        { name: 'SCF', time: '00:02:15', percentage: 40 },
        { name: 'Geometry Optimization', time: '00:02:45', percentage: 50 },
        { name: 'Other', time: '00:00:32', percentage: 10 }
      ]
    },
    tocEntries: [
      { id: 'summary', title: 'Summary', lineNumber: 1, icon: 'pi-info-circle' },
      { id: 'scf', title: 'SCF Iterations', lineNumber: 50, icon: 'pi-chart-line', status: 'success' },
      { id: 'opt', title: 'Geometry Optimization', lineNumber: 200, icon: 'pi-sitemap', status: 'success' },
      { id: 'freq', title: 'Frequencies', lineNumber: 500, icon: 'pi-wave-pulse' },
      { id: 'timing', title: 'Timing', lineNumber: 800, icon: 'pi-clock' }
    ]
  };
}
