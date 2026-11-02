import { ResumeData } from '../types/resume';

type PreviewContent = Omit<
  ResumeData,
  'id' | 'title' | 'lastModified' | 'sectionOrder' | 'sectionVisibility' | 'styles' | 'customSections'
>;

export const PREVIEW_PLACEHOLDER_CONTENT: PreviewContent = {
  personal: {
    fullName: 'Naledi Khumalo',
    jobTitle: 'Senior Operations Manager',
    email: 'naledi.khumalo@example.co.za',
    phone: '+27 82 456 7890',
    location: 'Sandton, Johannesburg (Hybrid)',
    website: 'https://naledikhumalo.co.za',
    linkedin: 'linkedin.com/in/naledi-khumalo',
    github: '',
    summary:
      'Senior Operations Manager with 10+ years leading multi-site teams in retail and logistics. Improved on-time stock replenishment from 82% to 96%, reduced annual operating costs by R12.4 million, and built stable teams across Gauteng and KwaZulu-Natal. Known for turning messy processes into simple, measurable systems that people actually use.',
    photoUrl: '',
  },
  experience: [
    {
      id: 'preview-experience-1',
      company: 'Massmart',
      position: 'Senior Operations Manager',
      location: 'Sandton, Johannesburg',
      startDate: '2021-03',
      endDate: '',
      current: true,
      description: 'Leading regional store and distribution operations across Gauteng.',
      highlights: [
        'Managed a 120-person team across 14 stores, lifting on-time stock replenishment from 82% to 96%.',
        'Reduced annual operating costs by R12.4 million through supplier renegotiation and route planning.',
      ],
      technologies: ['SAP', 'Power BI', 'Microsoft Excel'],
    },
    {
      id: 'preview-experience-2',
      company: 'The Courier Guy',
      position: 'Operations Manager',
      location: 'Durban, KwaZulu-Natal',
      startDate: '2016-07',
      endDate: '2021-02',
      current: false,
      description: 'Ran daily parcel operations for a busy Durban depot.',
      highlights: [
        'Cut customer complaints by 38% by redesigning sorting and dispatch workflows.',
        'Improved driver on-time performance from 81% to 94% during peak season.',
      ],
      technologies: ['Route optimisation', 'SAP', 'Microsoft Excel'],
    },
  ],
  education: [
    {
      id: 'preview-education-1',
      institution: 'University of the Witwatersrand',
      degree: 'Bachelor of Commerce (Honours)',
      fieldOfStudy: 'Business Management',
      location: 'Johannesburg, Gauteng',
      startDate: '2014',
      endDate: '2015',
      current: false,
      gpa: '75% average',
      honors: "Dean's List",
      coursework: 'Operations Management, Financial Management, Business Strategy',
    },
    {
      id: 'preview-education-2',
      institution: 'University of KwaZulu-Natal',
      degree: 'Bachelor of Commerce',
      fieldOfStudy: 'Supply Chain Management',
      location: 'Durban, KwaZulu-Natal',
      startDate: '2010',
      endDate: '2013',
      current: false,
      gpa: '72% average',
      honors: "Dean's List",
      coursework: 'Logistics, Procurement, Business Statistics',
    },
  ],
  skills: [
    {
      id: 'preview-skills-1',
      categoryName: 'Operations & Logistics',
      skills: ['Supply Chain Planning', 'Warehouse Management', 'Route Optimisation', 'Stock Control', 'Health & Safety'],
    },
    {
      id: 'preview-skills-2',
      categoryName: 'Leadership & People',
      skills: ['Team Leadership', 'Performance Management', 'Training & Development', 'Stakeholder Management'],
    },
    {
      id: 'preview-skills-3',
      categoryName: 'Business & Systems',
      skills: ['Budgeting & Cost Control', 'SAP', 'Power BI', 'Microsoft Excel', 'Contract Negotiation'],
    },
  ],
  projects: [
    {
      id: 'preview-project-1',
      title: 'National Distribution Route Redesign',
      role: 'Project Lead',
      description: 'Redesigned delivery routes across Gauteng and North West to reduce fuel and overtime costs.',
      highlights: [
        'Saved R4.2 million in annual fuel and overtime costs.',
        'Lifted driver on-time performance from 81% to 94%.',
      ],
      technologies: ['Route optimisation', 'SAP', 'Microsoft Excel'],
      link: '',
      githubLink: '',
      date: '2022 - 2023',
    },
  ],
  certifications: [
    {
      id: 'preview-certification-1',
      name: 'Project Management Professional (PMP)',
      issuer: 'Project Management Institute',
      issueDate: '2022-05',
      credentialId: 'PMP-2022-01928',
      credentialUrl: 'https://www.pmi.org/certifications/registry',
    },
    {
      id: 'preview-certification-2',
      name: 'Lean Six Sigma Green Belt',
      issuer: 'University of Stellenbosch Business School',
      issueDate: '2020-11',
      credentialId: 'LSSGB-2020-4471',
      credentialUrl: 'https://www.usb.ac.za/',
    },
  ],
  documents: [
    {
      id: 'preview-document-1',
      title: 'Certified ID Copy',
      category: 'id_copy',
      documentNumber: 'SA-ID-8801015800083',
      issuer: 'Department of Home Affairs',
      issueDate: '2024-02',
      fileName: 'id-copy.pdf',
      fileType: 'application/pdf',
      fileSize: '1.2 MB',
      isCertified: true,
      includeInCvAppendix: true,
      notes: 'Certified true copy verified by a commissioner of oaths.',
    },
    {
      id: 'preview-document-2',
      title: 'Bachelor of Commerce (Honours) Certificate',
      category: 'degree_certificate',
      documentNumber: 'WITS-BCOM-2015-4471',
      issuer: 'University of the Witwatersrand',
      issueDate: '2015-12',
      fileName: 'bcom-honours-certificate.pdf',
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
