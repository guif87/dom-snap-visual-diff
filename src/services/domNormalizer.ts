import { DynamicMasker } from './dynamicMasker';

export class DomNormalizer {
  /**
   * Cleans, masks, and pretty-formats HTML for deterministic text diffing.
   */
  static normalize(rawHtml: string): string {
    const masked = DynamicMasker.mask(rawHtml);
    return this.indentHtml(masked);
  }

  /**
   * Scans baseline and target HTML to identify dropped data-testid attributes.
   */
  static findMissingTestIds(baselineHtml: string, currentHtml: string): string[] {
    const baselineIds = this.extractTestIds(baselineHtml);
    const currentIds = new Set(this.extractTestIds(currentHtml));

    const missing: string[] = [];
    for (const id of baselineIds) {
      if (!currentIds.has(id)) {
        missing.push(id);
      }
    }
    return missing;
  }

  private static extractTestIds(html: string): string[] {
    const regex = /data-testid=["']([^"']+)["']/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      ids.push(match[1]);
    }
    return ids;
  }

  /**
   * Lightweight tag indenting to ensure clean multi-line diffs without requiring bulky DOM parsers.
   */
  private static indentHtml(html: string): string {
    const lines = html
      .replace(/>\s*</g, '>\n<')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let indentLevel = 0;
    const formatted: string[] = [];

    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    for (const line of lines) {
      const isClosing = line.startsWith('</');
      const isSelfClosing = line.endsWith('/>') || voidTags.has(line.replace(/<([a-z0-9_-]+).*/i, '$1').toLowerCase());

      if (isClosing) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formatted.push('  '.repeat(indentLevel) + line);

      if (!isClosing && !isSelfClosing && line.startsWith('<') && !line.startsWith('<!')) {
        indentLevel++;
      }
    }

    return formatted.join('\n');
  }
}
