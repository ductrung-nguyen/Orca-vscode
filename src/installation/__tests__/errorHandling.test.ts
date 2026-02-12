/**
 * Tests for Installation Error Handling System
 */

import {
    InstallationErrorHandler,
    InstallationErrorType,
    RetryStrategy
} from '../installationError';

describe('InstallationErrorHandler', () => {
    describe('parseError', () => {
        it('should detect network errors', () => {
            const error = 'CondaHTTPError: connection timeout while downloading package';
            const result = InstallationErrorHandler.parseError(error);
            
            expect(result.type).toBe(InstallationErrorType.NetworkError);
            expect(result.canRetry).toBe(true);
            expect(result.remediation.length).toBeGreaterThan(0);
        });
        
        it('should detect disk space errors', () => {
            const error = 'Error: No space left on device';
            const result = InstallationErrorHandler.parseError(error);
            
            expect(result.type).toBe(InstallationErrorType.DiskSpaceError);
            expect(result.canRetry).toBe(false);
        });
        
        it('should detect permission errors', () => {
            const error = 'EACCES: permission denied, mkdir /usr/local/orca';
            const result = InstallationErrorHandler.parseError(error);
            
            expect(result.type).toBe(InstallationErrorType.PermissionError);
            expect(result.canRetry).toBe(true);
        });
        
        it('should detect package not found errors', () => {
            const error = 'PackageNotFoundError: Package orca not found in channels';
            const result = InstallationErrorHandler.parseError(error);
            
            expect(result.type).toBe(InstallationErrorType.PackageNotFoundError);
            expect(result.canRetry).toBe(false);
        });
        
        it('should handle unknown errors gracefully', () => {
            const error = 'Some random unexpected error';
            const result = InstallationErrorHandler.parseError(error);
            
            expect(result.type).toBe(InstallationErrorType.UnknownError);
            expect(result.canRetry).toBe(true);
            expect(result.remediation).toContain('Check the error details below for more information');
        });
        
        it('should extract command and exit code', () => {
            const error = 'Installation failed';
            const command = 'conda install orca';
            const exitCode = 1;
            
            const result = InstallationErrorHandler.parseError(error, command, exitCode);
            
            expect(result.command).toBe(command);
            expect(result.exitCode).toBe(exitCode);
        });
        
        it('should handle Error objects', () => {
            const error = new Error('Test error message');
            const result = InstallationErrorHandler.parseError(error);
            
            expect(result.message).toContain('error');
            expect(result.originalError).toBe(error);
        });
    });
    
    describe('createValidationError', () => {
        it('should create validation error with default remediation', () => {
            const result = InstallationErrorHandler.createValidationError(
                'ORCA binary not executable',
                'chmod check failed'
            );
            
            expect(result.type).toBe(InstallationErrorType.ValidationError);
            expect(result.message).toBe('ORCA binary not executable');
            expect(result.details).toBe('chmod check failed');
            expect(result.canRetry).toBe(true);
        });
    });
    
    describe('createCancellationError', () => {
        it('should create cancellation error', () => {
            const result = InstallationErrorHandler.createCancellationError();
            
            expect(result.type).toBe(InstallationErrorType.CancellationError);
            expect(result.canRetry).toBe(true);
        });
    });
});

describe('RetryStrategy', () => {
    describe('getDelay', () => {
        it('should calculate exponential backoff correctly', () => {
            const strategy = new RetryStrategy(3, 1000, 30000);
            
            expect(strategy.getDelay(0)).toBe(1000);  // 1s
            expect(strategy.getDelay(1)).toBe(2000);  // 2s
            expect(strategy.getDelay(2)).toBe(4000);  // 4s
            expect(strategy.getDelay(3)).toBe(8000);  // 8s
        });
        
        it('should respect maximum delay', () => {
            const strategy = new RetryStrategy(10, 1000, 5000);
            
            expect(strategy.getDelay(10)).toBe(5000);  // capped at max
        });
    });
    
    describe('shouldRetry', () => {
        it('should allow retries within limit', () => {
            const strategy = new RetryStrategy(3);
            
            expect(strategy.shouldRetry(0)).toBe(true);
            expect(strategy.shouldRetry(1)).toBe(true);
            expect(strategy.shouldRetry(2)).toBe(true);
        });
        
        it('should block retries beyond limit', () => {
            const strategy = new RetryStrategy(3);
            
            expect(strategy.shouldRetry(3)).toBe(false);
            expect(strategy.shouldRetry(4)).toBe(false);
        });
    });
    
    describe('executeWithRetry', () => {
        it('should succeed on first attempt', async () => {
            const strategy = new RetryStrategy(3, 100);
            let attempts = 0;
            
            const result = await strategy.executeWithRetry(async () => {
                attempts++;
                return 'success';
            });
            
            expect(result).toBe('success');
            expect(attempts).toBe(1);
        });
        
        it('should retry on failure and eventually succeed', async () => {
            const strategy = new RetryStrategy(3, 100);
            let attempts = 0;
            
            const result = await strategy.executeWithRetry(async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            });
            
            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });
        
        it('should throw after max retries', async () => {
            const strategy = new RetryStrategy(3, 100);
            let attempts = 0;
            
            await expect(
                strategy.executeWithRetry(async () => {
                    attempts++;
                    throw new Error('Persistent failure');
                })
            ).rejects.toThrow('Persistent failure');
            
            expect(attempts).toBe(3);
        });
        
        it('should not retry non-retryable errors', async () => {
            const strategy = new RetryStrategy(3, 100);
            let attempts = 0;
            
            await expect(
                strategy.executeWithRetry(
                    async () => {
                        attempts++;
                        throw new Error('Non-retryable');
                    },
                    (error) => false // never retry
                )
            ).rejects.toThrow('Non-retryable');
            
            expect(attempts).toBe(1);
        });
    });
});
