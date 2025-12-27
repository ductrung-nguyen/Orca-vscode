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
}

/**
 * Comprehensive parsed results from ORCA output
 */
export interface ParsedResults {
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
        
        // Detect geometry cycle
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
            // Extract energy
            const energyMatch = line.match(/Energy\s*=\s*([-]?\d+\.\d+)/i);
            if (energyMatch) {
                currentStep.energy = parseFloat(energyMatch[1]);
            }
            
            // Extract gradient information
            const maxGradMatch = line.match(/MAX gradient\s*([-]?\d+\.\d+[EeDd]?[+-]?\d*)/i);
            if (maxGradMatch) {
                currentStep.maxGradient = parseFloat(maxGradMatch[1]);
            }
            
            const rmsGradMatch = line.match(/RMS gradient\s*([-]?\d+\.\d+[EeDd]?[+-]?\d*)/i);
            if (rmsGradMatch) {
                currentStep.rmsGradient = parseFloat(rmsGradMatch[1]);
            }
            
            // Extract step information
            const maxStepMatch = line.match(/MAX step\s*([-]?\d+\.\d+[EeDd]?[+-]?\d*)/i);
            if (maxStepMatch) {
                currentStep.maxStep = parseFloat(maxStepMatch[1]);
            }
            
            const rmsStepMatch = line.match(/RMS step\s*([-]?\d+\.\d+[EeDd]?[+-]?\d*)/i);
            if (rmsStepMatch) {
                currentStep.rmsStep = parseFloat(rmsStepMatch[1]);
            }
            
            // Check convergence
            if (/Geometry convergence.*YES/i.test(line)) {
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
 * @param content Full ORCA output content
 * @returns Array of TOC entries with line numbers
 */
export function parseTocEntries(content: string): TocEntry[] {
    const entries: TocEntry[] = [];
    const lines = content.split('\n');
    
    // Section detection patterns (from PRD FR-002)
    const patterns: TocPattern[] = [
        { id: 'orca-header', regex: /^\s*\*+\s+O\s+R\s+C\s+A\s+\*+/, title: 'ORCA Header', icon: '📋' },
        { id: 'input-file', regex: /INPUT FILE/i, title: 'Input File', icon: '📝' },
        { id: 'basis-set', regex: /Orbital basis set information/i, title: 'Basis Set Info', icon: '🔬' },
        { id: 'warnings', regex: /^-+\s*WARNINGS\s*-+$/i, title: 'Warnings', icon: '⚠️', status: 'warning' },
        { id: 'scf-iterations', regex: /SCF ITERATIONS/i, title: 'SCF Iterations', icon: '🔄' },
        { id: 'scf-converged', regex: /SCF CONVERGED/i, title: 'SCF Converged', icon: '✅', status: 'success' },
        { id: 'scf-not-converged', regex: /SCF NOT CONVERGED/i, title: 'SCF Not Converged', icon: '❌', status: 'error' },
        { id: 'geometry-opt', regex: /GEOMETRY OPTIMIZATION|OPTIMIZATION RUN/i, title: 'Geometry Optimization', icon: '📐' },
        { id: 'opt-converged', regex: /THE OPTIMIZATION HAS CONVERGED/i, title: 'Optimization Converged', icon: '✅', status: 'success' },
        { id: 'frequencies', regex: /VIBRATIONAL FREQUENCIES/i, title: 'Vibrational Frequencies', icon: '🎵' },
        { id: 'thermochemistry', regex: /THERMOCHEMISTRY/i, title: 'Thermochemistry', icon: '🌡️' },
        { id: 'final-energy', regex: /FINAL SINGLE POINT ENERGY/i, title: 'Final Energy', icon: '⚡' },
        { id: 'total-run-time', regex: /TOTAL RUN TIME/i, title: 'Total Run Time', icon: '⏱️' },
        { id: 'hurray', regex: /HURRAY/i, title: 'HURRAY', icon: '🎉', status: 'success' },
        { id: 'aborting', regex: /ABORTING/i, title: 'Aborting', icon: '🚫', status: 'error' }
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of patterns) {
            if (pattern.regex.test(line)) {
                entries.push({
                    id: `${pattern.id}-${i}`,
                    title: pattern.title,
                    lineNumber: i + 1, // 1-indexed
                    icon: pattern.icon,
                    status: pattern.status
                });
                break; // Only match first pattern per line
            }
        }
    }
    
    return entries;
}
