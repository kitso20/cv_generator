export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  photoUrl?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  highlights: string[];
  technologies?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  gpa?: string;
  honors?: string;
  coursework?: string;
}

export interface SkillCategory {
  id: string;
  categoryName: string;
  skills: string[];
}

export interface Project {
  id: string;
  title: string;
  role?: string;
  description: string;
  highlights: string[];
  technologies: string[];
  link?: string;
  githubLink?: string;
  date?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export type DocumentCategory =
  | 'id_copy'
  | 'degree_certificate'
  | 'professional_cert'
  | 'transcript'
  | 'drivers_license'
  | 'work_permit'
  | 'reference_letter'
  | 'other';

export interface AttachedDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  documentNumber?: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  fileData?: string; // base64 data URL or external URL
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  isCertified?: boolean;
  includeInCvAppendix: boolean;
  notes?: string;
}

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'documents'
  | string;

export interface SectionMeta {
  id: SectionKey;
  label: string;
  isCustom?: boolean;
}

export type TemplateId =
  | 'modern'
  | 'executive'
  | 'ats-classic'
  | 'creative'
  | 'minimalist'
  | 'technical';

export type ColorPaletteId =
  | 'navy'
  | 'slate'
  | 'emerald'
  | 'indigo'
  | 'crimson'
  | 'charcoal'
  | 'amber';

export type FontFamilyId =
  | 'modern-sans'
  | 'editorial-serif'
  | 'classic-clean'
  | 'mono-tech'
  | 'geometric-sans';

export type SpacingDensity = 'compact' | 'standard' | 'relaxed';
export type HeaderLayout = 'centered' | 'left-aligned' | 'accent-banner' | 'split';
export type PaperSize = 'a4' | 'letter';

export interface ResumeStyles {
  template: TemplateId;
  colorPalette: ColorPaletteId;
  fontFamily: FontFamilyId;
  fontSize: 'sm' | 'base' | 'lg';
  spacing: SpacingDensity;
  headerLayout: HeaderLayout;
  showPhoto: boolean;
  paperSize: PaperSize;
  showDividers: boolean;
  showDocumentAppendix?: boolean;
}

export interface ResumeData {
  id: string;
  title: string;
  lastModified: string;
  personal: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  projects: Project[];
  certifications: Certification[];
  documents?: AttachedDocument[];
  customSections: CustomSection[];
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean>;
  styles: ResumeStyles;
}

export interface ColorScheme {
  id: ColorPaletteId;
  name: string;
  primary: string;
  primaryText: string;
  secondary: string;
  accentBg: string;
  accentBorder: string;
  subtleBg: string;
  docxHex: string;
}

export const COLOR_SCHEMES: Record<ColorPaletteId, ColorScheme> = {
  navy: {
    id: 'navy',
    name: 'Executive Navy',
    primary: '#1E3A8A',
    primaryText: 'text-blue-900',
    secondary: '#3B82F6',
    accentBg: 'bg-blue-900',
    accentBorder: 'border-blue-900',
    subtleBg: 'bg-blue-50',
    docxHex: '1E3A8A',
  },
  slate: {
    id: 'slate',
    name: 'Modern Slate',
    primary: '#0F172A',
    primaryText: 'text-slate-900',
    secondary: '#475569',
    accentBg: 'bg-slate-900',
    accentBorder: 'border-slate-900',
    subtleBg: 'bg-slate-100',
    docxHex: '0F172A',
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Emerald',
    primary: '#065F46',
    primaryText: 'text-emerald-800',
    secondary: '#059669',
    accentBg: 'bg-emerald-800',
    accentBorder: 'border-emerald-800',
    subtleBg: 'bg-emerald-50',
    docxHex: '065F46',
  },
  indigo: {
    id: 'indigo',
    name: 'Royal Indigo',
    primary: '#3730A3',
    primaryText: 'text-indigo-800',
    secondary: '#6366F1',
    accentBg: 'bg-indigo-800',
    accentBorder: 'border-indigo-800',
    subtleBg: 'bg-indigo-50',
    docxHex: '3730A3',
  },
  crimson: {
    id: 'crimson',
    name: 'Burgundy Crimson',
    primary: '#881337',
    primaryText: 'text-rose-900',
    secondary: '#BE123C',
    accentBg: 'bg-rose-900',
    accentBorder: 'border-rose-900',
    subtleBg: 'bg-rose-50',
    docxHex: '881337',
  },
  charcoal: {
    id: 'charcoal',
    name: 'Minimal Charcoal',
    primary: '#27272A',
    primaryText: 'text-zinc-800',
    secondary: '#52525B',
    accentBg: 'bg-zinc-800',
    accentBorder: 'border-zinc-800',
    subtleBg: 'bg-zinc-100',
    docxHex: '27272A',
  },
  amber: {
    id: 'amber',
    name: 'Warm Ochre',
    primary: '#78350F',
    primaryText: 'text-amber-900',
    secondary: '#D97706',
    accentBg: 'bg-amber-900',
    accentBorder: 'border-amber-900',
    subtleBg: 'bg-amber-50',
    docxHex: '78350F',
  },
};

export interface FontOption {
  id: FontFamilyId;
  name: string;
  category: string;
  fontFamilyCss: string;
  docxFontName: string;
}

export const FONT_OPTIONS: Record<FontFamilyId, FontOption> = {
  'modern-sans': {
    id: 'modern-sans',
    name: 'Plus Jakarta Sans',
    category: 'Clean Neo-Grotesque',
    fontFamilyCss: "'Plus Jakarta Sans', system-ui, sans-serif",
    docxFontName: 'Calibri',
  },
  'geometric-sans': {
    id: 'geometric-sans',
    name: 'Outfit',
    category: 'Modern Geometric',
    fontFamilyCss: "'Outfit', system-ui, sans-serif",
    docxFontName: 'Arial',
  },
  'editorial-serif': {
    id: 'editorial-serif',
    name: 'Playfair Display',
    category: 'Editorial Luxury',
    fontFamilyCss: "'Playfair Display', Georgia, serif",
    docxFontName: 'Georgia',
  },
  'classic-clean': {
    id: 'classic-clean',
    name: 'Harvard Classic (Georgia)',
    category: 'ATS Classic Serif',
    fontFamilyCss: "Georgia, 'Times New Roman', serif",
    docxFontName: 'Times New Roman',
  },
  'mono-tech': {
    id: 'mono-tech',
    name: 'JetBrains Mono',
    category: 'Engineering Monospace',
    fontFamilyCss: "'JetBrains Mono', monospace",
    docxFontName: 'Consolas',
  },
};
