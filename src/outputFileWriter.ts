import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration options for OutputFileWriter
 */
export interface OutputFileWriterOptions {
    /** Path to the input file (used to derive output file name) */
    inputFilePath: string;
    /** Whether to append to existing file or overwrite */
    append?: boolean;
    /** Custom output file path (optional, overrides default naming) */
    customOutputPath?: string;
}

/**
 * Handles writing ORCA execution output to .out files
 * Supports real-time streaming and proper resource cleanup
 */
export class OutputFileWriter {
    private writeStream: fs.WriteStream | null = null;
    private outputFilePath: string;
    private isOpen: boolean = false;

    constructor(private options: OutputFileWriterOptions) {
        this.outputFilePath = this.determineOutputPath();
    }

    /**
     * Determine the output file path based on input file
     * @returns Absolute path to the .out file
     */
    private determineOutputPath(): string {
        if (this.options.customOutputPath) {
            return this.options.customOutputPath;
        }

        const inputFile = this.options.inputFilePath;
        const parsedPath = path.parse(inputFile);
        return path.join(parsedPath.dir, `${parsedPath.name}.out`);
    }

    /**
     * Initialize the file writer and create/open the output file
     * @returns Promise that resolves when file is ready for writing
     */
    public async open(): Promise<void> {
        if (this.isOpen) {
            throw new Error('OutputFileWriter is already open');
        }

        try {
            // Create write stream with UTF-8 encoding
            const flags = this.options.append ? 'a' : 'w';
            this.writeStream = fs.createWriteStream(this.outputFilePath, {
                flags,
                encoding: 'utf8'
            });

            // Wait for the stream to be ready
            await new Promise<void>((resolve, reject) => {
                this.writeStream!.once('open', () => {
                    this.isOpen = true;
                    resolve();
                });
                this.writeStream!.once('error', reject);
            });
        } catch (error) {
            throw new Error(`Failed to open output file: ${error}`);
        }
    }

    /**
     * Write a chunk of data to the output file
     * @param data String data to write
     * @returns Promise that resolves when data is written
     */
    public async write(data: string): Promise<void> {
        if (!this.isOpen || !this.writeStream) {
            throw new Error('OutputFileWriter is not open');
        }

        return new Promise((resolve, reject) => {
            const canContinue = this.writeStream!.write(data, 'utf8', (error) => {
                if (error) {
                    reject(new Error(`Failed to write to output file: ${error}`));
                } else {
                    resolve();
                }
            });

            // Handle backpressure
            if (!canContinue) {
                this.writeStream!.once('drain', resolve);
            }
        });
    }

    /**
     * Write data synchronously (use for small chunks)
     * @param data String data to write
     */
    public writeSync(data: string): void {
        if (!this.isOpen || !this.writeStream) {
            throw new Error('OutputFileWriter is not open');
        }

        this.writeStream.write(data, 'utf8');
    }

    /**
     * Close the file writer and flush all pending writes
     * @returns Promise that resolves when file is closed
     */
    public async close(): Promise<void> {
        if (!this.isOpen || !this.writeStream) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.writeStream!.end((error?: Error) => {
                if (error) {
                    reject(new Error(`Failed to close output file: ${error}`));
                } else {
                    this.isOpen = false;
                    this.writeStream = null;
                    resolve();
                }
            });
        });
    }

    /**
     * Get the path to the output file
     */
    public getOutputPath(): string {
        return this.outputFilePath;
    }

    /**
     * Check if the writer is currently open
     */
    public isWriterOpen(): boolean {
        return this.isOpen;
    }

    /**
     * Force flush any buffered data to disk
     * @returns Promise that resolves when data is flushed
     */
    public async flush(): Promise<void> {
        if (!this.isOpen || !this.writeStream) {
            return;
        }

        return new Promise((resolve, reject) => {
            // Cast to any to access internal file descriptor
            const fd = (this.writeStream as any).fd;
            if (fd !== undefined) {
                fs.fsync(fd, (error) => {
                    if (error) {
                        reject(new Error(`Failed to flush output file: ${error}`));
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Dispose of resources (can be called multiple times safely)
     */
    public dispose(): void {
        if (this.writeStream && this.isOpen) {
            this.writeStream.end();
            this.isOpen = false;
            this.writeStream = null;
        }
    }
}
