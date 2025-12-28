/**
 * Enhanced ORCA output parser with comprehensive result extraction
 */

/**
 * Geometry optimization step information
 */
export interface GeometryStep {
    stepNumber: number;
    energy: number;
    maxGradient: number;
    rmsGradient: number;
    maxStep: number;
    rmsStep: number;
    converged: boolean;
    deltaEnergy?: number;
}

/**
 * Vibrational frequency information
 */
export interface FrequencyData {
    modeNumber: number;
    frequency: number; // in cm^-1
    intensity: number;
    isImaginary: boolean;
}

/**
 * SCF iteration information
 */
export interface ScfIteration {
    iteration: number;
    energy: number;
    deltaE: number;
    maxDensityChange: number;
    rmsDensityChange: number;
}

/**
 * Warning or error message
 */
export interface DiagnosticMessage {
    type: 'warning' | 'error';
    message: string;
    lineNumber?: number;
}

/**
 * Table of Contents entry for navigation
 * Supports hierarchical tree structure for iteration grouping
 */
export interface TocEntry {
    /** Unique identifier (e.g., 'scf-iterations-42') */
    id: string;
    /** Display name (e.g., 'SCF Iterations') */
    title: string;
    /** 1-indexed line number in output file */
    lineNumber: number;
    /** Emoji icon (e.g., '🔄') */
    icon?: string;
    /** Optional status indicator */
    status?: 'success' | 'warning' | 'error';
    /** Child entries for hierarchical grouping */
    children?: TocEntry[];
    /** Whether this group is collapsed (default state) */
    isCollapsed?: boolean;
    /** True if this is a parent/grouping node */
    isParent?: boolean;
}

/**
 * Comprehensive parsed results from ORCA output
 */
export interface ParsedResults {
    // File information (added by dashboard panel)
    fileName?: string;
    filePath?: string;
    
    // Job information
    calculationType?: string;
    method?: string;
    basis?: string;
    charge?: number;
    multiplicity?: number;
    
    // Basic convergence
    converged: boolean;
    scfFailed: boolean;
    finalEnergy: number | null;
    jobStatus: 'finished' | 'running' | 'died' | 'killed' | 'unknown';
    
    // SCF details
    scfCycles: number;
    scfIterations: ScfIteration[];
    
    // Geometry optimization
    optimizationConverged: boolean;
    geometrySteps: GeometryStep[];
    finalGeometryStep: GeometryStep | null;
    
    // Frequencies
    hasFrequencies: boolean;
    frequencies: FrequencyData[];
    imaginaryFreqCount: number;
    zeroPointEnergy: number | null;
    
    // Diagnostics
    warnings: DiagnosticMessage[];
    errors: DiagnosticMessage[];
    hasErrors: boolean;
    
    // Timing
    totalRunTime: number | null; // in seconds
    
    // Table of Contents
    tocEntries: TocEntry[];
}

/**
 * Parse ORCA output and extract comprehensive results
 * @param content Full ORCA output content
 * @returns Comprehensive parsed results
 */
