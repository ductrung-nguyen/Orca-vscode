import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

export class OrcaRunner {
    private outputChannel: vscode.OutputChannel;
    private currentProcess: ChildProcess | null = null;
    private isRunning: boolean = false;
    private statusBarItem: vscode.StatusBarItem;
    private outputFilePath: string | null = null;
    private fileWatcher: fs.FSWatcher | null = null;

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

        this.isRunning = true;
        this.updateStatusBar('Running', true);

        // Start the ORCA process
        this.currentProcess = spawn(binaryPath, [inputFilePath], {
            cwd: fileDir,
            shell: false
        });

        // Capture stdout
        this.currentProcess.stdout?.on('data', (data: Buffer) => {
            this.outputChannel.append(data.toString());
        });

        // Capture stderr
        this.currentProcess.stderr?.on('data', (data: Buffer) => {
            const errorText = data.toString();
            this.outputChannel.append(errorText);
        });

        // Watch the output file for real-time updates
        this.watchOutputFile(this.outputFilePath);

        // Handle process completion
        this.currentProcess.on('close', (code: number | null) => {
            this.isRunning = false;
            this.stopWatchingOutputFile();
            
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('═══════════════════════════════════════════════════════');
            
            if (code === 0) {
                this.outputChannel.appendLine('✅ ORCA job completed successfully');
                this.updateStatusBar('Completed', false);
                vscode.window.showInformationMessage(`ORCA job completed: ${fileName}`);
                
                // Parse the output for key results
                this.parseResults(this.outputFilePath!);
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
        this.currentProcess.on('error', (err: Error) => {
            this.isRunning = false;
            this.stopWatchingOutputFile();
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
                                
                                stream.on('data', (chunk: string | Buffer) => {
                                    // This provides real-time output viewing
                                    // The actual content is already captured by stdout
                                });
                                
                                lastSize = currentSize;
                            }
                        } catch (err) {
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

    private parseResults(outputFilePath: string): void {
        if (!fs.existsSync(outputFilePath)) {
            return;
        }

        try {
            const content = fs.readFileSync(outputFilePath, 'utf-8');
            
            // Check for successful convergence
            if (content.includes('HURRAY')) {
                this.outputChannel.appendLine('🎉 Calculation converged successfully!');
            } else if (content.includes('SCF NOT CONVERGED')) {
                this.outputChannel.appendLine('⚠️  Warning: SCF did not converge');
            }

            // Extract final energy
            const energyMatch = content.match(/FINAL SINGLE POINT ENERGY\s+([-\d.]+)/);
            if (energyMatch) {
                const energy = parseFloat(energyMatch[1]);
                this.outputChannel.appendLine(`📊 Final Energy: ${energy.toFixed(8)} Hartree`);
                this.statusBarItem.text = `$(check) ORCA: ${energy.toFixed(6)} Eh`;
            }

            // Check for geometry optimization
            const optMatch = content.match(/THE OPTIMIZATION HAS CONVERGED/);
            if (optMatch) {
                this.outputChannel.appendLine('✨ Geometry optimization converged!');
            }

            // Check for frequency calculation
            const freqMatch = content.match(/VIBRATIONAL FREQUENCIES/);
            if (freqMatch) {
                this.outputChannel.appendLine('🎵 Frequency calculation completed');
                
                // Check for imaginary frequencies
                const imagMatch = content.match(/\*\*\*imaginary mode\*\*\*/g);
                if (imagMatch) {
                    this.outputChannel.appendLine(`⚠️  Found ${imagMatch.length} imaginary frequency/frequencies`);
                }
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
        this.outputChannel.dispose();
        this.statusBarItem.dispose();
    }
}
