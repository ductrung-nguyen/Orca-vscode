import * as vscode from 'vscode';
import { KeywordDefinition } from './orcaHoverProvider';
import { simpleKeywords } from './data/orcaKeywordDefs';

/**
 * Completion provider for ORCA input files (.inp)
 * Provides keyword completions on simple input lines (lines starting with !)
 */
export class OrcaCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.CompletionItem[] {
		// Task 2.4: Check cancellation first
		if (token.isCancellationRequested) {
			return [];
		}

		const lineText = document.lineAt(position.line).text;

		// Task 2.2: Only operate on simple input lines (starting with !)
		if (!this.isSimpleInputLine(lineText)) {
			return [];
		}

		// Cursor must be strictly after '!' (not at or before it)
		const trimLen = lineText.length - lineText.trimStart().length;
		if (position.character <= trimLen) {
			return [];
		}

		// Use getWordRangeAtPosition for parity with hover provider (FR-1)
		const wordRange = document.getWordRangeAtPosition(position, /[\w+*-]+/);
		const prefix = wordRange ? document.getText(wordRange) : '';
		const prefixUpper = prefix.toUpperCase();

		// Task 2.3: Build and filter completion items
		return Object.values(simpleKeywords)
			.filter(kw => prefixUpper === '' || kw.name.toUpperCase().startsWith(prefixUpper))
			.map(kw => this.buildCompletionItem(kw, wordRange));
	}

	/**
	 * Build a single completion item for a keyword definition.
	 * The `range` replaces the current word range so VS Code correctly
	 * substitutes the partial token (AC-US1-5).
	 * `filterText` is the uppercase key for consistent VS Code filtering (FR-1).
	 */
	private buildCompletionItem(
		kw: KeywordDefinition,
		wordRange: vscode.Range | undefined
	): vscode.CompletionItem {
		const item = new vscode.CompletionItem(kw.name, vscode.CompletionItemKind.Keyword);
		item.detail = kw.category;
		item.documentation = this.buildDocumentation(kw);
		item.insertText = kw.name;
		item.filterText = kw.name.toUpperCase();

		// Replace the current word range with the full keyword name
		if (wordRange) {
			item.range = wordRange;
		}

		return item;
	}

	/**
	 * Build MarkdownString documentation for a keyword.
	 * Format matches hover provider formatSimpleKeyword for parity (FR-4).
	 * isTrusted is explicitly set to false (NFR-Security).
	 */
	private buildDocumentation(kw: KeywordDefinition): vscode.MarkdownString {
		const md = new vscode.MarkdownString();
		md.isTrusted = false; // Security: never trust user-derived content

		// Title: **KEYWORD** — Category
		md.appendMarkdown(`**${kw.name}** — ${kw.category}\n\n`);

		// Description
		md.appendMarkdown(`${kw.description}\n\n`);

		if (kw.example) {
			md.appendMarkdown(`*Example:* \`${kw.example}\`\n\n`);
		}

		if (kw.deprecationNote) {
			md.appendMarkdown(`⚠️ **Deprecated:** ${kw.deprecationNote}\n\n`);
		}

		return md;
	}

	/**
	 * Returns true if the line is a simple keyword input line (starts with ! after optional whitespace).
	 */
	private isSimpleInputLine(line: string): boolean {
		return line.trimStart().startsWith('!');
	}


}