export function parseOrcaOutputEnhanced(content: string): ParsedResults {
    const result: ParsedResults = {
        converged: false,
        scfFailed: false,
        finalEnergy: null,
        jobStatus: 'unknown',
        scfCycles: 0,
        scfIterations: [],
        optimizationConverged: false,
        geometrySteps: [],
        finalGeometryStep: null,
        hasFrequencies: false,
        frequencies: [],
        imaginaryFreqCount: 0,
        zeroPointEnergy: null,
        warnings: [],
        errors: [],
        hasErrors: false,
        totalRunTime: null,
        tocEntries: []
    };

    // Parse input line for method, basis, and calculation type
    // Look for lines starting with ! (ignoring leading whitespace and potential line numbers/prefixes)
    const inputLineMatch = content.match(/(?:^|\n)\s*(?:\|\s*\d+>\s*)?!\s*(.+)$/m);
    if (inputLineMatch) {
        const inputLine = inputLineMatch[1].trim().toUpperCase();
        const keywords = inputLine.split(/\s+/);
        
        // Common DFT methods and Wavefunction methods
        const methods = [
            'B3LYP', 'PBE', 'PBE0', 'BP86', 'TPSS', 'M06', 'M062X', 'WB97X', 'WB97X-D3', 'WB97M-V',
            'CAM-B3LYP', 'B97-3C', 'R2SCAN-3C', 'PBEH-3C',
            'HF', 'RHF', 'UHF', 'ROHF',
            'MP2', 'RI-MP2', 'DLPNO-MP2',
            'CCSD', 'CCSD(T)', 'DLPNO-CCSD', 'DLPNO-CCSD(T)',
            'CASSCF', 'NEVPT2'
        ];
        // Common basis sets
        const basisSets = [
            'DEF2-SVP', 'DEF2-TZVP', 'DEF2-TZVPP', 'DEF2-QZVP', 'DEF2-QZVPP',
            'DEF2-SV(P)', 'MA-DEF2-SVP', 'MA-DEF2-TZVP',
            'CC-PVDZ', 'CC-PVTZ', 'CC-PVQZ', 'CC-PV5Z',
            'AUG-CC-PVDZ', 'AUG-CC-PVTZ', 'AUG-CC-PVQZ',
            '6-31G', '6-31G*', '6-31G**', '6-311G', '6-311G*', '6-311G**',
            'STO-3G', '3-21G', '6-311+G*', '6-311+G**',
            'PC-1', 'PC-2', 'PC-3', 'PCSSEG-1', 'PCSSEG-2'
        ];
        // Calculation types
        const calcTypes = ['OPT', 'FREQ', 'OPTFREQ', 'SP', 'ENGRAD', 'MD', 'NEB', 'TS', 'GRADIENT', 'NUMFREQ'];
        
        for (const kw of keywords) {
            if (methods.includes(kw) && !result.method) {
                result.method = kw;
            }
            if (basisSets.includes(kw) && !result.basis) {
                result.basis = kw;
            }
            if (calcTypes.includes(kw)) {
                if (kw === 'OPT') {
                    result.calculationType = 'Geometry Optimization';
                } else if (kw === 'OPTFREQ') {
                    result.calculationType = 'Optimization + Frequencies';
                } else if (kw === 'FREQ' || kw === 'NUMFREQ') {
                    result.calculationType = 'Frequency Analysis';
                } else if (kw === 'SP') {
                    result.calculationType = 'Single Point';
                } else if (kw === 'TS' || kw === 'NEB') {
                    result.calculationType = 'Transition State';
                } else {
                    result.calculationType = kw;
                }
            }
        }
        // Default calculation type
        if (!result.calculationType) {
            result.calculationType = 'Single Point';
        }
    }
    
    // Parse charge and multiplicity from xyz block
    const chargeMultMatch = content.match(/\*\s*xyz\s+(-?\d+)\s+(\d+)/i);
    if (chargeMultMatch) {
        result.charge = parseInt(chargeMultMatch[1], 10);
        result.multiplicity = parseInt(chargeMultMatch[2], 10);
    }

    // Basic convergence checks
    result.converged = content.includes('HURRAY');
    result.scfFailed = content.includes('SCF NOT CONVERGED');
    
    // Extract final energy (use last occurrence for optimization jobs)
    const energyMatches = [...content.matchAll(/FINAL SINGLE POINT ENERGY\s+([+-]?\d+\.?\d*(?:[eE][+-]?\d+)?)/g)];
    if (energyMatches.length > 0) {
        result.finalEnergy = parseFloat(energyMatches[energyMatches.length - 1][1]);
    }
    
    // Geometry optimization
    result.optimizationConverged = content.includes('THE OPTIMIZATION HAS CONVERGED');
    
    // Check for frequencies
    result.hasFrequencies = content.includes('VIBRATIONAL FREQUENCIES');
    
    // Parse detailed information
    result.scfCycles = countScfCycles(content);
    result.scfIterations = parseScfIterations(content);
    result.geometrySteps = parseGeometrySteps(content);
    result.finalGeometryStep = result.geometrySteps.length > 0 
        ? result.geometrySteps[result.geometrySteps.length - 1] 
        : null;
    result.frequencies = parseFrequencies(content);
    result.imaginaryFreqCount = result.frequencies.filter(f => f.isImaginary).length;
    result.zeroPointEnergy = parseZeroPointEnergy(content);
    result.warnings = parseWarnings(content);
    result.errors = parseErrors(content);
    result.hasErrors = result.errors.length > 0 || result.scfFailed;
    result.totalRunTime = parseTotalRunTime(content);
    result.tocEntries = parseTocEntries(content);
    result.jobStatus = detectJobStatus(content);

    return result;
}

