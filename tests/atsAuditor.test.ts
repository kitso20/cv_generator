import { describe, it, expect } from 'vitest';
import { runAtsAudit, autoFormatForAts } from '../src/utils/atsAuditor';
import { normalizeResumeData } from '../src/utils/resumeSchema';

const blank = normalizeResumeData({});

const strongResume = normalizeResumeData({
  personal: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+27 82 000 0000',
    location: 'Johannesburg',
    jobTitle: 'Senior Engineer',
    summary:
      'Senior software engineer with 8+ years building scalable platforms, leading cross-functional teams, delivering measurable cost reductions and reliability improvements across cloud infrastructure and developer tooling.',
  },
  experience: [
    {
      id: 'e1',
      company: 'Acme',
      position: 'Senior Engineer',
      location: 'Johannesburg',
      startDate: '2019-01',
      endDate: '',
      current: true,
      description: '',
      highlights: ['Reduced infrastructure costs by 35%', 'Improved deployment frequency 4x', 'Led a team of 6 engineers'],
    },
    {
      id: 'e2',
      company: 'Beta Corp',
      position: 'Engineer',
      location: 'Cape Town',
      startDate: '2015-06',
      endDate: '2018-12',
      current: false,
      description: '',
      highlights: ['Built automated testing pipeline', 'Decreased build times by 50%'],
    },
  ],
  skills: [{ id: 's1', categoryName: 'Core', skills: ['TypeScript', 'React', 'Node.js', 'AWS', 'PostgreSQL'] }],
});

describe('runAtsAudit', () => {
  it('returns a structurally complete report', () => {
    const report = runAtsAudit(blank);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
    expect(['A+', 'A', 'B', 'C', 'Needs Work']).toContain(report.letterGrade);
    expect(Array.isArray(report.checklist)).toBe(true);
    expect(report.checklist.length).toBeGreaterThan(0);
    for (const item of report.checklist) {
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });

  it('scores a blank resume lower than a strong, complete resume', () => {
    const blankScore = runAtsAudit(blank).overallScore;
    const strongScore = runAtsAudit(strongResume).overallScore;
    expect(strongScore).toBeGreaterThan(blankScore);
  });

  it('detects quantified bullet points', () => {
    const report = runAtsAudit(strongResume);
    expect(report.totalBullets).toBeGreaterThan(0);
    expect(report.quantifiedCount).toBeGreaterThan(0);
    expect(report.quantifiedPercentage).toBeGreaterThan(0);
  });
});

describe('autoFormatForAts', () => {
  it('forces an ATS-friendly template and keeps content intact', () => {
    const formatted = autoFormatForAts(strongResume);
    expect(formatted.styles.template).toBe('ats-classic');
    expect(formatted.styles.fontFamily).toBe('classic-clean');
    expect(formatted.styles.showPhoto).toBe(false);
    expect(formatted.experience).toHaveLength(strongResume.experience.length);
    expect(formatted.personal.fullName).toBe('Jane Doe');
  });
});
