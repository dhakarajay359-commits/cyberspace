import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { SessionManager } from './session';
import {
  copyFileToContainer,
  copyFileFromContainer,
  execInContainer,
} from './docker';

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

export function fileRouter(sessionManager: SessionManager): Router {
  const router = Router();

  const isValidPath = (p: string) => /^[a-zA-Z0-9_\-\.\/:\\ ]+$/.test(p);

  // ── GET /api/files/tree?sessionId=&path= ─────────────────────────────────────
  router.get('/tree', async (req: Request, res: Response) => {
    const { sessionId, path: dirPath = '/home/user' } = req.query as Record<string, string>;

    if (!isValidPath(dirPath)) {
      return res.status(400).json({ error: 'Invalid characters in path' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    try {
      let tree: string;
      if (session.container) {
        // Docker mode
        tree = await execInContainer(
          session.container.id,
          `find "${dirPath}" -maxdepth 3 -not -path "*/.*" 2>/dev/null | head -200`
        );
      } else {
        // Direct shell mode — read from host filesystem
        const { execSync } = require('child_process');
        const isWindows = process.platform === 'win32';
        if (isWindows) {
          tree = execSync(`dir /b /s "${dirPath}" 2>nul`).toString();
        } else {
          tree = execSync(`find "${dirPath}" -maxdepth 3 -not -path "*/.*" 2>/dev/null | head -200`).toString();
        }
      }

      const entries = parseFileTree(tree, dirPath as string);
      res.json({ entries });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/files/upload?sessionId=&path= ───────────────────────────────────
  router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    const { sessionId, path: uploadPath = '/home/user' } = req.query as Record<string, string>;

    if (!isValidPath(uploadPath)) {
      return res.status(400).json({ error: 'Invalid characters in path' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      const destPath = path.posix.join(uploadPath, req.file.originalname);

      if (session.container) {
        await copyFileToContainer(session.container.id, req.file.path, destPath);
        // Fix ownership
        await execInContainer(session.container.id, `chown user:user "${destPath}" 2>/dev/null || true`);
      }

      // Cleanup temp file
      fs.unlinkSync(req.file.path);

      res.json({ success: true, path: destPath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/files/download?sessionId=&path= ──────────────────────────────────
  router.get('/download', async (req: Request, res: Response) => {
    const { sessionId, path: filePath } = req.query as Record<string, string>;

    if (!filePath || !isValidPath(filePath)) {
      return res.status(400).json({ error: 'invalid or missing path' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const tmpFile = path.join(os.tmpdir(), `dl-${Date.now()}-${path.basename(filePath)}`);

    try {
      if (session.container) {
        await copyFileFromContainer(session.container.id, filePath, tmpFile);
      }

      const filename = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      const stream = fs.createReadStream(tmpFile);
      stream.pipe(res);
      stream.on('end', () => {
        try { fs.unlinkSync(tmpFile); } catch {}
      });
    } catch (err: any) {
      try { fs.unlinkSync(tmpFile); } catch {}
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ── Parse find output into a file tree ────────────────────────────────────────

interface FileEntry {
  path: string;
  name: string;
  isDir: boolean;
  depth: number;
}

function parseFileTree(findOutput: string, rootPath: string): FileEntry[] {
  const lines = findOutput.trim().split('\n').filter(Boolean);
  return lines.map((line) => {
    const trimmed = line.trim();
    const name = path.posix.basename(trimmed);
    const depth = trimmed.replace(rootPath, '').split('/').filter(Boolean).length;
    return {
      path: trimmed,
      name,
      isDir: !path.extname(name) && !name.includes('.'),
      depth,
    };
  });
}
