import React, { useRef, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Download,
  X,
  Eye,
  FileText as FileDocIcon,
} from 'lucide-react';
import { ResumeData, COLOR_SCHEMES, FONT_OPTIONS, AttachedDocument } from '../types/resume';

interface ResumePreviewProps {
  resume: ResumeData;
  scale?: number;
  onUpdateResume?: (updated: ResumeData) => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  scale: externalScale,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(externalScale || 1.0);
  const [selectedDocForView, setSelectedDocForView] = useState<AttachedDocument | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { personal, experience, education, skills, projects, certifications, customSections, sectionOrder, sectionVisibility, styles } = resume;

  const colorScheme = COLOR_SCHEMES[styles.colorPalette] || COLOR_SCHEMES.navy;
  const fontOption = FONT_OPTIONS[styles.fontFamily] || FONT_OPTIONS['modern-sans'];

  // Spacing variables
  const densityStyles = {
    compact: {
      sectionGap: 'mb-4',
      itemGap: 'mb-2.5',
      bulletGap: 'space-y-0.5',
      headingMargin: 'mb-1.5',
      padding: 'p-8 sm:p-10',
      fontSizeBase: 'text-[12.5px] leading-relaxed',
      headingSize: 'text-sm font-bold tracking-wider',
    },
    standard: {
      sectionGap: 'mb-6',
      itemGap: 'mb-4',
      bulletGap: 'space-y-1',
      headingMargin: 'mb-2.5',
      padding: 'p-10 sm:p-12',
      fontSizeBase: 'text-[13.5px] leading-relaxed',
      headingSize: 'text-base font-bold tracking-wide',
    },
    relaxed: {
      sectionGap: 'mb-8',
      itemGap: 'mb-5',
      bulletGap: 'space-y-1.5',
      headingMargin: 'mb-3.5',
      padding: 'p-12 sm:p-14',
      fontSizeBase: 'text-[14px] leading-loose',
      headingSize: 'text-lg font-bold tracking-wide',
    },
  }[styles.spacing];

  // Paper Dimensions:
  // A4 ratio: 210mm x 297mm (1 : 1.414)
  // US Letter ratio: 8.5 x 11 (1 : 1.294)
  const isLetter = styles.paperSize === 'letter';
  const paperMinWidth = '794px'; // ~96dpi A4 pixel width
  const paperMinHeight = isLetter ? '1028px' : '1123px';

  // Section Heading Component
  const renderSectionHeading = (title: string, customDividerClass = '') => {
    if (styles.template === 'ats-classic') {
      return (
        <div className={`border-b-2 border-slate-800 pb-0.5 ${densityStyles.headingMargin}`}>
          <h2 className={`${densityStyles.headingSize} uppercase tracking-wider text-slate-900 font-serif`}>
            {title}
          </h2>
        </div>
      );
    }

    if (styles.template === 'executive') {
      return (
        <div className={`relative flex items-center ${densityStyles.headingMargin}`}>
          <div className="flex-grow border-t border-slate-300" />
          <h2
            className={`px-3 ${densityStyles.headingSize} uppercase tracking-widest font-serif`}
            style={{ color: colorScheme.primary }}
          >
            {title}
          </h2>
          <div className="flex-grow border-t border-slate-300" />
        </div>
      );
    }

    if (styles.template === 'minimalist') {
      return (
        <div className={`border-b border-slate-200 pb-1 ${densityStyles.headingMargin}`}>
          <h2 className={`${densityStyles.headingSize} uppercase tracking-widest text-slate-700 font-medium`}>
            {title}
          </h2>
        </div>
      );
    }

    if (styles.template === 'technical') {
      return (
        <div className={`flex items-center gap-2 border-b border-slate-200 pb-1 ${densityStyles.headingMargin}`}>
          <span className="font-mono text-xs text-slate-400">#</span>
          <h2
            className={`${densityStyles.headingSize} uppercase font-mono tracking-wider`}
            style={{ color: colorScheme.primary }}
          >
            {title}
          </h2>
        </div>
      );
    }

    // Default 'modern' & 'creative'
    return (
      <div className={`pb-1 ${styles.showDividers ? 'border-b' : ''} ${densityStyles.headingMargin}`} style={{ borderColor: colorScheme.primary + '33' }}>
        <h2
          className={`${densityStyles.headingSize} uppercase tracking-wider flex items-center gap-2 font-semibold`}
          style={{ color: colorScheme.primary }}
        >
          {title}
        </h2>
      </div>
    );
  };