/**
 * Detect job status from ORCA output content
 */
function detectJobStatus(content: string): 'finished' | 'died' | 'unknown' {
    if (content.includes('****ORCA TERMINATED NORMALLY****')) {
        return 'finished';
    }
    if (content.includes('ABORTING') || 
        content.includes('ORCA finished by error termination')) {
        return 'died';
    }
    return 'unknown';
}

/**
 * Count the number of SCF cycles in the output
 */
export function countScfCycles(content: string): number {
    const regex = /SCF ITERATIONS/gi;
    const matches = content.match(regex);
    return matches ? matches.length : 0;
}

/**
 * Parse SCF iteration details
 */
export function parseScfIterations(content: string): ScfIteration[] {
    const iterations: ScfIteration[] = [];
    const lines = content.split('\n');
    
    let inScfSection = false;
    
    for (const line of lines) {
        // Detect SCF iterations section
        if (/SCF ITERATIONS/i.test(line)) {
            inScfSection = true;
            continue;
        }
        
        // Exit SCF section
        if (inScfSection && /^-+$/.test(line)) {
            inScfSection = false;
            continue;
        }
        
        // Parse iteration line
        if (inScfSection) {
            // Format: iteration energy deltaE maxDP rmsDP
            const match = line.match(/^\s*(\d+)\s+([-]?\d+\.\d+[EeDd]?[+-]?\d*)\s+([-]?\d+\.\d+[EeDd]?[+-]?\d*)\s+([-]?\d+\.\d+[EeDd]?[+-]?\d*)\s+([-]?\d+\.\d+[EeDd]?[+-]?\d*)/);
            if (match) {
                iterations.push({
                    iteration: parseInt(match[1]),
                    energy: parseFloat(match[2]),
                    deltaE: parseFloat(match[3]),
                    maxDensityChange: parseFloat(match[4]),
                    rmsDensityChange: parseFloat(match[5])
                });
            }
        }
    }
    
    return iterations;
}

/**
 * Parse geometry optimization steps
 */
