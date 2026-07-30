'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTerminal, ConnectionStatus } from '@/hooks/useTerminal';
import clsx from 'clsx';
import { TerminalSearchBar } from './TerminalSearchBar';

interface TerminalPaneProps {
  tabId: string;
  isVisible: boolean;
  isFocused: boolean;
  onStatusChange?: (status: ConnectionStatus) => void;
  onClick?: () => void;
}

export default function TerminalPane({ tabId, isVisible, isFocused, onStatusChange, onClick }: TerminalPaneProps) {
  const { terminalRef, status, container, fit, focus, search, searchPrevious, setTheme } = useTerminal(tabId);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Re-fit when panel becomes visible or focused
  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => {
        fit();
        if (isFocused) focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isVisible, isFocused, fit, focus]);

  // Search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocused) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Theme change listener
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setTheme(customEvent.detail);
    };
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, [setTheme]);

  const handleSearch = useCallback((term: string, options: { caseSensitive: boolean; regex: boolean }) => {
    return search(term, options) ?? false;
  }, [search]);

  const handleSearchPrevious = useCallback((term: string, options: { caseSensitive: boolean; regex: boolean }) => {
    return searchPrevious(term, options) ?? false;
  }, [searchPrevious]);

  return (
    <div
      className={clsx(
        'w-full h-full flex flex-col relative border-2 transition-colors',
        !isVisible ? 'hidden' : 'flex',
        isFocused ? 'border-[#58a6ff]' : 'border-transparent'
      )}
      onClick={(e) => {
        onClick?.();
        if (!isSearchOpen) focus();
      }}
    >
      <TerminalSearchBar
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          focus();
        }}
        onSearch={handleSearch}
        onSearchPrevious={handleSearchPrevious}
      />

      {/* Container info bar */}
      {container && (
        <div className={clsx(
          "flex items-center gap-2 px-3 py-1 border-b bg-kali-surface text-xs font-mono shrink-0 transition-colors",
          isFocused ? "border-[#58a6ff]/50 text-gray-200" : "border-kali-border text-kali-muted"
        )}>
          <span className="text-kali-purple">🐳</span>
          <span>{container.name}</span>
          <span className="text-kali-border">│</span>
          <span>{container.id}</span>
        </div>
      )}

      {/* Status overlay when not connected */}
      {status === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-kali-bg bg-opacity-80 pointer-events-none">
          <div className="text-center animate-fade-in">
            <div className="text-kali-purple text-4xl mb-4">⚙</div>
            <div className="text-kali-cyan text-sm font-mono">Initializing sandbox container...</div>
            <div className="mt-2 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-kali-purple"
                  style={{ animation: `pulse 1.2s ${i * 0.4}s ease-in-out infinite` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* The actual xterm.js mount point */}
      <div
        ref={terminalRef}
        className="flex-1 w-full overflow-hidden"
        style={{ minHeight: 0 }}
      />
    </div>
  );
}
