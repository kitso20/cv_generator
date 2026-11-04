import { describe, it, expect } from 'vitest';
import { generateSyncCode } from '../src/utils/cloudSync';

describe('generateSyncCode', () => {
  it('matches the CV- plus 8 char format', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSyncCode()).toMatch(/^CV-[2-9A-HJ-NP-Z]{8}$/);
    }
  });

  it('accepts the server-side sync code pattern', () => {
    const serverPattern = /^[A-Z0-9][A-Z0-9-]{4,31}$/;
    for (let i = 0; i < 50; i++) {
      expect(generateSyncCode()).toMatch(serverPattern);
    }
  });

  it('produces distinct codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateSyncCode()));
    expect(codes.size).toBeGreaterThan(90);
  });
});
