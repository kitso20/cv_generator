/**
 * Schema normalizer for resume data of unknown provenance.
 *
 * Applied to anything that did not come straight from the running editor:
 *  - localStorage drafts (best-effort)
 *  - backup files restored from disk
 *  - cloud resumes loaded by sync code (incl. the `?sync=` URL param)
 *  - JSON pasted into the LinkedIn importer
 *
 * It never throws; worst case it returns a fresh blank resume. Every field is
 * type-checked, unknown enum values fall back to defaults, array fields are
 * coerced, and user-controlled URLs are passed through the safe-URL helpers.
 */

import {
  ResumeData,
  ResumeStyles,
  PersonalInfo,
  WorkExperience,
  Education,
  SkillCategory,
  Project,
  Certification,
  AttachedDocument,
  CustomSection,
  CustomSectionItem,
  TemplateId,
  ColorPaletteId,
  FontFamilyId,
  SpacingDensity,
  HeaderLayout,
  PaperSize,
} from '../types/resume';
import { safeImageUrl } from './safeUrl';

const TEMPLATE_IDS: TemplateId[] = ['modern', 'executive', 'ats-classic', 'creative', 'minimalist', 'technical'];
const PALETTE_IDS: ColorPaletteId[] = ['navy', 'slate', 'emerald', 'indigo', 'crimson', 'charcoal', 'amber'];
const FONT_IDS: FontFamilyId[] = ['modern-sans', 'editorial-serif', 'classic-clean', 'mono-tech', 'geometric-sans'];
const SPACING_IDS: SpacingDensity[] = ['compact', 'standard', 'relaxed'];
const HEADER_IDS: HeaderLayout[] = ['centered', 'left-aligned', 'accent-banner', 'split'];
const PAPER_IDS: PaperSize[] = ['a4', 'letter'];
const FONT_SIZE_IDS = ['sm', 'base', 'lg'] as const;

const KNOWN_SECTIONS = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'documents'];

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').map((v) => v.slice(0, 500));
}

function clampEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function rid(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

function id(value: unknown, prefix: string): string {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 80) : rid(prefix);
}

function normalizePersonal(value: unknown): PersonalInfo {
  const p = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const photoUrl = safeImageUrl(p.photoUrl);
  return {
    fullName: str(p.fullName).slice(0, 120),
    jobTitle: str(p.jobTitle).slice(0, 160),
    email: str(p.email).slice(0, 160),
    phone: str(p.phone).slice(0, 60),
    location: str(p.location).slice(0, 160),
    website: str(p.website).slice(0, 300),
    linkedin: str(p.linkedin).slice(0, 300),
    github: str(p.github).slice(0, 300),
    summary: str(p.summary).slice(0, 4000),
    photoUrl: photoUrl ?? '',
  };
}

function normalizeExperience(value: unknown): WorkExperience[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).map((raw) => {
    const e = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: id(e.id, 'exp'),
      company: str(e.company).slice(0, 200),
      position: str(e.position).slice(0, 200),
      location: str(e.location).slice(0, 200),
      startDate: str(e.startDate).slice(0, 40),
      endDate: str(e.endDate).slice(0, 40),
      current: bool(e.current, false),
      description: str(e.description).slice(0, 4000),
      highlights: strArray(e.highlights).slice(0, 20),
      technologies: strArray(e.technologies).slice(0, 40),
    };
  });
}

function normalizeEducation(value: unknown): Education[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map((raw) => {
    const e = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: id(e.id, 'edu'),
      institution: str(e.institution).slice(0, 200),
      degree: str(e.degree).slice(0, 200),
      fieldOfStudy: str(e.fieldOfStudy).slice(0, 200),
      location: str(e.location).slice(0, 200),
      startDate: str(e.startDate).slice(0, 40),
      endDate: str(e.endDate).slice(0, 40),
      current: bool(e.current, false),
      gpa: str(e.gpa).slice(0, 40),
      honors: str(e.honors).slice(0, 300),
      coursework: str(e.coursework).slice(0, 2000),
    };
  });
}

function normalizeSkills(value: unknown): SkillCategory[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map((raw) => {
    const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: id(s.id, 'skill'),
      categoryName: str(s.categoryName).slice(0, 120),
      skills: strArray(s.skills).slice(0, 60),
    };
  });
}

function normalizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map((raw) => {
    const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: id(p.id, 'proj'),
      title: str(p.title).slice(0, 200),
      role: str(p.role).slice(0, 160),
      description: str(p.description).slice(0, 4000),
      highlights: strArray(p.highlights).slice(0, 20),
      technologies: strArray(p.technologies).slice(0, 40),
      link: str(p.link).slice(0, 300),
      githubLink: str(p.githubLink).slice(0, 300),
      date: str(p.date).slice(0, 80),
    };
  });
}

function normalizeCertifications(value: unknown): Certification[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).map((raw) => {
    const c = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: id(c.id, 'cert'),
      name: str(c.name).slice(0, 200),
      issuer: str(c.issuer).slice(0, 200),
      issueDate: str(c.issueDate).slice(0, 40),
      expirationDate: str(c.expirationDate).slice(0, 40),
      credentialId: str(c.credentialId).slice(0, 160),
      credentialUrl: str(c.credentialUrl).slice(0, 300),
    };
  });
}

