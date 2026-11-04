/**
 * URL sanitizing helpers.
 *
 * User-controlled strings (typed into the editor, pasted from a backup file,
 * or parsed from a LinkedIn export) must never land in an <a href> or an
 * <img src> untouched: React does not block `javascript:` URLs.
 */

// Matches ASCII control characters (incl. \n, \r, \t) that can smuggle schemes.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1F\x7F]+/g;

/**
 * Normalize a user-entered URL to a safe absolute URL.
 *
 * Allowed output protocols: http:, https:, plus mailto: when `allowMailto` is set.
 * Bare domains (e.g. "example.com") are upgraded to https://.
 * Returns null when the input cannot be made safe.
 */
export function safeUrl(value: unknown, opts: { allowMailto?: boolean } = {}): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  const cleaned = raw.replace(CONTROL_CHARS, '');

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(cleaned) ? cleaned : `https://${cleaned}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol === 'http:' || protocol === 'https:') return parsed.toString();
  if (protocol === 'mailto:' && opts.allowMailto) return parsed.toString();
  return null;
}

/** Safe href for a website/project link; undefined when unsafe. */
export function safeHref(value: unknown): string | undefined {
  return safeUrl(value) ?? undefined;
}

/**
 * Validate an image URL (photo, document fileData).
 * Allows http(s) URLs and data: URLs that carry an actual image payload.
 * Everything else (javascript:, data:text/html, …) is rejected.
 */
export function safeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const raw = value.trim();
  if (!raw) return undefined;

  if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);base64,/i.test(raw)) {
    return raw;
  }
  return safeUrl(raw) ?? undefined;
}
