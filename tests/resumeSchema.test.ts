import { describe, it, expect } from 'vitest';
import { normalizeResumeData, looksLikeResume } from '../src/utils/resumeSchema';

describe('normalizeResumeData', () => {
  it('returns a valid blank resume for garbage input', () => {
    for (const junk of [null, undefined, 42, 'hello', [], {}, true]) {
      const r = normalizeResumeData(junk);
      expect(r.personal).toBeTruthy();
      expect(Array.isArray(r.experience)).toBe(true);
      expect(Array.isArray(r.sectionOrder)).toBe(true);
      expect(r.styles.template).toBe('modern');
      expect(r.styles.spacing).toBe('standard');
      expect(r.styles.paperSize).toBe('a4');
    }
  });

  it('clamps unknown enum values to defaults', () => {
    const r = normalizeResumeData({
      styles: { spacing: 'huge', template: 'rainbow', paperSize: 'legal', fontFamily: 'wingdings' },
    });
    expect(r.styles.spacing).toBe('standard');
    expect(r.styles.template).toBe('modern');
    expect(r.styles.paperSize).toBe('a4');
    expect(r.styles.fontFamily).toBe('modern-sans');
  });

  it('keeps valid enum values', () => {
    const r = normalizeResumeData({
      styles: { spacing: 'relaxed', template: 'creative', paperSize: 'letter', fontFamily: 'mono-tech' },
    });
    expect(r.styles.spacing).toBe('relaxed');
    expect(r.styles.template).toBe('creative');
    expect(r.styles.paperSize).toBe('letter');
    expect(r.styles.fontFamily).toBe('mono-tech');
  });

  it('guarantees every known section appears exactly once in sectionOrder', () => {
    const r = normalizeResumeData({ sectionOrder: ['skills', 'experience', 'skills', 'experience'] });
    const known = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'documents'];
    for (const s of known) {
      expect(r.sectionOrder.filter((x) => x === s)).toHaveLength(1);
    }
    // Skills and experience retained their requested relative order, others appended.
    expect(r.sectionOrder.indexOf('skills')).toBeLessThan(r.sectionOrder.indexOf('experience'));
  });

  it('drops javascript: fileData from attached documents', () => {
    const r = normalizeResumeData({
      documents: [
        { id: 'd1', title: 'ID Copy', category: 'id_copy', fileData: 'javascript:alert(1)', includeInCvAppendix: true },
        { id: 'd2', title: 'Degree', category: 'degree_certificate', fileData: 'data:image/png;base64,AAAA', includeInCvAppendix: true },
      ],
    });
    expect(r.documents?.[0].fileData).toBeUndefined();
    expect(r.documents?.[1].fileData).toBe('data:image/png;base64,AAAA');
  });

  it('drops javascript: photoUrl from personal info', () => {
    const r = normalizeResumeData({ personal: { photoUrl: 'javascript:alert(1)' } });
    expect(r.personal.photoUrl).toBe('');
  });

  it('coerces wrongly-typed arrays and strings', () => {
    const r = normalizeResumeData({
      experience: [{ company: 123, highlights: 'not-an-array', current: 'yes' }, 'garbage-entry'],
      skills: [{ categoryName: 'Tools', skills: ['SAP', 42, null, 'Excel'] }],
    });
    expect(r.experience).toHaveLength(2);
    expect(r.experience[0].company).toBe('');
    expect(r.experience[0].highlights).toEqual([]);
    expect(r.experience[0].current).toBe(false);
    expect(r.skills[0].skills).toEqual(['SAP', 'Excel']);
  });

  it('caps absurd input sizes instead of growing unbounded', () => {
    const huge = 'x'.repeat(100_000);
    const r = normalizeResumeData({ personal: { summary: huge } });
    expect(r.personal.summary.length).toBeLessThanOrEqual(4000);
  });

  it('normalize then normalize again is stable (idempotent)', () => {
    const once = normalizeResumeData({
      personal: { fullName: 'Jane Doe', email: 'jane@example.com' },
      styles: { template: 'technical' },
      sectionOrder: ['projects', 'skills'],
    });
    const twice = normalizeResumeData(once);
    expect(twice).toEqual(once);
  });
});

describe('looksLikeResume', () => {
  it('accepts objects with a personal record', () => {
    expect(looksLikeResume({ personal: {} })).toBe(true);
  });
  it('rejects non-resumes', () => {
    expect(looksLikeResume(null)).toBe(false);
    expect(looksLikeResume([])).toBe(false);
    expect(looksLikeResume({ experience: [] })).toBe(false);
    expect(looksLikeResume('nope')).toBe(false);
  });
});
