import { Server as SocketServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createContainer,
  destroyContainer,
  getExecCommand,
  ContainerInfo,
} from './docker';
import * as pty from 'node-pty';
import { KaliSimulator } from './kali-simulator';

const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT || '1800000', 10);

// ── Try to load Gemini (optional enhancement) ────────────────────────────────
let GoogleGenerativeAI: any = null;
try {
  const mod = require('@google/generative-ai');
  GoogleGenerativeAI = mod.GoogleGenerativeAI;
} catch {}

interface GeminiSession {
  id: string;
  socketId: string;
  chat: any | null;
  simulator: KaliSimulator;
  lastActivity: Date;
  createdAt: Date;
  cols: number;
  rows: number;
  inputBuffer: string;
  container: null;
  pty: null;
}

interface PtySession {
  id: string;
  socketId: string;
  pty: pty.IPty;
  container: ContainerInfo | null;
  lastActivity: Date;
  createdAt: Date;
  cols: number;
  rows: number;
  chat: null;
}

type TerminalSession = GeminiSession | PtySession;

export class SessionManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private io: SocketServer;
  private reaper: NodeJS.Timeout;
  private genAI: any = null;

  constructor(io: SocketServer) {
    this.io = io;

    const apiKey = process.env.GEMINI_API_KEY;
    if (GoogleGenerativeAI && apiKey && !apiKey.startsWith('AQ.') && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        console.log('[SessionManager] Gemini API initialized — AI-enhanced mode');
      } catch {
        console.warn('[SessionManager] Gemini init failed, using built-in simulator');
      }
    } else {
      console.log('[SessionManager] Using built-in Kali simulator (no valid API key)');
    }

    this.setupSocketHandlers();
    this.reaper = setInterval(() => this.reapIdleSessions(), 5 * 60 * 1000);
    console.log('[SessionManager] Started — idle session reaper active');
  }

  getSessionCount(): number { return this.sessions.size; }
  getSession(id: string): TerminalSession | undefined { return this.sessions.get(id); }
  getAllSessions(): TerminalSession[] { return Array.from(this.sessions.values()); }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      socket.on('terminal:create', async (opts: { cols?: number; rows?: number }) => {
        await this.createSession(socket, opts.cols || 120, opts.rows || 40);
      });

      socket.on('terminal:input', (data: { sessionId: string; data: string }) => {
        const session = this.sessions.get(data.sessionId);
        if (!session) return;
        session.lastActivity = new Date();
        if (session.pty) {
          session.pty.write(data.data);
        } else {
          this.handleInput(session as GeminiSession, socket, data.data);
        }
      });

      socket.on('terminal:resize', (data: { sessionId: string; cols: number; rows: number }) => {
        const session = this.sessions.get(data.sessionId);
        if (!session) return;
        session.cols = data.cols;
        session.rows = data.rows;
        if (session.pty) session.pty.resize(data.cols, data.rows);
      });

      socket.on('terminal:close', async (data: { sessionId: string }) => {
        await this.destroySession(data.sessionId);
      });

      socket.on('disconnect', async () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        const toDestroy: string[] = [];
        for (const [id, s] of this.sessions) {
          if (s.socketId === socket.id) toDestroy.push(id);
        }
        for (const id of toDestroy) await this.destroySession(id);
      });
    });
  }

  private handleInput(session: GeminiSession, socket: Socket, data: string) {
    for (const char of data) {
      const code = char.charCodeAt(0);

      if (char === '\r' || char === '\n') {
        socket.emit('terminal:output', { sessionId: session.id, data: '\r\n' });
        const cmd = session.inputBuffer.trim();
        session.inputBuffer = '';

        if (cmd === '') { this.emitPrompt(session, socket); return; }

        if (cmd === 'exit' || cmd === 'logout') {
          socket.emit('terminal:output', { sessionId: session.id, data: 'logout\r\n' });
          socket.emit('terminal:exit', { sessionId: session.id, exitCode: 0 });
          this.sessions.delete(session.id);
          return;
        }

        if (cmd === 'clear' || cmd === 'reset') {
          socket.emit('terminal:output', { sessionId: session.id, data: '\x1b[2J\x1b[H' });
          this.emitPrompt(session, socket);
          return;
        }

        this.runCommand(session, socket, cmd);

      } else if (code === 127 || code === 8) {
        if (session.inputBuffer.length > 0) {
          session.inputBuffer = session.inputBuffer.slice(0, -1);
          socket.emit('terminal:output', { sessionId: session.id, data: '\b \b' });
        }
      } else if (code === 3) {
        session.inputBuffer = '';
        socket.emit('terminal:output', { sessionId: session.id, data: '^C\r\n' });
        this.emitPrompt(session, socket);
      } else if (code === 12) {
        socket.emit('terminal:output', { sessionId: session.id, data: '\x1b[2J\x1b[H' });
        this.emitPrompt(session, socket);
      } else if (code >= 32) {
        session.inputBuffer += char;
        socket.emit('terminal:output', { sessionId: session.id, data: char });
      }
    }
  }

  private async runCommand(session: GeminiSession, socket: Socket, cmd: string) {
    // 1) Try built-in simulator first (always works, fast)
    const builtinResult = session.simulator.execute(cmd);
    
    if (builtinResult !== null) {
      if (builtinResult.length > 0) {
        const out = builtinResult.replace(/\r?\n/g, '\r\n');
        
        // Make apt, pip, nmap, and dynamic tool simulations take time by streaming output line-by-line
        if (cmd.startsWith('apt') || cmd.startsWith('pip') || cmd.startsWith('nmap') || cmd.startsWith('sqlmap') || !['ls', 'cat', 'echo', 'pwd', 'whoami', 'cd', 'clear'].includes(cmd.split(' ')[0])) {
            const lines = out.split('\r\n');
            let currentDelay = 0;
            
            lines.forEach((line, index) => {
                if (line.trim() !== '') {
                    setTimeout(() => {
                        socket.emit('terminal:output', { sessionId: session.id, data: line + '\r\n' });
                    }, currentDelay);
                    // Add random delay between 50ms and 300ms per line
                    currentDelay += Math.floor(Math.random() * 250) + 50;
                }
            });
            
            setTimeout(() => {
                this.emitPrompt(session, socket);
            }, currentDelay);
            return;
        } else {
            socket.emit('terminal:output', { sessionId: session.id, data: out + '\r\n' });
        }
      }
      this.emitPrompt(session, socket);
      return;
    }

    // 2) Fallback to Gemini for complex/unknown commands
    if (session.chat) {
      try {
        const result = await session.chat.sendMessage(cmd);
        let response = result.response.text();
        response = response.replace(/^```[a-zA-Z0-9-]*\n?/gm, '').replace(/```\s*$/gm, '').trimEnd();
        if (response.length > 0) {
          socket.emit('terminal:output', {
            sessionId: session.id,
            data: response.replace(/\r?\n/g, '\r\n') + '\r\n',
          });
        }
      } catch (err: any) {
        // Gemini failed - use simulator fallback
        const fallback = session.simulator.unknownCommand(cmd);
        socket.emit('terminal:output', { sessionId: session.id, data: fallback + '\r\n' });
      }
    } else {
      // No Gemini - use built-in unknown command response
      const fallback = session.simulator.unknownCommand(cmd);
      socket.emit('terminal:output', { sessionId: session.id, data: fallback + '\r\n' });
    }

    this.emitPrompt(session, socket);
  }

  private emitPrompt(session: GeminiSession, socket: Socket) {
    const dir = session.simulator.getCwd() === '/root' ? '~' : session.simulator.getCwd();
    const prompt = `\x1b[38;5;82mroot\x1b[0m@\x1b[38;5;141mkali\x1b[0m:\x1b[38;5;81m${dir}\x1b[0m# `;
    socket.emit('terminal:output', { sessionId: session.id, data: prompt });
  }

  async createSession(socket: Socket, cols: number, rows: number): Promise<string> {
    const sessionId = uuidv4();
    if (process.env.USE_DOCKER !== 'false') {
      return this.createDockerSession(socket, sessionId, cols, rows);
    }
    return this.createGeminiSession(socket, sessionId, cols, rows);
  }

  private async createDockerSession(socket: Socket, sessionId: string, cols: number, rows: number): Promise<string> {
    socket.emit('terminal:creating', { sessionId, message: 'Starting container...' });
    let container: ContainerInfo | null = null;
    try {
      container = await createContainer(sessionId);
      const { file, args } = getExecCommand(container.id);
      const ptyProcess = pty.spawn(file, args, {
        name: 'xterm-256color', cols, rows, cwd: process.cwd(),
        env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' } as Record<string, string>,
      });
      const session: PtySession = {
        id: sessionId, socketId: socket.id, pty: ptyProcess, container,
        lastActivity: new Date(), createdAt: new Date(), cols, rows, chat: null,
      };
      this.sessions.set(sessionId, session);
      ptyProcess.onData((data: string) => { session.lastActivity = new Date(); socket.emit('terminal:output', { sessionId, data }); });
      ptyProcess.onExit(async ({ exitCode, signal }) => { socket.emit('terminal:exit', { sessionId, exitCode, signal }); await this.destroySession(sessionId); });
      socket.emit('terminal:ready', { sessionId, container: { id: container.id.substring(0, 12), name: container.name } });
      return sessionId;
    } catch (err: any) {
      socket.emit('terminal:error', { sessionId, message: `Failed to start terminal: ${err.message}` });
      if (container) await destroyContainer(container.id);
      throw err;
    }
  }

  private async createGeminiSession(socket: Socket, sessionId: string, cols: number, rows: number): Promise<string> {
    socket.emit('terminal:creating', { sessionId, message: 'Initializing Kali Linux environment...' });

    const simulator = new KaliSimulator();
    let chat = null;

    if (this.genAI) {
      try {
        const KALI_SYSTEM_PROMPT = `You are a live, interactive Kali Linux 2024 terminal. You ARE bash running as root.
Output ONLY raw terminal text. NO markdown, NO backticks, NO explanations.
Maintain session state. Handle pipes, redirects, chaining naturally.
For tools: nmap, sqlmap, metasploit, hydra, etc. generate realistic authentic output.
NEVER print the shell prompt. Keep output concise and realistic.`;
        const model = this.genAI.getGenerativeModel({
          model: 'models/gemini-2.0-flash',
          systemInstruction: KALI_SYSTEM_PROMPT,
          generationConfig: { maxOutputTokens: 2048, temperature: 0.05 },
        });
        chat = model.startChat({ history: [] });
        console.log(`[Session] Gemini chat created for ${sessionId}`);
      } catch (e) {
        console.error('[Session] Gemini chat creation failed:', e);
      }
    }

    const session: GeminiSession = {
      id: sessionId, socketId: socket.id,
      chat, simulator,
      lastActivity: new Date(), createdAt: new Date(),
      cols, rows, inputBuffer: '', container: null, pty: null,
    };
    this.sessions.set(sessionId, session);
    socket.emit('terminal:ready', { sessionId, container: null });
    
    // Print MOTD
    const motd = simulator.getMotd();
    socket.emit('terminal:output', { sessionId, data: motd });
    this.emitPrompt(session, socket);
    return sessionId;
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.delete(sessionId);
    if (session.pty) { try { session.pty.kill(); } catch {} }
    if (session.container) { await destroyContainer(session.container.id); }
    console.log(`[Session] Destroyed: ${sessionId}`);
  }

  async destroyAll(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    for (const id of ids) await this.destroySession(id);
    clearInterval(this.reaper);
  }

  private async reapIdleSessions(): Promise<void> {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > SESSION_TIMEOUT_MS) {
        await this.destroySession(id);
      }
    }
  }
}
