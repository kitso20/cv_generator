import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopType,
  convertInchesToTwip,
} from 'docx';
import { ResumeData, COLOR_SCHEMES, FONT_OPTIONS } from '../types/resume';

export async function exportResumeToDocx(resume: ResumeData): Promise<void> {
  const { personal, experience, education, skills, projects, certifications, customSections, sectionOrder, sectionVisibility, styles } = resume;
  const colorScheme = COLOR_SCHEMES[styles.colorPalette] || COLOR_SCHEMES.navy;
  const fontOption = FONT_OPTIONS[styles.fontFamily] || FONT_OPTIONS['modern-sans'];
  const fontName = fontOption.docxFontName;
  const primaryHex = colorScheme.docxHex;

  const children: Paragraph[] = [];

  // 1. Candidate Name Header
  children.push(
    new Paragraph({
      alignment: styles.headerLayout === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: personal.fullName || 'e.g. Alex Vance, M.Sc.',
          bold: true,
          size: 36, // 18pt
          font: fontName,
          color: primaryHex,
        }),
      ],
    })
  );

  // Professional Title / Headline
  if (personal.jobTitle) {
    children.push(
      new Paragraph({
        alignment: styles.headerLayout === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: personal.jobTitle,
            size: 24, // 12pt
            font: fontName,
            color: '4B5563', // Gray-600
            italics: true,
          }),
        ],
      })
    );
  }

  // Contact Information Bar (Single clean ATS-safe line)
  const contactParts: string[] = [];
  if (personal.email) contactParts.push(personal.email);
  if (personal.phone) contactParts.push(personal.phone);
  if (personal.location) contactParts.push(personal.location);
  if (personal.website) contactParts.push(personal.website.replace(/^https?:\/\//, ''));
  if (personal.linkedin) contactParts.push(personal.linkedin.replace(/^https?:\/\/(www\.)?/, ''));
  if (personal.github) contactParts.push(personal.github.replace(/^https?:\/\/(www\.)?/, ''));

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: styles.headerLayout === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 200 },
        border: {
          bottom: {
            color: primaryHex,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: contactParts.join('  •  '),
            size: 19, // 9.5pt
            font: fontName,
            color: '374151',
          }),
        ],
      })
    );
  }

  // Section heading helper function
  const createSectionHeading = (title: string): Paragraph => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      border: {
        bottom: {
          color: 'E5E7EB',
          space: 2,
          style: BorderStyle.SINGLE,
          size: 4,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22, // 11pt
          font: fontName,
          color: primaryHex,
        }),
      ],
    });
  };

  // Render sections in user-defined order
  for (const sectionId of sectionOrder) {
    if (sectionVisibility[sectionId] === false) continue;

    if (sectionId === 'summary' && personal.summary) {
      children.push(createSectionHeading('Professional Summary'));
      children.push(
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: personal.summary,
              size: 20, // 10pt
              font: fontName,
              color: '1F2937',
            }),
          ],
        })
      );
    } else if (sectionId === 'experience' && experience.length > 0) {
      children.push(createSectionHeading('Work Experience'));
      experience.forEach((job) => {
        // Job Title, Company, Dates line
        const dateStr = `${job.startDate} – ${job.current ? 'Present' : job.endDate || 'Present'}`;
        children.push(
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: convertInchesToTwip(7.2),
              },
            ],
            spacing: { before: 120, after: 30 },
            children: [
              new TextRun({
                text: job.position,
                bold: true,
                size: 21,
                font: fontName,
                color: '111827',
              }),
              new TextRun({
                text: job.company ? ` | ${job.company}` : '',
                bold: false,
                size: 21,
                font: fontName,
                color: '374151',
              }),
              new TextRun({
                text: job.location ? ` (${job.location})` : '',
                italics: true,
                size: 19,
                font: fontName,
                color: '6B7280',
              }),
              new TextRun({
                text: `\t${dateStr}`,
                bold: true,
                size: 19,
                font: fontName,
                color: '4B5563',
              }),
            ],
          })
        );

        if (job.description) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: job.description,
                  italics: true,
                  size: 19,
                  font: fontName,
                  color: '4B5563',
                }),
              ],
            })
          );
        }

        // Bullet points
        if (job.highlights && job.highlights.length > 0) {
          job.highlights.forEach((point) => {
            if (!point.trim()) return;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: point.trim(),
                    size: 20,
                    font: fontName,
                    color: '1F2937',
                  }),
                ],
              })
            );
          });
        }

        // Tech stack tag line
        if (job.technologies && job.technologies.length > 0) {
          children.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: 'Technologies: ',
                  bold: true,
                  size: 18,
                  font: fontName,
                  color: '6B7280',
                }),
                new TextRun({
                  text: job.technologies.join(', '),
                  size: 18,
                  font: fontName,
                  color: '4B5563',
                }),
              ],
            })
          );
        }
      });
    } else if (sectionId === 'education' && education.length > 0) {
      children.push(createSectionHeading('Education'));
      education.forEach((edu) => {
        const dateStr = `${edu.startDate || ''} – ${edu.current ? 'Present' : edu.endDate || ''}`;
        children.push(
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: convertInchesToTwip(7.2),
              },
            ],
            spacing: { before: 100, after: 30 },
            children: [
              new TextRun({
                text: `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`,
                bold: true,
                size: 21,
                font: fontName,
                color: '111827',
              }),
              new TextRun({
                text: edu.institution ? ` | ${edu.institution}` : '',
                size: 21,
                font: fontName,
                color: '374151',
              }),
              new TextRun({
                text: dateStr.trim() !== '–' ? `\t${dateStr}` : '',
                bold: true,
                size: 19,
                font: fontName,
                color: '4B5563',
              }),
            ],
          })
        );

        if (edu.gpa || edu.honors) {
          const detail = [edu.gpa ? `GPA: ${edu.gpa}` : '', edu.honors ? edu.honors : ''].filter(Boolean).join(' • ');
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: detail,
                  italics: true,
                  size: 19,
                  font: fontName,
                  color: '4B5563',
                }),
              ],
            })
          );
        }

        if (edu.coursework) {
          children.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: `Relevant Coursework: ${edu.coursework}`,
                  size: 18,
                  font: fontName,
                  color: '6B7280',
                }),
              ],
            })
          );
        }
      });
    } else if (sectionId === 'skills' && skills.length > 0) {
      children.push(createSectionHeading('Skills & Competencies'));
      skills.forEach((cat) => {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: `${cat.categoryName}: `,
                bold: true,
                size: 20,
                font: fontName,
                color: '111827',
              }),
              new TextRun({
                text: cat.skills.join(', '),
                size: 20,
                font: fontName,
                color: '374151',
              }),
            ],
          })
        );
      });
    } else if (sectionId === 'projects' && projects.length > 0) {
      children.push(createSectionHeading('Projects'));
      projects.forEach((proj) => {
        children.push(
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: convertInchesToTwip(7.2),
              },
            ],
            spacing: { before: 100, after: 30 },
            children: [
              new TextRun({
                text: proj.title,
                bold: true,
                size: 21,
                font: fontName,
                color: '111827',
              }),
              new TextRun({
                text: proj.role ? ` (${proj.role})` : '',
                italics: true,
                size: 19,
                font: fontName,
                color: '4B5563',
              }),
              new TextRun({
                text: proj.date ? `\t${proj.date}` : '',
                size: 19,
                font: fontName,
                color: '4B5563',
              }),
            ],
          })
        );

        if (proj.description) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: proj.description,
                  size: 19,
                  font: fontName,
                  color: '374151',
                }),
              ],
            })
          );
        }

        if (proj.highlights && proj.highlights.length > 0) {
          proj.highlights.forEach((point) => {
            if (!point.trim()) return;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: point.trim(),
                    size: 19,
                    font: fontName,
                    color: '1F2937',
                  }),
                ],
              })
            );
          });
        }
      });
    } else if (sectionId === 'certifications' && certifications.length > 0) {
      children.push(createSectionHeading('Certifications & Licenses'));
      certifications.forEach((cert) => {
        children.push(
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: convertInchesToTwip(7.2),
              },
            ],
            spacing: { after: 50 },
            children: [
              new TextRun({
                text: cert.name,
                bold: true,
                size: 20,
                font: fontName,
                color: '111827',
              }),
              new TextRun({
                text: cert.issuer ? ` – ${cert.issuer}` : '',
                size: 20,
                font: fontName,
                color: '4B5563',
              }),
              new TextRun({
                text: cert.issueDate ? `\t${cert.issueDate}` : '',
                size: 19,
                font: fontName,
                color: '6B7280',
              }),
            ],
          })
        );
      });
    } else if (sectionId === 'documents' && resume.documents && resume.documents.length > 0) {
      children.push(createSectionHeading('Verified Supporting Documents & Credentials'));
      resume.documents.forEach((doc) => {
        children.push(
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.RIGHT,
                position: convertInchesToTwip(7.2),
              },
            ],
            spacing: { before: 80, after: 20 },
            children: [
              new TextRun({
                text: `[${doc.category.toUpperCase().replace(/_/g, ' ')}] ${doc.title}`,
                bold: true,
                size: 20,
                font: fontName,
                color: '111827',
              }),
              new TextRun({
                text: doc.issueDate ? `\t${doc.issueDate}` : '',
                size: 19,
                font: fontName,
                color: '6B7280',
              }),
            ],
          })
        );

        const details = [
          doc.documentNumber ? `Ref / Doc #: ${doc.documentNumber}` : '',
          doc.issuer ? `Issuer: ${doc.issuer}` : '',
          doc.isCertified ? 'Certified True Copy' : '',
          doc.fileName ? `File: ${doc.fileName}` : '',
        ].filter(Boolean).join('  |  ');

        if (details) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: details,
                  italics: true,
                  size: 18,
                  font: fontName,
                  color: '4B5563',
                }),
              ],
            })
          );
        }
      });
    } else {
      // Custom sections
      const custom = customSections.find((c) => c.id === sectionId);
      if (custom && custom.items.length > 0) {
        children.push(createSectionHeading(custom.title));
        custom.items.forEach((item) => {
          children.push(
            new Paragraph({
              tabStops: [
                {
                  type: TabStopType.RIGHT,
                  position: convertInchesToTwip(7.2),
                },
              ],
              spacing: { before: 80, after: 30 },
              children: [
                new TextRun({
                  text: item.title,
                  bold: true,
                  size: 20,
                  font: fontName,
                  color: '111827',
                }),
                new TextRun({
                  text: item.subtitle ? ` | ${item.subtitle}` : '',
                  size: 19,
                  font: fontName,
                  color: '4B5563',
                }),
                new TextRun({
                  text: item.date ? `\t${item.date}` : '',
                  size: 19,
                  font: fontName,
                  color: '6B7280',
                }),
              ],
            })
          );
          if (item.description) {
            children.push(
              new Paragraph({
                spacing: { after: 50 },
                children: [
                  new TextRun({
                    text: item.description,
                    size: 19,
                    font: fontName,
                    color: '374151',
                  }),
                ],
              })
            );
          }
        });
      }
    }
  }

  // Create docx Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.65),
              right: convertInchesToTwip(0.65),
              bottom: convertInchesToTwip(0.65),
              left: convertInchesToTwip(0.65),
            },
          },
        },
        children,
      },
    ],
  });

  // Pack blob and trigger download
  const blob = await Packer.toBlob(doc);
  const fileName = `${personal.fullName.trim() || 'Candidate'}_Resume.docx`.replace(/\s+/g, '_');

  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
