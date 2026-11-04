import { describe, it, expect } from 'vitest';
import { safeUrl, safeHref, safeImageUrl } from '../src/utils/safeUrl';

describe('safeUrl', () => {
  it('allows absolute http(s) URLs', () => {
    expect(safeUrl('https://example.com/page')).toBe('https://example.com/page');
    expect(safeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('upgrades bare domains to https', () => {
    expect(safeUrl('example.com')).toBe('https://example.com/');
    expect(safeUrl('www.example.co.za/path?q=1')).toContain('https://www.example.co.za/');
  });

  it('rejects javascript: URLs (XSS vector)', () => {
    expect(safeUrl('javascript:alert(document.cookie)')).toBeNull();
    expect(safeUrl('  javascript:alert(1)')).toBeNull();
    expect(safeUrl('JaVaScRiPt:alert(1)')).toBeNull();
  });

  it('rejects javascript: URLs smuggled with control characters', () => {
    expect(safeUrl('java\nscript:alert(1)')).toBeNull();
    expect(safeUrl('java\tscript:alert(1)')).toBeNull();
    expect(safeUrl('java\r\nscript:alert(1)')).toBeNull();
  });

  it('rejects vbscript: and data: text payloads', () => {
    expect(safeUrl('vbscript:msgbox(1)')).toBeNull();
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('rejects empty and non-string input', () => {
    expect(safeUrl('')).toBeNull();
    expect(safeUrl('   ')).toBeNull();
    expect(safeUrl(null)).toBeNull();
    expect(safeUrl(undefined)).toBeNull();
    expect(safeUrl(42)).toBeNull();
  });

  it('mailto: is opt-in only', () => {
    expect(safeUrl('mailto:me@example.com')).toBeNull();
    expect(safeUrl('mailto:me@example.com', { allowMailto: true })).toBe('mailto:me@example.com');
  });

  it('safeHref returns undefined for unsafe URLs', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHref('https://example.com')).toBe('https://example.com/');
  });
});

describe('safeImageUrl', () => {
  const tinyPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('allows data: URLs for real images', () => {
    expect(safeImageUrl(tinyPng)).toBe(tinyPng);
  });

  it('allows https image URLs', () => {
    expect(safeImageUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
  });

  it('rejects data:text/html payloads', () => {
    expect(safeImageUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeUndefined();
  });

  it('rejects javascript: URLs', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBeUndefined();
  });

  it('rejects data:image/svg+xml with non-base64 payload', () => {
    expect(safeImageUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBeUndefined();
  });
});
