import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Eye,
  Edit3,
  Sliders,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ResumeData } from './types/resume';
import { EMPTY_RESUME  } from './data/sampleResumes';
import {
  getStoredSyncCode,
  setStoredSyncCode,
  loadLocalResume,
  saveLocalResume,
  syncResumeToCloud,
  loadResumeFromCloud,
} from './utils/cloudSync';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { ResumePreview } from './components/ResumePreview';
import { LinkedInImportModal } from './components/LinkedInImportModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AtsModal } from './components/AtsModal';

export default function App() {
  const [resume, setResume] = useState<ResumeData>(() => {
    const local = loadLocalResume();
    return local || EMPTY_RESUME ;
  });

  const [syncCode, setSyncCode] = useState<string>(() => getStoredSyncCode());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Editor Sub-tabs & mobile view toggles
  const [activeEditorTab, setActiveEditorTab] = useState<'content' | 'sections' | 'style'>('content');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Modals
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cvforge_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('cvforge_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('cvforge_theme', 'light');
    }
  }, [darkMode]);

  // Load resume from URL param ?sync=... if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSyncCode = params.get('sync');
    if (urlSyncCode && urlSyncCode.trim()) {
      const code = urlSyncCode.trim().toUpperCase();
      setSyncCode(code);
      setStoredSyncCode(code);
      loadResumeFromCloud(code).then((res) => {
        if (res.success && res.resumeData) {
          setResume(res.resumeData);
          saveLocalResume(res.resumeData);
        }
      });
    }
  }, []);

  // Debounced Auto-sync to LocalStorage and Cloud
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpdateResume = (updated: ResumeData) => {
    setResume(updated);
    saveLocalResume(updated);

    // Debounce cloud sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      const res = await syncResumeToCloud(updated, syncCode);
      setIsSyncing(false);
      if (res.success) {
        setLastSyncedAt(res.updatedAt || new Date().toISOString());
      }
    }, 1500);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <Header
        resume={resume}
        onUpdateResume={handleUpdateResume}
        syncCode={syncCode}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenLinkedInModal={() => setIsLinkedInModalOpen(true)}
        onOpenAtsModal={() => setIsAtsModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Mobile / Tablet Segmented View Switcher */}
      <div className="no-print lg:hidden p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full max-w-sm">
          <button
            onClick={() => setMobileView('editor')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mobileView === 'editor'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor & Styling</span>
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              mobileView === 'preview'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Document Preview</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Column: Form Editor & Drag-and-Drop Manager */}
        <div
          className={`no-print w-full lg:w-[48%] xl:w-[44%] shrink-0 lg:sticky lg:top-20 ${
            mobileView === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          <EditorPanel
            resume={resume}
            onChange={handleUpdateResume}
            activeTab={activeEditorTab}
            setActiveTab={setActiveEditorTab}
          />
        </div>

        {/* Right Column: Real-time Live Document Preview */}
        <div
          className={`w-full lg:flex-1 flex flex-col items-center ${
            mobileView === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          <ResumePreview
            resume={resume}
            onUpdateResume={handleUpdateResume}
          />
        </div>
      </main>

      {/* Modals */}
      <LinkedInImportModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        currentResume={resume}
        onApplyResume={handleUpdateResume}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        resume={resume}
        syncCode={syncCode}
        onUpdateResume={handleUpdateResume}
        onUpdateSyncCode={setSyncCode}
        lastSyncedAt={lastSyncedAt}
      />

      <AtsModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        resume={resume}
        onUpdateResume={handleUpdateResume}
      />
    </div>
  );
}
