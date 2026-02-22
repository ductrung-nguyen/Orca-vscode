import * as assert from 'assert';
import * as vscode from 'vscode';
import { OrcaCompletionProvider } from '../../orcaCompletionProvider';
import { KeywordDefinition } from '../../orcaHoverProvider';

suite('OrcaCompletionProvider Test Suite', () => {
	// Helper to create a minimal mock document (same pattern as OrcaHoverProvider tests)
	function createMockDocument(content: string): vscode.TextDocument {
		const lines = content.split('\n');
		return {
			uri: vscode.Uri.file('/test/file.inp'),
			fileName: '/test/file.inp',
			languageId: 'orca',
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
				let start = position.character;
				let end = position.character;
				while (start > 0 && pattern.test(line[start - 1])) { start--; }
				while (end < line.length && pattern.test(line[end])) { end++; }
				if (start === end) { return undefined; }
				return new vscode.Range(position.line, start, position.line, end);
			}
		} as any;
	}

	test('Provider class instantiates without errors', () => {
		assert.doesNotThrow(() => new OrcaCompletionProvider());
	});

	test('Provider implements provideCompletionItems method', () => {
		const provider = new OrcaCompletionProvider();
		assert.strictEqual(typeof provider.provideCompletionItems, 'function');
	});

	// =========================================================================
	// Task 2.1 — TDD: Returns completions when cursor is on a ! line
	// =========================================================================

	suite('Returns completions when cursor is on a ! keyword line', () => {
		test('Returns non-empty array for "! B3LYP" at end of line', () => {
			const provider = new OrcaCompletionProvider();
			const doc = createMockDocument('! B3LYP');
			const pos = new vscode.Position(0, 7);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideCompletionItems(doc, pos, token);
			assert.ok(Array.isArray(result), 'Should return an array');
			assert.ok(result.length > 0, 'Should return at least one completion item');
		});

		test('Returns non-empty array for "! " line (cursor after space)', () => {
			const provider = new OrcaCompletionProvider();
			const doc = createMockDocument('! ');
			const pos = new vscode.Position(0, 2);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideCompletionItems(doc, pos, token);
			assert.ok(Array.isArray(result));
			assert.ok(result.length > 0, 'Space-after-! line should return all keywords');
		});
	});

	// =========================================================================
	// Task 2.1 — Returns empty array when cursor is NOT on a ! line
	// =========================================================================

	suite('Returns empty array for non-! lines', () => {
		const nonInputLines: Array<{ label: string; text: string }> = [
			{ label: '* xyz comment',    text: '* xyz' },
			{ label: '%scf block',       text: '%scf' },
			{ label: 'blank line',       text: '' },
			{ label: 'end keyword',      text: 'end' },
			{ label: 'coordinate line',  text: 'C   0.0 0.0 0.0' },
			{ label: 'charge/mult line', text: '0 1' },
		];

		nonInputLines.forEach(({ label, text }) => {
			test(`Returns [] for "${label}"`, () => {
				const provider = new OrcaCompletionProvider();
				const doc = createMockDocument(text);
				const pos = new vscode.Position(0, Math.min(2, text.length));
				const token = new vscode.CancellationTokenSource().token;

				const result = provider.provideCompletionItems(doc, pos, token);
				assert.deepStrictEqual(result, [], `Expected [] for line: "${text}"`);
			});
		});
	});

	// =========================================================================
	// Task 2.1 — Typing "B3" returns at least B3LYP
	// =========================================================================

	test('Typing "B3" on a ! line returns at least B3LYP', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('! B3');
		const pos = new vscode.Position(0, 4); // cursor after '! B3'
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		const labels = result.map(item => item.label as string);
		assert.ok(labels.includes('B3LYP'),
			`Expected B3LYP in results. Got: [${labels.join(', ')}]`);
	});

	// =========================================================================
	// Task 2.3 — Completion item structure (label, detail, documentation, kind)
	// =========================================================================

	suite('Completion item has correct structure (label, detail, documentation, kind)', () => {
		let items: vscode.CompletionItem[];

		setup(() => {
			const provider = new OrcaCompletionProvider();
			// Empty prefix — returns all keywords so we test the whole set
			const doc = createMockDocument('! ');
			const pos = new vscode.Position(0, 2);
			const token = new vscode.CancellationTokenSource().token;
			items = provider.provideCompletionItems(doc, pos, token);
		});

		test('At least 50 keywords returned for empty prefix', () => {
			assert.ok(items.length >= 50, `Expected ≥50 items, got ${items.length}`);
		});

		test('Each item has a non-empty string label (keyword name)', () => {
			for (const item of items) {
				assert.strictEqual(typeof item.label, 'string',
					`Item label should be a string, got ${typeof item.label}`);
				assert.ok((item.label as string).length > 0, 'Label must not be empty');
			}
		});

		test('Each item has a non-empty string detail (category)', () => {
			for (const item of items) {
				assert.ok(item.detail,
					`Item "${item.label}" should have detail (category). Got: ${item.detail}`);
				assert.strictEqual(typeof item.detail, 'string');
			}
		});

		test('Each item has MarkdownString documentation', () => {
			for (const item of items) {
				assert.ok(item.documentation,
					`Item "${item.label}" should have documentation`);
				assert.ok(item.documentation instanceof vscode.MarkdownString,
					`Item "${item.label}" documentation should be a MarkdownString`);
			}
		});

		test('Each item has kind = CompletionItemKind.Keyword', () => {
			for (const item of items) {
				assert.strictEqual(item.kind, vscode.CompletionItemKind.Keyword,
					`Item "${item.label}" kind should be Keyword (${vscode.CompletionItemKind.Keyword})`);
			}
		});
	});

	// =========================================================================
	// AC-US1-5 — Selection replaces the typed prefix (range covers prefix)
	// =========================================================================

	test('AC-US1-5: item.range replaces the typed prefix', () => {
		const provider = new OrcaCompletionProvider();
		// Line "! B3": cursor at 4, prefix "B3" starts at character 2
		const doc = createMockDocument('! B3');
		const pos = new vscode.Position(0, 4);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		assert.ok(result.length > 0, 'Need at least one item to test range');

		for (const item of result) {
			assert.ok(item.range,
				`Item "${item.label}" should have range set for prefix replacement`);
			const range = item.range as vscode.Range;
			// Prefix "B3" starts at character index 2, cursor at 4
			assert.strictEqual(range.start.character, 2,
				`Range start should be at prefix start (char 2), got ${range.start.character}`);
			assert.strictEqual(range.end.character, 4,
				`Range end should be at cursor position (char 4), got ${range.end.character}`);
		}
	});

	test('AC-US1-5: no range set when prefix is empty (cursor on empty ! line)', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('! ');
		const pos = new vscode.Position(0, 2);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		assert.ok(result.length > 0, 'Need items');
		// No range needed when prefix is empty — VS Code default insertion applies
		for (const item of result) {
			assert.strictEqual(item.range, undefined,
				`Item "${item.label}" should not have an explicit range when prefix is empty`);
		}
	});

	// =========================================================================
	// AC-US2-4 — deprecationNote included in documentation MarkdownString
	// =========================================================================

	test('AC-US2-4: deprecationNote is included in documentation markdown', () => {
		const provider = new OrcaCompletionProvider() as any; // access private method
		const deprecatedKw: KeywordDefinition = {
			name: '6-31G*',
			category: 'Basis Set (Pople)',
			description: 'Legacy Pople split-valence basis.',
			deprecationNote: 'Consider using def2-SVP instead.'
		};

		const md = provider.buildDocumentation(deprecatedKw) as vscode.MarkdownString;
		assert.ok(md.value.includes('⚠️'), 'Documentation should include warning emoji');
		assert.ok(md.value.includes('Deprecated'), 'Documentation should include "Deprecated"');
		assert.ok(md.value.includes('def2-SVP'), 'Documentation should include the deprecation note text');
	});

	test('AC-US2-4: no deprecation section when deprecationNote is absent', () => {
		const provider = new OrcaCompletionProvider() as any;
		const normalKw: KeywordDefinition = {
			name: 'B3LYP',
			category: 'Hybrid DFT Functional',
			description: 'Becke 3-parameter Lee-Yang-Parr hybrid functional.'
		};

		const md = provider.buildDocumentation(normalKw) as vscode.MarkdownString;
		assert.ok(!md.value.includes('⚠️'), 'Non-deprecated keyword should not have warning emoji');
		assert.ok(!md.value.includes('Deprecated'), 'Non-deprecated keyword should not mention Deprecated');
	});

	// =========================================================================
	// NFR-Security — All MarkdownString instances must have isTrusted = false
	// =========================================================================

	test('NFR-Security: all MarkdownString instances have isTrusted = false', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('! ');
		const pos = new vscode.Position(0, 2);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		assert.ok(result.length > 0, 'Need items to validate security property');

		for (const item of result) {
			const md = item.documentation as vscode.MarkdownString;
			assert.strictEqual(md.isTrusted, false,
				`Item "${item.label}": MarkdownString.isTrusted must be false (security requirement)`);
		}
	});

	// =========================================================================
	// Edge cases (Task 2.4)
	// =========================================================================

	test('Edge: empty ! line (just "!") returns all keywords', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('!');
		const pos = new vscode.Position(0, 1); // cursor right after '!'
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		assert.ok(result.length >= 50,
			`Expected ≥50 keywords for empty ! line, got ${result.length}`);
	});

	test('Edge: line without ! returns []', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('B3LYP def2-TZVP');
		const pos = new vscode.Position(0, 5);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		assert.deepStrictEqual(result, []);
	});

	test('Edge: cursor before ! in leading whitespace returns []', () => {
		const provider = new OrcaCompletionProvider();
		// Line "   ! B3LYP": '!' is at index 3, cursor at index 1 (before '!')
		const doc = createMockDocument('   ! B3LYP');
		const pos = new vscode.Position(0, 1);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		assert.deepStrictEqual(result, [],
			'Cursor before ! (in leading whitespace) should return []');
	});

	// =========================================================================
	// Task 2.4 — Cancellation token check
	// =========================================================================

	test('2.4: Returns [] immediately when cancellation token is already cancelled', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('! B3LYP');
		const pos = new vscode.Position(0, 7);
		const source = new vscode.CancellationTokenSource();
		source.cancel(); // cancel before calling provider

		const result = provider.provideCompletionItems(doc, pos, source.token);
		assert.deepStrictEqual(result, [],
			'Cancelled token must cause provider to return empty array immediately');
	});

	// =========================================================================
	// Task 2.5 — Snippet placeholder non-interference
	// =========================================================================

	test('2.5: Cursor inside snippet ${} placeholder returns no completions', () => {
		// Snippet placeholder text like ${1|B3LYP,PBE|} does not start with '!'
		// so the provider naturally returns [] — no special handling needed
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('${1|B3LYP,PBE|}');
		const pos = new vscode.Position(0, 5);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		assert.deepStrictEqual(result, [],
			'Snippet placeholder lines (no !) should return no completions');
	});

	// =========================================================================
	// Task 2.6 — isIncomplete return contract: plain array, not CompletionList
	// =========================================================================

	test('2.6: Returns plain CompletionItem[] not vscode.CompletionList', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('! ');
		const pos = new vscode.Position(0, 2);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);

		// Must be a plain JavaScript array
		assert.ok(Array.isArray(result), 'Result must be a plain array, not a CompletionList');
		// vscode.CompletionList has an isIncomplete property; plain arrays do not
		assert.strictEqual((result as any).isIncomplete, undefined,
			'Result must not have isIncomplete property (that would indicate a CompletionList)');
	});

	// =========================================================================
	// Task 2.3 — Documentation builder edge cases
	// =========================================================================

	test('2.3: Example block included in documentation when keyword has example', () => {
		const provider = new OrcaCompletionProvider() as any;
		const kw: KeywordDefinition = {
			name: 'B3LYP',
			category: 'Hybrid DFT Functional',
			description: 'Test description.',
			example: '! B3LYP def2-TZVP'
		};

		const md = provider.buildDocumentation(kw) as vscode.MarkdownString;
		assert.ok(md.value.includes('*Example:*'), 'Should include Example header');
		assert.ok(md.value.includes('! B3LYP def2-TZVP'), 'Should include example code');
	});

	test('2.3: No example block when keyword has no example', () => {
		const provider = new OrcaCompletionProvider() as any;
		const kw: KeywordDefinition = {
			name: 'TESTFUNC',
			category: 'Test',
			description: 'Test description without example.'
		};

		const md = provider.buildDocumentation(kw) as vscode.MarkdownString;
		assert.ok(!md.value.includes('*Example:*'), 'Should not include Example section');
	});

	test('2.3: Case-insensitive prefix matching — "b3" matches B3LYP', () => {
		const provider = new OrcaCompletionProvider();
		const doc = createMockDocument('! b3');
		const pos = new vscode.Position(0, 4);
		const token = new vscode.CancellationTokenSource().token;

		const result = provider.provideCompletionItems(doc, pos, token);
		const labels = result.map(item => item.label as string);
		assert.ok(labels.includes('B3LYP'),
			'Lowercase prefix "b3" should match keyword "B3LYP" (case-insensitive)');
	});

	// =========================================================================
	// Integration: real catalog keywords
	// =========================================================================

	suite('Integration with real keyword catalog', () => {
		test('B3LYP completion has correct category "Hybrid DFT Functional"', () => {
			const provider = new OrcaCompletionProvider();
			const doc = createMockDocument('! B3LYP');
			const pos = new vscode.Position(0, 7);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideCompletionItems(doc, pos, token);
			const b3lyp = result.find(item => item.label === 'B3LYP');
			assert.ok(b3lyp, 'B3LYP completion must exist in catalog');
			assert.strictEqual(b3lyp.detail, 'Hybrid DFT Functional');
		});

		test('6-31G* completion includes deprecation note from real catalog', () => {
			const provider = new OrcaCompletionProvider();
			// Use prefix "6-31" to get the deprecated Pople basis sets
			const doc = createMockDocument('! 6-31');
			const pos = new vscode.Position(0, 6);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideCompletionItems(doc, pos, token);
			const deprecated = result.find(item => item.label === '6-31G*');
			assert.ok(deprecated, '6-31G* completion must exist in catalog');

			const md = deprecated.documentation as vscode.MarkdownString;
			assert.ok(md.value.includes('⚠️'),
				'6-31G* documentation should include deprecation warning');
			assert.ok(md.value.includes('Deprecated'),
				'6-31G* documentation should include "Deprecated"');
		});

		test('PBE completion has correct category "GGA DFT Functional"', () => {
			const provider = new OrcaCompletionProvider();
			const doc = createMockDocument('! PBE');
			const pos = new vscode.Position(0, 5);
			const token = new vscode.CancellationTokenSource().token;

			const result = provider.provideCompletionItems(doc, pos, token);
			const pbe = result.find(item => item.label === 'PBE');
			assert.ok(pbe, 'PBE completion must exist in catalog');
			assert.strictEqual(pbe.detail, 'GGA DFT Functional');
		});
	});
});
