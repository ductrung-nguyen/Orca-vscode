import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { OutputFileWriter } from '../../outputFileWriter';

suite('OutputFileWriter Test Suite', () => {
    let testDir: string;

    setup(() => {
        // Create a temporary directory for test files
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orca-test-'));
    });

    teardown(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    test('should create output file with correct naming', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        
        const expectedPath = path.join(testDir, 'test.out');
        assert.strictEqual(writer.getOutputPath(), expectedPath);
        assert.strictEqual(fs.existsSync(expectedPath), true);
        
        await writer.close();
    });

    test('should write data to file correctly', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        
        await writer.write('Test output line 1\n');
        await writer.write('Test output line 2\n');
        await writer.close();

        const outputPath = writer.getOutputPath();
        const content = fs.readFileSync(outputPath, 'utf-8');
        assert.strictEqual(content, 'Test output line 1\nTest output line 2\n');
    });

    test('should support synchronous writes', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        
        writer.writeSync('Sync line 1\n');
        writer.writeSync('Sync line 2\n');
        await writer.close();

        const content = fs.readFileSync(writer.getOutputPath(), 'utf-8');
        assert.strictEqual(content, 'Sync line 1\nSync line 2\n');
    });

    test('should overwrite existing file by default', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        const outputFile = path.join(testDir, 'test.out');
        
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');
        fs.writeFileSync(outputFile, 'Old content\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        await writer.write('New content\n');
        await writer.close();

        const content = fs.readFileSync(outputFile, 'utf-8');
        assert.strictEqual(content, 'New content\n');
    });

    test('should append to existing file when append option is true', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        const outputFile = path.join(testDir, 'test.out');
        
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');
        fs.writeFileSync(outputFile, 'Old content\n');

        const writer = new OutputFileWriter({ 
            inputFilePath: inputFile,
            append: true 
        });
        await writer.open();
        await writer.write('New content\n');
        await writer.close();

        const content = fs.readFileSync(outputFile, 'utf-8');
        assert.strictEqual(content, 'Old content\nNew content\n');
    });

    test('should support custom output path', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        const customPath = path.join(testDir, 'custom_output.txt');
        
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ 
            inputFilePath: inputFile,
            customOutputPath: customPath
        });
        await writer.open();
        await writer.write('Custom path content\n');
        await writer.close();

        assert.strictEqual(writer.getOutputPath(), customPath);
        assert.strictEqual(fs.existsSync(customPath), true);
        const content = fs.readFileSync(customPath, 'utf-8');
        assert.strictEqual(content, 'Custom path content\n');
    });

    test('should throw error when writing to closed writer', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        await writer.close();

        await assert.rejects(
            async () => await writer.write('Should fail\n'),
            /OutputFileWriter is not open/
        );
    });

    test('should throw error when opening already open writer', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();

        await assert.rejects(
            async () => await writer.open(),
            /OutputFileWriter is already open/
        );

        await writer.close();
    });

    test('should report open state correctly', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        assert.strictEqual(writer.isWriterOpen(), false);

        await writer.open();
        assert.strictEqual(writer.isWriterOpen(), true);

        await writer.close();
        assert.strictEqual(writer.isWriterOpen(), false);
    });

    test('should handle multiple writes without data loss', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();

        const lines = [];
        for (let i = 0; i < 100; i++) {
            const line = `Line ${i}\n`;
            lines.push(line);
            await writer.write(line);
        }

        await writer.close();

        const content = fs.readFileSync(writer.getOutputPath(), 'utf-8');
        assert.strictEqual(content, lines.join(''));
    });

    test('should dispose resources safely', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        await writer.write('Some content\n');
        
        writer.dispose();
        
        assert.strictEqual(writer.isWriterOpen(), false);
        
        // Should be safe to call dispose again
        writer.dispose();
    });

    test('should handle large data writes', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();

        // Write 1MB of data
        const largeData = 'x'.repeat(1024 * 1024);
        await writer.write(largeData);
        await writer.close();

        const stats = fs.statSync(writer.getOutputPath());
        assert.strictEqual(stats.size, 1024 * 1024);
    });

    test('should flush data to disk', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        await writer.write('Flushed content\n');
        
        // Flush should not throw
        await writer.flush();
        
        await writer.close();

        const content = fs.readFileSync(writer.getOutputPath(), 'utf-8');
        assert.strictEqual(content, 'Flushed content\n');
    });

    test('should handle UTF-8 characters correctly', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        await writer.open();
        
        const unicodeText = '测试 test αβγ 日本語 ñ\n';
        await writer.write(unicodeText);
        await writer.close();

        const content = fs.readFileSync(writer.getOutputPath(), 'utf-8');
        assert.strictEqual(content, unicodeText);
    });

    test('should close gracefully even if not open', async () => {
        const inputFile = path.join(testDir, 'test.inp');
        fs.writeFileSync(inputFile, '! B3LYP def2-SVP\n');

        const writer = new OutputFileWriter({ inputFilePath: inputFile });
        
        // Should not throw
        await writer.close();
    });
});
