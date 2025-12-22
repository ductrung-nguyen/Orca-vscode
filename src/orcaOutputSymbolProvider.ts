import * as vscode from 'vscode';

/**
 * Provides document symbols for ORCA output files to enable structured navigation
 * Creates a hierarchical table of contents from section headers
 */
export class OrcaOutputSymbolProvider implements vscode.DocumentSymbolProvider {
    /**
     * Parse ORCA output file and extract document structure
     * @param document The ORCA output document
     * @param token Cancellation token
     * @returns Array of document symbols representing the file structure
     */
    provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Section patterns to detect
        const patterns = {
            mainHeader: /^\s*\*+\s+O\s+R\s+C\s+A\s+\*+/,
            sectionTitle: /^[A-Z][A-Z\s]{5,}[A-Z]\s*$/,
            inputFile: /^.*INPUT FILE.*$/i,
            geometry: /^.*CARTESIAN COORDINATES.*$/i,
            scfIterations: /^.*SCF ITERATIONS.*$/i,
            scfConverged: /^.*SCF CONVERGED.*$/i,
            scfNotConverged: /^.*SCF NOT CONVERGED.*$/i,
            optimization: /^.*(GEOMETRY OPTIMIZATION|OPTIMIZATION RUN).*$/i,
            optConverged: /^.*THE OPTIMIZATION HAS CONVERGED.*$/i,
            frequencies: /^.*VIBRATIONAL FREQUENCIES.*$/i,
            thermochemistry: /^.*THERMOCHEMISTRY.*$/i,
            finalEnergy: /^.*FINAL SINGLE POINT ENERGY\s+([-]?\d+\.\d+).*$/,
            timing: /^.*TOTAL RUN TIME.*$/i,
            hurray: /^.*HURRAY.*$/i,
            aborting: /^.*ABORTING.*$/i,
            error: /^.*(ERROR|Error).*$/,
            warning: /^.*(WARNING|Warning).*$/
        };

        let currentSection: vscode.DocumentSymbol | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineRange = new vscode.Range(i, 0, i, line.length);

            // Main ORCA header
            if (patterns.mainHeader.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'ORCA Program Header',
                    '',
                    vscode.SymbolKind.Module,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // Input file section
            if (patterns.inputFile.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Input File',
                    '',
                    vscode.SymbolKind.Namespace,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // Geometry section
            if (patterns.geometry.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Cartesian Coordinates',
                    '',
                    vscode.SymbolKind.Struct,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // SCF iterations
            if (patterns.scfIterations.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'SCF Iterations',
                    '',
                    vscode.SymbolKind.Function,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // SCF convergence
            if (patterns.scfConverged.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'SCF Converged ✓',
                    '',
                    vscode.SymbolKind.Event,
                    lineRange,
                    lineRange
                );
                if (currentSection && currentSection.children) {
                    currentSection.children.push(symbol);
                } else {
                    symbols.push(symbol);
                }
                continue;
            }

            // SCF not converged
            if (patterns.scfNotConverged.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'SCF Not Converged ✗',
                    '',
                    vscode.SymbolKind.Event,
                    lineRange,
                    lineRange
                );
                if (currentSection && currentSection.children) {
                    currentSection.children.push(symbol);
                } else {
                    symbols.push(symbol);
                }
                continue;
            }

            // Geometry optimization
            if (patterns.optimization.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Geometry Optimization',
                    '',
                    vscode.SymbolKind.Function,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // Optimization converged
            if (patterns.optConverged.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Optimization Converged ✓',
                    '',
                    vscode.SymbolKind.Event,
                    lineRange,
                    lineRange
                );
                if (currentSection && currentSection.children) {
                    currentSection.children.push(symbol);
                } else {
                    symbols.push(symbol);
                }
                continue;
            }

            // Frequencies
            if (patterns.frequencies.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Vibrational Frequencies',
                    '',
                    vscode.SymbolKind.Array,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // Thermochemistry
            if (patterns.thermochemistry.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Thermochemistry',
                    '',
                    vscode.SymbolKind.Object,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // Final energy
            if (patterns.finalEnergy.test(line)) {
                const match = line.match(patterns.finalEnergy);
                const energyValue = match ? match[1] : '';
                const symbol = new vscode.DocumentSymbol(
                    'Final Single Point Energy',
                    energyValue + ' Eh',
                    vscode.SymbolKind.Constant,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                continue;
            }

            // HURRAY (successful completion)
            if (patterns.hurray.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Calculation Successful ✓',
                    'HURRAY',
                    vscode.SymbolKind.Event,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                continue;
            }

            // Timing information
            if (patterns.timing.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Timing Information',
                    '',
                    vscode.SymbolKind.Property,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                currentSection = symbol;
                continue;
            }

            // ABORTING (error)
            if (patterns.aborting.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Calculation Aborted ✗',
                    line.trim(),
                    vscode.SymbolKind.Event,
                    lineRange,
                    lineRange
                );
                symbols.push(symbol);
                continue;
            }

            // Errors
            if (patterns.error.test(line) && !patterns.warning.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Error',
                    line.trim().substring(0, 50),
                    vscode.SymbolKind.Event,
                    lineRange,
                    lineRange
                );
                if (currentSection && currentSection.children) {
                    currentSection.children.push(symbol);
                } else {
                    symbols.push(symbol);
                }
                continue;
            }

            // Warnings
            if (patterns.warning.test(line)) {
                const symbol = new vscode.DocumentSymbol(
                    'Warning',
                    line.trim().substring(0, 50),
                    vscode.SymbolKind.Event,
                    lineRange,
                    lineRange
                );
                if (currentSection && currentSection.children) {
                    currentSection.children.push(symbol);
                } else {
                    symbols.push(symbol);
                }
                continue;
            }
        }

        return symbols;
    }
}
