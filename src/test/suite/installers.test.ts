/**
 * Unit tests for Installation Strategies
 */

import * as assert from 'assert';
import { LinuxInstaller } from '../../installation/strategies/linuxInstaller';
import { MacOSInstaller } from '../../installation/strategies/macosInstaller';
import { WindowsInstaller } from '../../installation/strategies/windowsInstaller';
import { InstallationMethod, Platform } from '../../installation/types';

suite('Installation Strategies Test Suite', () => {
    test('Linux installer should have correct platform', () => {
        const installer = new LinuxInstaller();
        assert.strictEqual(installer.platform, Platform.Linux);
    });
    
    test('Linux installer should support Conda', () => {
        const installer = new LinuxInstaller();
        const methods = installer.getSupportedMethods();
        
        assert.ok(methods.includes(InstallationMethod.Conda), 'Should support Conda');
    });
    
    test('Linux installer should recommend Conda', () => {
        const installer = new LinuxInstaller();
        const recommended = installer.getRecommendedMethod();
        
        assert.strictEqual(recommended, InstallationMethod.Conda);
    });
    
    test('Linux installer should provide installation steps', () => {
        const installer = new LinuxInstaller();
        const steps = installer.getInstallationSteps(InstallationMethod.Conda);
        
        assert.ok(Array.isArray(steps), 'Should return array of steps');
        assert.ok(steps.length > 0, 'Should have at least one step');
        assert.ok(steps[0].title, 'Each step should have a title');
    });
    
    test('macOS installer should have correct platform', () => {
        const installer = new MacOSInstaller();
        assert.strictEqual(installer.platform, Platform.MacOS);
    });
    
    test('macOS installer should provide installation steps', () => {
        const installer = new MacOSInstaller();
        const steps = installer.getInstallationSteps(InstallationMethod.Conda);
        
        assert.ok(Array.isArray(steps), 'Should return array of steps');
        assert.ok(steps.length > 0, 'Should have at least one step');
    });
    
    test('Windows installer should have correct platform', () => {
        const installer = new WindowsInstaller();
        assert.strictEqual(installer.platform, Platform.Windows);
    });
    
    test('Windows installer should provide installation steps', () => {
        const installer = new WindowsInstaller();
        const steps = installer.getInstallationSteps(InstallationMethod.Conda);
        
        assert.ok(Array.isArray(steps), 'Should return array of steps');
        assert.ok(steps.length > 0, 'Should have at least one step');
    });
    
    test('All installers should check prerequisites', async () => {
        const installers = [
            new LinuxInstaller(),
            new MacOSInstaller(),
            new WindowsInstaller()
        ];
        
        for (const installer of installers) {
            const prerequisites = await installer.checkPrerequisites();
            
            assert.ok(Array.isArray(prerequisites), 'Should return array of prerequisites');
            
            for (const prereq of prerequisites) {
                assert.ok(prereq.name, 'Prerequisite should have name');
                assert.ok(prereq.checkCommand, 'Prerequisite should have check command');
                assert.ok(prereq.hasOwnProperty('isMet'), 'Prerequisite should have isMet property');
            }
        }
    });
});
