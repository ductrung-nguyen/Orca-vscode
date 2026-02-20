import * as vscode from 'vscode';
import { simpleKeywords, blockDefinitions, blockAttributes } from './data/orcaKeywordDefs';

/**
 * Base interface for all keyword definitions
 */
export interface KeywordDefinition {
	name: string;
	category: string;
	description: string;
	example?: string;
	relatedKeywords?: string[];
	deprecationNote?: string;
}

/**
 * Definition for block directives (%block)
 */
export interface BlockDefinition {
	name: string;
	description: string;
	commonParams: string[];
	example?: string;
}

/**
 * Definition for block attributes (parameters inside blocks)
 */
export interface BlockAttributeDefinition {
	name: string;
	blockName: string;
	type: 'integer' | 'float' | 'string' | 'boolean';
	default?: string;
	unit?: string;
	description: string;
	example?: string;
}

/**
 * Hover provider for ORCA input files (.inp)
 * Provides inline documentation for keywords, block directives, and block attributes
 */
export class OrcaHoverProvider implements vscode.HoverProvider {
	provideHover(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.Hover> {
		// Try simple input line token
		const simpleToken = this.extractSimpleLineToken(document, position);
		if (simpleToken) {
			const definition = this.lookupSimpleKeyword(simpleToken);
			if (definition) {
				const markdown = this.formatSimpleKeyword(definition);
				return new vscode.Hover(markdown);
			}
		}

		// Try block directive name
		const blockName = this.extractBlockDirectiveName(document, position);
		if (blockName) {
			const definition = this.lookupBlockDefinition(blockName);
			if (definition) {
				const markdown = this.formatBlockDefinition(definition);
				return new vscode.Hover(markdown);
			}
		}

		// Try block attribute
		const blockContext = this.resolveBlockContext(document, position);
		if (blockContext) {
			const attributeToken = this.extractBlockAttributeToken(document, position);
			if (attributeToken) {
				const definition = this.lookupBlockAttribute(blockContext, attributeToken);
				if (definition) {
					const markdown = this.formatBlockAttribute(definition);
					return new vscode.Hover(markdown);
				}
			}
		}

		// No token found
		return undefined;
	}

	/**
	 * Extract token from simple input line (line starting with !)
	 * Returns the word at the cursor position, or null if not on a word
	 */
	private extractSimpleLineToken(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | null {
		const line = document.lineAt(position.line);
		const lineText = line.text.trim();

		// Check if line starts with '!'
		if (!lineText.startsWith('!')) {
			return null;
		}

		// Get word range at position
		// Note: Hyphen at end of character class doesn't need escaping
		const wordRange = document.getWordRangeAtPosition(position, /[\w+*-]+/);
		if (!wordRange) {
			return null;
		}

		// Extract and return the word
		return document.getText(wordRange);
	}

	/**
	 * Extract block directive name from line starting with %
	 * Returns block name (normalized to lowercase), or null if not on a block directive line
	 */
	private extractBlockDirectiveName(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | null {
		const line = document.lineAt(position.line);
		const lineText = line.text.trim();

		// Check if line starts with '%'
		if (!lineText.startsWith('%')) {
			return null;
		}

		// Extract block name (word after %)
		const match = lineText.match(/^%\s*(\w+)/);
		if (!match) {
			return null;
		}

		// Return normalized (lowercase) block name
		return match[1].toLowerCase();
	}

	/**
	 * Determine which block directive contains the cursor position
	 * Scans upward from current line to find enclosing %block without matching 'end'
	 * Returns block name (lowercase) or null if not inside a block
	 */
	private resolveBlockContext(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | null {
		const currentLineNum = position.line;
		const scanLimit = Math.max(0, currentLineNum - 50); // Performance limit: 50 lines upward

		let foundEnd = false;

		// Scan upward from current position
		for (let i = currentLineNum; i >= scanLimit; i--) {
			const line = document.lineAt(i).text.trim();

			// Skip the current line if it's a block directive
			if (i === currentLineNum && line.match(/^%\s*(\w+)/)) {
				continue;
			}

			// Check for block end (remember we found it)
			if (line.toLowerCase() === 'end') {
				foundEnd = true;
				continue;
			}

			// Check for block start
			const blockMatch = line.match(/^%\s*(\w+)/);
			if (blockMatch) {
				// If we found an 'end' before finding the block start, we're outside
				if (foundEnd) {
					return null;
				}
				// Otherwise, we're inside this block
				return blockMatch[1].toLowerCase();
			}
		}

		// No enclosing block found
		return null;
	}

	/**
	 * Extract parameter name from position inside a block body
	 * Returns the word at cursor position (typically parameter name)
	 */
	private extractBlockAttributeToken(
		document: vscode.TextDocument,
		position: vscode.Position
	): string | null {
		const line = document.lineAt(position.line);
		const lineText = line.text.trim();

		// Skip if it's a block directive line or empty
		if (lineText.startsWith('%') || lineText.toLowerCase() === 'end' || lineText === '') {
			return null;
		}

		// Get word range at position
		const wordRange = document.getWordRangeAtPosition(position, /[\w]+/);
		if (!wordRange) {
			return null;
		}

		// Extract and return the word
		return document.getText(wordRange);
	}

	// =========================================================================
	// Task 4.0: Keyword Lookup Logic
	// =========================================================================

	/**
	 * Look up a simple keyword (case-insensitive)
	 * @param token Keyword token from simple input line
	 * @returns Keyword definition or null if not found
	 */
	private lookupSimpleKeyword(token: string): KeywordDefinition | null {
		// Normalize to uppercase for case-insensitive lookup
		const normalized = token.toUpperCase();
		return simpleKeywords[normalized] || null;
	}

	/**
	 * Look up a block directive definition
	 * @param blockName Block name (already normalized to lowercase)
	 * @returns Block definition or null if not found
	 */
	private lookupBlockDefinition(blockName: string): BlockDefinition | null {
		return blockDefinitions[blockName] || null;
	}

	/**
	 * Look up a block attribute definition (context-aware)
	 * @param blockName Block context name
	 * @param attributeName Attribute token
	 * @returns Block attribute definition or null if not found
	 */
	private lookupBlockAttribute(blockName: string, attributeName: string): BlockAttributeDefinition | null {
		const blockAttrs = blockAttributes[blockName];
		if (!blockAttrs) {
			return null;
		}
		// Note: Case-insensitive lookup for consistency with simple keywords
		// ORCA is case-insensitive, so "maxiter" should match "MaxIter"
		const normalizedAttr = attributeName.toUpperCase();
		for (const key of Object.keys(blockAttrs)) {
			if (key.toUpperCase() === normalizedAttr) {
				return blockAttrs[key];
			}
		}
		return null;
	}

	// =========================================================================
	// Task 5.0: Hover Content Formatting
	// =========================================================================

	/**
	 * Format simple keyword as Markdown hover content
	 * @param definition Keyword definition
	 * @returns MarkdownString for hover display
	 */
	private formatSimpleKeyword(definition: KeywordDefinition): vscode.MarkdownString {
		const md = new vscode.MarkdownString();
		md.isTrusted = false; // Security: untrusted markdown defaults

		// Title: **KEYWORD_NAME** — Category
		md.appendMarkdown(`**${definition.name}** — ${definition.category}\n\n`);

		// Description
		md.appendMarkdown(`${definition.description}\n\n`);

		// Example (optional)
		if (definition.example) {
			md.appendMarkdown(`*Example:* \`${definition.example}\`\n\n`);
		}

		// Deprecation warning (if applicable)
		if (definition.deprecationNote) {
			md.appendMarkdown(`⚠️ **Deprecated:** ${definition.deprecationNote}\n\n`);
		}

		// See also / Related keywords (optional)
		if (definition.relatedKeywords && definition.relatedKeywords.length > 0) {
			const seeAlso = this.renderSeeAlso(definition.relatedKeywords);
			if (seeAlso) {
				md.appendMarkdown(seeAlso);
			}
		}

		return md;
	}

	/**
	 * Format block directive as Markdown hover content
	 * @param definition Block definition
	 * @returns MarkdownString for hover display
	 */
	private formatBlockDefinition(definition: BlockDefinition): vscode.MarkdownString {
		const md = new vscode.MarkdownString();
		md.isTrusted = false;

		// Title: **%blockname** — Block Directive
		md.appendMarkdown(`**${definition.name}** — Block Directive\n\n`);

		// Description
		md.appendMarkdown(`${definition.description}\n\n`);

		// Common parameters
		if (definition.commonParams && definition.commonParams.length > 0) {
			const params = definition.commonParams.map(p => `\`${p}\``).join(', ');
			md.appendMarkdown(`*Common parameters:* ${params}\n\n`);
		}

		// Example (optional)
		if (definition.example) {
			md.appendMarkdown(`*Example:*\n\`\`\`\n${definition.example}\n\`\`\`\n`);
		}

		return md;
	}

	/**
	 * Format block attribute as Markdown hover content
	 * @param definition Block attribute definition
	 * @returns MarkdownString for hover display
	 */
	private formatBlockAttribute(definition: BlockAttributeDefinition): vscode.MarkdownString {
		const md = new vscode.MarkdownString();
		md.isTrusted = false;

		// Title: **AttributeName** *(in %blockname)*
		md.appendMarkdown(`**${definition.name}** *(in %${definition.blockName})*\n\n`);

		// Description
		md.appendMarkdown(`${definition.description}\n\n`);

		// Metadata
		md.appendMarkdown(`- **Type:** ${definition.type}\n`);
		if (definition.default) {
			md.appendMarkdown(`- **Default:** ${definition.default}\n`);
		}
		if (definition.unit) {
			md.appendMarkdown(`- **Unit:** ${definition.unit}\n`);
		}
		md.appendMarkdown('\n');

		// Example (optional)
		if (definition.example) {
			md.appendMarkdown(`*Example:* \`${definition.example}\`\n`);
		}

		return md;
	}

	/**
	 * Render "See also" section with related keywords
	 * @param relatedKeywords List of related keyword names
	 * @returns Markdown string for see also section (empty if no keywords)
	 */
	private renderSeeAlso(relatedKeywords: string[]): string {
		if (!relatedKeywords || relatedKeywords.length === 0) {
			return '';
		}

		// Limit to 5 keywords max
		const keywords = relatedKeywords.slice(0, 5);
		const formatted = keywords.map(k => `\`${k}\``).join(', ');
		return `*See also:* ${formatted}\n`;
	}
}