const DOC_CATEGORIES = ['id_copy', 'degree_certificate', 'professional_cert', 'transcript', 'drivers_license', 'work_permit', 'reference_letter', 'other'] as const;

function normalizeDocuments(value: unknown): AttachedDocument[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map((raw) => {
    const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const fileData = safeImageUrl(d.fileData) ?? (typeof d.fileData === 'string' && /^https?:\/\//i.test(d.fileData.trim()) ? d.fileData.trim() : undefined);
    return {
      id: id(d.id, 'doc'),
      title: str(d.title).slice(0, 200),
      category: clampEnum(d.category, DOC_CATEGORIES, 'other'),
      documentNumber: str(d.documentNumber).slice(0, 120),
      issuer: str(d.issuer).slice(0, 200),
      issueDate: str(d.issueDate).slice(0, 40),
      expiryDate: str(d.expiryDate).slice(0, 40),
      fileData,
      fileName: str(d.fileName).slice(0, 200),
      fileType: str(d.fileType).slice(0, 120),
      fileSize: str(d.fileSize).slice(0, 40),
      isCertified: bool(d.isCertified, false),
      includeInCvAppendix: bool(d.includeInCvAppendix, true),
      notes: str(d.notes).slice(0, 1000),
    };
  });
}

function normalizeCustomSections(value: unknown): CustomSection[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 15).map((raw) => {
    const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const items: CustomSectionItem[] = Array.isArray(s.items)
      ? s.items.slice(0, 40).map((rawItem) => {
          const it = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>;
          return {
            id: id(it.id, 'item'),
            title: str(it.title).slice(0, 200),
            subtitle: str(it.subtitle).slice(0, 200),
            date: str(it.date).slice(0, 80),
            description: str(it.description).slice(0, 4000),
          };
        })
      : [];
    return {
      id: id(s.id, 'section'),
      title: str(s.title).slice(0, 120),
      items,
    };
  });
}

function normalizeSectionOrder(value: unknown, customSections: CustomSection[]): string[] {
  const customIds = customSections.map((s) => s.id);
  const allowed = new Set([...KNOWN_SECTIONS, ...customIds]);
  const order: string[] = [];
  if (Array.isArray(value)) {
    for (const raw of value) {
      if (typeof raw !== 'string') continue;
      const key = raw.trim();
      if (!key || order.includes(key)) continue;
      if (allowed.has(key) || key.startsWith('custom-') || key.startsWith('section-')) {
        order.push(key.slice(0, 80));
      }
    }
  }
  // Guarantee every known section appears exactly once.
  for (const known of KNOWN_SECTIONS) {
    if (!order.includes(known)) order.push(known);
  }
  for (const customId of customIds) {
    if (!order.includes(customId)) order.push(customId);
  }
  return order;
}

function normalizeSectionVisibility(value: unknown, sectionOrder: string[]): Record<string, boolean> {
  const src = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const out: Record<string, boolean> = {};
  for (const key of sectionOrder) {
    out[key] = bool(src[key], true);
  }
  for (const [key, v] of Object.entries(src)) {
    if (typeof v === 'boolean' && !(key in out)) out[key] = v;
  }
  return out;
}

function normalizeStyles(value: unknown): ResumeStyles {
  const s = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    template: clampEnum(s.template, TEMPLATE_IDS, 'modern'),
    colorPalette: clampEnum(s.colorPalette, PALETTE_IDS, 'slate'),
    fontFamily: clampEnum(s.fontFamily, FONT_IDS, 'modern-sans'),
    fontSize: clampEnum(s.fontSize, FONT_SIZE_IDS, 'base'),
    spacing: clampEnum(s.spacing, SPACING_IDS, 'standard'),
    headerLayout: clampEnum(s.headerLayout, HEADER_IDS, 'left-aligned'),
    showPhoto: bool(s.showPhoto, false),
    paperSize: clampEnum(s.paperSize, PAPER_IDS, 'a4'),
    showDividers: bool(s.showDividers, true),
    showDocumentAppendix: bool(s.showDocumentAppendix, true),
    showAttribution: bool(s.showAttribution, true),
  };
}

export function normalizeResumeData(input: unknown): ResumeData {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  const customSections = normalizeCustomSections(src.customSections);
  const sectionOrder = normalizeSectionOrder(src.sectionOrder, customSections);
  const sectionVisibility = normalizeSectionVisibility(src.sectionVisibility, sectionOrder);

  return {
    id: id(src.id, 'resume'),
    title: str(src.title, 'My Resume').slice(0, 200) || 'My Resume',
    lastModified: str(src.lastModified) || new Date().toISOString(),
    personal: normalizePersonal(src.personal),
    experience: normalizeExperience(src.experience),
    education: normalizeEducation(src.education),
    skills: normalizeSkills(src.skills),
    projects: normalizeProjects(src.projects),
    certifications: normalizeCertifications(src.certifications),
    documents: normalizeDocuments(src.documents),
    customSections,
    sectionOrder,
    sectionVisibility,
    styles: normalizeStyles(src.styles),
  };
}

/**
 * True when the input has roughly the right shape to be a resume at all.
 * Used to reject obviously-wrong payloads before showing a restore UI.
 */
export function looksLikeResume(input: unknown): boolean {
  if (!input || typeof input !== 'object') return false;
  const src = input as Record<string, unknown>;
  return typeof src.personal === 'object' && src.personal !== null;
}
