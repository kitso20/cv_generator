import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Cloud,
  Copy,
  Check,
  RefreshCw,
  Shield,
  Download,
  Upload,
  Clock,
  Trash2,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { ResumeData } from '../types/resume';
import { useModalDismiss } from '../hooks/useModalDismiss';
import { normalizeResumeData } from '../utils/resumeSchema';
import {
  CloudBackupItem,
  loadResumeFromCloud,
  createCloudBackup,
  fetchCloudBackups,
  deleteCloudBackup,
  copyTextToClipboard,
  downloadJsonFile,
  setStoredSyncCode,
} from '../utils/cloudSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeData;
  syncCode: string;
  onUpdateResume: (updated: ResumeData) => void;
  onUpdateSyncCode: (newCode: string) => void;
  lastSyncedAt: string | null;
  syncError: string | null;
  /** Whether the user opted in to cloud sync (uploads). */
  cloudSyncEnabled: boolean;
  onToggleCloudSync: (enabled: boolean) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  resume,
  syncCode,
  onUpdateResume,
  onUpdateSyncCode,
  lastSyncedAt,
  syncError,
  cloudSyncEnabled,
  onToggleCloudSync,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isLoadingOther, setIsLoadingOther] = useState(false);
  const [otherError, setOtherError] = useState<string | null>(null);

  const [backups, setBackups] = useState<CloudBackupItem[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sync' | 'backups'>('sync');

  const panelRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useModalDismiss(isOpen, onClose, panelRef);

  // Declared before the effect that uses it (and stable across renders).
  const loadBackupsList = useCallback(async () => {
    setIsLoadingBackups(true);
    setBackupError(null);
    const result = await fetchCloudBackups(syncCode);
    if (result.success && result.backups) {
      setBackups(result.backups);
    } else {
      setBackupError(result.error || 'Could not load your backups.');
    }
    setIsLoadingBackups(false);
  }, [syncCode]);

  useEffect(() => {
    if (isOpen) {
      loadBackupsList();
    }
  }, [isOpen, loadBackupsList]);

  // Clear any pending "copied!" reset timer on unmount.
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const shareableUrl = `${window.location.origin}${window.location.pathname}?sync=${syncCode}`;

  const flashCopied = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => setter(false), 2000);
  };

  const handleCopyCode = async () => {
    const copied = await copyTextToClipboard(syncCode);
    if (copied) {
      flashCopied(setCopiedCode);
    }
  };

  const handleCopyLink = async () => {
    const copied = await copyTextToClipboard(shareableUrl);
    if (copied) {
      flashCopied(setCopiedLink);
    }
  };

  const handleConnectDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;

    setIsLoadingOther(true);
    setOtherError(null);

    const res = await loadResumeFromCloud(clean);
    setIsLoadingOther(false);

    if (res.success && res.resumeData) {
      onUpdateSyncCode(clean);
      setStoredSyncCode(clean);
      onUpdateResume(res.resumeData);
      // A shared code was explicitly used; opt into sync so future edits upload.
      onToggleCloudSync(true);
      setInputCode('');
      onClose();
    } else {
      setOtherError(res.error || 'Could not find a resume for that sync code.');
    }
  };

  const handleCreateSnapshot = async () => {
    setIsCreatingBackup(true);
    setBackupError(null);
    const label = backupLabel.trim() || `Snapshot ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const res = await createCloudBackup(resume, syncCode, label);
    setIsCreatingBackup(false);
    if (res.success && res.backup) {
      setBackups((previous) => [res.backup as CloudBackupItem, ...previous]);
      setBackupLabel('');
    } else {
      setBackupError(res.error || 'Could not create the snapshot. Please try again.');
    }
  };

  const handleDeleteBackup = async (backup: CloudBackupItem) => {
    if (!window.confirm(`Delete snapshot "${backup.label}"? This cannot be undone.`)) {
      return;
    }

    setDeletingBackupId(backup.id);
    setBackupError(null);
    const res = await deleteCloudBackup(backup.id, syncCode);
    setDeletingBackupId(null);

    if (res.success) {
      setBackups((previous) => previous.filter((item) => item.id !== backup.id));
    } else {
      setBackupError(res.error || 'Could not delete this snapshot.');
    }
  };

  const handleRestoreBackup = (backup: CloudBackupItem) => {
    if (window.confirm(`Restore resume snapshot "${backup.label}" from ${new Date(backup.timestamp).toLocaleString()}? This will replace your current workspace.`)) {
      onUpdateResume(normalizeResumeData(backup.resumeData));
      onClose();
    }
  };

  const MAX_BACKUP_FILE_BYTES = 5 * 1024 * 1024; // 5 MB is generous for a JSON resume.

  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupError(null);

    if (file.size > MAX_BACKUP_FILE_BYTES) {
      setBackupError('That file is larger than 5 MB. Refusing to load it.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result;
        if (typeof raw !== 'string') {
          setBackupError('Could not read that backup file.');
          return;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && typeof parsed.personal === 'object') {
          onUpdateResume(normalizeResumeData(parsed));
          onClose();
        } else {
          setBackupError('That file is not a valid resume backup.');
        }
      } catch {
        setBackupError('Could not read that backup file. Make sure it is a .cvbackup or .json file.');
      }
    };
    reader.onerror = () => {
      setBackupError('Could not read that backup file.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-sync-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="cloud-sync-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Device Cloud Sync &amp; Backups
              </h2>
              <p className="text-xs text-slate-500">
                Access your resume across laptop, phone, or tablet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
            aria-label="Close cloud sync"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950/40 gap-4 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sync'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="whitespace-nowrap">Cross-Device Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`py-2.5 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backups'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              <span className="sm:hidden">Backups ({backups.length})</span>
              <span className="hidden sm:inline">Cloud Backups ({backups.length})</span>
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'sync' ? (
            <>
              {/* Cloud sync opt-in banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  cloudSyncEnabled
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30'
                    : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20'
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-xs font-bold ${cloudSyncEnabled ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                    {cloudSyncEnabled ? 'Cloud sync is ON' : 'Cloud sync is OFF — your resume stays on this device'}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                    {cloudSyncEnabled
                      ? 'Edits are uploaded to your server so other devices with this code can pick them up.'
                      : 'Nothing is uploaded. Enable cloud sync to sync this resume across devices or share a sync link.'}
                  </p>
                </div>
                <button
                  onClick={() => onToggleCloudSync(!cloudSyncEnabled)}
                  className={`shrink-0 px-3.5 py-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    cloudSyncEnabled
                      ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {cloudSyncEnabled ? 'Turn off' : 'Enable cloud sync'}
                </button>
              </div>

              {/* Current Sync Code Box */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Your Active Sync Code
                  </span>
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${!cloudSyncEnabled ? 'text-slate-500 dark:text-slate-400' : syncError ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${!cloudSyncEnabled ? 'bg-slate-400' : syncError ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    {!cloudSyncEnabled ? 'Sync off' : syncError ? 'Local only' : lastSyncedAt ? 'Cloud synced' : 'Saved locally'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="w-full sm:w-auto text-center font-mono text-lg sm:text-xl font-bold tracking-widest text-slate-900 dark:text-white px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {syncCode}
                  </div>
                  <div className="grid grid-cols-2 sm:flex gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                    <button
                      onClick={handleCopyLink}
                      disabled={!cloudSyncEnabled}
                      title={cloudSyncEnabled ? 'Copy a link that opens this resume' : 'Enable cloud sync to share a link'}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
                {syncError && (
                  <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                    Cloud sync is unavailable right now. Your work is saved on this device; it will retry when you edit again.
                  </p>
                )}

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Open this link or enter this code on your phone or tablet to continue editing. Anyone with the code or link can view and edit this resume, so share it only with people you trust.
                </p>
              </div>

              {/* Connect another device */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Connect & Load Another Resume</span>
                </div>
                <p className="text-slate-500">
                  Enter a sync code generated on another device to fetch that resume:
                </p>

                <form onSubmit={handleConnectDevice} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CV-8942A"
                    aria-label="Sync code from another device"
                    autoComplete="off"
                    spellCheck={false}
                    className="flex-1 font-mono uppercase text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoadingOther || !inputCode.trim()}
                    className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingOther ? 'Loading...' : 'Load Resume'}
                  </button>
                </form>

                {otherError && (
                  <div className="text-rose-500 text-[11px] font-medium">{otherError}</div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Snapshot Creator */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Create Snapshot
                  </span>
                  <span className="text-[10px] text-slate-400">Stored on your server</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={backupLabel}
                    onChange={(e) => setBackupLabel(e.target.value)}
                    placeholder="Label (e.g. Before final review)"
                    aria-label="Snapshot label"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleCreateSnapshot}
                    disabled={isCreatingBackup}
                    className="px-3.5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    {isCreatingBackup ? 'Saving...' : 'Save Snapshot'}
                  </button>
                </div>
              </div>

              {/* Backups List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Saved Revisions ({backups.length})</span>
                  <button
                    onClick={loadBackupsList}
                    className="hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {backupError && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>{backupError}</span>
                  </div>
                )}

                {isLoadingBackups ? (
                  <div className="text-center py-6 text-slate-400">Loading backups...</div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No snapshot backups saved yet. Click Save Snapshot above.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {backups.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {b.label}
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(b.timestamp).toLocaleString()}</span>
                            <span>·</span>
                            <span className="font-mono text-[10px]">Hash: {b.checksum}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleRestoreBackup(b)}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(b)}
                            disabled={deletingBackupId === b.id}
                            aria-label={`Delete snapshot ${b.label}`}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded cursor-pointer disabled:opacity-50"
                          >
                            {deletingBackupId === b.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>{deletingBackupId === b.id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Offline Export / Import */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Offline File Backup
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Download or restore a standalone .cvbackup JSON file.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => downloadJsonFile(resume)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore File</span>
                    <input
                      type="file"
                      accept=".json,.cvbackup"
                      onChange={handleFileUploadRestore}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
