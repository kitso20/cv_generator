import { ResumeData } from '../types/resume';

const LOCAL_STORAGE_KEY = 'cvforge_resume_active';
const SYNC_CODE_KEY = 'cvforge_sync_code';

export interface CloudBackupItem {
  id: string;
  syncCode: string;
  label: string;
  timestamp: string;
  resumeData: ResumeData;
  checksum: string;
}

export function generateSyncCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'CV-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getStoredSyncCode(): string {
  let code = localStorage.getItem(SYNC_CODE_KEY);
  if (!code) {
    code = generateSyncCode();
    localStorage.setItem(SYNC_CODE_KEY, code);
  }
  return code;
}

export function setStoredSyncCode(code: string): void {
  localStorage.setItem(SYNC_CODE_KEY, code.toUpperCase());
}

export function saveLocalResume(resume: ResumeData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resume));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function loadLocalResume(): ResumeData | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
  }
  return null;
}

export async function syncResumeToCloud(
  resume: ResumeData,
  syncCode: string
): Promise<{ success: boolean; updatedAt?: string; error?: string }> {
  try {
    const response = await fetch('/api/sync/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncCode: syncCode.toUpperCase(),
        title: resume.title || `${resume.personal.fullName || 'Candidate'}'s Resume`,
        resumeData: resume,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server error syncing resume');
    }

    const data = await response.json();
    return { success: true, updatedAt: data.updatedAt };
  } catch (err: any) {
    console.warn('Cloud sync error (fallback to local):', err.message);
    return { success: false, error: err.message };
  }
}

export async function loadResumeFromCloud(
  syncCode: string
): Promise<{ success: boolean; resumeData?: ResumeData; error?: string }> {
  try {
    const response = await fetch(`/api/sync/load/${syncCode.toUpperCase()}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Sync code not found');
    }
    const data = await response.json();
    return { success: true, resumeData: data.resumeData };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createCloudBackup(
  resume: ResumeData,
  syncCode: string,
  label?: string
): Promise<{ success: boolean; backup?: CloudBackupItem; error?: string }> {
  try {
    const response = await fetch('/api/sync/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncCode: syncCode.toUpperCase(),
        label: label || `Manual Backup · ${new Date().toLocaleDateString()}`,
        resumeData: resume,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create cloud backup');
    }

    const data = await response.json();
    return { success: true, backup: data.backup };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchCloudBackups(
  syncCode: string
): Promise<{ success: boolean; backups?: CloudBackupItem[]; error?: string }> {
  try {
    const response = await fetch(`/api/sync/backups/${syncCode.toUpperCase()}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to load backups');
    }
    const data = await response.json();
    return { success: true, backups: data.backups || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function downloadJsonFile(resume: ResumeData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resume, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const preferredName =
    resume.title?.trim() && resume.title.trim().toLowerCase() !== 'my resume'
      ? resume.title.trim()
      : resume.personal.fullName?.trim();
  const name =
    (preferredName || 'Resume')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Resume';
  downloadAnchor.setAttribute('download', `${name}_Backup_${new Date().toISOString().slice(0, 10)}.cvbackup`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
