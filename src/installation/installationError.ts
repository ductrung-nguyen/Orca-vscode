/**
 * Installation Error Handling System
 * Provides comprehensive error types, pattern matching, and remediation logic
 */

/**
 * Types of installation errors
 */
export enum InstallationErrorType {
    NetworkError = 'network-error',
    DiskSpaceError = 'disk-space-error',
    PermissionError = 'permission-error',
    PackageNotFoundError = 'package-not-found-error',
    DependencyError = 'dependency-error',
    TimeoutError = 'timeout-error',
    CancellationError = 'cancellation-error',
    ValidationError = 'validation-error',
    UnknownError = 'unknown-error'
}

/**
 * Installation error with context and remediation
 */
export interface InstallationError {
    type: InstallationErrorType;
    message: string;
    originalError?: Error;
    remediation: string[];
    canRetry: boolean;
    details?: string;
    command?: string;
    exitCode?: number;
}

/**
 * Error pattern for matching against outputs
 */
interface ErrorPattern {
    type: InstallationErrorType;
    patterns: RegExp[];
    remediation: string[];
    canRetry: boolean;
}

/**
 * Predefined error patterns for common installation issues
 */
const ERROR_PATTERNS: ErrorPattern[] = [
    // Network errors
    {
        type: InstallationErrorType.NetworkError,
        patterns: [
            /connection\s+timeout/i,
            /network\s+is\s+unreachable/i,
            /failed\s+to\s+connect/i,
            /could\s+not\s+resolve\s+host/i,
            /CondaHTTPError/i,
            /URLError/i,
            /ConnectionError/i
        ],
        remediation: [
            'Check your internet connection',
            'Verify firewall settings allow Conda/package manager access',
            'Try using a different network (e.g., disable VPN)',
            'Retry the installation'
        ],
        canRetry: true
    },
    
    // Disk space errors
    {
        type: InstallationErrorType.DiskSpaceError,
        patterns: [
            /no\s+space\s+left\s+on\s+device/i,
            /disk\s+is\s+full/i,
            /insufficient\s+disk\s+space/i,
            /not\s+enough\s+free\s+space/i
        ],
        remediation: [
            'Free up at least 2GB of disk space',
            'Remove unused files or applications',
            'Empty trash/recycle bin',
            'Consider installing on a different drive'
        ],
        canRetry: false
    },
    
    // Permission errors
    {
        type: InstallationErrorType.PermissionError,
        patterns: [
            /permission\s+denied/i,
            /access\s+denied/i,
            /operation\s+not\s+permitted/i,
            /EACCES/i,
            /EPERM/i
        ],
        remediation: [
            'Run the installation with appropriate permissions',
            'On Linux/macOS: Use sudo for system-wide package managers',
            'Check write permissions for Conda environment directory',
            'Try installing in user home directory instead'
        ],
        canRetry: true
    },
    
    // Package not found errors
    {
        type: InstallationErrorType.PackageNotFoundError,
        patterns: [
            /package.*not\s+found/i,
            /PackageNotFoundError/i,
            /no\s+such\s+package/i,
            /unable\s+to\s+locate\s+package/i
        ],
        remediation: [
            'Verify the package repository is accessible',
            'Update package manager channels (conda config --add channels conda-forge)',
            'Check if ORCA is available for your platform',
            'Try manual installation from ORCA forum'
        ],
        canRetry: false
    },
    
    // Dependency errors
    {
        type: InstallationErrorType.DependencyError,
        patterns: [
            /dependency\s+conflict/i,
            /incompatible\s+packages/i,
            /UnsatisfiableError/i,
            /conflicts\s+with/i
        ],
        remediation: [
            'Create a fresh Conda environment for ORCA',
            'Update existing packages: conda update --all',
            'Remove conflicting packages manually',
            'Try installing in a clean environment'
        ],
        canRetry: true
    },
    
    // Timeout errors
    {
        type: InstallationErrorType.TimeoutError,
        patterns: [
            /timeout/i,
            /timed\s+out/i,
            /operation\s+exceeded\s+deadline/i
        ],
        remediation: [
            'Retry the installation (server may be temporarily slow)',
            'Check your internet connection speed',
            'Try during off-peak hours',
            'Consider manual installation'
        ],
        canRetry: true
    },
    
    // Cancellation
    {
        type: InstallationErrorType.CancellationError,
        patterns: [
            /cancelled\s+by\s+user/i,
            /operation\s+cancelled/i,
            /installation\s+aborted/i
        ],
        remediation: [
            'Restart the installation if needed',
            'Clean up partial installation before retrying'
        ],
        canRetry: true
    }
];

/**
 * Error parser and handler
 */
