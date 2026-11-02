import { ResumeData, WorkExperience, Education, SkillCategory, Certification } from '../types/resume';

export interface LinkedInParseResult {
  personal: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    summary: string;
  };
  experience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  certifications: Certification[];
  detectedSections: string[];
  rawTextLength: number;
}

export function parseLinkedInData(input: string): LinkedInParseResult {
  const cleanInput = input.trim();

  // 1. Check if user provided JSON export
  if (cleanInput.startsWith('{') && cleanInput.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanInput);
      return parseJsonResume(parsed);
    } catch {
      // Continue to text heuristic parsing
    }
  }

  // Text Parsing
  const lines = cleanInput.split('\n').map((l) => l.trim()).filter(Boolean);

  const result: LinkedInParseResult = {
    personal: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      summary: '',
    },
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    detectedSections: [],
    rawTextLength: cleanInput.length,
  };

  // Extract Emails
  const emailMatch = cleanInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.personal.email = emailMatch[0];
  }

  // Extract Phone Numbers
  const phoneMatch = cleanInput.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    result.personal.phone = phoneMatch[0];
  }

  // Extract LinkedIn URL or username
  const linkedinMatch = cleanInput.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) {
    result.personal.linkedin = linkedinMatch[0];
  }

  // Split into major sections
  const sectionKeywords = [
    { key: 'summary', regex: /^(about|summary|professional summary|executive summary)$/i },
    { key: 'experience', regex: /^(experience|work experience|employment history|work history)$/i },
    { key: 'education', regex: /^(education|academic background|studies)$/i },
    { key: 'skills', regex: /^(skills|top skills|core competencies|technical skills|skills & expertise)$/i },
    { key: 'certifications', regex: /^(certifications|licenses & certifications|credentials)$/i },
  ];

  type SectionType = 'header' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'other';
  let currentSection: SectionType = 'header';

  const sectionLines: Record<SectionType, string[]> = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    other: [],
  };

  for (const line of lines) {
    // Check if line matches a section header
    const matchedKeyword = sectionKeywords.find((kw) => kw.regex.test(line));
    if (matchedKeyword) {
      currentSection = matchedKeyword.key as SectionType;
      if (!result.detectedSections.includes(currentSection)) {
        result.detectedSections.push(currentSection);
      }
      continue;
    }
    sectionLines[currentSection].push(line);
  }

  // Parse Header (Full Name, Headline, Location)
  if (sectionLines.header.length > 0) {
    // LinkedIn PDF usually puts Name first, followed by headline, then location
    const nonContactLines = sectionLines.header.filter(
      (l) =>
        !l.includes('@') &&
        !l.match(/^\+?\d/) &&
        !l.toLowerCase().includes('linkedin.com') &&
        !l.toLowerCase().includes('page ')
    );

    if (nonContactLines.length > 0) {
      result.personal.fullName = nonContactLines[0].replace(/^(Name:|\s*)/i, '').trim();
    }
    if (nonContactLines.length > 1) {
      result.personal.jobTitle = nonContactLines[1].trim();
    }
    if (nonContactLines.length > 2 && !result.personal.location) {
      // Check if line looks like location (contains comma, Area, City)
      const locCandidate = nonContactLines[2];
      if (locCandidate.includes(',') || locCandidate.toLowerCase().includes('area') || locCandidate.toLowerCase().includes('united')) {
        result.personal.location = locCandidate.trim();
      }
    }
  }

  // Parse Summary / About
  if (sectionLines.summary.length > 0) {
    result.personal.summary = sectionLines.summary.join('\n\n');
  }

  // Parse Experience
  if (sectionLines.experience.length > 0) {
    result.experience = parseExperienceLines(sectionLines.experience);
  }

  // Parse Education
  if (sectionLines.education.length > 0) {
    result.education = parseEducationLines(sectionLines.education);
  }

  // Parse Skills
  if (sectionLines.skills.length > 0) {
    const rawSkills: string[] = [];
    sectionLines.skills.forEach((l) => {
      // Could be comma-separated or bullet list or line per skill
      const parts = l.split(/[,•|·]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 50);
      rawSkills.push(...parts);
    });

    // Remove duplicates
    const uniqueSkills = Array.from(new Set(rawSkills));
    if (uniqueSkills.length > 0) {
      result.skills = [
        {
          id: 'imported-skills-1',
          categoryName: 'LinkedIn Profile Skills',
          skills: uniqueSkills.slice(0, 25),
        },
      ];
    }
  }

  // Parse Certifications
  if (sectionLines.certifications.length > 0) {
    const certs: Certification[] = [];
    let currentCert: Partial<Certification> = {};

    sectionLines.certifications.forEach((line, idx) => {
      if (!currentCert.name) {
        currentCert.name = line;
      } else if (!currentCert.issuer) {
        currentCert.issuer = line;
      } else {
        // Date or credential ID
        const dateMatch = line.match(/\b(20\d\d|19\d\d)\b/);
        if (dateMatch) {
          currentCert.issueDate = dateMatch[0];
        }
        certs.push({
          id: `imported-cert-${idx}`,
          name: currentCert.name || 'Certification',
          issuer: currentCert.issuer || 'Issuing Organization',
          issueDate: currentCert.issueDate || '2023',
        });
        currentCert = {};
      }
    });

    if (currentCert.name) {
      certs.push({
        id: `imported-cert-last`,
        name: currentCert.name,
        issuer: currentCert.issuer || 'Issuing Organization',
        issueDate: currentCert.issueDate || '2023',
      });
    }

    result.certifications = certs;
  }

  return result;
}

