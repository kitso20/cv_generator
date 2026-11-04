import { ResumeData } from '../types/resume';

export interface AtsCheckItem {
  id: string;
  category: 'critical' | 'recommended' | 'formatting';
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  scoreImpact: number;
}

export interface AtsAuditReport {
  overallScore: number;
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Work';
  checklist: AtsCheckItem[];
  quantifiedCount: number;
  totalBullets: number;
  quantifiedPercentage: number;
  actionVerbCount: number;
  actionVerbPercentage: number;
  recommendedKeywords: string[];
}

const STRONG_ACTION_VERBS = new Set([
  'accelerated', 'achieved', 'administered', 'amplified', 'analyzed', 'applied',
  'architected', 'automated', 'boosted', 'built', 'championed', 'coached',
  'collaborated', 'consolidated', 'constructed', 'coordinated', 'curated',
  'cut', 'decreased', 'delivered', 'deployed', 'designed', 'developed',
  'devised', 'directed', 'drove', 'eliminated', 'engineered', 'enhanced',
  'established', 'evaluated', 'exceeded', 'executed', 'expanded', 'expedited',
  'formulated', 'fostered', 'generated', 'grew', 'guided', 'halved',
  'headed', 'implemented', 'improved', 'increased', 'initiated', 'innovated',
  'installed', 'instituted', 'integrated', 'invented', 'launched', 'led',
  'leveraged', 'managed', 'maximized', 'mentored', 'migrated', 'minimized',
  'modernized', 'negotiated', 'optimized', 'orchestrated', 'originated',
  'outperformed', 'overhauled', 'oversaw', 'pioneered', 'planned', 'produced',
  'quadrupled', 're-engineered', 'reduced', 'refactored', 'resolved', 'restructured',
  'revamped', 'revitalized', 'scaled', 'secured', 'simplified', 'slashed',
  'spearheaded', 'standardized', 'streamlined', 'strengthened', 'structured',
  'surpassed', 'synthesized', 'transformed', 'tripled', 'unified', 'upgraded',
]);