export function parseGeometrySteps(content: string): GeometryStep[] {
    const steps: GeometryStep[] = [];
    const lines = content.split('\n');
    
    let currentStep: Partial<GeometryStep> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect geometry cycle (format: *  GEOMETRY OPTIMIZATION CYCLE   N  *)
        const cycleMatch = line.match(/GEOMETRY OPTIMIZATION CYCLE\s+(\d+)/i);
        if (cycleMatch) {
            if (currentStep && currentStep.stepNumber !== undefined) {
                steps.push(currentStep as GeometryStep);
            }
            currentStep = {
                stepNumber: parseInt(cycleMatch[1]),
                converged: false
            };
            continue;
        }
        
        if (currentStep) {
            // Extract energy from "FINAL SINGLE POINT ENERGY" (appears after each cycle)
            const finalEnergyMatch = line.match(/FINAL SINGLE POINT ENERGY\s+([-]?\d+\.\d+)/i);
            if (finalEnergyMatch) {
                currentStep.energy = parseFloat(finalEnergyMatch[1]);
            }
            
            // Also try "SCF Energy" format for simpler outputs
            const scfEnergyMatch = line.match(/SCF Energy\s*:\s*([-]?\d+\.\d+)/i);
            if (scfEnergyMatch && currentStep.energy === undefined) {
                currentStep.energy = parseFloat(scfEnergyMatch[1]);
            }
            
            // Extract gradient from formatted table line:
            // "          RMS gradient        0.0075687691            0.0000080000      NO"
            const rmsGradTableMatch = line.match(/^\s*RMS gradient\s+([-]?\d+\.?\d*[EeDd]?[+-]?\d*)/i);
            if (rmsGradTableMatch) {
                currentStep.rmsGradient = parseFloat(rmsGradTableMatch[1].replace(/[DdEe]/g, 'e'));
            }
            
            const maxGradTableMatch = line.match(/^\s*MAX gradient\s+([-]?\d+\.?\d*[EeDd]?[+-]?\d*)/i);
            if (maxGradTableMatch) {
                currentStep.maxGradient = parseFloat(maxGradTableMatch[1].replace(/[DdEe]/g, 'e'));
            }
            
            // Extract step information from formatted table
            const rmsStepMatch = line.match(/^\s*RMS step\s+([-]?\d+\.?\d*[EeDd]?[+-]?\d*)/i);
            if (rmsStepMatch) {
                currentStep.rmsStep = parseFloat(rmsStepMatch[1].replace(/[DdEe]/g, 'e'));
            }
            
            const maxStepMatch = line.match(/^\s*MAX step\s+([-]?\d+\.?\d*[EeDd]?[+-]?\d*)/i);
            if (maxStepMatch) {
                currentStep.maxStep = parseFloat(maxStepMatch[1].replace(/[DdEe]/g, 'e'));
            }
            
            // Check convergence (THE OPTIMIZATION HAS CONVERGED)
            if (/THE OPTIMIZATION HAS CONVERGED/i.test(line) || /Geometry convergence.*YES/i.test(line)) {
                currentStep.converged = true;
            }
        }
    }
    
    // Add last step if exists
    if (currentStep && currentStep.stepNumber !== undefined) {
        steps.push(currentStep as GeometryStep);
    }
    
    // Calculate delta energies
    for (let i = 0; i < steps.length; i++) {
        if (i === 0) {
            steps[i].deltaEnergy = undefined;
        } else if (steps[i].energy !== undefined && steps[i-1].energy !== undefined) {
            steps[i].deltaEnergy = steps[i].energy - steps[i-1].energy;
        }
    }
    
    return steps;
}

/**
 * Parse frequency table
 */
export function parseFrequencies(content: string): FrequencyData[] {
    const frequencies: FrequencyData[] = [];
    const lines = content.split('\n');
    
    let inFreqSection = false;
    
    for (const line of lines) {
        // Detect frequency section
        if (/VIBRATIONAL FREQUENCIES/i.test(line)) {
            inFreqSection = true;
            continue;
        }
        
        // Exit frequency section
        if (inFreqSection && /^-+$/.test(line.trim())) {
            // Check if this is the end marker
            if (frequencies.length > 0) {
                inFreqSection = false;
            }
            continue;
        }
        
        // Parse frequency line
        if (inFreqSection) {
            // Format: mode: frequency cm**-1 intensity
            // Also handles: mode: frequency cm**-1 ***imaginary mode***
            const match = line.match(/^\s*(\d+):\s*([-]?\d+\.\d+)\s+cm\*\*-1.*?(\d+\.\d+)/);
            if (match) {
                const freq = parseFloat(match[2]);
                const isImaginary = freq < 0 || line.includes('***imaginary mode***');
                frequencies.push({
                    modeNumber: parseInt(match[1]),
                    frequency: isImaginary ? Math.abs(freq) : freq,
                    intensity: parseFloat(match[3]),
                    isImaginary: isImaginary
                });
            }
        }
    }
    
    return frequencies;
}

/**
 * Parse zero-point energy
 */
export function parseZeroPointEnergy(content: string): number | null {
    const match = content.match(/Zero point energy\s*\.*\s*([-]?\d+\.\d+)/i);
    return match ? parseFloat(match[1]) : null;
}

/**
 * Parse warnings from output
 */
