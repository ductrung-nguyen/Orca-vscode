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
    dependencies: { [key: string]: boolean }; // e.g., {openmpi: true, libblas: false}
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
  links?: { text: string; url: string }[];

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
 * Note: Only minimal state (current step) is persisted for resuming the wizard.
 * Full wizard context (detections, validations) is re-fetched on resume.
 */
export interface WizardState {
  /** Current step index (0-4: Welcome, Detection, Download, Path, Completion) */
  currentStep: number;

  /** Timestamp of last wizard interaction (for state expiration) */
  timestamp: number;
}

/**
 * OS platform type
 */
export enum Platform {
  Linux = "linux",
  MacOS = "darwin",
  Windows = "win32",
}

/**
 * Installation method type
 */
export enum InstallationMethod {
  /** @deprecated Not supported */
  Conda = "conda",
  /** @deprecated Not supported */
  Homebrew = "homebrew",
  /** @deprecated Not supported */
  Apt = "apt",
  /** @deprecated Not supported */
  Yum = "yum",
  /** Manual installation from ORCA Forum */
  Manual = "manual",
  /** @deprecated Not supported */
  PackageManager = "package-manager",
}

// ============================================================================
// Automated Installation Types (kept for compatibility)
// ============================================================================

/**
 * Package manager enum (kept for compatibility)
 * @deprecated No package manager provides ORCA quantum chemistry
 */
export enum PackageManager {
  /** @deprecated */
  Conda = "conda",
  /** @deprecated */
  Homebrew = "brew",
  /** @deprecated */
  Apt = "apt",
  /** @deprecated */
  Yum = "yum",
  /** @deprecated */
  Winget = "winget",
}

/**
 * Progress callback for real-time installation updates
 */
export interface ProgressCallback {
  (percentage: number, message: string): void;
}

/**
 * Result of an automated installation attempt
 */
export interface AutoInstallResult {
  success: boolean;
  binaryPath?: string;
  version?: string;
  error?: string;
  duration: number; // seconds
}

/**
 * Result of command execution
 */
export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

/**
 * Installation error with remediation guidance
 */
export interface AutoInstallationError {
  code: string;
  message: string;
  originalError?: Error;
  remediation: string[];
  canRetry: boolean;
  details?: Record<string, unknown>;
}

/**
 * Command execution options
 */
export interface CommandOptions {
  sudo?: boolean;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

/**
 * Package manager detection result
 */
export interface PackageManagerInfo {
  manager: PackageManager;
  available: boolean;
  version?: string;
  path?: string;
  priority: number; // Lower is higher priority
  requiresSudo: boolean;
}

/**
 * Stream output callback
 */
export interface OutputCallback {
  (line: string): void;
}
