/**
 * Security utilities to prevent XSS and audit vulnerabilities.
 */

/**
 * Validates a URL to prevent javascript: or other malicious schema injections.
 * Allows safe protocols: http, https, blob.
 * Also allows relative URLs starting with / (excluding schema-relative //).
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const cleaned = url.trim();

  // Safe relative paths: must start with / but not // (schema-relative)
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) {
    return true;
  }

  // Safe absolute protocols
  try {
    const parsed = new URL(cleaned);
    return ['http:', 'https:', 'blob:'].includes(parsed.protocol);
  } catch (e) {
    // If it fails URL parsing and wasn't a valid relative path, it's unsafe
    return false;
  }
}

/**
 * Sanitizes a URL and returns a safe fallback if the input is dangerous.
 */
export function sanitizeUrl(url: string | null | undefined, fallback: string = 'about:blank'): string {
  if (!url) return fallback;
  const cleaned = url.trim();
  if (isSafeUrl(cleaned)) {
    return cleaned;
  }
  return fallback;
}
