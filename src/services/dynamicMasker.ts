export class DynamicMasker {
  private static readonly PATTERNS: { regex: RegExp; placeholder: string }[] = [
    // ISO 8601 Timestamps (e.g. 2026-11-11T12:54:55.123Z)
    {
      regex: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g,
      placeholder: '{{MASKED:TIMESTAMP}}',
    },
    // Standard UUIDs (e.g. 123e4567-e89b-12d3-a456-426614174000)
    {
      regex: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
      placeholder: '{{MASKED:UUID}}',
    },
    // Relative human timestamps (e.g. "5 minutes ago", "just now", "yesterday")
    {
      regex: /\b(?:\d+\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago|just now|yesterday)\b/gi,
      placeholder: '{{MASKED:RELATIVE_TIME}}',
    },
    // Common session and bearer tokens in attributes/text (e.g. token="eyJhbG...")
    {
      regex: /bearer\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi,
      placeholder: 'Bearer {{MASKED:JWT_TOKEN}}',
    },
  ];

  /**
   * Sanitizes volatile dynamic strings inside raw or serialized HTML.
   */
  static mask(html: string): string {
    let result = html;
    for (const pattern of this.PATTERNS) {
      result = result.replace(pattern.regex, pattern.placeholder);
    }
    return result;
  }
}