  // Render individual sections
  const renderSummarySection = () => {
    if (!personal.summary) return null;
    return (
      <section className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading('Professional Summary')}
        <p className={`${densityStyles.fontSizeBase} text-slate-700 dark:text-slate-700 text-justify`}>
          {personal.summary}
        </p>
      </section>
    );
  };

  const renderExperienceSection = () => {
    if (experience.length === 0) return null;
    return (
      <section className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading('Work Experience')}
        <div className="space-y-4">
          {experience.map((job) => (
            <div key={job.id} className={`${densityStyles.itemGap} print-page-break-avoid`}>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <span className="font-bold text-slate-900 text-[14px]">{job.position}</span>
                  {job.company && (
                    <span className="font-semibold text-slate-700 text-[14px]">
                      {' '}· {job.company}
                    </span>
                  )}
                  {job.location && (
                    <span className="text-xs text-slate-500 italic ml-1.5">
                      ({job.location})
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-500 font-mono shrink-0">
                  {job.startDate} – {job.current ? 'Present' : job.endDate || 'Present'}
                </div>
              </div>

              {job.description && (
                <p className="text-xs text-slate-600 italic mt-0.5 mb-1.5">
                  {job.description}
                </p>
              )}

              {job.highlights && job.highlights.length > 0 && (
                <ul className={`list-disc list-outside ml-4 mt-1.5 text-slate-700 ${densityStyles.fontSizeBase} ${densityStyles.bulletGap}`}>
                  {job.highlights.map((point, idx) => point.trim() && (
                    <li key={idx} className="pl-1">
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {job.technologies && job.technologies.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tools:
                  </span>
                  {job.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderEducationSection = () => {
    if (education.length === 0) return null;
    return (
      <section className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading('Education')}
        <div className="space-y-3">
          {education.map((edu) => (
            <div key={edu.id} className="print-page-break-avoid">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <span className="font-bold text-slate-900 text-[14px]">
                    {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                  </span>
                  {edu.institution && (
                    <span className="font-medium text-slate-700 text-[13.5px]">
                      {' '}· {edu.institution}
                    </span>
                  )}
                  {edu.location && (
                    <span className="text-xs text-slate-500 italic ml-1">
                      ({edu.location})
                    </span>
                  )}
                </div>
                {(edu.startDate || edu.endDate) && (
                  <div className="text-xs font-semibold text-slate-500 font-mono shrink-0">
                    {edu.startDate} {edu.startDate && edu.endDate ? '–' : ''} {edu.current ? 'Present' : edu.endDate}
                  </div>
                )}
              </div>

              {(edu.gpa || edu.honors) && (
                <div className="text-xs text-slate-600 italic mt-0.5">
                  {[edu.gpa ? `GPA: ${edu.gpa}` : '', edu.honors].filter(Boolean).join(' • ')}
                </div>
              )}

              {edu.coursework && (
                <div className="text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-500">Key Coursework: </span>
                  {edu.coursework}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSkillsSection = () => {
    if (skills.length === 0) return null;
    return (
      <section className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading('Skills & Competencies')}
        <div className="space-y-1.5">
          {skills.map((category) => (
            <div key={category.id} className="text-xs sm:text-[13px] leading-relaxed">
              <span className="font-bold text-slate-800">{category.categoryName}: </span>
              <span className="text-slate-700">
                {category.skills.join(', ')}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderProjectsSection = () => {
    if (projects.length === 0) return null;
    return (
      <section className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading('Key Projects')}
        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="print-page-break-avoid">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-[14px]">{proj.title}</span>
                  {proj.role && (
                    <span className="text-xs text-slate-500 italic">({proj.role})</span>
                  )}
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {proj.date && (
                  <span className="text-xs font-mono text-slate-500">{proj.date}</span>
                )}
              </div>

              {proj.description && (
                <p className="text-xs text-slate-600 mt-0.5">{proj.description}</p>
              )}

              {proj.highlights && proj.highlights.length > 0 && (
                <ul className="list-disc list-outside ml-4 mt-1 text-slate-700 text-xs sm:text-[13px] space-y-0.5">
                  {proj.highlights.map((h, idx) => h.trim() && (
                    <li key={idx} className="pl-1">{h}</li>
                  ))}
                </ul>
              )}

              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {proj.technologies.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCertificationsSection = () => {
    if (certifications.length === 0) return null;
    return (
      <section className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading('Certifications & Credentials')}
        <div className="space-y-1.5">
          {certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between items-baseline text-xs sm:text-[13px]">
              <div>
                <span className="font-bold text-slate-900">{cert.name}</span>
                {cert.issuer && <span className="text-slate-600"> — {cert.issuer}</span>}
                {cert.credentialId && (
                  <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                    (ID: {cert.credentialId})
                  </span>
                )}
              </div>
              {cert.issueDate && (
                <span className="text-xs font-mono text-slate-500 shrink-0 ml-2">
                  {cert.issueDate}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderDocumentsSection = () => {
    const docs = resume.documents || [];
    if (docs.length === 0) return null;

    return (
      <section className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading('Verified Supporting Documents & Credentials Dossier')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100/90 text-blue-800 font-mono">
                    {doc.category.replace(/_/g, ' ')}
                  </span>
                  {doc.isCertified && (
                    <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Certified Copy
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-xs leading-snug">
                  {doc.title}
                </h4>
                {doc.issuer && (
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {doc.issuer} {doc.issueDate ? `· ${doc.issueDate}` : ''}
                  </p>
                )}
                {doc.documentNumber && (
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    Doc / Ref #: {doc.documentNumber}
                  </p>
                )}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono text-[10px] truncate max-w-[130px]">
                  {doc.fileName || 'Attachment Document'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDocForView(doc)}
                  className="no-print text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Doc</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCustomSection = (sectionId: string) => {
    const custom = customSections.find((c) => c.id === sectionId);
    if (!custom || custom.items.length === 0) return null;

    return (
      <section key={custom.id} className={`${densityStyles.sectionGap} print-page-break-avoid`}>
        {renderSectionHeading(custom.title)}
        <div className="space-y-2">
          {custom.items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900 text-[13.5px]">{item.title}</span>
                  {item.subtitle && <span className="text-slate-600 text-xs"> — {item.subtitle}</span>}
                </div>
                {item.date && (
                  <span className="text-xs font-mono text-slate-500 shrink-0">{item.date}</span>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-slate-700 mt-0.5">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Header Contact Bar
  const renderContactBar = (isSplit = false) => {
    return (
      <div className={`flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-600 ${isSplit ? 'flex-col items-start gap-y-2' : styles.headerLayout === 'centered' ? 'justify-center' : 'justify-start'}`}>
        {personal.email && (
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <a href={`mailto:${personal.email}`} className="hover:underline">{personal.email}</a>
          </span>
        )}
        {personal.phone && (
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{personal.phone}</span>
          </span>
        )}
        {personal.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{personal.location}</span>
          </span>
        )}
        {personal.website && (
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-400 shrink-0" />
            <a href={personal.website} target="_blank" rel="noreferrer" className="hover:underline">
              {personal.website.replace(/^https?:\/\//, '')}
            </a>
          </span>
        )}
        {personal.linkedin && (
          <span className="flex items-center gap-1">
            <Linkedin className="w-3 h-3 text-slate-400 shrink-0" />
            <a href={`https://${personal.linkedin.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:underline">
              {personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'in/')}
            </a>
          </span>
        )}
        {personal.github && (
          <span className="flex items-center gap-1">
            <Github className="w-3 h-3 text-slate-400 shrink-0" />
            <a href={`https://${personal.github.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="hover:underline">
              {personal.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
            </a>
          </span>
        )}
      </div>
    );
  };

  // Render Header according to styles.headerLayout & template
  const renderHeader = () => {
    const isCentered = styles.headerLayout === 'centered';

    return (
      <header className={`mb-6 pb-4 border-b border-slate-200 ${isCentered ? 'text-center' : 'text-left'}`}>
        <div className={`flex ${isCentered ? 'flex-col items-center' : 'flex-row items-center justify-between'} gap-4`}>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
              style={{
                fontFamily: fontOption.fontFamilyCss,
                color: styles.template === 'ats-classic' ? '#0F172A' : colorScheme.primary,
              }}
            >
              {personal.fullName || 'e.g. Alex Vance, M.Sc.'}
            </h1>
            {personal.jobTitle && (
              <p className="text-sm sm:text-base font-medium text-slate-600 mt-0.5 tracking-wide">
                {personal.jobTitle}
              </p>
            )}
          </div>

          {styles.showPhoto && personal.photoUrl && (
            <div className="shrink-0">
              <img
                src={personal.photoUrl}
                alt={personal.fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 shadow-sm"
                style={{ borderColor: colorScheme.primary }}
              />
            </div>
          )}
        </div>

        <div className="mt-3">
          {renderContactBar()}
        </div>
      </header>
    );
  };

  // Section dispatch by order
  const renderOrderedSections = () => {
    return sectionOrder.map((sectionId) => {
      if (sectionVisibility[sectionId] === false) return null;

      switch (sectionId) {
        case 'summary':
          return <React.Fragment key="summary">{renderSummarySection()}</React.Fragment>;
        case 'experience':
          return <React.Fragment key="experience">{renderExperienceSection()}</React.Fragment>;
        case 'education':
          return <React.Fragment key="education">{renderEducationSection()}</React.Fragment>;
        case 'skills':
          return <React.Fragment key="skills">{renderSkillsSection()}</React.Fragment>;
        case 'projects':
          return <React.Fragment key="projects">{renderProjectsSection()}</React.Fragment>;
        case 'certifications':
          return <React.Fragment key="certifications">{renderCertificationsSection()}</React.Fragment>;
        case 'documents':
          return <React.Fragment key="documents">{renderDocumentsSection()}</React.Fragment>;
        default:
          return <React.Fragment key={sectionId}>{renderCustomSection(sectionId)}</React.Fragment>;
      }
    });
  };

  // Special Layout for 'creative' (Split-Column layout)
  const renderCreativeSplitLayout = () => {
    return (
      <div className="flex flex-col sm:flex-row gap-8">
        {/* Left Sidebar Column (33%) */}
        <div className="sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-200 sm:pr-6 pb-6 sm:pb-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900" style={{ color: colorScheme.primary }}>
              {personal.fullName || 'e.g. Alex Vance, M.Sc.'}
            </h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
              {personal.jobTitle}
            </p>
          </div>

          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Contact
            </div>
            {renderContactBar(true)}
          </div>

          {skills.length > 0 && sectionVisibility['skills'] !== false && (
            <div className="mb-6">
              {renderSectionHeading('Skills')}
              <div className="space-y-2 text-xs">
                {skills.map((c) => (
                  <div key={c.id}>
                    <div className="font-semibold text-slate-800">{c.categoryName}</div>
                    <div className="text-slate-600">{c.skills.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && sectionVisibility['education'] !== false && (
            <div className="mb-6">
              {renderSectionHeading('Education')}
              <div className="space-y-3 text-xs">
                {education.map((e) => (
                  <div key={e.id}>
                    <div className="font-bold text-slate-800">{e.degree}</div>
                    <div className="text-slate-600">{e.institution}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{e.endDate}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && sectionVisibility['certifications'] !== false && (
            <div className="mb-6">
              {renderSectionHeading('Certifications')}
              <div className="space-y-1.5 text-xs">
                {certifications.map((c) => (
                  <div key={c.id}>
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-slate-500 text-[11px]">{c.issuer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Column (67%) */}
        <div className="sm:w-2/3">
          {personal.summary && sectionVisibility['summary'] !== false && renderSummarySection()}
          {experience.length > 0 && sectionVisibility['experience'] !== false && renderExperienceSection()}
          {projects.length > 0 && sectionVisibility['projects'] !== false && renderProjectsSection()}
          {customSections.map((c) => sectionVisibility[c.id] !== false && renderCustomSection(c.id))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Live Preview Viewport Controls Bar */}
      <div className="no-print w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Document Preview
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-500 font-mono uppercase text-[11px]">
            {styles.paperSize} · {styles.template}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-12 text-center text-slate-700 dark:text-slate-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1.0)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 cursor-pointer text-[11px] font-medium"
            title="Reset Zoom (100%)"
          >
            100%
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded font-medium cursor-pointer"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas Backdrop */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto flex justify-center py-4 px-2"
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Printable White Resume Canvas */}
          <div
            id="resume-document-container"
            className={`bg-white text-slate-900 shadow-xl border border-slate-200/90 rounded-sm relative selection:bg-blue-100 selection:text-blue-900 ${densityStyles.padding}`}
            style={{
              width: paperMinWidth,
              minHeight: paperMinHeight,
              fontFamily: fontOption.fontFamilyCss,
            }}
          >
            {styles.template === 'creative' ? (
              renderCreativeSplitLayout()
            ) : (
              <>
                {renderHeader()}
                <main>{renderOrderedSections()}</main>
              </>
            )}

            {/* Subtle Page Boundary Guide for users (hidden in print) */}
            <div className="no-print absolute bottom-2 right-4 text-[10px] text-slate-300 font-mono select-none">
              CVForkt ATS Canvas · {styles.paperSize.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal Lightbox */}
      {selectedDocForView && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <FileDocIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                    {selectedDocForView.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="uppercase font-mono font-semibold">
                      {selectedDocForView.category.replace(/_/g, ' ')}
                    </span>
                    {selectedDocForView.isCertified && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" /> Certified Copy
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForView(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Document Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Document Number</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white truncate">
                    {selectedDocForView.documentNumber || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Issuing Authority</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedDocForView.issuer || 'Official Issuer'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Issue Date</span>
                  <div className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedDocForView.issueDate || 'Document on record'}
                  </div>
                </div>
              </div>

              {/* Document Preview Canvas */}
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/60 min-h-[220px]">
                {selectedDocForView.fileData && selectedDocForView.fileData.startsWith('data:image/') ? (
                  <img
                    src={selectedDocForView.fileData}
                    alt={selectedDocForView.title}
                    className="max-h-72 object-contain rounded-lg shadow-sm border border-slate-200"
                  />
                ) : (
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-inner">
                      <FileDocIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedDocForView.fileName || `${selectedDocForView.title}.pdf`}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {selectedDocForView.fileSize || 'Standard Attachment'} · Verified Document Record
                      </div>
                    </div>
                    {selectedDocForView.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic max-w-md bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        "{selectedDocForView.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <span className="text-xs text-slate-500 font-mono">
                Status: Verified &amp; Attached to Application Dossier
              </span>
              <div className="flex gap-2">
                {selectedDocForView.fileData && (
                  <a
                    href={selectedDocForView.fileData}
                    download={selectedDocForView.fileName || 'attachment_document'}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedDocForView(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