export function runAtsAudit(resume: ResumeData): AtsAuditReport {
  const { personal, experience, skills, styles } = resume;
  const checklist: AtsCheckItem[] = [];

  // Check 1: Contact Info Completeness
  const hasName = Boolean(personal.fullName?.trim());
  const hasEmail = Boolean(personal.email?.trim() && personal.email.includes('@'));
  const hasPhone = Boolean(personal.phone?.trim());
  const hasLocation = Boolean(personal.location?.trim());

  if (hasName && hasEmail && hasPhone && hasLocation) {
    checklist.push({
      id: 'contact-complete',
      category: 'critical',
      title: 'Complete Contact Essentials',
      description: 'Your name, email, phone number, and location are all detected properly.',
      status: 'passed',
      scoreImpact: 15,
    });
  } else {
    checklist.push({
      id: 'contact-missing',
      category: 'critical',
      title: 'Missing Core Contact Details',
      description: `Ensure your ${[!hasName && 'Name', !hasEmail && 'Email', !hasPhone && 'Phone', !hasLocation && 'Location'].filter(Boolean).join(', ')} are clearly filled.`,
      status: 'failed',
      scoreImpact: -15,
    });
  }

  // Check 2: Professional Summary
  if (personal.summary && personal.summary.length >= 80) {
    checklist.push({
      id: 'summary-optimal',
      category: 'recommended',
      title: 'Strong Executive Summary',
      description: `Summary contains ${personal.summary.split(/\s+/).length} words, providing context for recruiters and ATS parsers.`,
      status: 'passed',
      scoreImpact: 10,
    });
  } else {
    checklist.push({
      id: 'summary-short',
      category: 'recommended',
      title: 'Executive Summary Brief or Missing',
      description: 'A 2-4 sentence summary with target keywords increases keyword match rates by 35%.',
      status: 'warning',
      scoreImpact: -5,
    });
  }

  // Check 3: Work Experience Entries & Dates
  if (experience.length >= 2) {
    const allHaveDates = experience.every((e) => e.startDate && (e.endDate || e.current));
    if (allHaveDates) {
      checklist.push({
        id: 'experience-dates',
        category: 'critical',
        title: 'Chronological Work History',
        description: `${experience.length} roles documented with consistent month/year date formats.`,
        status: 'passed',
        scoreImpact: 15,
      });
    } else {
      checklist.push({
        id: 'experience-missing-dates',
        category: 'critical',
        title: 'Missing Employment Dates',
        description: 'Some roles are missing start or end dates. ATS parsers require dates to compute tenure.',
        status: 'warning',
        scoreImpact: -8,
      });
    }
  } else if (experience.length === 1) {
    checklist.push({
      id: 'experience-minimal',
      category: 'recommended',
      title: 'Single Experience Item',
      description: 'Consider detailing internships, research roles, or freelance work.',
      status: 'passed',
      scoreImpact: 8,
    });
  } else {
    checklist.push({
      id: 'experience-empty',
      category: 'critical',
      title: 'No Work Experience Listed',
      description: 'Add at least one professional or project experience entry.',
      status: 'failed',
      scoreImpact: -20,
    });
  }

  // Check 4: Quantified Impact Metrics in Highlights
  const allBullets: string[] = [];
  experience.forEach((e) => {
    if (e.highlights) allBullets.push(...e.highlights.filter((h) => h.trim().length > 0));
  });

  const numberPattern = /\b\d+(?:\.\d+)?%|\$\d+(?:\.\d+)?[kKmMbB]?|\b\d+\+?|\b\d+x\b/i;
  const quantifiedBullets = allBullets.filter((b) => numberPattern.test(b));
  const quantifiedCount = quantifiedBullets.length;
  const totalBullets = allBullets.length;
  const quantifiedPercentage = totalBullets > 0 ? Math.round((quantifiedCount / totalBullets) * 100) : 0;

  if (quantifiedPercentage >= 40) {
    checklist.push({
      id: 'quantified-high',
      category: 'recommended',
      title: 'Measurable Quantitative Impact',
      description: `${quantifiedPercentage}% of your bullets contain numbers, percentages, or financial metrics ($/%)—excellent for hiring managers.`,
      status: 'passed',
      scoreImpact: 15,
    });
  } else if (quantifiedPercentage > 0) {
    checklist.push({
      id: 'quantified-moderate',
      category: 'recommended',
      title: 'Add More Quantified Results',
      description: `Only ${quantifiedPercentage}% of bullets have numbers. Try including team size, % improvement, or revenue impact.`,
      status: 'warning',
      scoreImpact: 5,
    });
  } else {
    checklist.push({
      id: 'quantified-none',
      category: 'recommended',
      title: 'No Measurable Metrics Detected',
      description: 'Quantify achievements with metrics (e.g. "Reduced build times by 40%", "Managed team of 6").',
      status: 'failed',
      scoreImpact: -10,
    });
  }

  // Check 5: Action Verbs
  let actionVerbCount = 0;
  allBullets.forEach((bullet) => {
    const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (firstWord && STRONG_ACTION_VERBS.has(firstWord)) {
      actionVerbCount++;
    }
  });

  const actionVerbPercentage = totalBullets > 0 ? Math.round((actionVerbCount / totalBullets) * 100) : 0;
  if (actionVerbPercentage >= 50) {
    checklist.push({
      id: 'verbs-strong',
      category: 'recommended',
      title: 'High-Impact Action Verbs',
      description: `${actionVerbPercentage}% of bullets begin with powerful action verbs (e.g. Spearheaded, Engineered, Scaled).`,
      status: 'passed',
      scoreImpact: 15,
    });
  } else {
    checklist.push({
      id: 'verbs-weak',
      category: 'recommended',
      title: 'Strengthen Leading Action Verbs',
      description: 'Begin each bullet with active verbs instead of passive phrases like "Responsible for" or "Helped with".',
      status: 'warning',
      scoreImpact: 5,
    });
  }

  // Check 6: Skills Section
  const totalSkills = skills.reduce((acc, cat) => acc + (cat.skills?.length || 0), 0);
  if (totalSkills >= 8) {
    checklist.push({
      id: 'skills-adequate',
      category: 'critical',
      title: 'Categorized Core Skills',
      description: `${totalSkills} categorized skills detected across ${skills.length} domains.`,
      status: 'passed',
      scoreImpact: 15,
    });
  } else if (totalSkills > 0) {
    checklist.push({
      id: 'skills-sparse',
      category: 'recommended',
      title: 'Add More Key Industry Skills',
      description: `Current skills count is ${totalSkills}. Adding 8-15 specific tools/languages aids automated filtering.`,
      status: 'warning',
      scoreImpact: 5,
    });
  } else {
    checklist.push({
      id: 'skills-missing',
      category: 'critical',
      title: 'Skills Section Empty',
      description: 'Applicant Tracking Systems match resumes against job descriptions based heavily on keywords in this section.',
      status: 'failed',
      scoreImpact: -15,
    });
  }

  // Check 7: Layout & Template ATS Compatibility
  const isAtsNativeTemplate = styles.template === 'ats-classic' || styles.template === 'executive' || styles.template === 'modern';
  if (isAtsNativeTemplate && !styles.showPhoto) {
    checklist.push({
      id: 'template-ats-clean',
      category: 'formatting',
      title: 'Parser-Safe Layout Architecture',
      description: `${styles.template.toUpperCase()} layout uses standard sequential column flow with no scanning obstructions.`,
      status: 'passed',
      scoreImpact: 15,
    });
  } else if (styles.showPhoto) {
    checklist.push({
      id: 'photo-warning',
      category: 'formatting',
      title: 'Photo Visible (Not Recommended for US/UK ATS)',
      description: 'US, UK, and Canadian corporate ATS systems recommend omitting photos to avoid compliance filters.',
      status: 'warning',
      scoreImpact: -5,
    });
  } else {
    checklist.push({
      id: 'template-creative-warning',
      category: 'formatting',
      title: 'Creative Layout in Use',
      description: 'Split layouts look modern to humans, but simpler single-column formats (Harvard Classic) rank highest with older ATS software.',
      status: 'warning',
      scoreImpact: 0,
    });
  }

  // Calculate overall score (capped between 20 and 100)
  let rawScore = 35;
  checklist.forEach((item) => {
    if (item.status === 'passed') rawScore += item.scoreImpact;
    else if (item.status === 'failed') rawScore += item.scoreImpact;
  });

  const finalScore = Math.max(25, Math.min(100, rawScore));
  let letterGrade: AtsAuditReport['letterGrade'] = 'Needs Work';
  if (finalScore >= 90) letterGrade = 'A+';
  else if (finalScore >= 80) letterGrade = 'A';
  else if (finalScore >= 70) letterGrade = 'B';
  else if (finalScore >= 60) letterGrade = 'C';

  return {
    overallScore: finalScore,
    letterGrade,
    checklist,
    quantifiedCount,
    totalBullets,
    quantifiedPercentage,
    actionVerbCount,
    actionVerbPercentage,
    recommendedKeywords: [
      'Spearheaded', 'Architected', 'Reduced costs by', 'Scaled to',
      'Engineered', 'Accelerated', 'Cross-functional leadership', 'Optimized',
      'Automated pipeline', 'Delivered sub-100ms latency', 'Zero-downtime migration'
    ],
  };
}

export function autoFormatForAts(current: ResumeData): ResumeData {
  return {
    ...current,
    lastModified: new Date().toISOString(),
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects'],
    sectionVisibility: {
      ...current.sectionVisibility,
      summary: true,
      experience: true,
      education: true,
      skills: true,
      certifications: true,
      projects: true,
    },
    styles: {
      ...current.styles,
      template: 'ats-classic',
      fontFamily: 'classic-clean',
      colorPalette: 'slate',
      headerLayout: 'centered',
      showPhoto: false,
      spacing: 'standard',
      showDividers: true,
      paperSize: 'a4',
    },
  };
}
