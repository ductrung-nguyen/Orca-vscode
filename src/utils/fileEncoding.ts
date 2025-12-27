/**
 * File encoding detection and conversion utilities
 * Handles UTF-8, UTF-16 LE, UTF-16 BE, and ASCII encoded files
 */

import * as fs from 'fs';

/**
 * Detected file encoding types
 */
export type FileEncoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'ascii';

/**
 * Byte Order Mark (BOM) signatures for different encodings
 */
const BOM_SIGNATURES = {
    'utf-8': Buffer.from([0xEF, 0xBB, 0xBF]),
    'utf-16be': Buffer.from([0xFE, 0xFF]),
    'utf-16le': Buffer.from([0xFF, 0xFE]),
};

/**
 * Detect file encoding by reading the first few bytes
 * @param filePath Path to the file
 * @returns Detected encoding type
 */
export function detectFileEncoding(filePath: string): FileEncoding {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    
    try {
        fs.readSync(fd, buffer, 0, 4, 0);
    } finally {
        fs.closeSync(fd);
    }

    // Check for BOM signatures
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf-8';
    }
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        return 'utf-16be';
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return 'utf-16le';
    }

    // No BOM - try to detect UTF-16 by looking for null bytes pattern
    // UTF-16LE typically has null bytes after ASCII characters (e.g., 'O' = 0x4F 0x00)
    // UTF-16BE typically has null bytes before ASCII characters (e.g., 'O' = 0x00 0x4F)
    
    // Read more bytes to analyze the pattern
    const analysisBuffer = Buffer.alloc(1024);
    const fd2 = fs.openSync(filePath, 'r');
    let bytesRead = 0;
    
    try {
        bytesRead = fs.readSync(fd2, analysisBuffer, 0, 1024, 0);
    } finally {
        fs.closeSync(fd2);
    }

    if (bytesRead >= 4) {
        // Count null bytes in odd and even positions
        let nullInOdd = 0;  // UTF-16LE pattern: char, null, char, null
        let nullInEven = 0; // UTF-16BE pattern: null, char, null, char
        
        for (let i = 0; i < bytesRead; i++) {
            if (analysisBuffer[i] === 0x00) {
                if (i % 2 === 0) {
                    nullInEven++;
                } else {
                    nullInOdd++;
                }
            }
        }

        // If more than 20% of positions have nulls in a consistent pattern, it's likely UTF-16
        const threshold = bytesRead * 0.2;
        
        if (nullInOdd > threshold && nullInEven < threshold * 0.1) {
            return 'utf-16le';
        }
        if (nullInEven > threshold && nullInOdd < threshold * 0.1) {
            return 'utf-16be';
        }
    }

    // Default to UTF-8 (which is backward compatible with ASCII)
    return 'utf-8';
}

/**
 * Detect encoding from a buffer
 * @param buffer Buffer to analyze
 * @returns Detected encoding type
 */
export function detectBufferEncoding(buffer: Buffer): FileEncoding {
    // Check for BOM signatures
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf-8';
    }
    if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        return 'utf-16be';
    }
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return 'utf-16le';
    }

    // Analyze null byte pattern
    const analysisLength = Math.min(buffer.length, 1024);
    let nullInOdd = 0;
    let nullInEven = 0;
    
    for (let i = 0; i < analysisLength; i++) {
        if (buffer[i] === 0x00) {
            if (i % 2 === 0) {
                nullInEven++;
            } else {
                nullInOdd++;
            }
        }
    }

    const threshold = analysisLength * 0.2;
    
    if (nullInOdd > threshold && nullInEven < threshold * 0.1) {
        return 'utf-16le';
    }
    if (nullInEven > threshold && nullInOdd < threshold * 0.1) {
        return 'utf-16be';
    }

    return 'utf-8';
}

/**
 * Convert buffer to UTF-8 string based on detected encoding
 * @param buffer Buffer to convert
 * @param encoding Source encoding (auto-detected if not provided)
 * @returns UTF-8 string
 */
export function bufferToString(buffer: Buffer, encoding?: FileEncoding): string {
    const detectedEncoding = encoding || detectBufferEncoding(buffer);
    
    let content: string;
    let startOffset = 0;
    
    switch (detectedEncoding) {
        case 'utf-16le':
            // Skip BOM if present
            if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
                startOffset = 2;
            }
            content = buffer.slice(startOffset).toString('utf16le');
            break;
            
        case 'utf-16be':
            // Skip BOM if present
            if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
                startOffset = 2;
            }
            // Node.js doesn't have native utf16be, need to swap bytes
            const swapped = Buffer.alloc(buffer.length - startOffset);
            for (let i = startOffset; i < buffer.length - 1; i += 2) {
                swapped[i - startOffset] = buffer[i + 1];
                swapped[i - startOffset + 1] = buffer[i];
            }
            content = swapped.toString('utf16le');
            break;
            
        case 'utf-8':
        default:
            // Skip BOM if present
            if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
                startOffset = 3;
            }
            content = buffer.slice(startOffset).toString('utf-8');
            break;
    }
    
    // Normalize line endings to LF
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Read a file with automatic encoding detection
 * @param filePath Path to the file
 * @returns File content as UTF-8 string
 */
export function readFileWithEncoding(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return bufferToString(buffer);
}

/**
 * Read the last N bytes of a file with encoding detection
 * Used for efficiently reading the end of large ORCA output files
 * @param filePath Path to the file
 * @param bytesToRead Number of bytes to read from the end
 * @returns File content as UTF-8 string
 */
export function readFileTail(filePath: string, bytesToRead: number): string {
    const stats = fs.statSync(filePath);
    const actualBytesToRead = Math.min(stats.size, bytesToRead);
    
    // For UTF-16, we need to read even number of bytes and potentially more
    // to ensure we don't split a character
    const adjustedBytesToRead = actualBytesToRead + (actualBytesToRead % 2);
    
    // First, detect the encoding by reading the start of the file
    const encoding = detectFileEncoding(filePath);
    
    const buffer = Buffer.alloc(adjustedBytesToRead);
    const fd = fs.openSync(filePath, 'r');
    
    try {
        const startPosition = Math.max(0, stats.size - adjustedBytesToRead);
        fs.readSync(fd, buffer, 0, adjustedBytesToRead, startPosition);
    } finally {
        fs.closeSync(fd);
    }
    
    // For UTF-16, we need to handle the case where we might start mid-character
    if (encoding === 'utf-16le' || encoding === 'utf-16be') {
        // The tail buffer won't have BOM, so we need to pass encoding explicitly
        return bufferToString(buffer, encoding);
    }
    
    return bufferToString(buffer, encoding);
}

/**
 * Check if a file appears to be a valid text file
 * @param filePath Path to the file
 * @returns true if the file appears to be text
 */
export function isTextFile(filePath: string): boolean {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(512);
        
        try {
            const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
            
            // Check for binary content (non-text bytes)
            for (let i = 0; i < bytesRead; i++) {
                const byte = buffer[i];
                // Allow common control characters and printable ASCII
                // Also allow UTF-8 continuation bytes (0x80-0xBF) and UTF-8 start bytes (0xC0-0xFF)
                // And null bytes for UTF-16
                if (byte < 0x09 || (byte > 0x0D && byte < 0x20 && byte !== 0x00)) {
                    // Binary file
                    return false;
                }
            }
            
            return true;
        } finally {
            fs.closeSync(fd);
        }
    } catch {
        return false;
    }
}