export function parseWarnings(content: string): DiagnosticMessage[] {
    const warnings: DiagnosticMessage[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (/WARNING|Warning/i.test(line) && !/ERROR/i.test(line)) {
            warnings.push({
                type: 'warning',
                message: line.trim(),
                lineNumber: i + 1
            });
        }
        
        // Imaginary frequencies are warnings
        if (/\*\*\*imaginary mode\*\*\*/i.test(line)) {
            warnings.push({
                type: 'warning',
                message: 'Imaginary frequency detected',
                lineNumber: i + 1
            });
        }
        
        // Wavefunction not converged
        if (/Wavefunction not converged/i.test(line)) {
            warnings.push({
                type: 'warning',
                message: line.trim(),
                lineNumber: i + 1
            });
        }
    }
    
    return warnings;
}

/**
 * Parse errors from output
 */
export function parseErrors(content: string): DiagnosticMessage[] {
    const errors: DiagnosticMessage[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // SCF not converged
        if (/SCF NOT CONVERGED/i.test(line)) {
            errors.push({
                type: 'error',
                message: 'SCF did not converge',
                lineNumber: i + 1
            });
        }
        
        // Explicit errors
        if (/ERROR|Error/i.test(line) && !/WARNING/i.test(line)) {
            errors.push({
                type: 'error',
                message: line.trim(),
                lineNumber: i + 1
            });
        }
        
        // Aborting
        if (/ABORTING/i.test(line)) {
            errors.push({
                type: 'error',
                message: line.trim(),
                lineNumber: i + 1
            });
        }
        
        // Memory errors
        if (/Not enough memory|cannot allocate memory/i.test(line)) {
            errors.push({
                type: 'error',
                message: 'Memory allocation error',
                lineNumber: i + 1
            });
        }
    }
    
    return errors;
}

/**
 * Parse total run time
 */
export function parseTotalRunTime(content: string): number | null {
    const match = content.match(/TOTAL RUN TIME:\s*(\d+)\s*days?\s*(\d+)\s*hours?\s*(\d+)\s*minutes?\s*(\d+)\s*seconds?\s*(\d+)\s*msec/i);
    if (match) {
        const days = parseInt(match[1]);
        const hours = parseInt(match[2]);
        const minutes = parseInt(match[3]);
        const seconds = parseInt(match[4]);
        const msec = parseInt(match[5]);
        
        return days * 86400 + hours * 3600 + minutes * 60 + seconds + msec / 1000;
    }
    
    return null;
}

/**
 * Legacy function for backward compatibility
 */
export interface OrcaParseResult {
    converged: boolean;
    scfFailed: boolean;
    finalEnergy: number | null;
    optimizationConverged: boolean;
    hasFrequencies: boolean;
    imaginaryFreqCount: number;
    hasErrors: boolean;
}

export function parseOrcaOutput(content: string): OrcaParseResult {
    const enhanced = parseOrcaOutputEnhanced(content);
    
    return {
        converged: enhanced.converged,
        scfFailed: enhanced.scfFailed,
        finalEnergy: enhanced.finalEnergy,
        optimizationConverged: enhanced.optimizationConverged,
        hasFrequencies: enhanced.hasFrequencies,
        imaginaryFreqCount: enhanced.imaginaryFreqCount,
        hasErrors: enhanced.hasErrors
    };
}

/**
 * Section pattern definition for TOC parsing
 */
interface TocPattern {
    id: string;
    regex: RegExp;
    title: string;
    icon: string;
    status?: 'success' | 'warning' | 'error';
}

/**
 * Parse ORCA output and extract Table of Contents entries
 * Supports hierarchical grouping of geometry optimization cycles
 * @param content Full ORCA output content
 * @returns Array of TOC entries with line numbers (hierarchical structure)
 */
