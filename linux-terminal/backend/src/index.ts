import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketServer } from 'socket.io';
import { createRateLimiter } from './ratelimit';
import { fileRouter } from './filemanager';
import { SessionManager } from './session';

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Security middleware ──────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(createRateLimiter());

// ── Socket.io ─────────────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ── Session manager ───────────────────────────────────────────────
const sessionManager = new SessionManager(io);

// ── REST API ──────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessionManager.getSessionCount(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/files', fileRouter(sessionManager));

// ── Start server ──────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Linux Terminal Backend running on http://0.0.0.0:${PORT}`);
  console.log(`   Frontend expected at: ${FRONTEND_URL}`);
  console.log(`   Docker mode: ${process.env.USE_DOCKER === 'true' ? 'enabled' : 'disabled (direct shell)'}`);
  console.log(`   Press Ctrl+C to stop\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  sessionManager.destroyAll();
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('\nSIGINT received — shutting down');
  sessionManager.destroyAll();
  process.exit(0);
});
