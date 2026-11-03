import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const parsedPort = Number.parseInt(process.env.PORT || '', 10);
const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 3000;

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const RESUMES_FILE = path.join(DATA_DIR, 'cloud_resumes.json');
const BACKUPS_FILE = path.join(DATA_DIR, 'cloud_backups.json');

const SYNC_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,31}$/;
const BACKUP_ID_PATTERN = /^[A-Z0-9-]{3,64}$/;

function normalizeSyncCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return SYNC_CODE_PATTERN.test(code) ? code : null;
}

function isResumeData(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    // Preserve the unreadable file instead of overwriting it on the next save.
    try {
      fs.renameSync(filePath, `${filePath}.corrupt-${Date.now()}`);
    } catch (renameErr) {
      console.error(`Error preserving corrupt file ${filePath}:`, renameErr);
    }
  }
  return fallback;
}

function saveJson<T>(filePath: string, data: T): void {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // Ignore cleanup failures; the original error is more useful.
    }
    throw err;
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
    const { syncCode, title, resumeData } = req.body ?? {};
    const code = normalizeSyncCode(syncCode);
    if (!code || !isResumeData(resumeData)) {
      return res.status(400).json({ error: 'A valid syncCode and resumeData are required' });
    }

    const resumes = loadJson<Record<string, CloudResumeRecord>>(RESUMES_FILE, {});
    const now = new Date().toISOString();

    const existing = resumes[code];
    resumes[code] = {
      syncCode: code,
      title: typeof title === 'string' && title.trim() ? title.trim().slice(0, 200) : 'Professional Resume',
      resumeData,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };

    saveJson(RESUMES_FILE, resumes);

    res.json({
      success: true,
      syncCode: code,
      updatedAt: now,
      message: 'Resume synced to cloud successfully',
    });
  } catch (error: any) {
    console.error('Failed to sync resume:', error);
    res.status(500).json({ error: 'Failed to sync resume' });
  }
});

// Load resume by sync code
app.get('/api/sync/load/:code', (req, res) => {
  try {
    const code = normalizeSyncCode(req.params.code);
    if (!code) {
      return res.status(400).json({ error: 'Invalid sync code' });
    }

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
    console.error('Failed to load resume:', error);
    res.status(500).json({ error: 'Failed to load resume' });
  }
});

// Create explicit secure cloud backup
app.post('/api/sync/backup', (req, res) => {
  try {
    const { syncCode, label, resumeData } = req.body ?? {};
    const code = normalizeSyncCode(syncCode);
    if (!code || !isResumeData(resumeData)) {
      return res.status(400).json({ error: 'A valid syncCode and resumeData are required' });
    }

    const backups = loadJson<CloudBackupRecord[]>(BACKUPS_FILE, []);
    const backupId = 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const now = new Date().toISOString();

    const newBackup: CloudBackupRecord = {
      id: backupId,
      syncCode: code,
      label:
        typeof label === 'string' && label.trim()
          ? label.trim().slice(0, 200)
          : `Snapshot ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
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
    console.error('Failed to create backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// List backups for a sync code
app.get('/api/sync/backups/:code', (req, res) => {
  try {
    const code = normalizeSyncCode(req.params.code);
    if (!code) {
      return res.status(400).json({ error: 'Invalid sync code' });
    }

    const backups = loadJson<CloudBackupRecord[]>(BACKUPS_FILE, []);
    const filtered = backups.filter(b => b.syncCode === code);

    res.json({
      success: true,
      backups: filtered,
    });
  } catch (error: any) {
    console.error('Failed to fetch backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// Delete a backup
app.delete('/api/sync/backup/:id', (req, res) => {
  try {
    const id = req.params.id?.toUpperCase();
    if (!id || !BACKUP_ID_PATTERN.test(id)) {
      return res.status(400).json({ error: 'Invalid backup id' });
    }

    let backups = loadJson<CloudBackupRecord[]>(BACKUPS_FILE, []);
    backups = backups.filter(b => b.id !== id);
    saveJson(BACKUPS_FILE, backups);
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error: any) {
    console.error('Failed to delete backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Unknown API routes must not fall through to the SPA shell.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
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
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (req, res, next) => {
      if (path.extname(req.path)) {
        return next();
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.use((req, res) => {
      res.status(404).send('Not found');
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
    console.error('Unhandled request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`CVForge server running at http://0.0.0.0:${port}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down gracefully.`);
    server.close((err) => {
      if (err) {
        console.error('Error closing HTTP server:', err);
        process.exit(1);
      }
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
