import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { OutputFileWriter } from './outputFileWriter';
import { parseOrcaOutput, OrcaParseResult } from './outputParser';

// Re-export for backward compatibility
export { parseOrcaOutput, OrcaParseResult } from './outputParser';

// Legacy helper functions for backward compatibility
/**
 * Extract final energy from ORCA output
 * @param content ORCA output content
 * @returns Energy in Hartree or null if not found
 */
export function extractFinalEnergy(content: string): number | null {
    const energyMatch = content.match(/FINAL SINGLE POINT ENERGY\s+([-\d.]+)/);
    return energyMatch ? parseFloat(energyMatch[1]) : null;
}

/**
 * Check if calculation converged successfully
 * @param content ORCA output content
 * @returns true if HURRAY marker found
 */
export function checkConvergence(content: string): boolean {
    return content.includes('HURRAY');
}

/**
 * Count imaginary frequencies in output
 * @param content ORCA output content
 * @returns Number of imaginary frequencies
 */
export function countImaginaryFrequencies(content: string): number {
    const matches = content.match(/\*\*\*imaginary mode\*\*\*/g);
    return matches ? matches.length : 0;
}

export class OrcaRunner {
    private outputChannel: vscode.OutputChannel;
    private currentProcess: ChildProcess | null = null;
    private isRunning: boolean = false;
    private statusBarItem: vscode.StatusBarItem;
    private outputFilePath: string | null = null;
    private fileWatcher: fs.FSWatcher | null = null;
    private outputFileWriter: OutputFileWriter | null = null;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('ORCA');
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.show();
        this.updateStatusBar('Ready');
    }

    async runJob(inputFilePath: string): Promise<void> {
        if (this.isRunning) {
            const response = await vscode.window.showWarningMessage(
                'An ORCA job is already running. Kill it?',
                'Yes', 'No'
            );
            
            if (response === 'Yes') {
                this.killJob();
            } else {
                return;
            }
        }

        const config = vscode.workspace.getConfiguration('orca');
        const binaryPath = config.get<string>('binaryPath', '/opt/orca/orca');
        const clearOutput = config.get<boolean>('clearOutputBeforeRun', true);
        const saveOutputToFile = config.get<boolean>('saveOutputToFile', true);

        if (clearOutput) {
            this.outputChannel.clear();
        }

        this.outputChannel.show(true);
        
        const fileName = path.basename(inputFilePath);
        const fileDir = path.dirname(inputFilePath);
        const baseName = path.basename(inputFilePath, '.inp');
        
        this.outputFilePath = path.join(fileDir, `${baseName}.out`);

        this.outputChannel.appendLine('═══════════════════════════════════════════════════════');
        this.outputChannel.appendLine(`🚀 Starting ORCA calculation`);
        this.outputChannel.appendLine(`   Input:  ${fileName}`);
        this.outputChannel.appendLine(`   Binary: ${binaryPath}`);
        this.outputChannel.appendLine(`   Directory: ${fileDir}`);
        this.outputChannel.appendLine('═══════════════════════════════════════════════════════');
        this.outputChannel.appendLine('');

        // Delete old output file if exists
        if (fs.existsSync(this.outputFilePath)) {
            try {
                fs.unlinkSync(this.outputFilePath);
                this.outputChannel.appendLine('Removed old output file');
            } catch (err) {
                this.outputChannel.appendLine(`Warning: Could not delete old output file: ${err}`);
            }
        }

        // Initialize output file writer if enabled
        if (saveOutputToFile) {
            try {
                this.outputFileWriter = new OutputFileWriter({
                    inputFilePath: inputFilePath,
                    append: false
                });
                await this.outputFileWriter.open();
                this.outputChannel.appendLine(`Writing output to: ${this.outputFileWriter.getOutputPath()}`);
            } catch (err) {
                this.outputChannel.appendLine(`Warning: Could not initialize output file writer: ${err}`);
                vscode.window.showWarningMessage('Failed to create output file. Output will only show in panel.');
                this.outputFileWriter = null;
            }
        }

        this.isRunning = true;
        this.updateStatusBar('Running', true);

        // Start the ORCA process
        this.currentProcess = spawn(binaryPath, [inputFilePath], {
            cwd: fileDir,
            shell: false
        });

        // Capture stdout
        this.currentProcess.stdout?.on('data', (data: Buffer) => {
            const text = data.toString();
            this.outputChannel.append(text);
            
            // Write to file in real-time if enabled
            if (this.outputFileWriter) {
                this.outputFileWriter.writeSync(text);
            }
        });

        // Capture stderr
        this.currentProcess.stderr?.on('data', (data: Buffer) => {
            const errorText = data.toString();
            this.outputChannel.append(errorText);
            
            // Write stderr to file as well
            if (this.outputFileWriter) {
                this.outputFileWriter.writeSync(errorText);
            }
        });

        // Watch the output file for real-time updates
        this.watchOutputFile(this.outputFilePath);

        // Handle process completion
        this.currentProcess.on('close', async (code: number | null) => {
            this.isRunning = false;
            this.stopWatchingOutputFile();
            
            // Close output file writer
            if (this.outputFileWriter) {
                try {
                    await this.outputFileWriter.close();
                    this.outputFileWriter = null;
                } catch (err) {
                    this.outputChannel.appendLine(`Warning: Error closing output file: ${err}`);
                }
            }
            
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('═══════════════════════════════════════════════════════');
            
            if (code === 0) {
                this.outputChannel.appendLine('✅ ORCA job completed successfully');
                this.updateStatusBar('Completed', false);
                vscode.window.showInformationMessage(`ORCA job completed: ${fileName}`);
                
                // Parse the output for key results
                if (this.outputFilePath) {
                    this.parseResults(this.outputFilePath);
                }
            } else if (code === null) {
                this.outputChannel.appendLine('⚠️  ORCA job was terminated');
                this.updateStatusBar('Terminated', false);
                vscode.window.showWarningMessage(`ORCA job was terminated: ${fileName}`);
            } else {
                this.outputChannel.appendLine(`❌ ORCA job failed with exit code ${code}`);
                this.updateStatusBar('Failed', false);
                vscode.window.showErrorMessage(`ORCA job failed with code ${code}: ${fileName}`);
            }
            
            this.outputChannel.appendLine('═══════════════════════════════════════════════════════');
            this.currentProcess = null;
        });

        // Handle process errors
        this.currentProcess.on('error', async (err: Error) => {
            this.isRunning = false;
            this.stopWatchingOutputFile();
            
            // Close output file writer on error
            if (this.outputFileWriter) {
                try {
                    await this.outputFileWriter.close();
                    this.outputFileWriter = null;
                } catch (closeErr) {
                    // Ignore errors during cleanup
                }
            }
            
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('═══════════════════════════════════════════════════════');
            this.outputChannel.appendLine(`❌ Error starting ORCA: ${err.message}`);
            this.outputChannel.appendLine('═══════════════════════════════════════════════════════');
            this.updateStatusBar('Error', false);
            vscode.window.showErrorMessage(`Failed to start ORCA: ${err.message}`);
            this.currentProcess = null;
        });
    }

    killJob(): void {
        if (!this.isRunning || !this.currentProcess) {
            vscode.window.showInformationMessage('No ORCA job is currently running');
            return;
        }

        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('🛑 Terminating ORCA job...');
        
        // Kill the process
        this.currentProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds if still alive
        setTimeout(() => {
            if (this.currentProcess && !this.currentProcess.killed) {
                this.outputChannel.appendLine('   Force killing process...');
                this.currentProcess.kill('SIGKILL');
            }
        }, 5000);

        this.isRunning = false;
        this.updateStatusBar('Terminating...', false);
    }

    private watchOutputFile(filePath: string): void {
        // Wait a bit for the file to be created
        const checkInterval = setInterval(() => {
            if (fs.existsSync(filePath)) {
                clearInterval(checkInterval);
                
                // Start watching the file
                let lastSize = 0;
                this.fileWatcher = fs.watch(filePath, (eventType) => {
                    if (eventType === 'change') {
                        try {
                            const stats = fs.statSync(filePath);
                            const currentSize = stats.size;
                            
                            if (currentSize > lastSize) {
                                const stream = fs.createReadStream(filePath, {
                                    start: lastSize,
                                    end: currentSize
                                });
                                
                                stream.on('data', (_chunk: string | Buffer) => {
                                    // This provides real-time output viewing
                                    // The actual content is already captured by stdout
                                });
                                
                                lastSize = currentSize;
                            }
                        } catch (_err) {
                            // File might be temporarily locked
                        }
                    }
                });
            }
        }, 100);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    private stopWatchingOutputFile(): void {
        if (this.fileWatcher) {
            this.fileWatcher.close();
            this.fileWatcher = null;
        }
    }

    /**
     * Check if output file size exceeds configured maximum
     * @param filePath Path to output file
     * @returns true if file can be fully parsed, false if too large
     */
    private checkOutputSize(filePath: string): boolean {
        try {
            const stats = fs.statSync(filePath);
            const sizeMB = stats.size / (1024 * 1024);
            const config = vscode.workspace.getConfiguration('orca');
            const maxSize = config.get<number>('maxOutputSize', 50);
            
            if (sizeMB > maxSize) {
                this.outputChannel.appendLine('');
                this.outputChannel.appendLine(`⚠️  Output file is ${sizeMB.toFixed(1)} MB (limit: ${maxSize} MB)`);
                this.outputChannel.appendLine('   Parsing final results only. Open .out file for full output.');
                return false;
            }
            return true;
        } catch (_err) {
            // If we can't stat the file, try to parse anyway
            return true;
        }
    }

    /**
     * Suggest recovery strategies for common ORCA failures
     * @param outputContent Full content of the output file
     */
    private suggestRecovery(outputContent: string): void {
        // Detect SCF convergence failure
        if (outputContent.includes('SCF NOT CONVERGED')) {
            const suggestions = [
                '• Try SlowConv or VerySlowConv keywords',
                '• Increase SCF iterations: %scf MaxIter 250 end',
                '• Use initial Hessian guess: ! MORead',
                '• Try different starting geometry or basis set'
            ];
            
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('💡 SCF Convergence Recovery Suggestions:');
            suggestions.forEach(s => this.outputChannel.appendLine(s));
            
            vscode.window.showWarningMessage(
                'SCF did not converge. View recovery suggestions?',
                'Show Suggestions',
                'Ignore'
            ).then(response => {
                if (response === 'Show Suggestions') {
                    this.outputChannel.show(true);
                }
            });
        }
        
        // Detect memory issues
        if (outputContent.includes('Not enough memory') || 
            outputContent.includes('cannot allocate memory')) {
            const suggestions = [
                '• Reduce maxcore: %maxcore 2000',
                '• Use fewer processors',
                '• Split calculation into smaller steps',
                '• Use RI approximations to reduce memory'
            ];
            
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('💡 Memory Error Recovery Suggestions:');
            suggestions.forEach(s => this.outputChannel.appendLine(s));
            
            vscode.window.showWarningMessage(
                'ORCA ran out of memory. View recovery suggestions?',
                'Show Suggestions',
                'Ignore'
            ).then(response => {
                if (response === 'Show Suggestions') {
                    this.outputChannel.show(true);
                }
            });
        }
        
        // Detect geometry optimization failures
        if (outputContent.includes('ABORTING THE RUN') && 
            outputContent.includes('GEOMETRY OPTIMIZATION')) {
            const suggestions = [
                '• Check initial geometry for unrealistic bonds',
                '• Use looser convergence: ! LooseOpt',
                '• Try different optimization algorithm: ! BFGS',
                '• Constrain problematic coordinates'
            ];
            
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('💡 Geometry Optimization Recovery Suggestions:');
            suggestions.forEach(s => this.outputChannel.appendLine(s));
            
            vscode.window.showWarningMessage(
                'Geometry optimization failed. View recovery suggestions?',
                'Show Suggestions',
                'Ignore'
            ).then(response => {
                if (response === 'Show Suggestions') {
                    this.outputChannel.show(true);
                }
            });
        }
    }

    private parseResults(outputFilePath: string): void {
        if (!fs.existsSync(outputFilePath)) {
            return;
        }

        try {
            // Check file size before full parsing
            const canFullyParse = this.checkOutputSize(outputFilePath);
            
            let content: string;
            if (canFullyParse) {
                // Read full file for small outputs
                content = fs.readFileSync(outputFilePath, 'utf-8');
            } else {
                // For large files, read only last 50KB for final results
                const stats = fs.statSync(outputFilePath);
                const bytesToRead = Math.min(stats.size, 50 * 1024);
                const buffer = Buffer.alloc(bytesToRead);
                const fd = fs.openSync(outputFilePath, 'r');
                fs.readSync(fd, buffer, 0, bytesToRead, stats.size - bytesToRead);
                fs.closeSync(fd);
                content = buffer.toString('utf-8');
            }
            
            // Use extracted parsing functions
            const parseResult = parseOrcaOutput(content);
            
            // Display convergence status
            if (parseResult.converged) {
                this.outputChannel.appendLine('🎉 Calculation converged successfully!');
            } else if (parseResult.scfFailed) {
                this.outputChannel.appendLine('⚠️  Warning: SCF did not converge');
            }

            // Display final energy
            if (parseResult.finalEnergy !== null) {
                const energyValue = parseResult.finalEnergy;
                this.outputChannel.appendLine(`📊 Final Energy: ${energyValue.toFixed(8)} Hartree`);
                this.statusBarItem.text = `$(check) ORCA: ${energyValue.toFixed(6)} Eh`;
            }

            // Display optimization status
            if (parseResult.optimizationConverged) {
                this.outputChannel.appendLine('✨ Geometry optimization converged!');
            }

            // Display frequency results
            if (parseResult.hasFrequencies) {
                this.outputChannel.appendLine('🎵 Frequency calculation completed');
                
                if (parseResult.imaginaryFreqCount > 0) {
                    this.outputChannel.appendLine(`⚠️  Found ${parseResult.imaginaryFreqCount} imaginary frequency/frequencies`);
                }
            }
            
            // Check for errors and suggest recovery
            if (parseResult.scfFailed || parseResult.hasErrors) {
                // Read more content if we only parsed tail for error detection
                const fullContent = canFullyParse ? content : fs.readFileSync(outputFilePath, 'utf-8');
                this.suggestRecovery(fullContent);
            }

        } catch (err) {
            this.outputChannel.appendLine(`Error parsing output: ${err}`);
        }
    }

    private updateStatusBar(status: string, spinning: boolean = false): void {
        const icon = spinning ? '$(loading~spin)' : '$(beaker)';
        this.statusBarItem.text = `${icon} ORCA: ${status}`;
    }

    dispose(): void {
        this.killJob();
        this.stopWatchingOutputFile();
        
        // Clean up output file writer
        if (this.outputFileWriter) {
            this.outputFileWriter.dispose();
            this.outputFileWriter = null;
        }
        
        this.outputChannel.dispose();
        this.statusBarItem.dispose();
    }
}
