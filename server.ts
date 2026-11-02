import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const RESUMES_FILE = path.join(DATA_DIR, 'cloud_resumes.json');
const BACKUPS_FILE = path.join(DATA_DIR, 'cloud_backups.json');

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function saveJson<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// In-memory / file-backed stores
interface CloudResumeRecord {
  syncCode: string;
  title: string;
  resumeData: any;
  updatedAt: string;
  createdAt: string;
}

interface CloudBackupRecord {
  id: string;
  syncCode: string;
  label: string;
  resumeData: any;
  timestamp: string;
  checksum: string;
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Save or update cloud resume
app.post('/api/sync/save', (req, res) => {
  try {
    const { syncCode, title, resumeData } = req.body;
    if (!syncCode || !resumeData) {
      return res.status(400).json({ error: 'Missing syncCode or resumeData' });
    }

    const resumes = loadJson<Record<string, CloudResumeRecord>>(RESUMES_FILE, {});
    const now = new Date().toISOString();

    const existing = resumes[syncCode.toUpperCase()];
    resumes[syncCode.toUpperCase()] = {
      syncCode: syncCode.toUpperCase(),
      title: title || 'Professional Resume',
      resumeData,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };

    saveJson(RESUMES_FILE, resumes);

    // Also auto-create a backup point if previous existed
    res.json({
      success: true,
      syncCode: syncCode.toUpperCase(),
      updatedAt: now,
      message: 'Resume synced to cloud successfully',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync resume' });
  }
});

// Load resume by sync code
app.get('/api/sync/load/:code', (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    const resumes = loadJson<Record<string, CloudResumeRecord>>(RESUMES_FILE, {});
    const record = resumes[code];

    if (!record) {
      return res.status(404).json({ error: 'Resume not found for this sync code' });
    }

    res.json({
      success: true,
      syncCode: record.syncCode,
      title: record.title,
      resumeData: record.resumeData,
      updatedAt: record.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load resume' });
  }
});

// Create explicit secure cloud backup
app.post('/api/sync/backup', (req, res) => {
  try {
    const { syncCode, label, resumeData } = req.body;
    if (!syncCode || !resumeData) {
      return res.status(400).json({ error: 'Missing syncCode or resumeData' });
    }

    const backups = loadJson<CloudBackupRecord[]>(BACKUPS_FILE, []);
    const backupId = 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const now = new Date().toISOString();

    const newBackup: CloudBackupRecord = {
      id: backupId,
      syncCode: syncCode.toUpperCase(),
      label: label || `Snapshot ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      resumeData,
      timestamp: now,
      checksum: Buffer.from(JSON.stringify(resumeData)).toString('base64').slice(0, 16),
    };

    backups.unshift(newBackup);
    // Keep last 50 backups
    const trimmed = backups.slice(0, 50);
    saveJson(BACKUPS_FILE, trimmed);

    res.json({
      success: true,
      backup: newBackup,
      message: 'Cloud backup snapshot secured',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create backup' });
  }
});

// List backups for a sync code
app.get('/api/sync/backups/:code', (req, res) => {
  try {
    const code = req.params.code?.toUpperCase();
    const backups = loadJson<CloudBackupRecord[]>(BACKUPS_FILE, []);
    const filtered = backups.filter(b => b.syncCode === code);

    res.json({
      success: true,
      backups: filtered,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch backups' });
  }
});

// Delete a backup
app.delete('/api/sync/backup/:id', (req, res) => {
  try {
    const { id } = req.params;
    let backups = loadJson<CloudBackupRecord[]>(BACKUPS_FILE, []);
    backups = backups.filter(b => b.id !== id);
    saveJson(BACKUPS_FILE, backups);
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete backup' });
  }
});

// Serve frontend: Vite middleware in dev, static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: port,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CVForge server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
