import { ResumeData } from '../types/resume';

type PreviewContent = Omit<
  ResumeData,
  'id' | 'title' | 'lastModified' | 'sectionOrder' | 'sectionVisibility' | 'styles' | 'customSections'
>;

export const PREVIEW_PLACEHOLDER_CONTENT: PreviewContent = {
  personal: {
    fullName: 'Alex Vance, M.Sc.',
    jobTitle: 'Lead Distributed Systems Architect',
    email: 'alex.vance@example.com',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA (Hybrid / Remote)',
    website: 'https://portfolio.dev',
    linkedin: 'linkedin.com/in/alex-vance',
    github: 'github.com/alexvance',
    summary:
      'Lead Distributed Systems Architect with 10+ years designing resilient, high-throughput cloud platforms. Scaled event-driven infrastructure to 350,000 messages per second, cut compute spend by 35%, and mentored cross-functional engineering teams. Focused on turning complex reliability and performance challenges into measurable business outcomes.',
    photoUrl: '',
  },
  experience: [
    {
      id: 'preview-experience-1',
      company: 'Acme Cloud Corp',
      position: 'Senior Software Architect',
      location: 'San Francisco, CA / Remote',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description: 'Architecting multi-region cloud platforms and leading a team of 12 engineers.',
      highlights: [
        'Spearheaded infrastructure overhaul, reducing compute latency by 35% and saving $450k annually.',
        'Designed a multi-region failover strategy that sustained 99.99% uptime across 8 services.',
      ],
      technologies: ['Go', 'Kubernetes', 'TypeScript', 'AWS'],
    },
    {
      id: 'preview-experience-2',
      company: 'Nimbus Data Systems',
      position: 'Distributed Systems Engineer',
      location: 'Austin, TX',
      startDate: '2018-06',
      endDate: '2022-02',
      current: false,
      description: 'Built and operated high-volume event processing services.',
      highlights: [
        'Scaled Kafka ingestion from 40k to 210k events per second without downtime.',
        'Introduced observability standards that reduced mean time to resolution by 42%.',
      ],
      technologies: ['Java', 'Kafka', 'PostgreSQL', 'Terraform'],
    },
  ],
  education: [
    {
      id: 'preview-education-1',
      institution: 'University of California, Berkeley',
      degree: 'Master of Science',
      fieldOfStudy: 'Computer Science',
      location: 'Berkeley, CA',
      startDate: '2016',
      endDate: '2018',
      current: false,
      gpa: '3.9 / 4.0',
      honors: 'Magna Cum Laude',
      coursework: 'Distributed Systems, Cloud Computing, Advanced Algorithms',
    },
    {
      id: 'preview-education-2',
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      location: 'Austin, TX',
      startDate: '2012',
      endDate: '2016',
      current: false,
      gpa: '3.8 / 4.0',
      honors: "Dean's List",
      coursework: 'Operating Systems, Data Structures, Software Engineering',
    },
  ],
  skills: [
    {
      id: 'preview-skills-1',
      categoryName: 'Cloud & DevOps',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Helm', 'Prometheus'],
    },
    {
      id: 'preview-skills-2',
      categoryName: 'Languages',
      skills: ['Go', 'TypeScript', 'Python', 'Java', 'SQL'],
    },
    {
      id: 'preview-skills-3',
      categoryName: 'Architecture & Leadership',
      skills: ['Distributed Systems', 'Event-Driven Design', 'Mentoring', 'Technical Strategy'],
    },
  ],
  projects: [
    {
      id: 'preview-project-1',
      title: 'StreamForge Message Queue',
      role: 'Creator & Maintainer',
      description: 'Open-source, fault-tolerant event streaming platform for high-volume workloads.',
      highlights: [
        'Handled 350,000 msgs/sec throughput, adopted by 8 enterprise fintech clients.',
        'Maintained sub-10ms p99 publish latency across three cloud regions.',
      ],
      technologies: ['Go', 'Kafka', 'Redis', 'Kubernetes'],
      link: 'https://github.com/alexvance/streamforge',
      githubLink: 'https://github.com/alexvance/streamforge',
      date: '2023 - 2024',
    },
  ],
  certifications: [
    {
      id: 'preview-certification-1',
      name: 'AWS Certified Solutions Architect Professional',
      issuer: 'Amazon Web Services',
      issueDate: '2023-09',
      credentialId: 'AWS-SAP-482019',
      credentialUrl: 'https://aws.amazon.com/verification',
    },
    {
      id: 'preview-certification-2',
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      issueDate: '2022-05',
      credentialId: 'CKA-2022-01928',
      credentialUrl: 'https://training.linuxfoundation.org/certification/verify/',
    },
  ],
  documents: [
    {
      id: 'preview-document-1',
      title: 'Certified ID Copy / Passport',
      category: 'id_copy',
      documentNumber: 'US-PASSPORT-482019',
      issuer: 'Dept of State',
      issueDate: '2024-02',
      fileName: 'passport-copy.pdf',
      fileType: 'application/pdf',
      fileSize: '1.2 MB',
      isCertified: true,
      includeInCvAppendix: true,
      notes: 'Certified true copy verified by commissioner.',
    },
    {
      id: 'preview-document-2',
      title: 'Master of Science Diploma',
      category: 'degree_certificate',
      documentNumber: 'UCB-MS-2018-4471',
      issuer: 'University of California, Berkeley',
      issueDate: '2018-06',
      fileName: 'msc-diploma.pdf',
      fileType: 'application/pdf',
      fileSize: '860 KB',
      isCertified: true,
      includeInCvAppendix: true,
    },
  ],
};

export function hasUserContent(resume: ResumeData): boolean {
  const personal = resume.personal;

  return Boolean(
    personal.fullName.trim() ||
      personal.jobTitle.trim() ||
      personal.email.trim() ||
      personal.phone.trim() ||
      personal.location.trim() ||
      personal.website.trim() ||
      personal.linkedin.trim() ||
      personal.github.trim() ||
      personal.summary.trim() ||
      resume.experience.length > 0 ||
      resume.education.length > 0 ||
      resume.skills.length > 0 ||
      resume.projects.length > 0 ||
      resume.certifications.length > 0 ||
      (resume.documents && resume.documents.length > 0) ||
      resume.customSections.length > 0
  );
}

export function withPreviewPlaceholders(resume: ResumeData): ResumeData {
  if (hasUserContent(resume)) {
    return resume;
  }

  const fallback = PREVIEW_PLACEHOLDER_CONTENT;

  return {
    ...resume,
    personal: { ...fallback.personal },
    experience: fallback.experience,
    education: fallback.education,
    skills: fallback.skills,
    projects: fallback.projects,
    certifications: fallback.certifications,
    documents: fallback.documents,
  };
}

export function previewUsesPlaceholders(resume: ResumeData): boolean {
  return !hasUserContent(resume);
}