export class InstallationErrorHandler {
    /**
     * Parse error from installation output/exception
     * @param error Source error (string, Error object, or unknown)
     * @param command Command that was executed
     * @param exitCode Process exit code
     * @returns Structured installation error with remediation
     */
    static parseError(
        error: string | Error | unknown,
        command?: string,
        exitCode?: number
    ): InstallationError {
        const errorText = this.extractErrorText(error);
        
        // Try to match against known patterns
        for (const pattern of ERROR_PATTERNS) {
            if (pattern.patterns.some(regex => regex.test(errorText))) {
                return {
                    type: pattern.type,
                    message: this.extractUserFriendlyMessage(errorText, pattern.type),
                    originalError: error instanceof Error ? error : undefined,
                    remediation: pattern.remediation,
                    canRetry: pattern.canRetry,
                    details: errorText,
                    command,
                    exitCode
                };
            }
        }
        
        // Unknown error type
        return {
            type: InstallationErrorType.UnknownError,
            message: this.extractUserFriendlyMessage(errorText, InstallationErrorType.UnknownError),
            originalError: error instanceof Error ? error : undefined,
            remediation: [
                'Check the error details below for more information',
                'Try manual installation as a fallback',
                'Report this issue if problem persists'
            ],
            canRetry: true,
            details: errorText,
            command,
            exitCode
        };
    }
    
    /**
     * Extract error text from various error types
     */
    private static extractErrorText(error: string | Error | unknown): string {
        if (typeof error === 'string') {
            return error;
        }
        if (error instanceof Error) {
            return `${error.message}\n${error.stack || ''}`;
        }
        return String(error);
    }
    
    /**
     * Extract user-friendly message from technical error
     */
    private static extractUserFriendlyMessage(errorText: string, type: InstallationErrorType): string {
        switch (type) {
            case InstallationErrorType.NetworkError:
                return 'Network connection failed during installation';
            case InstallationErrorType.DiskSpaceError:
                return 'Insufficient disk space to complete installation';
            case InstallationErrorType.PermissionError:
                return 'Permission denied while installing ORCA';
            case InstallationErrorType.PackageNotFoundError:
                return 'ORCA package not found in repository';
            case InstallationErrorType.DependencyError:
                return 'Package dependency conflict detected';
            case InstallationErrorType.TimeoutError:
                return 'Installation timed out';
            case InstallationErrorType.CancellationError:
                return 'Installation cancelled by user';
            case InstallationErrorType.ValidationError:
                return 'Installation completed but validation failed';
            default: {
                // Try to extract first meaningful line
                const lines = errorText.split('\n').filter(l => l.trim());
                return lines[0] || 'Installation failed unexpectedly';
            }
        }
    }
    
    /**
     * Create validation error
     */
    static createValidationError(message: string, details?: string): InstallationError {
        return {
            type: InstallationErrorType.ValidationError,
            message,
            remediation: [
                'Verify ORCA binary is executable',
                'Check ORCA installation directory structure',
                'Try reinstalling ORCA',
                'Consult ORCA documentation for system requirements'
            ],
            canRetry: true,
            details
        };
    }
    
    /**
     * Create cancellation error
     */
    static createCancellationError(): InstallationError {
        return {
            type: InstallationErrorType.CancellationError,
            message: 'Installation cancelled by user',
            remediation: [
                'Restart installation when ready',
                'Ensure partial installations are cleaned up'
            ],
            canRetry: true
        };
    }
}

/**
 * Retry strategy with exponential backoff
 */
export class RetryStrategy {
    private maxRetries: number;
    private baseDelay: number;
    private maxDelay: number;
    
    constructor(maxRetries: number = 3, baseDelay: number = 1000, maxDelay: number = 30000) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
    }
    
    /**
     * Calculate delay for next retry attempt
     * @param attempt Current attempt number (0-indexed)
     * @returns Delay in milliseconds
     */
    getDelay(attempt: number): number {
        const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
        return Math.min(exponentialDelay, this.maxDelay);
    }
    
    /**
     * Check if should retry based on attempt count
     */
    shouldRetry(attempt: number): boolean {
        return attempt < this.maxRetries;
    }
    
    /**
     * Execute function with retry logic
     * @param fn Function to execute
     * @param isRetryable Function to determine if error is retryable
     * @returns Result of function execution
     */
    async executeWithRetry<T>(
        fn: () => Promise<T>,
        isRetryable: (error: unknown) => boolean = () => true
    ): Promise<T> {
        let lastError: unknown;
        
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                // Check if error is retryable
                if (!isRetryable(error)) {
                    throw error;
                }
                
                // Check if more attempts remain
                if (!this.shouldRetry(attempt + 1)) {
                    break;
                }
                
                // Wait before retry
                const delay = this.getDelay(attempt);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }
    
    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
