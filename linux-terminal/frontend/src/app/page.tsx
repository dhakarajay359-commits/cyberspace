'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import TerminalTabBar, { Tab } from '@/components/TerminalTabBar';
import FileExplorer from '@/components/FileExplorer';
import StatusBar from '@/components/StatusBar';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { ThemesPanel } from '@/components/ThemesPanel';
import { SplitPane } from '@/components/SplitPane';
import { ConnectionStatus } from '@/hooks/useTerminal';
import {
  PanelLeftClose, PanelLeft, Maximize2, Minimize2,
  SplitSquareHorizontal, Settings, Zap, Palette
} from 'lucide-react';
import clsx from 'clsx';

// Dynamic import — xterm.js is browser-only
const TerminalPane = dynamic(() => import('@/components/TerminalPane'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-kali-bg">
      <div className="text-kali-muted text-sm font-mono animate-pulse">
        Loading terminal engine...
      </div>
    </div>
  ),
});

function createTab(index: number): Tab {
  return { id: uuidv4(), label: `Terminal ${index}`, status: 'connecting' };
}

export default function HomePage() {
  const [tabs, setTabs] = useState<Tab[]>([createTab(1)]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [sessionIds, setSessionIds] = useState<Record<string, string | null>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isDragging = useRef(false);
  const dragStart = useRef(0);

  // Set initial active tab once on mount
  useEffect(() => {
    if (tabs.length > 0 && !activeTabId) {
      setActiveTabId(tabs[0].id);
    }
  }, []);

  const handleAddTab = useCallback(() => {
    const newTab = createTab(tabs.length + 1);
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs.length]);

  const handleCloseTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTabId === id && next.length > 0) {
        setActiveTabId(next[next.length - 1].id);
      }
      return next;
    });
  }, [activeTabId]);

  const handleStatusChange = useCallback((tabId: string, status: ConnectionStatus, paneIndex: 1 | 2 = 1) => {
    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        if (paneIndex === 1) return { ...t, status };
        if (paneIndex === 2) return { ...t, pane2Status: status };
      }
      return t;
    }));
  }, []);

  const handleSessionIdChange = useCallback((tabId: string, sessionId: string | null) => {
    setSessionIds(prev => ({ ...prev, [tabId]: sessionId }));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ── Sidebar drag resize ─────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = e.clientX - sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.max(160, Math.min(480, e.clientX - dragStart.current));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isThemesOpen, setIsThemesOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '\\' || e.key === '-')) {
        // Split pane
        e.preventDefault();
        const direction = e.key === '\\' ? 'horizontal' : 'vertical';
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabId && !t.isSplit) {
            return {
              ...t,
              isSplit: true,
              splitDirection: direction,
              pane2Id: uuidv4(),
              pane2Status: 'connecting',
              activePaneIndex: 2, // Focus new pane
            };
          }
          return t;
        }));
      } else if ((e.ctrlKey || e.metaKey) && e.key.startsWith('Arrow')) {
        // Switch pane focus
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabId && t.isSplit) {
            return {
              ...t,
              activePaneIndex: t.activePaneIndex === 1 ? 2 : 1
            };
          }
          return t;
        }));
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTabId]);

  const activeSession = sessionIds[activeTabId] ?? null;

  return (
    <div className="flex flex-col h-screen bg-kali-bg overflow-hidden relative">
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      
      <ThemesPanel 
        isOpen={isThemesOpen} 
        onClose={() => setIsThemesOpen(false)} 
        onSelectTheme={(themeId) => {
          // Broadcast theme change to all TerminalPanes
          window.dispatchEvent(new CustomEvent('themeChange', { detail: themeId }));
        }} 
      />

      {/* ── Top Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center h-10 px-4 bg-kali-surface border-b border-kali-border shrink-0 select-none z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <Zap size={16} className="text-kali-purple" />
          <span className="text-sm font-bold text-kali-text tracking-tight">
            Kali<span className="text-kali-purple">Terminal</span>
          </span>
        </div>

        <div className="w-px h-5 bg-kali-border mx-2" />

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(s => !s)}
          className="flex items-center justify-center w-7 h-7 rounded text-kali-muted hover:text-kali-text hover:bg-white/5 transition-all"
          title={sidebarOpen ? 'Hide Explorer' : 'Show Explorer'}
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
        </button>

        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsThemesOpen(true)}
            className="flex items-center justify-center w-7 h-7 rounded text-kali-muted hover:text-kali-text hover:bg-white/5 transition-all"
            title="Themes"
          >
            <Palette size={14} />
          </button>
          
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="flex items-center justify-center w-7 h-7 rounded text-kali-muted hover:text-kali-text hover:bg-white/5 transition-all"
            title="Keyboard Shortcuts (? or Ctrl+/)"
          >
            <span className="font-bold text-[10px] bg-kali-border px-1 rounded">?</span>
          </button>
          
          <div className="w-px h-4 bg-kali-border mx-1" />

          <button
            onClick={handleAddTab}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-kali-muted hover:text-kali-green hover:bg-white/5 transition-all font-mono border border-transparent hover:border-kali-green/30"
            title="New Terminal"
          >
            <span className="text-kali-green">+</span> New Terminal
          </button>

          <div className="w-px h-4 bg-kali-border mx-1" />

          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-7 h-7 rounded text-kali-muted hover:text-kali-text hover:bg-white/5 transition-all"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <div style={{ width: sidebarWidth }} className="shrink-0 overflow-hidden animate-slide-in">
              <FileExplorer sessionId={activeSession} className="h-full" />
            </div>

            {/* Drag handle */}
            <div
              className="resize-handle w-1 bg-kali-border hover:bg-kali-purple/40 cursor-col-resize shrink-0"
              onMouseDown={handleMouseDown}
            />
          </>
        )}

        {/* Terminal area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tab bar */}
          <TerminalTabBar
            tabs={tabs}
            activeId={activeTabId}
            onSelect={setActiveTabId}
            onAdd={handleAddTab}
            onClose={handleCloseTab}
            onStatusChange={handleStatusChange}
          />

          {/* Terminal panes */}
          <div className="flex-1 relative overflow-hidden bg-kali-bg">
            {tabs.map((tab) => (
              <div key={tab.id} className={clsx('w-full h-full', tab.id !== activeTabId && 'hidden')}>
                {tab.isSplit ? (
                  <SplitPane direction={tab.splitDirection}>
                    <TerminalPane
                      tabId={tab.id}
                      isVisible={tab.id === activeTabId}
                      isFocused={tab.id === activeTabId && tab.activePaneIndex !== 2}
                      onStatusChange={(s) => handleStatusChange(tab.id, s, 1)}
                      onClick={() => {
                        setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, activePaneIndex: 1 } : t));
                      }}
                    />
                    <TerminalPane
                      tabId={tab.pane2Id!}
                      isVisible={tab.id === activeTabId}
                      isFocused={tab.id === activeTabId && tab.activePaneIndex === 2}
                      onStatusChange={(s) => handleStatusChange(tab.id, s, 2)}
                      onClick={() => {
                        setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, activePaneIndex: 2 } : t));
                      }}
                    />
                  </SplitPane>
                ) : (
                  <TerminalPane
                    tabId={tab.id}
                    isVisible={tab.id === activeTabId}
                    isFocused={tab.id === activeTabId}
                    onStatusChange={(s) => handleStatusChange(tab.id, s, 1)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Bar ────────────────────────────────────────────────── */}
      <StatusBar />
    </div>
  );
}