export function parseTocEntries(content: string): TocEntry[] {
    const entries: TocEntry[] = [];
    const lines = content.split('\n');

    // Patterns for cycle detection
    const cyclePattern = /GEOMETRY OPTIMIZATION CYCLE\s+(\d+)/i;
    const altCyclePattern = /-+\s*CYCLE\s+(\d+)\s*-+/i;

    // Capture optimization cycles with their start lines
    const cycles: Array<{ cycleNumber: number; startLine: number; startIndex: number }> = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(cyclePattern) || line.match(altCyclePattern);
        if (match) {
            const cycleNumber = parseInt(match[1], 10);
            cycles.push({ cycleNumber, startLine: i + 1, startIndex: i });
        }
    }

    const hasCycles = cycles.length > 0;

    // Build cycle ranges to know what line ranges belong to iterations
    const cycleRanges: Array<{ start: number; end: number }> = [];
    if (hasCycles) {
        for (let idx = 0; idx < cycles.length; idx++) {
            const start = cycles[idx].startIndex;
            const end = cycles[idx + 1] ? cycles[idx + 1].startIndex - 1 : lines.length - 1;
            cycleRanges.push({ start, end });
        }
    }

    // Helper to check if a line index is inside any cycle
    const isInsideCycle = (lineIdx: number): boolean => {
        return cycleRanges.some(range => lineIdx >= range.start && lineIdx <= range.end);
    };

    // Top-level patterns (professional icons; no emoji)
    // If cycles exist, skip iteration-specific patterns at top level
    const iterationSpecificPatterns = ['scf-iterations', 'scf-converged', 'scf-not-converged', 'final-energy'];
    const topLevelPatterns: TocPattern[] = [
        { id: 'orca-header', regex: /^\s*\*+\s*O\s+R\s+C\s+A\s*\*+/, title: 'ORCA Header', icon: 'pi pi-book' },
        { id: 'input-file', regex: /INPUT FILE/i, title: 'Input File', icon: 'pi pi-file' },
        { id: 'basis-set', regex: /Orbital basis set information/i, title: 'Basis Set Info', icon: 'pi pi-sitemap' },
        { id: 'geometry-opt', regex: /GEOMETRY OPTIMIZATION(?!.*CYCLE)/i, title: 'Geometry Optimization', icon: 'pi pi-folder' },
        { id: 'opt-converged', regex: /THE OPTIMIZATION HAS CONVERGED/i, title: 'Optimization Converged', icon: 'pi pi-check-circle', status: 'success' },
        { id: 'frequencies', regex: /VIBRATIONAL FREQUENCIES/i, title: 'Vibrational Frequencies', icon: 'pi pi-wave-pulse' },
        { id: 'thermochemistry', regex: /THERMOCHEMISTRY/i, title: 'Thermochemistry', icon: 'pi pi-thermometer' },
        { id: 'total-run-time', regex: /TOTAL RUN TIME/i, title: 'Total Run Time', icon: 'pi pi-clock' },
        { id: 'hurray', regex: /HURRAY/i, title: 'HURRAY', icon: 'pi pi-check', status: 'success' },
        { id: 'aborting', regex: /ABORTING/i, title: 'Aborting', icon: 'pi pi-times-circle', status: 'error' },
        // Only include iteration-specific patterns if no cycles (single-point calculations)
        { id: 'scf-iterations', regex: /SCF ITERATIONS/i, title: 'SCF Iterations', icon: 'pi pi-refresh' },
        { id: 'scf-converged', regex: /SCF CONVERGED/i, title: 'SCF Converged', icon: 'pi pi-check-circle', status: 'success' },
        { id: 'scf-not-converged', regex: /SCF NOT CONVERGED/i, title: 'SCF Not Converged', icon: 'pi pi-times-circle', status: 'error' },
        { id: 'final-energy', regex: /FINAL SINGLE POINT ENERGY/i, title: 'Final Energy', icon: 'pi pi-bolt' },
    ];

    // Track where to insert the iterations group (after geometry optimization header if present)
    let iterationsInsertIndex = -1;

    // Add top-level anchors
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip cycle header lines - they'll be in the iterations tree
        if (hasCycles && (cyclePattern.test(line) || altCyclePattern.test(line))) {
            continue;
        }
        
        for (const pattern of topLevelPatterns) {
            if (pattern.regex.test(line)) {
                // Skip iteration-specific patterns if they're inside a cycle (will be in the iterations tree)
                if (hasCycles && iterationSpecificPatterns.includes(pattern.id) && isInsideCycle(i)) {
                    continue;
                }
                const entry: TocEntry = {
                    id: `${pattern.id}-${i}`,
                    title: pattern.title,
                    lineNumber: i + 1,
                    icon: pattern.icon,
                    status: pattern.status
                };
                entries.push(entry);
                if (pattern.id === 'geometry-opt' && iterationsInsertIndex === -1) {
                    iterationsInsertIndex = entries.length; // insert after this
                }
                break;
            }
        }
    }

    // Build "N Iterations" -> "Iteration k" -> [SCF/Final Energy/...] tree
    if (cycles.length > 0) {
        const sortedCycles = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber);

        // Determine each cycle's end boundary (next cycle start - 1, or end of file)
        const iterationNodes: TocEntry[] = [];
        for (let idx = 0; idx < sortedCycles.length; idx++) {
            const current = sortedCycles[idx];
            const next = sortedCycles[idx + 1];
            const start = current.startIndex;
            const end = next ? next.startIndex - 1 : lines.length - 1;

            const children: TocEntry[] = [];

            const findInRange = (regex: RegExp): number | null => {
                for (let j = start; j <= end; j++) {
                    if (regex.test(lines[j])) return j + 1;
                }
                return null;
            };

            const scfIterLine = findInRange(/SCF ITERATIONS/i);
            if (scfIterLine) {
                children.push({
                    id: `iter-${current.cycleNumber}-scf-iterations`,
                    title: 'SCF Iterations',
                    lineNumber: scfIterLine,
                    icon: 'pi pi-refresh'
                });
            }

            const scfConvLine = findInRange(/SCF CONVERGED/i);
            if (scfConvLine) {
                children.push({
                    id: `iter-${current.cycleNumber}-scf-converged`,
                    title: 'SCF Converged',
                    lineNumber: scfConvLine,
                    icon: 'pi pi-check-circle',
                    status: 'success'
                });
            }

            const scfFailLine = findInRange(/SCF NOT CONVERGED/i);
            if (scfFailLine) {
                children.push({
                    id: `iter-${current.cycleNumber}-scf-not-converged`,
                    title: 'SCF Not Converged',
                    lineNumber: scfFailLine,
                    icon: 'pi pi-times-circle',
                    status: 'error'
                });
            }

            const finalEnergyLine = findInRange(/FINAL SINGLE POINT ENERGY/i);
            if (finalEnergyLine) {
                children.push({
                    id: `iter-${current.cycleNumber}-final-energy`,
                    title: 'Final Energy',
                    lineNumber: finalEnergyLine,
                    icon: 'pi pi-bolt'
                });
            }

            // If we didn't find any sub-anchors, still make the iteration navigable to its start
            const iterationNode: TocEntry = {
                id: `iteration-${current.cycleNumber}`,
                title: `Iteration ${current.cycleNumber}`,
                lineNumber: current.startLine,
                icon: 'pi pi-repeat',
                isParent: children.length > 0,
                isCollapsed: true,
                children: children.length > 0 ? children : undefined
            };

            iterationNodes.push(iterationNode);
        }

        const iterationsGroup: TocEntry = {
            id: 'iterations-group',
            title: `${iterationNodes.length} Iterations`,
            lineNumber: iterationNodes[0]?.lineNumber ?? 1,
            icon: 'pi pi-list',
            isParent: true,
            isCollapsed: iterationNodes.length > 10,
            children: iterationNodes
        };

        // Avoid duplicating old cycle entries: insert our new group near geometry-opt if present.
        if (iterationsInsertIndex >= 0 && iterationsInsertIndex <= entries.length) {
            entries.splice(iterationsInsertIndex, 0, iterationsGroup);
        } else {
            entries.unshift(iterationsGroup);
        }
    }

    return entries;
}
