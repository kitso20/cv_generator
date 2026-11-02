import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  FileText,
  Sliders,
  ExternalLink,
  Check,
  Palette,
  Type,
  Layout,
  X,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Upload,
  FileCheck,
  Download,
} from 'lucide-react';
import {
  ResumeData,
  WorkExperience,
  Education,
  SkillCategory,
  Project,
  Certification,
  CustomSection,
  AttachedDocument,
  DocumentCategory,
  COLOR_SCHEMES,
  FONT_OPTIONS,
  TemplateId,
  ColorPaletteId,
  FontFamilyId,
} from '../types/resume';

interface EditorPanelProps {
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
  activeTab: 'content' | 'sections' | 'style';
  setActiveTab: (tab: 'content' | 'sections' | 'style') => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  resume,
  onChange,
  activeTab,
  setActiveTab,
}) => {
  const [contentSubTab, setContentSubTab] = useState<string>('personal');
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  // Bottom-Right Add Prompt Modal state
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<
    'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'documents' | 'custom'
  >('experience');

  // Form fields inside Add Prompt Modal
  const [addExpData, setAddExpData] = useState({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    bullet1: '',
    technologies: '',
  });

  const [addEduData, setAddEduData] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    location: '',
    startDate: '',
    endDate: '',
    gpa: '',
    honors: '',
  });

  const [addSkillData, setAddSkillData] = useState({
    categoryName: '',
    skillsString: '',
  });

  const [addProjData, setAddProjData] = useState({
    title: '',
    role: '',
    description: '',
    bullet1: '',
    technologies: '',
    link: '',
    date: '',
  });

  const [addCertData, setAddCertData] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    credentialId: '',
  });

  const [addDocData, setAddDocData] = useState<{
    title: string;
    category: DocumentCategory;
    documentNumber: string;
    issuer: string;
    issueDate: string;
    isCertified: boolean;
    fileName: string;
    fileSize: string;
    fileData: string;
    notes: string;
  }>({
    title: '',
    category: 'id_copy',
    documentNumber: '',
    issuer: '',
    issueDate: '',
    isCertified: true,
    fileName: '',
    fileSize: '',
    fileData: '',
    notes: '',
  });

  const [addCustomData, setAddCustomData] = useState({
    sectionTitle: 'Publications & Honors',
    itemTitle: '',
    itemSubtitle: '',
    itemDate: '',
    itemDesc: '',
  });

  // Track newly added item for auto-scroll and visual highlight
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Template filter for Word-style gallery
  const [templateFilter, setTemplateFilter] = useState<'all' | 'ats' | 'executive' | 'modern' | 'creative'>('all');

  const { personal, experience, education, skills, projects, certifications, customSections, sectionOrder, sectionVisibility, styles } = resume;

  // Set default category when Add prompt opens based on current subtab
  const handleOpenAddPrompt = () => {
    if (contentSubTab === 'education') setAddCategory('education');
    else if (contentSubTab === 'skills') setAddCategory('skills');
    else if (contentSubTab === 'projects') setAddCategory('projects');
    else if (contentSubTab === 'certifications') setAddCategory('certifications');
    else if (contentSubTab === 'documents') setAddCategory('documents');
    else if (contentSubTab.startsWith('custom-')) setAddCategory('custom');
    else setAddCategory('experience');
    setIsAddPromptOpen(true);
  };

  // Helper updates for personal details
  const updatePersonal = (field: keyof typeof personal, value: string) => {
    const newResume = {
      ...resume,
      lastModified: new Date().toISOString(),
      personal: { ...personal, [field]: value },
    };
    if (field === 'fullName' && (!resume.title || resume.title === 'My Resume')) {
      newResume.title = value.trim() || 'My Resume';
    }
    onChange(newResume);
  };

  // Section drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedSectionIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === index) return;

    const newOrder = [...sectionOrder];
    const draggedItem = newOrder[draggedSectionIndex];
    newOrder.splice(draggedSectionIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setDraggedSectionIndex(index);
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      sectionOrder: newOrder,
    });
  };

  const handleDragEnd = () => {
    setDraggedSectionIndex(null);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;

    const newOrder = [...sectionOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      sectionOrder: newOrder,
    });
  };

  const toggleSectionVisibility = (sectionId: string) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      sectionVisibility: {
        ...sectionVisibility,
        [sectionId]: sectionVisibility[sectionId] === false ? true : false,
      },
    });
  };

  // Add Custom Section
  const handleAddCustomSection = () => {
    const newId = `custom-${Date.now()}`;
    const newCustom: CustomSection = {
      id: newId,
      title: 'Publications & Honors',
      items: [
        {
          id: `item-${Date.now()}`,
          title: 'Title of Entry / Publication',
          subtitle: 'Journal / Organization Name',
          date: '2024',
          description: 'Brief summary of key contribution, reach, or award recognition.',
        },
      ],
    };

    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      customSections: [...customSections, newCustom],
      sectionOrder: [...sectionOrder, newId],
      sectionVisibility: { ...sectionVisibility, [newId]: true },
    });
  };

  const removeCustomSection = (id: string) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      customSections: customSections.filter((c) => c.id !== id),
      sectionOrder: sectionOrder.filter((s) => s !== id),
    });
  };

  // Individual item mutations
  const updateExperience = (id: string, updated: Partial<WorkExperience>) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      experience: experience.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      experience: experience.filter((e) => e.id !== id),
    });
  };

  const updateEducation = (id: string, updated: Partial<Education>) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      education: education.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      education: education.filter((e) => e.id !== id),
    });
  };

  const updateSkillCategory = (id: string, updated: Partial<SkillCategory>) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      skills: skills.map((s) => (s.id === id ? { ...s, ...updated } : s)),
    });
  };

  const removeSkillCategory = (id: string) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      skills: skills.filter((s) => s.id !== id),
    });
  };

  const updateProject = (id: string, updated: Partial<Project>) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      projects: projects.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    });
  };

  const removeProject = (id: string) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      projects: projects.filter((p) => p.id !== id),
    });
  };

  const updateCertification = (id: string, updated: Partial<Certification>) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      certifications: certifications.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    });
  };

  const removeCertification = (id: string) => {
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      certifications: certifications.filter((c) => c.id !== id),
    });
  };

  const updateDocument = (id: string, updated: Partial<AttachedDocument>) => {
    const docs = resume.documents || [];
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      documents: docs.map((d) => (d.id === id ? { ...d, ...updated } : d)),
    });
  };

  const removeDocument = (id: string) => {
    const docs = resume.documents || [];
    onChange({
      ...resume,
      lastModified: new Date().toISOString(),
      documents: docs.filter((d) => d.id !== id),
    });
  };

  // Execute Add Prompt Submission (Appends to the END and auto-scrolls to the new addition)
  const handleConfirmAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    let newId = '';
    let targetSubTab = '';
    const nowIso = new Date().toISOString();

    if (addCategory === 'experience') {
      newId = `exp-${Date.now()}`;
      targetSubTab = 'experience';
      const bullets = addExpData.bullet1.trim()
        ? [addExpData.bullet1.trim()]
        : ['Spearheaded project resulting in 25% performance improvement.'];
      const tags = addExpData.technologies
        ? addExpData.technologies.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const newExp: WorkExperience = {
        id: newId,
        company: addExpData.company.trim() || 'Company Name',
        position: addExpData.position.trim() || 'Role / Position',
        location: addExpData.location.trim() || 'San Francisco, CA',
        startDate: addExpData.startDate.trim() || '2023-01',
        endDate: addExpData.endDate.trim() || '',
        current: addExpData.current,
        description: addExpData.description.trim(),
        highlights: bullets,
        technologies: tags,
      };

      // Append at the END
      onChange({
        ...resume,
        lastModified: nowIso,
        experience: [...experience, newExp],
      });

      // Reset form
      setAddExpData({
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        bullet1: '',
        technologies: '',
      });
    } else if (addCategory === 'education') {
      newId = `edu-${Date.now()}`;
      targetSubTab = 'education';
      const newEdu: Education = {
        id: newId,
        institution: addEduData.institution.trim() || 'University Name',
        degree: addEduData.degree.trim() || 'Bachelor of Science',
        fieldOfStudy: addEduData.fieldOfStudy.trim() || 'Computer Science',
        location: addEduData.location.trim(),
        startDate: addEduData.startDate.trim() || '2019',
        endDate: addEduData.endDate.trim() || '2023',
        current: false,
        gpa: addEduData.gpa.trim(),
        honors: addEduData.honors.trim(),
      };

      // Append at the END
      onChange({
        ...resume,
        lastModified: nowIso,
        education: [...education, newEdu],
      });

      setAddEduData({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        location: '',
        startDate: '',
        endDate: '',
        gpa: '',
        honors: '',
      });
    } else if (addCategory === 'skills') {
      newId = `skill-${Date.now()}`;
      targetSubTab = 'skills';
      const parsedSkills = addSkillData.skillsString
        ? addSkillData.skillsString.split(',').map((s) => s.trim()).filter(Boolean)
        : ['JavaScript', 'TypeScript', 'Node.js'];

      const newSkill: SkillCategory = {
        id: newId,
        categoryName: addSkillData.categoryName.trim() || 'Core Competencies',
        skills: parsedSkills,
      };

      // Append at the END
      onChange({
        ...resume,
        lastModified: nowIso,
        skills: [...skills, newSkill],
      });

      setAddSkillData({ categoryName: '', skillsString: '' });
    } else if (addCategory === 'projects') {
      newId = `proj-${Date.now()}`;
      targetSubTab = 'projects';
      const bullets = addProjData.bullet1.trim()
        ? [addProjData.bullet1.trim()]
        : ['Designed and deployed application serving 10,000+ active users.'];
      const tags = addProjData.technologies
        ? addProjData.technologies.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const newProj: Project = {
        id: newId,
        title: addProjData.title.trim() || 'New Project Title',
        role: addProjData.role.trim() || 'Lead Developer',
        description: addProjData.description.trim() || 'A high-throughput application resolving core workflow bottlenecks.',
        highlights: bullets,
        technologies: tags,
        link: addProjData.link.trim(),
        date: addProjData.date.trim() || '2024',
      };

      // Append at the END
      onChange({
        ...resume,
        lastModified: nowIso,
        projects: [...projects, newProj],
      });

      setAddProjData({
        title: '',
        role: '',
        description: '',
        bullet1: '',
        technologies: '',
        link: '',
        date: '',
      });
    } else if (addCategory === 'certifications') {
      newId = `cert-${Date.now()}`;
      targetSubTab = 'certifications';
      const newCert: Certification = {
        id: newId,
        name: addCertData.name.trim() || 'Professional Certification',
        issuer: addCertData.issuer.trim() || 'Issuing Body (AWS, Google, PMI)',
        issueDate: addCertData.issueDate.trim() || '2024',
        credentialId: addCertData.credentialId.trim(),
      };

      // Append at the END
      onChange({
        ...resume,
        lastModified: nowIso,
        certifications: [...certifications, newCert],
      });

      setAddCertData({ name: '', issuer: '', issueDate: '', credentialId: '' });
    } else if (addCategory === 'documents') {
      newId = `doc-${Date.now()}`;
      targetSubTab = 'documents';
      const existingDocs = resume.documents || [];

      const newDoc: AttachedDocument = {
        id: newId,
        title: addDocData.title.trim() || 'Certified Supporting Document',
        category: addDocData.category,
        documentNumber: addDocData.documentNumber.trim(),
        issuer: addDocData.issuer.trim(),
        issueDate: addDocData.issueDate.trim() || new Date().toISOString().slice(0, 7),
        isCertified: addDocData.isCertified,
        fileName: addDocData.fileName || 'Certified_Document.pdf',
        fileSize: addDocData.fileSize || '1.2 MB',
        fileData: addDocData.fileData,
        includeInCvAppendix: true,
        notes: addDocData.notes.trim(),
      };

      const newOrder = sectionOrder.includes('documents') ? sectionOrder : [...sectionOrder, 'documents'];

      // Append at the END
      onChange({
        ...resume,
        lastModified: nowIso,
        documents: [...existingDocs, newDoc],
        sectionOrder: newOrder,
        sectionVisibility: { ...sectionVisibility, documents: true },
      });

      setAddDocData({
        title: '',
        category: 'id_copy',
        documentNumber: '',
        issuer: '',
        issueDate: '',
        isCertified: true,
        fileName: '',
        fileSize: '',
        fileData: '',
        notes: '',
      });
    } else if (addCategory === 'custom') {
      newId = `custom-item-${Date.now()}`;
      const customSectionId = `custom-${Date.now()}`;
      targetSubTab = customSectionId;

      const newCustomItem = {
        id: newId,
        title: addCustomData.itemTitle.trim() || 'Honors / Publication Title',
        subtitle: addCustomData.itemSubtitle.trim() || 'Publishing Organization',
        date: addCustomData.itemDate.trim() || '2024',
        description: addCustomData.itemDesc.trim() || 'Notable details and recognized contributions.',
      };

      const newSection: CustomSection = {
        id: customSectionId,
        title: addCustomData.sectionTitle.trim() || 'Publications & Honors',
        items: [newCustomItem],
      };

      onChange({
        ...resume,
        lastModified: nowIso,
        customSections: [...customSections, newSection],
        sectionOrder: [...sectionOrder, customSectionId],
        sectionVisibility: { ...sectionVisibility, [customSectionId]: true },
      });

      setAddCustomData({
        sectionTitle: 'Publications & Honors',
        itemTitle: '',
        itemSubtitle: '',
        itemDate: '',
        itemDesc: '',
      });
    }

    // Close dialog
    setIsAddPromptOpen(false);

    // Switch view to Content tab and the target subtab
    setActiveTab('content');
    setContentSubTab(targetSubTab);

    // Trigger smooth auto-scroll to the newly added item at the end and highlight it
    if (newId) {
      setHighlightedItemId(newId);
      setTimeout(() => {
        const el = document.getElementById(newId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      // Remove highlight after 2.5s
      setTimeout(() => {
        setHighlightedItemId(null);
      }, 2800);
    }
  };

  const getSectionTitle = (id: string) => {
    switch (id) {
      case 'summary':
        return 'Professional Summary';
      case 'experience':
        return 'Work Experience';
      case 'education':
        return 'Education';
      case 'skills':
        return 'Skills & Expertise';
      case 'projects':
        return 'Projects';
      case 'certifications':
        return 'Certifications';
      case 'documents':
        return 'Supporting Documents & ID Copies';
      default:
        const custom = customSections.find((c) => c.id === id);
        return custom ? custom.title : 'Custom Section';
    }
  };

  // Word-Style Visual Templates Definitions
  const WORD_VISUAL_TEMPLATES: Array<{
    id: TemplateId;
    name: string;
    wordTheme: string;
    category: 'ats' | 'executive' | 'modern' | 'creative';
    badge: string;
    colorHex: string;
    fontName: string;
    desc: string;
    preview: {
      headerStyle: 'banner' | 'centered' | 'left' | 'split' | 'minimal';
      bannerBg?: string;
      twoColumn?: boolean;
    };
  }> = [
    {
      id: 'ats-classic',
      name: 'Harvard Standard ATS',
      wordTheme: 'Word Traditional (Single-Column)',
      category: 'ats',
      badge: '100% ATS Match',
      colorHex: '#0F172A',
      fontName: 'Times New Roman / Georgia',
      desc: 'Matches traditional Microsoft Word Harvard template format. Standard single column, zero parser friction.',
      preview: {
        headerStyle: 'centered',
      },
    },
    {
      id: 'modern',
      name: 'Modern Chronological',
      wordTheme: 'Word Modern Blue Accent',
      category: 'modern',
      badge: 'Popular Corporate',
      colorHex: '#1E3A8A',
      fontName: 'Plus Jakarta Sans',
      desc: 'Top colored accent rule with contemporary scannable sans-serif type. Clean divider lines.',
      preview: {
        headerStyle: 'banner',
        bannerBg: '#1E3A8A',
      },
    },
    {
      id: 'executive',
      name: 'Executive Leadership',
      wordTheme: 'Word Executive Regal',
      category: 'executive',
      badge: 'Senior Leadership',
      colorHex: '#881337',
      fontName: 'Playfair Display Serif',
      desc: 'Formal editorial layout with twin rule line headers and date column tab stops.',
      preview: {
        headerStyle: 'centered',
      },
    },
    {
      id: 'creative',
      name: 'Duo-Tone Sidebar Split',
      wordTheme: 'Word Creative Split Page',
      category: 'creative',
      badge: 'Visual Portfolio',
      colorHex: '#065F46',
      fontName: 'Outfit Geometric',
      desc: 'Two-column layout with tinted 30% left sidebar for contact & skills and 70% main body.',
      preview: {
        headerStyle: 'split',
        twoColumn: true,
      },
    },
    {
      id: 'minimalist',
      name: 'Nordic Clean Minimal',
      wordTheme: 'Word Swiss Monochrome',
      category: 'modern',
      badge: 'Airy & Concise',
      colorHex: '#27272A',
      fontName: 'Plus Jakarta Sans',
      desc: 'High-whitespace layout with understated hairline rules and elegant breathing room.',
      preview: {
        headerStyle: 'minimal',
      },
    },
    {
      id: 'technical',
      name: 'Silicon Valley Dev',
      wordTheme: 'Word Technical Console',
      category: 'modern',
      badge: 'Engineering Focus',
      colorHex: '#3730A3',
      fontName: 'JetBrains Mono',
      desc: 'Monospace code tag accents, GitHub links, and structured technology stack highlights.',
      preview: {
        headerStyle: 'left',
      },
    },
  ];

  // Quick One-Click Word Style Sets (Palette + Font + Header)
  const WORD_STYLE_SETS: Array<{
    name: string;
    desc: string;
    palette: ColorPaletteId;
    font: FontFamilyId;
    template: TemplateId;
    layout: 'left-aligned' | 'centered';
  }> = [
    {
      name: 'Office Classic',
      desc: 'Navy + Plus Jakarta Sans + Modern',
      palette: 'navy',
      font: 'modern-sans',
      template: 'modern',
      layout: 'left-aligned',
    },
    {
      name: 'Harvard Crimson',
      desc: 'Burgundy + Georgia Serif + ATS Harvard',
      palette: 'crimson',
      font: 'classic-clean',
      template: 'ats-classic',
      layout: 'centered',
    },
    {
      name: 'Emerald Executive',
      desc: 'Forest Green + Playfair + Executive',
      palette: 'emerald',
      font: 'editorial-serif',
      template: 'executive',
      layout: 'centered',
    },
    {
      name: 'Tech Indigo',
      desc: 'Royal Indigo + JetBrains Mono + Technical',
      palette: 'indigo',
      font: 'mono-tech',
      template: 'technical',
      layout: 'left-aligned',
    },
    {
      name: 'Modern Slate',
      desc: 'Monochrome Slate + Outfit + Minimalist',
      palette: 'slate',
      font: 'geometric-sans',
      template: 'minimalist',
      layout: 'left-aligned',
    },
  ];

  const filteredTemplates = WORD_VISUAL_TEMPLATES.filter((t) => {
    if (templateFilter === 'all') return true;
    return t.category === templateFilter;
  });

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col h-full relative">
      {/* Top Main Mode Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 p-1.5 bg-slate-50 dark:bg-slate-950/60 shrink-0">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'content'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Content Details</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Section Order</span>
        </button>

        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'style'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Design & Style (Word Templates)</span>
        </button>
      </div>

      {/* Mode 1: Drag-and-Drop Section Manager */}
      {activeTab === 'sections' && (
        <div className="p-5 overflow-y-auto max-h-[calc(100vh-230px)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Drag-and-Drop Section Arrangement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag to reorder resume sections or toggle visibility for ATS tailoring.
              </p>
            </div>
            <button
              onClick={handleAddCustomSection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Section</span>
            </button>
          </div>

          <div className="space-y-2 mt-3">
            {sectionOrder.map((secId, index) => {
              const isVisible = sectionVisibility[secId] !== false;
              const isCustom = secId.startsWith('custom-');
              const customItem = isCustom ? customSections.find((c) => c.id === secId) : null;

              return (
                <div
                  key={secId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    draggedSectionIndex === index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 opacity-70'
                      : isVisible
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col">
                      {isCustom ? (
                        <input
                          type="text"
                          value={customItem?.title || 'Custom Section'}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            onChange({
                              ...resume,
                              lastModified: new Date().toISOString(),
                              customSections: customSections.map((c) =>
                                c.id === secId ? { ...c, title: newTitle } : c
                              ),
                            });
                          }}
                          className="text-xs font-semibold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {getSectionTitle(secId)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {isCustom ? 'Custom dynamic section' : 'Standard core section'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                      aria-label="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sectionOrder.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                      aria-label="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleSectionVisibility(secId)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isVisible
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isVisible ? 'Visible on resume' : 'Hidden from resume'}
                    >
                      {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {isCustom && (
                      <button
                        onClick={() => removeCustomSection(secId)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title="Delete custom section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Content Details Editing */}
      {activeTab === 'content' && (
        <div className="flex flex-col flex-1 overflow-hidden relative">
          {/* Subtabs for content categories */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto p-1 bg-white dark:bg-slate-900 gap-1 text-xs shrink-0">
            {[
              { id: 'personal', label: 'Personal', icon: User },
              { id: 'experience', label: `Experience (${experience.length})`, icon: Briefcase },
              { id: 'education', label: `Education (${education.length})`, icon: GraduationCap },
              { id: 'skills', label: `Skills (${skills.length})`, icon: Wrench },
              { id: 'projects', label: `Projects (${projects.length})`, icon: FolderGit2 },
              { id: 'certifications', label: `Certifications (${certifications.length})`, icon: Award },
              { id: 'documents', label: `Documents & ID (${(resume.documents || []).length})`, icon: ShieldCheck },
              ...customSections.map((c) => ({ id: c.id, label: c.title, icon: Layers })),
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setContentSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    contentSubTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subtab Contents */}
          <div className="p-5 pb-20 overflow-y-auto max-h-[calc(100vh-270px)] space-y-6">
            {/* SUBTAB: Personal Details */}
            {contentSubTab === 'personal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={personal.fullName}
                      onChange={(e) => updatePersonal('fullName', e.target.value)}
                      placeholder="e.g. Alex Vance, M.Sc."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Job Title / Headline *
                    </label>
                    <input
                      type="text"
                      value={personal.jobTitle}
                      onChange={(e) => updatePersonal('jobTitle', e.target.value)}
                      placeholder="e.g. Lead Distributed Systems Architect"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={personal.email}
                      onChange={(e) => updatePersonal('email', e.target.value)}
                      placeholder="alex.vance@example.com"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={personal.phone}
                      onChange={(e) => updatePersonal('phone', e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Location / Region *
                    </label>
                    <input
                      type="text"
                      value={personal.location}
                      onChange={(e) => updatePersonal('location', e.target.value)}
                      placeholder="San Francisco, CA (Hybrid / Remote)"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Website / Portfolio
                    </label>
                    <input
                      type="text"
                      value={personal.website}
                      onChange={(e) => updatePersonal('website', e.target.value)}
                      placeholder="https://portfolio.dev"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      LinkedIn URL or Username
                    </label>
                    <input
                      type="text"
                      value={personal.linkedin}
                      onChange={(e) => updatePersonal('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/alex-vance"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      GitHub URL or Username
                    </label>
                    <input
                      type="text"
                      value={personal.github}
                      onChange={(e) => updatePersonal('github', e.target.value)}
                      placeholder="github.com/alexvance"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Executive Summary / Bio
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {personal.summary ? personal.summary.split(/\s+/).length : 0} words
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={personal.summary}
                    onChange={(e) => updatePersonal('summary', e.target.value)}
                    placeholder="2-4 sentences highlighting your years of experience, core achievements, and target value."
                    className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                {/* Profile Photo Toggle */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Profile Headshot Photo
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Note: Most US/UK ATS prefer no photos; Europe/APAC commonly include them.
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showPhotoToggle"
                      checked={styles.showPhoto}
                      onChange={(e) =>
                        onChange({
                          ...resume,
                          styles: { ...styles, showPhoto: e.target.checked },
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="showPhotoToggle" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      Display photo
                    </label>
                  </div>
                </div>

                {styles.showPhoto && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Photo Image URL
                    </label>
                    <input
                      type="url"
                      value={personal.photoUrl || ''}
                      onChange={(e) => updatePersonal('photoUrl', e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB: Work Experience */}
            {contentSubTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Add work history in chronological order. Click Add button on bottom right or below to append.
                  </div>
                </div>

                {experience.map((job, idx) => (
                  <div
                    key={job.id}
                    id={job.id}
                    className={`p-4 rounded-xl border transition-all duration-500 space-y-3 ${
                      highlightedItemId === job.id
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Position #{idx + 1}: {job.position || 'Untitled Role'}
                        </span>
                        {highlightedItemId === job.id && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                            New Addition
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeExperience(job.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={job.company}
                          onChange={(e) => updateExperience(job.id, { company: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Job Title / Role
                        </label>
                        <input
                          type="text"
                          value={job.position}
                          onChange={(e) => updateExperience(job.id, { position: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={job.location}
                          onChange={(e) => updateExperience(job.id, { location: e.target.value })}
                          placeholder="e.g. San Francisco, CA / Remote"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Start Date
                          </label>
                          <input
                            type="text"
                            value={job.startDate}
                            onChange={(e) => updateExperience(job.id, { startDate: e.target.value })}
                            placeholder="e.g. 2021-03"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            End Date
                          </label>
                          <input
                            type="text"
                            value={job.endDate}
                            disabled={job.current}
                            onChange={(e) => updateExperience(job.id, { endDate: e.target.value })}
                            placeholder={job.current ? 'Present' : 'e.g. 2024-01'}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-40"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`current-${job.id}`}
                        checked={job.current}
                        onChange={(e) => updateExperience(job.id, { current: e.target.checked })}
                        className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                      />
                      <label htmlFor={`current-${job.id}`} className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        Currently working in this role
                      </label>
                    </div>

                    {/* Bullet Points */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Key Achievements & Metrics (Bullet Points)
                        </label>
                        <button
                          onClick={() => {
                            const newHighlights = [...job.highlights, 'Spearheaded project resulting in 20% efficiency gain.'];
                            updateExperience(job.id, { highlights: newHighlights });
                          }}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add bullet
                        </button>
                      </div>

                      <div className="space-y-2">
                        {job.highlights.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">•</span>
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => {
                                const newHighlights = [...job.highlights];
                                newHighlights[bIdx] = e.target.value;
                                updateExperience(job.id, { highlights: newHighlights });
                              }}
                              className="flex-1 text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => {
                                const newHighlights = job.highlights.filter((_, i) => i !== bIdx);
                                updateExperience(job.id, { highlights: newHighlights });
                              }}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                              title="Remove bullet"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tech stack */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Technologies / Tools (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={job.technologies ? job.technologies.join(', ') : ''}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                          updateExperience(job.id, { technologies: tags });
                        }}
                        placeholder="e.g. Go, Kubernetes, TypeScript, AWS"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBTAB: Education */}
            {contentSubTab === 'education' && (
              <div className="space-y-4">
                {education.map((edu) => (
                  <div
                    key={edu.id}
                    id={edu.id}
                    className={`p-4 rounded-xl border transition-all duration-500 space-y-3 ${
                      highlightedItemId === edu.id
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {edu.degree || 'Degree Program'}
                        </span>
                        {highlightedItemId === edu.id && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                            New Addition
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Institution / University
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Degree & Major
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                          placeholder="e.g. Master of Science, Computer Science"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Dates (or Graduation Year)
                        </label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                          placeholder="e.g. 2016 – 2020"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          GPA / Academic Honors
                        </label>
                        <input
                          type="text"
                          value={edu.honors || ''}
                          onChange={(e) => updateEducation(edu.id, { honors: e.target.value })}
                          placeholder="e.g. GPA: 3.9 / 4.0, Magna Cum Laude"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBTAB: Skills */}
            {contentSubTab === 'skills' && (
              <div className="space-y-4">
                {skills.map((cat) => (
                  <div
                    key={cat.id}
                    id={cat.id}
                    className={`p-3.5 rounded-xl border transition-all duration-500 space-y-2 ${
                      highlightedItemId === cat.id
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={cat.categoryName}
                          onChange={(e) => updateSkillCategory(cat.id, { categoryName: e.target.value })}
                          className="text-xs font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none"
                        />
                        {highlightedItemId === cat.id && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                            New Addition
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeSkillCategory(cat.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Skills (comma-separated):
                      </label>
                      <input
                        type="text"
                        value={cat.skills.join(', ')}
                        onChange={(e) => {
                          const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          updateSkillCategory(cat.id, { skills: list });
                        }}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBTAB: Projects */}
            {contentSubTab === 'projects' && (
              <div className="space-y-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    id={proj.id}
                    className={`p-4 rounded-xl border transition-all duration-500 space-y-3 ${
                      highlightedItemId === proj.id
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {proj.title}
                        </span>
                        {highlightedItemId === proj.id && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                            New Addition
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeProject(proj.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Project Title
                        </label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Role / Contribution
                        </label>
                        <input
                          type="text"
                          value={proj.role || ''}
                          onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                          placeholder="e.g. Creator & Maintainer"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Project URL / Demo Link
                        </label>
                        <input
                          type="text"
                          value={proj.link || ''}
                          onChange={(e) => updateProject(proj.id, { link: e.target.value })}
                          placeholder="https://github.com/..."
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Timeline / Year
                        </label>
                        <input
                          type="text"
                          value={proj.date || ''}
                          onChange={(e) => updateProject(proj.id, { date: e.target.value })}
                          placeholder="e.g. 2023 - 2024"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Summary Description
                      </label>
                      <input
                        type="text"
                        value={proj.description}
                        onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBTAB: Certifications */}
            {contentSubTab === 'certifications' && (
              <div className="space-y-4">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    id={cert.id}
                    className={`p-3.5 rounded-xl border transition-all duration-500 space-y-2.5 ${
                      highlightedItemId === cert.id
                        ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {cert.name}
                        </span>
                        {highlightedItemId === cert.id && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                            New Addition
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeCertification(cert.id)}
                        className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Certification Name</label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Issuing Authority</label>
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                          placeholder="e.g. Amazon Web Services"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Issue Date</label>
                        <input
                          type="text"
                          value={cert.issueDate}
                          onChange={(e) => updateCertification(cert.id, { issueDate: e.target.value })}
                          placeholder="e.g. 2023-08"
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBTAB: Supporting Documents & ID Copies */}
            {contentSubTab === 'documents' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-950 dark:text-blue-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Supporting Documents, ID Copies &amp; Certifications Dossier</span>
                  </div>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    Attach certified ID copies, academic diplomas, professional credentials, transcripts, or driver's licenses. These documents are verified and formatted into your CV dossier.
                  </p>
                </div>

                {(resume.documents || []).length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No Attached Documents Yet
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click the "Add to Resume" button at the bottom right corner to upload an ID copy or certificate.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddCategory('documents');
                        setIsAddPromptOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                    >
                      + Add First Document
                    </button>
                  </div>
                ) : (
                  (resume.documents || []).map((doc, idx) => (
                    <div
                      key={doc.id}
                      id={doc.id}
                      className={`p-4 rounded-xl border transition-all duration-500 space-y-3.5 ${
                        highlightedItemId === doc.id
                          ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Document #{idx + 1}: {doc.title || 'Untitled Document'}
                          </span>
                          {highlightedItemId === doc.id && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                              New Addition
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Document Title *
                          </label>
                          <input
                            type="text"
                            value={doc.title}
                            onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
                            placeholder="e.g. Certified ID Copy / Passport or Master of Science Diploma"
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Category / Document Type
                          </label>
                          <select
                            value={doc.category}
                            onChange={(e) => updateDocument(doc.id, { category: e.target.value as DocumentCategory })}
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="id_copy">National ID Copy / Passport</option>
                            <option value="degree_certificate">Degree / Diploma Certificate</option>
                            <option value="professional_cert">Professional Certification</option>
                            <option value="transcript">Academic Transcript</option>
                            <option value="drivers_license">Driver's License</option>
                            <option value="work_permit">Work Permit / Visa</option>
                            <option value="reference_letter">Reference Letter</option>
                            <option value="other">Other Supporting Document</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Document / Credential ID #
                          </label>
                          <input
                            type="text"
                            value={doc.documentNumber || ''}
                            onChange={(e) => updateDocument(doc.id, { documentNumber: e.target.value })}
                            placeholder="e.g. ID-US-9482019-V"
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Issuing Authority / Institution
                          </label>
                          <input
                            type="text"
                            value={doc.issuer || ''}
                            onChange={(e) => updateDocument(doc.id, { issuer: e.target.value })}
                            placeholder="e.g. Dept of Home Affairs / MIT"
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Issue Date / Expiry
                          </label>
                          <input
                            type="text"
                            value={doc.issueDate || ''}
                            onChange={(e) => updateDocument(doc.id, { issueDate: e.target.value })}
                            placeholder="e.g. 2023-08"
                            className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* File upload / replace box */}
                      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {doc.fileName || 'Attached Document File'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {doc.fileSize || 'Standard Document'} · {doc.isCertified ? 'Certified True Copy' : 'Standard Upload'}
                            </div>
                          </div>
                        </div>

                        <label className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload / Replace File</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateDocument(doc.id, {
                                    fileName: f.name,
                                    fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                                    fileType: f.type,
                                    fileData: ev.target?.result as string,
                                  });
                                };
                                reader.readAsDataURL(f);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.isCertified}
                            onChange={(e) => updateDocument(doc.id, { isCertified: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span className="font-medium">Certified True Copy (Official Verification)</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={doc.includeInCvAppendix}
                            onChange={(e) => updateDocument(doc.id, { includeInCvAppendix: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span>Include in CV Dossier Preview</span>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Custom Sections dynamically selected */}
            {customSections.some((c) => c.id === contentSubTab) && (
              <div className="space-y-4">
                {(() => {
                  const currentCustom = customSections.find((c) => c.id === contentSubTab);
                  if (!currentCustom) return null;

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={currentCustom.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            onChange({
                              ...resume,
                              lastModified: new Date().toISOString(),
                              customSections: customSections.map((c) =>
                                c.id === currentCustom.id ? { ...c, title: newTitle } : c
                              ),
                            });
                          }}
                          className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-700 pb-1"
                        />
                      </div>

                      <div className="space-y-3">
                        {currentCustom.items.map((item, itIdx) => (
                          <div
                            key={item.id}
                            id={item.id}
                            className={`p-3.5 rounded-xl border transition-all duration-500 space-y-2 ${
                              highlightedItemId === item.id
                                ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 shadow-md'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Entry #{itIdx + 1}
                                </span>
                                {highlightedItemId === item.id && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                                    New Addition
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  onChange({
                                    ...resume,
                                    lastModified: new Date().toISOString(),
                                    customSections: customSections.map((c) =>
                                      c.id === currentCustom.id
                                        ? { ...c, items: c.items.filter((i) => i.id !== item.id) }
                                        : c
                                    ),
                                  });
                                }}
                                className="text-rose-500 text-xs cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onChange({
                                    ...resume,
                                    lastModified: new Date().toISOString(),
                                    customSections: customSections.map((c) =>
                                      c.id === currentCustom.id
                                        ? {
                                            ...c,
                                            items: c.items.map((i) =>
                                              i.id === item.id ? { ...i, title: val } : i
                                            ),
                                          }
                                        : c
                                    ),
                                  });
                                }}
                                placeholder="Title / Subject"
                                className="text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                              <input
                                type="text"
                                value={item.subtitle || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onChange({
                                    ...resume,
                                    lastModified: new Date().toISOString(),
                                    customSections: customSections.map((c) =>
                                      c.id === currentCustom.id
                                        ? {
                                            ...c,
                                            items: c.items.map((i) =>
                                              i.id === item.id ? { ...i, subtitle: val } : i
                                            ),
                                          }
                                        : c
                                    ),
                                  });
                                }}
                                placeholder="Subtitle / Publication / Org"
                                className="text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                              <input
                                type="text"
                                value={item.date || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onChange({
                                    ...resume,
                                    lastModified: new Date().toISOString(),
                                    customSections: customSections.map((c) =>
                                      c.id === currentCustom.id
                                        ? {
                                            ...c,
                                            items: c.items.map((i) =>
                                              i.id === item.id ? { ...i, date: val } : i
                                            ),
                                          }
                                        : c
                                    ),
                                  });
                                }}
                                placeholder="Date / Year"
                                className="text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={item.description || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                onChange({
                                  ...resume,
                                  lastModified: new Date().toISOString(),
                                  customSections: customSections.map((c) =>
                                    c.id === currentCustom.id
                                      ? {
                                          ...c,
                                          items: c.items.map((i) =>
                                            i.id === item.id ? { ...i, description: val } : i
                                          ),
                                        }
                                      : c
                                  ),
                                });
                              }}
                              placeholder="Description or notable achievements..."
                              className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Microsoft Word Style Visual Templates Gallery & Design Customizer */}
      {activeTab === 'style' && (
        <div className="p-5 overflow-y-auto max-h-[calc(100vh-220px)] space-y-6">
          {/* Word Style Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Word Document Templates Gallery</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select visual resume templates inspired by Microsoft Word designs.
                </p>
              </div>

              {/* Word-like category filters */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                {(['all', 'ats', 'executive', 'modern', 'creative'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTemplateFilter(cat)}
                    className={`px-2.5 py-1 font-medium rounded-md transition-colors capitalize cursor-pointer ${
                      templateFilter === cat
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Template Cards Gallery (Word "New from Template" style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
              {filteredTemplates.map((tmpl) => {
                const isSelected = styles.template === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() =>
                      onChange({
                        ...resume,
                        styles: { ...styles, template: tmpl.id },
                      })
                    }
                    className={`group relative rounded-xl border-2 p-3 text-left transition-all cursor-pointer flex flex-col ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 hover:shadow-xs'
                    }`}
                  >
                    {/* Miniature Page Render (like Word template thumbnails) */}
                    <div className="w-full h-32 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 shadow-inner mb-3 relative overflow-hidden flex flex-col justify-between">
                      {tmpl.preview.twoColumn ? (
                        <div className="flex h-full gap-2">
                          {/* Sidebar */}
                          <div
                            className="w-1/3 rounded-sm p-1.5 flex flex-col gap-1"
                            style={{ backgroundColor: tmpl.colorHex + '25' }}
                          >
                            <div className="w-4 h-4 rounded-full bg-slate-400/80 mb-0.5" />
                            <div className="h-1.5 w-3/4 rounded-xs bg-slate-400" />
                            <div className="h-1 w-full rounded-xs bg-slate-300" />
                            <div className="mt-1 h-1 w-2/3 rounded-xs bg-slate-300" />
                            <div className="h-1 w-4/5 rounded-xs bg-slate-300" />
                          </div>
                          {/* Main */}
                          <div className="flex-1 flex flex-col gap-1 py-1">
                            <div className="h-2 w-1/2 rounded-xs bg-slate-800 dark:bg-slate-200" />
                            <div className="h-1 w-1/3 rounded-xs bg-slate-400 mb-1" />
                            <div className="h-1 w-full rounded-xs bg-slate-300" />
                            <div className="h-1 w-5/6 rounded-xs bg-slate-300" />
                            <div className="h-1 w-full rounded-xs bg-slate-300 mt-1" />
                            <div className="h-1 w-4/5 rounded-xs bg-slate-300" />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Banner or Centered Header */}
                          {tmpl.preview.headerStyle === 'banner' && (
                            <div
                              className="w-full h-4 rounded-xs mb-1.5 flex items-center px-1.5"
                              style={{ backgroundColor: tmpl.colorHex }}
                            >
                              <div className="h-1.5 w-1/3 rounded-xs bg-white/90" />
                            </div>
                          )}

                          {tmpl.preview.headerStyle === 'centered' && (
                            <div className="flex flex-col items-center mb-1 pb-1 border-b border-slate-200 dark:border-slate-800">
                              <div className="h-2 w-1/3 rounded-xs bg-slate-800 dark:bg-slate-200 mb-0.5" />
                              <div className="h-1 w-1/4 rounded-xs bg-slate-400" />
                            </div>
                          )}

                          {tmpl.preview.headerStyle === 'minimal' && (
                            <div className="flex justify-between items-baseline mb-1">
                              <div className="h-2 w-1/3 rounded-xs bg-slate-800 dark:bg-slate-200" />
                              <div className="h-1 w-1/5 rounded-xs bg-slate-400" />
                            </div>
                          )}

                          {tmpl.preview.headerStyle === 'left' && (
                            <div className="mb-1">
                              <div className="h-2 w-1/3 rounded-xs bg-slate-800 dark:bg-slate-200 mb-0.5" />
                              <div className="h-1 w-1/4 rounded-xs bg-slate-400" />
                            </div>
                          )}

                          {/* Body Simulated Paragraph Lines */}
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between">
                              <div className="h-1.5 w-1/4 rounded-xs bg-blue-600/70" />
                              <div className="h-1 w-1/6 rounded-xs bg-slate-300" />
                            </div>
                            <div className="h-1 w-full rounded-xs bg-slate-200 dark:bg-slate-700" />
                            <div className="h-1 w-5/6 rounded-xs bg-slate-200 dark:bg-slate-700" />
                            <div className="flex justify-between mt-1">
                              <div className="h-1.5 w-1/4 rounded-xs bg-blue-600/70" />
                              <div className="h-1 w-1/6 rounded-xs bg-slate-300" />
                            </div>
                            <div className="h-1 w-full rounded-xs bg-slate-200 dark:bg-slate-700" />
                          </div>
                        </>
                      )}

                      {/* Selected Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3 stroke-3" />
                        </div>
                      )}
                    </div>

                    {/* Template Details */}
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {tmpl.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {tmpl.wordTheme}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {tmpl.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Word Document Style Sets */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Microsoft Word Style Sets (1-Click Color & Font Themes)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {WORD_STYLE_SETS.map((set, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    onChange({
                      ...resume,
                      styles: {
                        ...styles,
                        template: set.template,
                        colorPalette: set.palette,
                        fontFamily: set.font,
                        headerLayout: set.layout,
                      },
                    })
                  }
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/60 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {set.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{set.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palettes Picker */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Accent Color Swatches</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'navy', name: 'Executive Navy', color: '#1E3A8A' },
                { id: 'slate', name: 'Modern Slate', color: '#0F172A' },
                { id: 'emerald', name: 'Forest Emerald', color: '#065F46' },
                { id: 'indigo', name: 'Royal Indigo', color: '#3730A3' },
                { id: 'crimson', name: 'Burgundy Crimson', color: '#881337' },
                { id: 'charcoal', name: 'Minimal Charcoal', color: '#27272A' },
                { id: 'amber', name: 'Warm Ochre', color: '#78350F' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    onChange({
                      ...resume,
                      styles: { ...styles, colorPalette: c.id as any },
                    })
                  }
                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                    styles.colorPalette === c.id
                      ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-xs"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Pairing */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>Typography Pairing</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'modern-sans', name: 'Plus Jakarta Sans', type: 'Word Modern Neo-Grotesque' },
                { id: 'geometric-sans', name: 'Outfit', type: 'Word Geometric Headline' },
                { id: 'editorial-serif', name: 'Playfair Display', type: 'Word Executive Regal Serif' },
                { id: 'classic-clean', name: 'Harvard Georgia', type: 'Word Traditional (Times/Georgia)' },
                { id: 'mono-tech', name: 'JetBrains Mono', type: 'Word Technical Consolas' },
              ].map((font) => (
                <button
                  key={font.id}
                  onClick={() =>
                    onChange({
                      ...resume,
                      styles: { ...styles, fontFamily: font.id as any },
                    })
                  }
                  className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                    styles.fontFamily === font.id
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{font.name}</div>
                  <div className="text-[10px] text-slate-500">{font.type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Spacing & Page Fit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Spacing Density (1-Page Fit)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['compact', 'standard', 'relaxed'] as const).map((space) => (
                  <button
                    key={space}
                    onClick={() =>
                      onChange({
                        ...resume,
                        styles: { ...styles, spacing: space },
                      })
                    }
                    className={`py-1.5 px-2 text-xs font-semibold rounded-md border capitalize cursor-pointer transition-colors ${
                      styles.spacing === space
                        ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {space}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Paper Size
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['a4', 'letter'] as const).map((pSize) => (
                  <button
                    key={pSize}
                    onClick={() =>
                      onChange({
                        ...resume,
                        styles: { ...styles, paperSize: pSize },
                      })
                    }
                    className={`py-1.5 px-2 text-xs font-semibold rounded-md border uppercase cursor-pointer transition-colors ${
                      styles.paperSize === pSize
                        ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pSize === 'a4' ? 'A4 (International)' : 'US Letter'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button on the Bottom Right Corner (User requested) */}
      <div className="absolute bottom-5 right-5 z-20">
        <button
          onClick={handleOpenAddPrompt}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          title="Add new entry to resume"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span>Add to Resume</span>
        </button>
      </div>

      {/* Add New Entry Prompt Modal (Prompt for data, append at end, auto scroll) */}
      {isAddPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add New Entry
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Prompt details, append at the end, and auto-scroll to the new addition.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPromptOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selector Buttons */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                What would you like to add?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'experience', label: 'Work Experience', icon: Briefcase },
                  { id: 'education', label: 'Education', icon: GraduationCap },
                  { id: 'skills', label: 'Skill Group', icon: Wrench },
                  { id: 'projects', label: 'Key Project', icon: FolderGit2 },
                  { id: 'certifications', label: 'Certification', icon: Award },
                  { id: 'documents', label: 'ID / Certificate', icon: ShieldCheck },
                  { id: 'custom', label: 'Custom Section', icon: Layers },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = addCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAddCategory(item.id as any)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Form Body */}
            <form onSubmit={handleConfirmAddPrompt} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Experience Form */}
              {addCategory === 'experience' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addExpData.company}
                        onChange={(e) => setAddExpData({ ...addExpData, company: e.target.value })}
                        placeholder="e.g. Acme Cloud Corp"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Job Title / Position *
                      </label>
                      <input
                        type="text"
                        required
                        value={addExpData.position}
                        onChange={(e) => setAddExpData({ ...addExpData, position: e.target.value })}
                        placeholder="e.g. Senior Software Architect"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={addExpData.location}
                        onChange={(e) => setAddExpData({ ...addExpData, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={addExpData.startDate}
                        onChange={(e) => setAddExpData({ ...addExpData, startDate: e.target.value })}
                        placeholder="e.g. 2022-03"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        value={addExpData.endDate}
                        disabled={addExpData.current}
                        onChange={(e) => setAddExpData({ ...addExpData, endDate: e.target.value })}
                        placeholder={addExpData.current ? 'Present' : 'e.g. 2024-01'}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="promptCurrent"
                      checked={addExpData.current}
                      onChange={(e) => setAddExpData({ ...addExpData, current: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="promptCurrent" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      Currently employed in this role
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Key Achievement Bullet Point
                    </label>
                    <textarea
                      rows={2}
                      value={addExpData.bullet1}
                      onChange={(e) => setAddExpData({ ...addExpData, bullet1: e.target.value })}
                      placeholder="e.g. Spearheaded infrastructure overhaul, reducing compute latency by 35% and saving $450k annually."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Technologies / Tools (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={addExpData.technologies}
                      onChange={(e) => setAddExpData({ ...addExpData, technologies: e.target.value })}
                      placeholder="e.g. TypeScript, React, Docker, PostgreSQL"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Education Form */}
              {addCategory === 'education' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Institution / University *
                    </label>
                    <input
                      type="text"
                      required
                      value={addEduData.institution}
                      onChange={(e) => setAddEduData({ ...addEduData, institution: e.target.value })}
                      placeholder="e.g. University of California, Berkeley"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Degree *
                      </label>
                      <input
                        type="text"
                        required
                        value={addEduData.degree}
                        onChange={(e) => setAddEduData({ ...addEduData, degree: e.target.value })}
                        placeholder="e.g. Bachelor of Science"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={addEduData.fieldOfStudy}
                        onChange={(e) => setAddEduData({ ...addEduData, fieldOfStudy: e.target.value })}
                        placeholder="e.g. Computer Science"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Graduation Year / Dates
                      </label>
                      <input
                        type="text"
                        value={addEduData.endDate}
                        onChange={(e) => setAddEduData({ ...addEduData, endDate: e.target.value })}
                        placeholder="e.g. 2018 - 2022"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        GPA / Honors
                      </label>
                      <input
                        type="text"
                        value={addEduData.honors}
                        onChange={(e) => setAddEduData({ ...addEduData, honors: e.target.value })}
                        placeholder="e.g. Magna Cum Laude, GPA 3.9"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Form */}
              {addCategory === 'skills' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Skill Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addSkillData.categoryName}
                      onChange={(e) => setAddSkillData({ ...addSkillData, categoryName: e.target.value })}
                      placeholder="e.g. Cloud & DevOps, Languages, Leadership"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Skills (comma-separated) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={addSkillData.skillsString}
                      onChange={(e) => setAddSkillData({ ...addSkillData, skillsString: e.target.value })}
                      placeholder="e.g. Docker, Kubernetes, Terraform, AWS, Prometheus, Helm"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Projects Form */}
              {addCategory === 'projects' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addProjData.title}
                        onChange={(e) => setAddProjData({ ...addProjData, title: e.target.value })}
                        placeholder="e.g. StreamForge Message Queue"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Role / Contribution
                      </label>
                      <input
                        type="text"
                        value={addProjData.role}
                        onChange={(e) => setAddProjData({ ...addProjData, role: e.target.value })}
                        placeholder="e.g. Lead Maintainer"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Project Link / GitHub URL
                    </label>
                    <input
                      type="text"
                      value={addProjData.link}
                      onChange={(e) => setAddProjData({ ...addProjData, link: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Highlights / Impact Bullet
                    </label>
                    <textarea
                      rows={2}
                      value={addProjData.bullet1}
                      onChange={(e) => setAddProjData({ ...addProjData, bullet1: e.target.value })}
                      placeholder="e.g. Handled 350,000 msgs/sec throughput, adopted by 8 enterprise fintech clients."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Certifications Form */}
              {addCategory === 'certifications' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Certification Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addCertData.name}
                      onChange={(e) => setAddCertData({ ...addCertData, name: e.target.value })}
                      placeholder="e.g. AWS Certified Solutions Architect Professional"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Issuing Authority
                      </label>
                      <input
                        type="text"
                        value={addCertData.issuer}
                        onChange={(e) => setAddCertData({ ...addCertData, issuer: e.target.value })}
                        placeholder="e.g. Amazon Web Services"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Issue Year / Date
                      </label>
                      <input
                        type="text"
                        value={addCertData.issueDate}
                        onChange={(e) => setAddCertData({ ...addCertData, issueDate: e.target.value })}
                        placeholder="e.g. 2023-09"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Documents & ID Form */}
              {addCategory === 'documents' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Document Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={addDocData.title}
                      onChange={(e) => setAddDocData({ ...addDocData, title: e.target.value })}
                      placeholder="e.g. Certified ID Copy / Passport or Master of Science Diploma"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category / Document Type *
                      </label>
                      <select
                        value={addDocData.category}
                        onChange={(e) => setAddDocData({ ...addDocData, category: e.target.value as DocumentCategory })}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="id_copy">National ID Copy / Passport</option>
                        <option value="degree_certificate">Degree / Diploma Certificate</option>
                        <option value="professional_cert">Professional Certification</option>
                        <option value="transcript">Academic Transcript</option>
                        <option value="drivers_license">Driver's License</option>
                        <option value="work_permit">Work Permit / Visa</option>
                        <option value="reference_letter">Reference Letter</option>
                        <option value="other">Other Supporting Document</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Document / Credential ID #
                      </label>
                      <input
                        type="text"
                        value={addDocData.documentNumber}
                        onChange={(e) => setAddDocData({ ...addDocData, documentNumber: e.target.value })}
                        placeholder="e.g. US-PASSPORT-482019"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Issuing Authority
                      </label>
                      <input
                        type="text"
                        value={addDocData.issuer}
                        onChange={(e) => setAddDocData({ ...addDocData, issuer: e.target.value })}
                        placeholder="e.g. Dept of State / Stanford University"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Issue Date / Validity
                      </label>
                      <input
                        type="text"
                        value={addDocData.issueDate}
                        onChange={(e) => setAddDocData({ ...addDocData, issueDate: e.target.value })}
                        placeholder="e.g. 2024-02"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Certified True Copy Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="modalDocCertified"
                      checked={addDocData.isCertified}
                      onChange={(e) => setAddDocData({ ...addDocData, isCertified: e.target.checked })}
                      className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="modalDocCertified" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Certified True Copy verified by commissioner / notary</span>
                    </label>
                  </div>

                  {/* File Upload Selector */}
                  <div className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {addDocData.fileName || 'Attach Scanned Copy (PDF, PNG, JPG)'}
                        </div>
                        {addDocData.fileSize && (
                          <div className="text-[10px] text-slate-400">{addDocData.fileSize} attached</div>
                        )}
                      </div>
                    </div>
                    <label className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-100 shrink-0">
                      <span>Browse...</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setAddDocData({
                                ...addDocData,
                                fileName: f.name,
                                fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                                fileData: ev.target?.result as string,
                              });
                            };
                            reader.readAsDataURL(f);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Custom Section Form */}
              {addCategory === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Section Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addCustomData.sectionTitle}
                      onChange={(e) => setAddCustomData({ ...addCustomData, sectionTitle: e.target.value })}
                      placeholder="e.g. Publications, Volunteer Work, Patents"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Entry Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={addCustomData.itemTitle}
                      onChange={(e) => setAddCustomData({ ...addCustomData, itemTitle: e.target.value })}
                      placeholder="e.g. High-Throughput Event Log Verification"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Subtitle / Organization
                      </label>
                      <input
                        type="text"
                        value={addCustomData.itemSubtitle}
                        onChange={(e) => setAddCustomData({ ...addCustomData, itemSubtitle: e.target.value })}
                        placeholder="e.g. IEEE Transactions on Cloud"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date / Year
                      </label>
                      <input
                        type="text"
                        value={addCustomData.itemDate}
                        onChange={(e) => setAddCustomData({ ...addCustomData, itemDate: e.target.value })}
                        placeholder="e.g. 2023"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Appends at the end &amp; auto-scrolls to position
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPromptOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Add to End &amp; Jump</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
