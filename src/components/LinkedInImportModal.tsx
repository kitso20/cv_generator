import React, { useState } from 'react';
import {
  X,
  Upload,
  Clipboard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Wrench,
  User,
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { parseLinkedInData, mergeLinkedInIntoResume, LinkedInParseResult } from '../utils/linkedinParser';
import { EMPTY_RESUME } from '../data/sampleResumes';

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResume: ResumeData;
  onApplyResume: (updated: ResumeData) => void;
}

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  currentResume,
  onApplyResume,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'samples'>('paste');
  const [rawText, setRawText] = useState('');
  const [parseResult, setParseResult] = useState<LinkedInParseResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParseResult(null);
      return;
    }
    const result = parseLinkedInData(text);
    setParseResult(result);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParse(content);
      }
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!parseResult) return;

    if (importMode === 'merge') {
      const merged = mergeLinkedInIntoResume(currentResume, parseResult);
      onApplyResume(merged);
    } else {
      // Create new populated resume from parsed data
      const newResume: ResumeData = {
        ...currentResume,
        lastModified: new Date().toISOString(),
        title: `${parseResult.personal.fullName || 'Imported'}'s Resume`,
        personal: {
          ...currentResume.personal,
          fullName: parseResult.personal.fullName || currentResume.personal.fullName,
          jobTitle: parseResult.personal.jobTitle || currentResume.personal.jobTitle,
          email: parseResult.personal.email || currentResume.personal.email,
          phone: parseResult.personal.phone || currentResume.personal.phone,
          location: parseResult.personal.location || currentResume.personal.location,
          linkedin: parseResult.personal.linkedin || currentResume.personal.linkedin,
          summary: parseResult.personal.summary || currentResume.personal.summary,
        },
        experience: parseResult.experience.length > 0 ? parseResult.experience : currentResume.experience,
        education: parseResult.education.length > 0 ? parseResult.education : currentResume.education,
        skills: parseResult.skills.length > 0 ? parseResult.skills : currentResume.skills,
        certifications: parseResult.certifications.length > 0 ? parseResult.certifications : currentResume.certifications,
      };
      onApplyResume(newResume);
    }

    onClose();
  };

  const handleApplySample = (sample: ResumeData) => {
    onApplyResume({
      ...sample,
      id: currentResume.id,
      lastModified: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Import or Start Fresh
              </h2>
              <p className="text-xs text-slate-500">
                Import from LinkedIn or start with a blank resume to enter your own details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-950/40 gap-4 text-xs">
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'paste'
                ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#70B5F9]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Paste Profile Text
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#70B5F9]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Upload LinkedIn PDF / Text File
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'samples'
                ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#70B5F9]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Start Fresh
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                On LinkedIn, open your profile, select and copy your text (or click{' '}
                <span className="font-semibold text-slate-800 dark:text-white">More → Save to PDF</span>{' '}
                and paste its content below):
              </div>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => handleParse(e.target.value)}
                placeholder="Paste your LinkedIn profile text here...&#10;&#10;e.g.&#10;Alex Vance&#10;Lead Distributed Systems Architect&#10;San Francisco, California&#10;alex.vance@example.com&#10;&#10;Experience&#10;Senior Cloud Architect&#10;Datavane Systems · March 2022 - Present..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:border-[#0A66C2] font-mono leading-relaxed"
              />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-[#0A66C2] transition-colors cursor-pointer relative bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="file"
                  accept=".txt,.json,.pdf,.cvbackup"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {fileName ? fileName : 'Choose LinkedIn export file or drop here'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports exported .txt, .json, or .cvbackup files
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                💡 <span className="font-semibold text-blue-900 dark:text-blue-300">Tip:</span> To get your LinkedIn PDF, visit your LinkedIn profile → click the <span className="font-semibold">More</span> button below your headline → choose <span className="font-semibold">Save to PDF</span>.
              </div>
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2">
                Start with a blank resume to fill in your own details:
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {[{
                    title: 'Start from scratch (blank resume)',
                    candidate: 'Clears all data',
                    metrics: 'Empty resume, ready for your own details',
                    data: EMPTY_RESUME,
                  },
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplySample(sample.data)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/60 text-left transition-all hover:shadow-xs group cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {sample.title}
                      </span>
                      <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                        Load <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                      {sample.candidate}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{sample.metrics}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Inspection Preview Drawer */}
          {parseResult && (
            <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Extracted LinkedIn Data Successfully</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Candidate</div>
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {parseResult.personal.fullName || 'Not detected'}
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">
                    {parseResult.personal.jobTitle || 'No title'}
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Contact</div>
                  <div className="text-slate-800 dark:text-slate-200 truncate">
                    {parseResult.personal.email || parseResult.personal.phone || 'No direct contact in text'}
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">
                    {parseResult.personal.location || 'Location not detected'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-300">
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                  {parseResult.experience.length} Positions detected
                </span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                  {parseResult.education.length} Degrees detected
                </span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                  {parseResult.skills.reduce((acc, c) => acc + c.skills.length, 0)} Skills detected
                </span>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-4 pt-2 border-t border-emerald-200 dark:border-emerald-900 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-[#0A66C2]"
                  />
                  <span>Replace current resume</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="text-[#0A66C2]"
                  />
                  <span>Merge with current data</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {parseResult && (
            <button
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Apply to Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