function parseExperienceLines(lines: string[]): WorkExperience[] {
  const experiences: WorkExperience[] = [];
  let currentExp: Partial<WorkExperience> | null = null;
  let currentBullets: string[] = [];

  const dateRegex =
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(dateRegex);

    if (dateMatch) {
      // Found a date line! This means the preceding line or current context is a role
      if (currentExp && currentExp.company) {
        currentExp.highlights = currentBullets;
        experiences.push(currentExp as WorkExperience);
        currentBullets = [];
      }

      const prevLine1 = i > 0 ? lines[i - 1] : '';
      const prevLine2 = i > 1 ? lines[i - 2] : '';

      const isCurrent = /present|current/i.test(dateMatch[2]);
      const startDate = dateMatch[1];
      const endDate = isCurrent ? '' : dateMatch[2];

      currentExp = {
        id: `imported-exp-${experiences.length + 1}`,
        position: prevLine1 || 'Role / Position',
        company: prevLine2 || 'Company',
        location: '',
        startDate,
        endDate,
        current: isCurrent,
        description: '',
        highlights: [],
      };
    } else if (currentExp) {
      // Check if bullet point or description
      const trimmed = line.replace(/^[•\-\*]\s*/, '').trim();
      if (trimmed.length > 5) {
        currentBullets.push(trimmed);
      }
    }
  }

  if (currentExp && (currentExp.company || currentExp.position)) {
    currentExp.highlights = currentBullets;
    experiences.push(currentExp as WorkExperience);
  }

  // Fallback if no strict date regex matched
  if (experiences.length === 0 && lines.length > 0) {
    experiences.push({
      id: 'imported-exp-fallback',
      company: lines[0] || 'Company Name',
      position: lines[1] || 'Professional Role',
      location: '',
      startDate: '2021',
      endDate: 'Present',
      current: true,
      description: lines.slice(2).join('\n'),
      highlights: lines.slice(2, 6),
    });
  }

  return experiences;
}

