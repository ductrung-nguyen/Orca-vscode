import * as assert from 'assert';
import * as vscode from 'vscode';
import { OrcaHoverProvider } from '../../orcaHoverProvider';

suite('OrcaHoverProvider Test Suite', () => {
	// Helper to create mock document
	function createMockDocument(content: string, languageId: string = 'orca'): vscode.TextDocument {
		const lines = content.split('\n');
		return {
			uri: vscode.Uri.file('/test/file.inp'),
			fileName: '/test/file.inp',
			languageId,
			lineCount: lines.length,
			lineAt: (line: number) => ({
				text: lines[line] || '',
				range: new vscode.Range(line, 0, line, lines[line]?.length || 0),
				lineNumber: line
			}),
			getText: (range?: vscode.Range) => {
				if (!range) { return content; }
				const line = lines[range.start.line] || '';
				return line.substring(range.start.character, range.end.character);
			},
			getWordRangeAtPosition: (position: vscode.Position, regex?: RegExp) => {
				const line = lines[position.line] || '';
				const pattern = regex || /[\w]+/;
				
				// Find word boundaries
				let start = position.character;
				let end = position.character;
				
				// Move start backward
				while (start > 0 && pattern.test(line[start - 1])) {
					start--;
				}
				
				// Move end forward
				while (end < line.length && pattern.test(line[end])) {
					end++;
				}
				
				if (start === end) { return undefined; }
				return new vscode.Range(position.line, start, position.line, end);
			}
		} as any;
	}

	test('Provider class instantiates without errors', () => {
		assert.doesNotThrow(() => {
			new OrcaHoverProvider();
		});
	});

	test('Provider implements provideHover method with correct signature', () => {
		const provider = new OrcaHoverProvider();
		assert.strictEqual(typeof provider.provideHover, 'function');
		
		// Verify method signature by checking it accepts correct parameters
		const mockDocument = createMockDocument('! B3LYP def2-TZVP');
		const mockPosition = new vscode.Position(0, 0);
		const mockToken = new vscode.CancellationTokenSource().token;
		
		// Should not throw when called with correct parameters
		assert.doesNotThrow(() => {
			provider.provideHover(mockDocument, mockPosition, mockToken);
		});
	});

	test('Provider is correctly instantiable for registration', () => {
		const provider = new OrcaHoverProvider();
		assert.ok(provider instanceof OrcaHoverProvider);
		assert.ok('provideHover' in provider);
	});

	// Task 2.0: Token Detection Tests

	suite('Simple Line Token Extraction', () => {
		test('Extracts B3LYP from "! B3LYP def2-TZVP" when hovering B3LYP', () => {
			const provider = new OrcaHoverProvider() as any; // Access private method
			const document = createMockDocument('! B3LYP def2-TZVP');
			const position = new vscode.Position(0, 4); // On 'B3LYP'
			
			const token = provider.extractSimpleLineToken(document, position);
			assert.strictEqual(token, 'B3LYP');
		});

		test('Handles hyphens in keywords (def2-TZVP)', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('! B3LYP def2-TZVP');
			const position = new vscode.Position(0, 12); // On 'def2-TZVP'
			
			const token = provider.extractSimpleLineToken(document, position);
			assert.strictEqual(token, 'def2-TZVP');
		});

		test('Handles asterisks in keywords (6-31G*)', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('! HF 6-31G*');
			const position = new vscode.Position(0, 7); // On '6-31G*'
			
			const token = provider.extractSimpleLineToken(document, position);
			assert.strictEqual(token, '6-31G*');
		});

		test('Returns null for whitespace', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('! B3LYP def2-TZVP');
			const position = new vscode.Position(0, 1); // On whitespace
			
			const token = provider.extractSimpleLineToken(document, position);
			assert.strictEqual(token, null);
		});

		test('Returns null for lines not starting with !', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf');
			const position = new vscode.Position(0, 2);
			
			const token = provider.extractSimpleLineToken(document, position);
			assert.strictEqual(token, null);
		});
	});

	suite('Block Directive Name Detection', () => {
		test('Extracts "scf" when hovering %scf', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf');
			const position = new vscode.Position(0, 2);
			
			const blockName = provider.extractBlockDirectiveName(document, position);
			assert.strictEqual(blockName, 'scf');
		});

		test('Handles whitespace (e.g., "%  pal")', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%  pal');
			const position = new vscode.Position(0, 3);
			
			const blockName = provider.extractBlockDirectiveName(document, position);
			assert.strictEqual(blockName, 'pal');
		});

		test('Normalizes to lowercase', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%SCF');
			const position = new vscode.Position(0, 2);
			
			const blockName = provider.extractBlockDirectiveName(document, position);
			assert.strictEqual(blockName, 'scf');
		});

		test('Returns null for non-block lines', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('! B3LYP');
			const position = new vscode.Position(0, 3);
			
			const blockName = provider.extractBlockDirectiveName(document, position);
			assert.strictEqual(blockName, null);
		});
	});

	suite('Block Context Resolution', () => {
		test('Returns "scf" when inside %scf...end block', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf\n  MaxIter 200\nend');
			const position = new vscode.Position(1, 5); // On 'MaxIter' line
			
			const blockContext = provider.resolveBlockContext(document, position);
			assert.strictEqual(blockContext, 'scf');
		});

		test('Returns null when outside any block', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('! B3LYP\n\n%scf\nend\n\nMaxIter 200');
			const position = new vscode.Position(5, 2); // After 'end'
			
			const blockContext = provider.resolveBlockContext(document, position);
			assert.strictEqual(blockContext, null);
		});

		test('Returns null when on block directive line', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf\n  MaxIter 200\nend');
			const position = new vscode.Position(0, 2); // On '%scf' line itself
			
			// Note: Block context is for parameters inside, not the block name itself
			const blockContext = provider.resolveBlockContext(document, position);
			assert.strictEqual(blockContext, null);
		});

		test('Handles multiple blocks correctly', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf\nend\n\n%geom\n  MaxIter 100\nend');
			const position = new vscode.Position(4, 5); // In second block (%geom)
			
			const blockContext = provider.resolveBlockContext(document, position);
			assert.strictEqual(blockContext, 'geom');
		});
	});

	suite('Block Attribute Token Extraction', () => {
		test('Extracts parameter name inside block', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf\n  MaxIter 200\nend');
			const position = new vscode.Position(1, 4); // On 'MaxIter'
			
			const token = provider.extractBlockAttributeToken(document, position);
			assert.strictEqual(token, 'MaxIter');
		});

		test('Returns null on block directive lines', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf\n  MaxIter 200\nend');
			const position = new vscode.Position(0, 2); // On '%scf'
			
			const token = provider.extractBlockAttributeToken(document, position);
			assert.strictEqual(token, null);
		});

		test('Returns null on "end" keyword', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf\n  MaxIter 200\nend');
			const position = new vscode.Position(2, 1); // On 'end'
			
			const token = provider.extractBlockAttributeToken(document, position);
			assert.strictEqual(token, null);
		});

		test('Returns null for whitespace', () => {
			const provider = new OrcaHoverProvider() as any;
			const document = createMockDocument('%scf\n  MaxIter 200\nend');
			const position = new vscode.Position(1, 1); // On whitespace
			
			const token = provider.extractBlockAttributeToken(document, position);
			assert.strictEqual(token, null);
		});
	});
	
	// Task 3.0: Keyword Catalog Validation Tests
	
	suite('Keyword Catalog Validation', () => {
		// Import catalog modules using ES6 syntax
		let simpleKeywords: any;
		let blockDefinitions: any;
		let blockAttributes: any;
		
		setup(async () => {
			const catalogModule = await import('../../data/orcaKeywordDefs');
			simpleKeywords = catalogModule.simpleKeywords;
			blockDefinitions = catalogModule.blockDefinitions;
			blockAttributes = catalogModule.blockAttributes;
		});
		
		test('simpleKeywords contains ≥50 entries', () => {
			const count = Object.keys(simpleKeywords).length;
			assert.ok(count >= 50, `Expected ≥50 keywords, found ${count}`);
		});

		test('All simple keyword entries have required fields', () => {
			Object.entries(simpleKeywords).forEach(([key, kw]: [string, any]) => {
				assert.ok(kw.name, `${key}: missing 'name'`);
				assert.ok(kw.category, `${key}: missing 'category'`);
				assert.ok(kw.description, `${key}: missing 'description'`);
				assert.ok(kw.description.length >= 20, `${key}: description too short`);
			});
		});

		test('blockDefinitions contains ≥12 entries', () => {
			const count = Object.keys(blockDefinitions).length;
			assert.ok(count >= 12, `Expected ≥12 blocks, found ${count}`);
		});

		test('All block definitions have required fields', () => {
			Object.entries(blockDefinitions).forEach(([key, block]: [string, any]) => {
				assert.ok(block.name, `${key}: missing 'name'`);
				assert.ok(block.description, `${key}: missing 'description'`);
				assert.ok(Array.isArray(block.commonParams), `${key}: commonParams must be array`);
				assert.ok(block.description.length >= 20, `${key}: description too short`);
			});
		});

		test('blockAttributes contains ≥30 total attributes', () => {
			let totalCount = 0;
			Object.values(blockAttributes).forEach((attrs: any) => {
				totalCount += Object.keys(attrs).length;
			});
			assert.ok(totalCount >= 30, `Expected ≥30 attributes, found ${totalCount}`);
		});

		test('All block attributes have required fields', () => {
			Object.entries(blockAttributes).forEach(([blockName, attrs]: [string, any]) => {
				Object.entries(attrs).forEach(([attrKey, attr]: [string, any]) => {
					assert.ok(attr.name, `${blockName}.${attrKey}: missing 'name'`);
					assert.ok(attr.blockName, `${blockName}.${attrKey}: missing 'blockName'`);
					assert.ok(attr.type, `${blockName}.${attrKey}: missing 'type'`);
					assert.ok(attr.description, `${blockName}.${attrKey}: missing 'description'`);
					assert.ok(['integer', 'float', 'string', 'boolean'].includes(attr.type), 
						`${blockName}.${attrKey}: invalid type '${attr.type}'`);
				});
			});
		});

		test('Case-insensitive lookup works (stub test - logic in Task 4.0)', () => {
			// This test placeholder verifies catalog structure supports case-insensitive lookup
			// Actual lookup logic will be implemented in Task 4.0
			assert.ok(simpleKeywords['B3LYP'], 'B3LYP keyword should exist');
			// Note: Normalization to uppercase happens in lookup logic (Task 4.0)
		});

		test('No empty descriptions in catalog', () => {
			// Verify no placeholder/empty content made it into production catalog
			Object.entries(simpleKeywords).forEach(([key, kw]: [string, any]) => {
				assert.ok(kw.description && kw.description.trim().length > 0, 
					`${key}: empty description`);
			});
			
			Object.entries(blockDefinitions).forEach(([key, block]: [string, any]) => {
				assert.ok(block.description && block.description.trim().length > 0, 
					`${key}: empty description`);
			});
		});
	});

	// Task 4.0: Keyword Lookup Logic Tests

	suite('Simple Keyword Lookup', () => {
		test('Lookup B3LYP (uppercase)', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupSimpleKeyword('B3LYP');
			assert.ok(result, 'Should find B3LYP');
			assert.strictEqual(result.name, 'B3LYP');
			assert.strictEqual(result.category, 'Hybrid DFT Functional');
		});

		test('Lookup b3lyp (lowercase) - case insensitive', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupSimpleKeyword('b3lyp');
			assert.ok(result, 'Should find b3lyp');
			assert.strictEqual(result.name, 'B3LYP');
		});

		test('Lookup def2-TZVP (with hyphen)', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupSimpleKeyword('def2-TZVP');
			assert.ok(result, 'Should find def2-TZVP');
			assert.strictEqual(result.category, 'Basis Set (Triple-Zeta)');
		});

		test('Lookup returns null for unknown keyword', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupSimpleKeyword('INVALIDKEYWORD');
			assert.strictEqual(result, null);
		});
	});

	suite('Block Directive Lookup', () => {
		test('Lookup scf block', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockDefinition('scf');
			assert.ok(result, 'Should find scf block');
			assert.strictEqual(result.name, '%scf');
			assert.ok(result.description.includes('SCF'));
		});

		test('Lookup pal block', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockDefinition('pal');
			assert.ok(result, 'Should find pal block');
			assert.ok(Array.isArray(result.commonParams));
		});

		test('Lookup returns null for unknown block', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockDefinition('unknownblock');
			assert.strictEqual(result, null);
		});
	});

	suite('Block Attribute Lookup (Context-Aware)', () => {
		test('Lookup MaxIter in scf context', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockAttribute('scf', 'MaxIter');
			assert.ok(result, 'Should find MaxIter in scf');
			assert.strictEqual(result.blockName, 'scf');
			assert.ok(result.description.includes('SCF'));
		});

		test('Lookup MaxIter in geom context - different definition', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockAttribute('geom', 'MaxIter');
			assert.ok(result, 'Should find MaxIter in geom');
			assert.strictEqual(result.blockName, 'geom');
			assert.ok(result.description.includes('geometry'));
		});

		test('Lookup TolE in scf context', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockAttribute('scf', 'TolE');
			assert.ok(result, 'Should find TolE in scf');
			assert.strictEqual(result.unit, 'Hartree');
		});

		test('Returns null for unknown attribute in known block', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockAttribute('scf', 'UnknownParam');
			assert.strictEqual(result, null);
		});

		test('Returns null for unknown block', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.lookupBlockAttribute('unknownblock', 'MaxIter');
			assert.strictEqual(result, null);
		});

		test('Case-insensitive attribute lookup', () => {
			const provider = new OrcaHoverProvider() as any;
			// Test lowercase
			const resultLower = provider.lookupBlockAttribute('scf', 'maxiter');
			assert.notStrictEqual(resultLower, null);
			assert.strictEqual(resultLower?.name, 'MaxIter');
			
			// Test uppercase
			const resultUpper = provider.lookupBlockAttribute('scf', 'MAXITER');
			assert.notStrictEqual(resultUpper, null);
			assert.strictEqual(resultUpper?.name, 'MaxIter');
			
			// Test mixed case
			const resultMixed = provider.lookupBlockAttribute('scf', 'MaxIter');
			assert.notStrictEqual(resultMixed, null);
			assert.strictEqual(resultMixed?.name, 'MaxIter');
		});
	});

	// Task 5.0: Hover Content Formatting Tests

	suite('Simple Keyword Formatting', () => {
		test('Format simple keyword with all fields', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: 'B3LYP',
				category: 'Hybrid DFT Functional',
				description: 'Test description.',
				example: '! B3LYP def2-TZVP',
				relatedKeywords: ['PBE0', 'CAM-B3LYP']
			};
			
			const markdown = provider.formatSimpleKeyword(definition);
			assert.ok(markdown.value.includes('**B3LYP**'));
			assert.ok(markdown.value.includes('Hybrid DFT Functional'));
			assert.ok(markdown.value.includes('Test description'));
			assert.ok(markdown.value.includes('*Example:*'));
			assert.ok(markdown.value.includes('*See also:*'));
			assert.ok(!markdown.isTrusted, 'Markdown should be untrusted');
		});

		test('Format handles optional fields gracefully', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: 'TestKeyword',
				category: 'Test Category',
				description: 'Test description.'
			};
			
			const markdown = provider.formatSimpleKeyword(definition);
			assert.ok(markdown.value.includes('**TestKeyword**'));
			assert.ok(!markdown.value.includes('*Example:*'));
			assert.ok(!markdown.value.includes('*See also:*'));
		});

		test('Format renders deprecated keyword warning', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: '6-31G*',
				category: 'Basis Set',
				description: 'Test description.',
				deprecationNote: 'Consider using def2-SVP instead.'
			};
			
			const markdown = provider.formatSimpleKeyword(definition);
			assert.ok(markdown.value.includes('⚠️'), 'Should include warning emoji');
			assert.ok(markdown.value.includes('Deprecated'), 'Should mention deprecated');
			assert.ok(markdown.value.includes('def2-SVP'), 'Should mention alternative');
		});
	});

	suite('Block Directive Formatting', () => {
		test('Format block with all fields', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: '%scf',
				description: 'Controls SCF convergence.',
				commonParams: ['MaxIter', 'TolE', 'Convergence'],
				example: '%scf\n  MaxIter 200\nend'
			};
			
			const markdown = provider.formatBlockDefinition(definition);
			assert.ok(markdown.value.includes('**%scf**'));
			assert.ok(markdown.value.includes('Controls SCF'));
			assert.ok(markdown.value.includes('*Common parameters:*'));
			assert.ok(markdown.value.includes('MaxIter'));
			assert.ok(!markdown.isTrusted, 'Markdown should be untrusted');
		});

		test('Format block handles missing optional example', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: '%test',
				description: 'Test block.',
				commonParams: ['param1']
			};
			
			const markdown = provider.formatBlockDefinition(definition);
			assert.ok(markdown.value.includes('**%test**'));
			assert.ok(!markdown.value.includes('*Example:*'));
		});
	});

	suite('Block Attribute Formatting', () => {
		test('Format attribute with all fields', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: 'MaxIter',
				blockName: 'scf',
				type: 'integer',
				default: '125',
				unit: undefined,
				description: 'Maximum number of SCF iterations.',
				example: 'MaxIter 500'
			};
			
			const markdown = provider.formatBlockAttribute(definition);
			assert.ok(markdown.value.includes('**MaxIter**'));
			assert.ok(markdown.value.includes('(in %scf)'));
			assert.ok(markdown.value.includes('**Type:**'));
			assert.ok(markdown.value.includes('integer'));
			assert.ok(markdown.value.includes('**Default:**'));
			assert.ok(markdown.value.includes('125'));
			assert.ok(!markdown.isTrusted, 'Markdown should be untrusted');
		});

		test('Format attribute with unit', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: 'TolE',
				blockName: 'scf',
				type: 'float',
				default: '1e-6',
				unit: 'Hartree',
				description: 'Energy convergence tolerance.'
			};
			
			const markdown = provider.formatBlockAttribute(definition);
			assert.ok(markdown.value.includes('**Unit:**'));
			assert.ok(markdown.value.includes('Hartree'));
		});

		test('Format attribute handles missing default', () => {
			const provider = new OrcaHoverProvider() as any;
			const definition = {
				name: 'nprocs',
				blockName: 'pal',
				type: 'integer',
				description: 'Number of CPU cores.'
			};
			
			const markdown = provider.formatBlockAttribute(definition);
			assert.ok(markdown.value.includes('**nprocs**'));
			assert.ok(!markdown.value.includes('**Default:**'));
		});
	});

	suite('See Also Renderer', () => {
		test('Renders related keywords as plain-text code', () => {
			const provider = new OrcaHoverProvider() as any;
			const related = ['PBE0', 'CAM-B3LYP', 'wB97X-D3'];
			const result = provider.renderSeeAlso(related);
			
			// Should be plain text with backticks, NOT markdown links
			assert.ok(result.includes('`PBE0`'));
			assert.ok(result.includes('`CAM-B3LYP`'));
			assert.ok(result.includes('`wB97X-D3`'));
			assert.ok(!result.includes('[PBE0]'), 'Should not be markdown links');
			assert.ok(result.includes('*See also:*'));
		});

		test('Renders 3-5 related keywords', () => {
			const provider = new OrcaHoverProvider() as any;
			const related = ['A', 'B', 'C', 'D'];
			const result = provider.renderSeeAlso(related);
			
			const count = (result.match(/`/g) || []).length / 2; // Count backtick pairs
			assert.ok(count >= 3 && count <= 5, `Expected 3-5 keywords, found ${count}`);
		});

		test('Returns empty string for empty related keywords', () => {
			const provider = new OrcaHoverProvider() as any;
			const result = provider.renderSeeAlso([]);
			assert.strictEqual(result, '');
		});
	});

	// Task 6.0: Integration Tests

	suite('End-to-End Hover Behavior', () => {
		test('Hover on B3LYP shows complete hover popup', () => {
			const provider = new OrcaHoverProvider();
			const document = createMockDocument('! B3LYP def2-TZVP');
			const position = new vscode.Position(0, 4);
			const token = new vscode.CancellationTokenSource().token;
			
			const hover = provider.provideHover(document, position, token) as vscode.Hover;
			assert.ok(hover, 'Should return hover object');
			assert.ok(hover.contents, 'Should have contents');
			
			const markdown = (hover.contents[0] as vscode.MarkdownString);
			assert.ok(markdown.value.includes('B3LYP'));
			assert.ok(markdown.value.includes('Hybrid DFT'));
		});

		test('Hover on %scf shows block documentation', () => {
			const provider = new OrcaHoverProvider();
			const document = createMockDocument('%scf');
			const position = new vscode.Position(0, 2);
			const token = new vscode.CancellationTokenSource().token;
			
			const hover = provider.provideHover(document, position, token) as vscode.Hover;
			assert.ok(hover, 'Should return hover object');
			
			const markdown = (hover.contents[0] as vscode.MarkdownString);
			assert.ok(markdown.value.includes('%scf'));
			assert.ok(markdown.value.includes('SCF'));
		});

		test('Hover on MaxIter inside %scf shows attribute documentation', () => {
			const provider = new OrcaHoverProvider();
			const document = createMockDocument('%scf\n  MaxIter 200\nend');
			const position = new vscode.Position(1, 4);
			const token = new vscode.CancellationTokenSource().token;
			
			const hover = provider.provideHover(document, position, token) as vscode.Hover;
			assert.ok(hover, 'Should return hover object');
			
			const markdown = (hover.contents[0] as vscode.MarkdownString);
			assert.ok(markdown.value.includes('MaxIter'));
			assert.ok(markdown.value.includes('%scf'));
		});

		test('Hover on unknown keyword returns null', () => {
			const provider = new OrcaHoverProvider();
			const document = createMockDocument('! INVALIDKEYWORD');
			const position = new vscode.Position(0, 3);
			const token = new vscode.CancellationTokenSource().token;
			
			const hover = provider.provideHover(document, position, token);
			assert.strictEqual(hover, undefined);
		});

		test('Hover on whitespace returns null', () => {
			const provider = new OrcaHoverProvider();
			const document = createMockDocument('! B3LYP   def2-TZVP');
			const position = new vscode.Position(0, 8); // Whitespace
			const token = new vscode.CancellationTokenSource().token;
			
			const hover = provider.provideHover(document, position, token);
			assert.strictEqual(hover, undefined);
		});
	});
});
