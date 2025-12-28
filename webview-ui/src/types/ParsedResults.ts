/**
 * TypeScript type definitions for parsed ORCA results
 * These types match the output from src/outputParser.ts
 */

/**
 * Table of Contents entry for navigation sidebar
 */
export interface TocEntry {
  /** Unique identifier (e.g., 'scf-iterations') */
  id: string;
  /** Display name (e.g., 'SCF Iterations') */
  title: string;
  /** 1-indexed line number in output file */
  lineNumber: number;
  /** Optional icon (emoji or icon class) */
  icon?: string;
  /** Status indicator for visual styling */
  status?: 'success' | 'warning' | 'error';
  /** Child entries for hierarchical grouping */
  children?: TocEntry[];
  /** Whether this group is collapsed by default */
  isCollapsed?: boolean;
  /** True if this is a parent/grouping node */
  isParent?: boolean;
}

/**
 * SCF iteration data
 */
export interface ScfIteration {
  /** Iteration number (1-indexed) */
  iteration: number;
  /** Total energy in Hartree */
  energy: number;
  /** Energy change from previous iteration */
  deltaE: number;
  /** Maximum density change */
  maxDensityChange: number;
  /** RMS density change */
  rmsDensityChange: number;
}

/**
 * Geometry optimization cycle data
 */
export interface GeometryStep {
  /** Optimization step number (1-indexed) */
  stepNumber: number;
  /** Total energy in Hartree */
  energy: number;
  /** Maximum gradient component */
  maxGradient: number;
  /** RMS gradient */
  rmsGradient: number;
  /** Maximum step size */
  maxStep: number;
  /** RMS step size */
  rmsStep: number;
  /** Whether this step converged */
  converged: boolean;
  /** Energy change from previous step */
  deltaEnergy?: number;
}

/**
 * Vibrational frequency data
 */
export interface FrequencyData {
  /** Mode number (1-indexed) */
  modeNumber: number;
  /** Frequency in cm⁻¹ */
  frequency: number;
  /** IR intensity (km/mol) */
  intensity: number;
  /** True if frequency is imaginary (negative) */
  isImaginary: boolean;
}

/**
 * Warning or error diagnostic message
 */
export interface DiagnosticMessage {
  /** Message type */
  type: 'warning' | 'error';
  /** Message text */
  message: string;
  /** Line number in output file (if available) */
  lineNumber?: number;
}

/**
 * Timing section breakdown
 */
export interface TimingSection {
  /** Section name (e.g., 'SCF', 'Geometry Optimization') */
  name: string;
  /** Formatted time string */
  time: string;
  /** Percentage of total time */
  percentage: number;
}

/**
 * Timing information
 */
export interface TimingInfo {
  /** Total run time formatted string */
  totalTime: string;
  /** Total run time in seconds */
  totalSeconds: number;
  /** Breakdown by section */
  sections: TimingSection[];
}

/**
 * Job status from ORCA execution
 */
export type JobStatus = 'finished' | 'running' | 'died' | 'killed' | 'unknown';

/**
 * Complete parsed results from ORCA output
 * This is the main data structure passed from extension to webview
 */
export interface ParsedResults {
  // === File Information ===
  /** Base name of the output file */
  fileName: string;
  /** Full path to output file */
  filePath?: string;

  // === Job Information ===
  /** Current job status */
  jobStatus: JobStatus;
  /** Calculation type (e.g., 'Single Point', 'Geometry Optimization') */
  calculationType?: string;
  /** Method used (e.g., 'B3LYP', 'HF') */
  method?: string;
  /** Basis set (e.g., 'def2-SVP') */
  basis?: string;
  /** Molecular charge */
  charge?: number;
  /** Spin multiplicity */
  multiplicity?: number;

  // === Convergence ===
  /** Overall SCF convergence status */
  converged: boolean;
  /** True if SCF failed to converge */
  scfFailed: boolean;
  /** Geometry optimization convergence status */
  optimizationConverged: boolean;

  // === Energy ===
  /** Final single point energy in Hartree */
  finalEnergy: number | null;
  /** Zero-point energy correction (if available) */
  zeroPointEnergy: number | null;

  // === SCF Data ===
  /** Number of SCF cycles */
  scfCycles: number;
  /** Detailed SCF iteration data */
  scfIterations: ScfIteration[];

  // === Optimization Data ===
  /** Detailed geometry optimization steps */
  geometrySteps: GeometryStep[];
  /** Final geometry step (for quick access) */
  finalGeometryStep: GeometryStep | null;

  // === Frequency Data ===
  /** True if frequency calculation was performed */
  hasFrequencies: boolean;
  /** Vibrational frequency data */
  frequencies: FrequencyData[];
  /** Count of imaginary frequencies */
  imaginaryFreqCount: number;

  // === Diagnostics ===
  /** Warning messages */
  warnings: DiagnosticMessage[];
  /** Error messages */
  errors: DiagnosticMessage[];
  /** True if any errors occurred */
  hasErrors: boolean;

  // === Timing ===
  /** Total run time in seconds */
  totalRunTime: number | null;
  /** Detailed timing breakdown */
  timing?: TimingInfo;

  // === Navigation ===
  /** Table of contents entries for sidebar */
  tocEntries: TocEntry[];
}

/**
 * Helper type for components that only need a subset of data
 */
export type ParsedResultsMinimal = Pick<
  ParsedResults,
  'fileName' | 'converged' | 'finalEnergy' | 'jobStatus'
>;

/**
 * Message types received from the extension
 */
export type ExtensionMessage =
  | { type: 'updateData'; data: ParsedResults }
  | { type: 'themeChanged' }
  | { type: 'refresh' };
