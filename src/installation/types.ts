/**
 * Core type definitions for ORCA installation capability
 */

/**
 * Represents a detected ORCA installation
 */
export interface OrcaInstallation {
    /** Absolute path to the ORCA binary */
    path: string;
    
    /** ORCA version string (e.g., "5.0.4") */
    version: string;
    
    /** Whether this installation passes validation */
    isValid: boolean;
    
    /** Error message if validation failed */
    validationError?: string;
    
    /** Source of detection (e.g., "PATH", "standard-directory", "conda") */
    detectionSource?: string;
}

/**
 * Result of installation validation
 */
export interface ValidationResult {
    /** Overall validation success */
    success: boolean;
    
    /** Critical errors that prevent ORCA from running */
    errors: string[];
    
    /** Non-critical issues (ORCA may still work) */
    warnings: string[];
    
    /** Detailed installation information if validation succeeded */
    installationDetails?: {
        version: string;
        architecture: string; // e.g., "x86_64", "arm64"
        dependencies: {[key: string]: boolean}; // e.g., {openmpi: true, libblas: false}
        testJobPassed: boolean;
        testJobOutput?: string;
    };
}

/**
 * Installation step in wizard
 */
export interface InstallationStep {
    /** Step title */
    title: string;
    
    /** Detailed description */
    description: string;
    
    /** Shell commands to execute (user copies and runs) */
    commands?: string[];
    
    /** External links for downloads or documentation */
    links?: {text: string, url: string}[];
    
    /** Whether this step is required (vs. optional) */
    isRequired: boolean;
}

/**
 * Prerequisite for ORCA installation
 */
export interface Prerequisite {
    /** Name of the prerequisite (e.g., "OpenMPI") */
    name: string;
    
    /** Command to check if prerequisite is met */
    checkCommand: string;
    
    /** Command to install prerequisite (if available) */
    installCommand?: string;
    
    /** Whether this prerequisite is currently met */
    isMet: boolean;
    
    /** Error message if check failed */
    error?: string;
}

/**
 * Wizard state for persistence
 */
export interface WizardState {
    /** Current step index (0-6) */
    currentStep: number;
    
    /** Installations detected during wizard */
    detectedInstalls: OrcaInstallation[];
    
    /** Path selected by user */
    selectedPath?: string;
    
    /** Whether user acknowledged license terms */
    licenseAcknowledged: boolean;
    
    /** Whether validation passed */
    validationPassed: boolean;
    
    /** Timestamp of last wizard interaction (for state expiration) */
    timestamp: number;
}

/**
 * OS platform type
 */
export enum Platform {
    Linux = 'linux',
    MacOS = 'darwin',
    Windows = 'win32'
}

/**
 * Installation method type
 */
export enum InstallationMethod {
    Conda = 'conda',
    Manual = 'manual',
    PackageManager = 'package-manager' // apt, yum, brew, etc.
}
