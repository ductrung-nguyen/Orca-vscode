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
 * Comprehensive parsed results from ORCA output
 */
export interface ParsedResults {
    // Basic convergence
    converged: boolean;
    scfFailed: boolean;
    finalEnergy: number | null;
    
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
        totalRunTime: null
    };

    // Basic convergence checks
    result.converged = content.includes('HURRAY');
    result.scfFailed = content.includes('SCF NOT CONVERGED');
    
    // Extract final energy
    const energyMatch = content.match(/FINAL SINGLE POINT ENERGY\s+([-\d.]+)/);
    if (energyMatch) {
        result.finalEnergy = parseFloat(energyMatch[1]);
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

    return result;
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
            const match = line.match(/^\s*(\d+)\s+([-]?\d+\.\d+)\s+([-]?\d+\.\d+[EeDd]?[+-]?\d*)\s+([-]?\d+\.\d+[EeDd]?[+-]?\d*)\s+([-]?\d+\.\d+[EeDd]?[+-]?\d*)/);
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
