'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { getThemeById } from '@/lib/themes';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface TerminalSession {
  id: string;
  sessionId: string | null;
  status: ConnectionStatus;
  container: { id: string; name: string } | null;
}

export function useTerminal(tabId: string) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const searchAddonRef = useRef<any>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [container, setContainer] = useState<{ id: string; name: string } | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isInitialized = useRef(false);

  const initTerminal = useCallback(async () => {
    if (isInitialized.current || !terminalRef.current) return;
    isInitialized.current = true;

    // Dynamically import xterm.js (browser-only)
    const { Terminal } = await import('@xterm/xterm');
    const { FitAddon } = await import('@xterm/addon-fit');
    const { WebLinksAddon } = await import('@xterm/addon-web-links');
    const { SearchAddon } = await import('@xterm/addon-search');
    let WebglAddon: any = null;
    try {
      const WebglModule = await import('@xterm/addon-webgl');
      WebglAddon = WebglModule.WebglAddon;
    } catch (e) {
      console.warn('WebGL addon could not be loaded, falling back to canvas', e);
    }

    // Read theme from localStorage or fallback to default
    const savedThemeId = typeof window !== 'undefined' ? localStorage.getItem('terminal-theme') : null;
    const initialTheme = getThemeById(savedThemeId || 'kali-dark');

    // Create terminal instance
    const term = new Terminal({
      theme: initialTheme.theme,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 14,
      fontWeight: '400',
      fontWeightBold: '700',
      lineHeight: 1.4,
      letterSpacing: 0.5,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
      smoothScrollDuration: 100,
      overviewRulerWidth: 10,
      rows: 40,
      cols: 120,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    term.open(terminalRef.current);
    
    if (WebglAddon) {
      try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => {
          webglAddon.dispose();
        });
        term.loadAddon(webglAddon);
        console.log('WebGL Addon loaded successfully');
      } catch (e) {
        console.warn('WebGL addon failed to initialize', e);
      }
    }

    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // ── Write welcome banner ──────────────────────────────────────────
    term.writeln('\x1b[38;5;141m╔══════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[38;5;141m║\x1b[0m  \x1b[38;5;82m🐉 KALI LINUX TERMINAL\x1b[0m  \x1b[38;5;67m│\x1b[0m  \x1b[38;5;39mDocker Isolated Sandbox\x1b[0m        \x1b[38;5;141m║\x1b[0m');
    term.writeln('\x1b[38;5;141m╚══════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('\x1b[38;5;67m  Connecting to backend...\x1b[0m');

    const socket = getSocket();
    setStatus('connecting');

    // ── Socket events ─────────────────────────────────────────────────

    socket.on('connect', () => {
      if (!sessionIdRef.current) {
        const { cols, rows } = fitAddon.proposeDimensions() ?? { cols: 120, rows: 40 };
        socket.emit('terminal:create', { cols, rows });
      }
      setStatus('connecting');
    });

    // ── Key input → backend ───────────────────────────────────────────
    const handleData = (data: string) => {
      if (sessionIdRef.current) {
        socket.emit('terminal:input', {
          sessionId: sessionIdRef.current,
          data,
        });
      }
    };
    
    const dataDisposable = term.onData(handleData);

    const onCreating = ({ message }: { sessionId: string; message: string }) => {
      term.writeln(`\x1b[38;5;220m  ⏳ ${message}\x1b[0m`);
    };

    const onReady = (data: { sessionId: string; container: { id: string; name: string } | null }) => {
      sessionIdRef.current = data.sessionId;
      setSessionId(data.sessionId);
      setContainer(data.container);
      setStatus('connected');
      term.writeln(`\x1b[38;5;82m  ✓ Connected — Session: ${data.sessionId.substring(0, 8)}\x1b[0m`);
      if (data.container) {
        term.writeln(`\x1b[38;5;67m  Container: ${data.container.name} (${data.container.id})\x1b[0m`);
      }
      term.writeln('');
      term.focus();
    };

    const onOutput = (data: { sessionId: string; data: string }) => {
      if (data.sessionId === sessionIdRef.current) {
        term.write(data.data);
      }
    };

    const onExit = (data: { sessionId: string; exitCode: number }) => {
      if (data.sessionId === sessionIdRef.current) {
        term.writeln(`\x1b[38;5;196m\r\n  [Process exited with code ${data.exitCode}]\x1b[0m`);
        setStatus('disconnected');
      }
    };

    const onError = (data: { message: string }) => {
      term.writeln(`\x1b[38;5;196m  [ERROR] ${data.message}\x1b[0m`);
      setStatus('error');
    };

    const onDisconnect = () => {
      setStatus('disconnected');
      term.writeln('\r\n\x1b[38;5;196m  [Disconnected from backend]\x1b[0m');
    };

    socket.on('terminal:creating', onCreating);
    socket.on('terminal:ready', onReady);
    socket.on('terminal:output', onOutput);
    socket.on('terminal:exit', onExit);
    socket.on('terminal:error', onError);
    socket.on('disconnect', onDisconnect);

    // ── Initial connection ────────────────────────────────────────────
    if (socket.connected) {
      const { cols, rows } = fitAddon.proposeDimensions() ?? { cols: 120, rows: 40 };
      socket.emit('terminal:create', { cols, rows });
    }

    // ── Window resize ─────────────────────────────────────────────────
    const handleResize = () => {
      fitAddon.fit();
      if (sessionIdRef.current) {
        socket.emit('terminal:resize', {
          sessionId: sessionIdRef.current,
          cols: term.cols,
          rows: term.rows,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Store cleanup on the terminal instance itself so it can be called later
    (term as any)._cleanupEvents = () => {
      window.removeEventListener('resize', handleResize);
      socket.off('terminal:creating', onCreating);
      socket.off('terminal:ready', onReady);
      socket.off('terminal:output', onOutput);
      socket.off('terminal:exit', onExit);
      socket.off('terminal:error', onError);
      socket.off('disconnect', onDisconnect);
      dataDisposable.dispose();
    };
  }, [tabId]);

  useEffect(() => {
    initTerminal();

    return () => {
      if (sessionIdRef.current) {
        const socket = getSocket();
        socket.emit('terminal:close', { sessionId: sessionIdRef.current });
      }
      if (xtermRef.current) {
        if (typeof (xtermRef.current as any)._cleanupEvents === 'function') {
          (xtermRef.current as any)._cleanupEvents();
        }
        xtermRef.current.dispose();
      }
      isInitialized.current = false;
    };
  }, [initTerminal]);

  const fit = useCallback(() => {
    fitAddonRef.current?.fit();
  }, []);

  const focus = useCallback(() => {
    xtermRef.current?.focus();
  }, []);

  const clear = useCallback(() => {
    xtermRef.current?.clear();
  }, []);

  const writeText = useCallback((text: string) => {
    xtermRef.current?.write(text);
  }, []);

  const search = useCallback((term: string, searchOptions?: any) => {
    return searchAddonRef.current?.findNext(term, searchOptions);
  }, []);
  
  const searchPrevious = useCallback((term: string, searchOptions?: any) => {
    return searchAddonRef.current?.findPrevious(term, searchOptions);
  }, []);

  const setTheme = useCallback((themeId: string) => {
    if (xtermRef.current) {
      const newTheme = getThemeById(themeId);
      xtermRef.current.options.theme = newTheme.theme;
      if (typeof window !== 'undefined') {
        localStorage.setItem('terminal-theme', themeId);
      }
      // Re-render WebGL if active
      if (fitAddonRef.current) {
        // slight delay to ensure xterm.js applies theme before we resize (which triggers webgl redraw)
        setTimeout(() => fitAddonRef.current?.fit(), 10);
      }
    }
  }, []);

  return {
    terminalRef,
    status,
    sessionId,
    container,
    fit,
    focus,
    clear,
    writeText,
    search,
    searchPrevious,
    setTheme,
  };
}
