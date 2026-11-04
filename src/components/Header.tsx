import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  Moon,
  Sun,
  FileCheck2,
  FileSpreadsheet,
  Cloud,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { withPreviewPlaceholders, previewUsesPlaceholders } from '../data/previewPlaceholders';
import { downloadJsonFile } from '../utils/cloudSync';
import { runAtsAudit } from '../utils/atsAuditor';

interface HeaderProps {
  resume: ResumeData;
  onUpdateResume: (updated: ResumeData) => void;
  syncCode: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onOpenSyncModal: () => void;
  onOpenLinkedInModal: () => void;
  onOpenAtsModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  syncError: string | null;
  /** Opt-in state; when false, edits are saved locally only. */
  cloudSyncEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  resume,
  onUpdateResume,
  syncCode,
  isSyncing,
  lastSyncedAt,
  onOpenSyncModal,
  onOpenLinkedInModal,
  onOpenAtsModal,
  darkMode,
  onToggleDarkMode,
  syncError,
  cloudSyncEnabled = true,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isExportMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsExportMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isExportMenuOpen]);

  // Auditing is expensive; only re-run when the resume actually changes.
  const atsReport = useMemo(() => runAtsAudit(resume), [resume]);

  const getExportBaseName = () => {
    const fullName = resume.personal.fullName?.trim().replace(/\s+/g, ' ');
    const title = resume.title?.trim().replace(/\s+/g, ' ');
    const preferred = title && title.toLowerCase() !== 'my resume' ? title : fullName || title;
    return (
      (preferred || 'Resume')
        .replace(/[\\/:*?"<>|]+/g, '')
        .replace(/\s+/g, ' ')
        .trim() || 'Resume'
    );
  };

  const handlePrintPdf = () => {
    setIsExportMenuOpen(false);
    const previousTitle = document.title;
    const exportName = getExportBaseName();
    document.title = `${exportName} - Resume`;
    const restore = () => {
      document.title = previousTitle;
    };
    // Prefer the print lifecycle over a fixed timer.
    window.addEventListener('afterprint', restore, { once: true });
    window.setTimeout(restore, 2000); // Fallback if afterprint never fires.
    window.print();
  };

  const handleExportDocx = async () => {
    try {
      // Never silently ship sample placeholder content as the user's resume.
      if (previewUsesPlaceholders(resume)) {
        const proceed = window.confirm(
          'Your resume is empty, so an export right now would contain example placeholder content — not your details.\n\nExport with placeholder content anyway?'
        );
        if (!proceed) return;
      }
      setIsExportingDocx(true);
      setExportError(null);
      const { exportResumeToDocx } = await import('../utils/docxExport');
      await exportResumeToDocx(previewUsesPlaceholders(resume) ? withPreviewPlaceholders(resume) : resume);
      setIsExportMenuOpen(false);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      setExportError('Could not create the Word file. Please try again.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportBackup = () => {
    downloadJsonFile(resume);
    setIsExportMenuOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Wordmark & Document Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-900 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div className="hidden min-[380px]:block">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                CVForkt
                <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  ATS Pro
                </span>
              </span>
            </div>
          </div>

          <div className="hidden lg:block h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Editable Document Title */}
          <div className="hidden md:flex items-center min-w-0">
            <input
              type="text"
              value={resume.title}
              onChange={(e) => onUpdateResume({ ...resume, title: e.target.value })}
              aria-label="Resume document title"
              placeholder="Resume title / file name"
              title="Used as the PDF, DOCX and backup file name"
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 px-2 py-1 rounded transition-colors border border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:outline-none w-40 lg:w-56 truncate"
            />
          </div>
        </div>

        {/* Zone 2: Status & Tool Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* LinkedIn Import CTA */}
          <button
            onClick={onOpenLinkedInModal}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0A66C2]/10 hover:bg-[#0A66C2]/15 text-[#0A66C2] dark:bg-[#0A66C2]/20 dark:text-[#70B5F9] transition-colors border border-[#0A66C2]/20 whitespace-nowrap cursor-pointer"
            title="Import or sync LinkedIn profile data"
            aria-label="Import LinkedIn profile"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span className="hidden sm:inline">LinkedIn Import</span>
          </button>

          {/* ATS Readiness Score */}
          <button
            onClick={onOpenAtsModal}
            className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer ${
              atsReport.overallScore >= 85
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                : atsReport.overallScore >= 70
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
            }`}
            title="Applicant Tracking System (ATS) Compatibility Score"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span><span className="hidden min-[360px]:inline">ATS </span>{atsReport.overallScore}%</span>
            <span className="hidden sm:inline text-[10px] opacity-75 font-mono">({atsReport.letterGrade})</span>
          </button>

          {/* Cloud Sync Status Button */}
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer"
            title={!cloudSyncEnabled ? 'Cloud sync is off — resume is saved locally only. Open to enable.' : syncError ? `Cloud sync unavailable: ${syncError}` : lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()} · Code ${syncCode}` : `Cloud Sync Code: ${syncCode}`}
            aria-label={!cloudSyncEnabled ? 'Cloud sync off; resume saved locally' : syncError ? `Cloud sync unavailable. Sync code ${syncCode}` : `Cloud sync code ${syncCode}`}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
            ) : !cloudSyncEnabled ? (
              <Cloud className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            ) : syncError ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            )}
            <span className="hidden md:inline font-mono text-[11px] font-semibold">{cloudSyncEnabled ? syncCode : 'Sync off'}</span>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${!cloudSyncEnabled ? 'bg-slate-400' : syncError ? 'bg-rose-500' : isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsExportMenuOpen(!isExportMenuOpen);
                setExportError(null);
              }}
              aria-label="Export resume"
              aria-expanded={isExportMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="hidden sm:block w-3 h-3 opacity-70" />
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  aria-hidden="true"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div role="menu" aria-label="Export formats" className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-1rem)] rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Export Formats
                    </div>
                    <label className="mt-1.5 block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      File name
                      <input
                        type="text"
                        value={resume.title}
                        onChange={(e) => onUpdateResume({ ...resume, title: e.target.value })}
                        placeholder={getExportBaseName()}
                        aria-label="Resume file name"
                        autoComplete="off"
                        className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </label>
                    <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      Saves as {getExportBaseName()}.pdf / .docx
                    </div>
                  </div>

                  {/* Print / Save as PDF */}
                  <button
                    role="menuitem"
                    onClick={handlePrintPdf}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <div>
                      <div className="font-semibold">PDF Document</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Vector print-ready (ATS Safe)</div>
                    </div>
                  </button>

                  {/* Export DOCX */}
                  <button
                    role="menuitem"
                    onClick={handleExportDocx}
                    disabled={isExportingDocx}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isExportingDocx ? (
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <div>
                      <div className="font-semibold">
                        {isExportingDocx ? 'Preparing Word file...' : 'Word Document (.docx)'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Native editable ATS format</div>
                    </div>
                  </button>

                  {exportError && (
                    <div className="mx-3 my-1 flex items-start gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 px-2.5 py-2 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{exportError}</span>
                    </div>
                  )}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* Export Backup File */}
                  <button
                    role="menuitem"
                    onClick={handleExportBackup}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="font-semibold">Download Backup File</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Portable .cvbackup JSON</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