function parseEducationLines(lines: string[]): Education[] {
  const educations: Education[] = [];
  let currentEdu: Partial<Education> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(/\b(19\d\d|20\d\d)\b(?:\s*[-–—]\s*\b(19\d\d|20\d\d|Present)\b)?/i);

    if (line.match(/(university|college|institute|school|academy)/i) || !currentEdu) {
      if (currentEdu && currentEdu.institution) {
        educations.push(currentEdu as Education);
      }
      currentEdu = {
        id: `imported-edu-${educations.length + 1}`,
        institution: line,
        degree: '',
        fieldOfStudy: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
      };
    } else if (currentEdu) {
      if (dateMatch && (!currentEdu.startDate || !currentEdu.endDate)) {
        currentEdu.startDate = dateMatch[1] || '';
        currentEdu.endDate = dateMatch[2] || '';
      } else if (!currentEdu.degree) {
        currentEdu.degree = line;
      } else if (!currentEdu.fieldOfStudy) {
        currentEdu.fieldOfStudy = line;
      }
    }
  }

  if (currentEdu && currentEdu.institution) {
    educations.push(currentEdu as Education);
  }

  return educations;
}

function parseJsonResume(json: any): LinkedInParseResult {
  const basics = json.basics || json.personal || json;
  return {
    personal: {
      fullName: basics.name || basics.fullName || '',
      jobTitle: basics.label || basics.jobTitle || basics.headline || '',
      email: basics.email || '',
      phone: basics.phone || '',
      location: typeof basics.location === 'object' ? `${basics.location.city || ''}, ${basics.location.region || ''}` : basics.location || '',
      linkedin: basics.linkedin || '',
      summary: basics.summary || basics.about || '',
    },
    experience: (json.work || json.experience || []).map((w: any, idx: number) => ({
      id: `imported-exp-${idx}`,
      company: w.company || w.name || '',
      position: w.position || w.role || '',
      location: w.location || '',
      startDate: w.startDate || '',
      endDate: w.endDate || '',
      current: !w.endDate || w.endDate.toLowerCase() === 'present',
      description: w.summary || w.description || '',
      highlights: Array.isArray(w.highlights) ? w.highlights : w.description ? [w.description] : [],
      technologies: Array.isArray(w.technologies) ? w.technologies : [],
    })),
    education: (json.education || []).map((e: any, idx: number) => ({
      id: `imported-edu-${idx}`,
      institution: e.institution || e.school || '',
      degree: e.studyType || e.degree || '',
      fieldOfStudy: e.area || e.fieldOfStudy || '',
      location: e.location || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      current: false,
      gpa: e.score || e.gpa || '',
    })),
    skills: (json.skills || []).map((s: any, idx: number) => ({
      id: `imported-skill-${idx}`,
      categoryName: s.name || s.categoryName || 'Skills',
      skills: Array.isArray(s.keywords) ? s.keywords : Array.isArray(s.skills) ? s.skills : [],
    })),
    certifications: (json.certificates || json.certifications || []).map((c: any, idx: number) => ({
      id: `imported-cert-${idx}`,
      name: c.name || '',
      issuer: c.issuer || '',
      issueDate: c.date || c.issueDate || '',
    })),
    detectedSections: ['summary', 'experience', 'education', 'skills'],
    rawTextLength: JSON.stringify(json).length,
  };
}

export function mergeLinkedInIntoResume(current: ResumeData, imported: LinkedInParseResult): ResumeData {
  const updated: ResumeData = {
    ...current,
    lastModified: new Date().toISOString(),
    personal: {
      ...current.personal,
      fullName: imported.personal.fullName || current.personal.fullName,
      jobTitle: imported.personal.jobTitle || current.personal.jobTitle,
      email: imported.personal.email || current.personal.email,
      phone: imported.personal.phone || current.personal.phone,
      location: imported.personal.location || current.personal.location,
      linkedin: imported.personal.linkedin || current.personal.linkedin,
      summary: imported.personal.summary || current.personal.summary,
    },
    experience: imported.experience.length > 0 ? imported.experience : current.experience,
    education: imported.education.length > 0 ? imported.education : current.education,
    skills: imported.skills.length > 0 ? imported.skills : current.skills,
    certifications: imported.certifications.length > 0 ? imported.certifications : current.certifications,
  };

  return updated;
}
