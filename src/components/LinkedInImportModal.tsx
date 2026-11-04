import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { parseLinkedInData, mergeLinkedInIntoResume, LinkedInParseResult } from '../utils/linkedinParser';
import { EMPTY_RESUME } from '../data/sampleResumes';
import { useModalDismiss } from '../hooks/useModalDismiss';

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

  const panelRef = useRef<HTMLDivElement>(null);
  useModalDismiss(isOpen, onClose, panelRef);

  if (!isOpen) return null;

  const hasExtractionSignal = (r: LinkedInParseResult): boolean =>
    Boolean(
      r.personal.fullName.trim() ||
        r.personal.email.trim() ||
        r.personal.phone.trim() ||
        r.personal.location.trim() ||
        r.personal.summary.trim() ||
        r.personal.jobTitle.trim() ||
        r.experience.length > 0 ||
        r.education.length > 0 ||
        r.skills.some((s) => s.skills.length > 0) ||
        r.certifications.length > 0 ||
        r.detectedSections.length > 0
    );

  const handleParse = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParseResult(null);
      return;
    }
    const result = parseLinkedInData(text);
    setParseResult(result);
  };

  const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB of text is more than any LinkedIn export.

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMPORT_BYTES) {
      setFileName(null);
      setParseResult(null);
      window.alert('That file is larger than 2 MB. Please export a smaller file (e.g. a .txt or .json, not a scanned PDF).');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string' && content) {
        handleParse(content);
      }
    };
    reader.onerror = () => {
      setFileName(null);
      setParseResult(null);
      window.alert('Could not read that file. Please try a .txt or .json export.');
    };
    reader.readAsText(file);
    e.target.value = '';
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
        // LinkedIn exports carry no projects/documents — clear stale ones so a
        // "replace" actually replaces.
        projects: [],
        documents: [],
      };
      onApplyResume(newResume);
    }

    onClose();
  };

  const handleApplySample = (sample: ResumeData) => {
    const hasExistingData = Boolean(
      currentResume.personal.fullName ||
        currentResume.personal.email ||
        currentResume.experience.length ||
        currentResume.education.length ||
        currentResume.skills.length
    );
    if (
      hasExistingData &&
      !window.confirm('Start with a blank resume? This clears the current resume from this workspace, but your latest cloud backup remains available.')
    ) {
      return;
    }
    // Deep-clone the shared EMPTY_RESUME constant so nested objects are never shared by reference.
    onApplyResume({
      ...structuredClone(sample),
      id: currentResume.id,
      lastModified: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="linkedin-import-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shadow-xs shrink-0">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="linkedin-import-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Import or Start Fresh
              </h2>
              <p className="text-xs text-slate-500">
                Import from LinkedIn or start with a blank resume.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
            aria-label="Close import dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950/40 gap-4 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'paste'
                ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#70B5F9]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="sm:hidden">Paste Text</span>
            <span className="hidden sm:inline">Paste Profile Text</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#70B5F9]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="sm:hidden">Upload File</span>
            <span className="hidden sm:inline">Upload LinkedIn PDF / Text File</span>
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'samples'
                ? 'border-[#0A66C2] text-[#0A66C2] dark:text-[#70B5F9]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Start Fresh
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
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
                placeholder="Paste your LinkedIn profile text here...&#10;&#10;e.g.&#10;Naledi Khumalo&#10;Senior Operations Manager&#10;Sandton, Johannesburg&#10;naledi.khumalo@example.co.za&#10;&#10;Experience&#10;Operations Manager&#10;The Courier Guy · July 2016 - February 2021..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:border-[#0A66C2] font-mono leading-relaxed"
              />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-[#0A66C2] transition-colors cursor-pointer relative bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="file"
                  accept=".txt,.json,.cvbackup"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Upload LinkedIn export file"
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
                💡 <span className="font-semibold text-blue-900 dark:text-blue-300">Tip:</span> LinkedIn&apos;s &quot;Save to PDF&quot; produces a PDF, which cannot be parsed here — open that PDF, select all, and paste the text into the <span className="font-semibold">Paste Profile Text</span> tab instead. Only .txt, .json and .cvbackup files can be uploaded.
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

          {/* Parsed preview — only claim success when something was actually extracted */}
          {parseResult && !hasExtractionSignal(parseResult) && (
            <div className="border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Nothing readable detected
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                We couldn&apos;t find a name, contact details, work history or skills in that input.
                Make sure you pasted the full text of your LinkedIn profile (or upload a .txt/.json export), then try again.
              </p>
            </div>
          )}
          {parseResult && hasExtractionSignal(parseResult) && (
            <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Extracted LinkedIn Data Successfully</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2 border-t border-emerald-200 dark:border-emerald-900 text-xs">
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
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {parseResult && hasExtractionSignal(parseResult) && (
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
