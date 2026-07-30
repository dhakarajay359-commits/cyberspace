'use client';

import React, { useEffect, useState } from 'react';
import { X, Palette } from 'lucide-react';
import { THEMES } from '@/lib/themes';
import clsx from 'clsx';

interface ThemesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (themeId: string) => void;
}

export function ThemesPanel({ isOpen, onClose, onSelectTheme }: ThemesPanelProps) {
  const [activeThemeId, setActiveThemeId] = useState<string>('kali-dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('terminal-theme');
      if (saved) setActiveThemeId(saved);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (id: string) => {
    setActiveThemeId(id);
    onSelectTheme(id);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-12 right-4 z-40 w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#0d1117]">
        <div className="flex items-center gap-2 text-gray-200">
          <Palette size={16} className="text-[#58a6ff]" />
          <h3 className="text-sm font-semibold">Color Themes</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors">
          <X size={16} />
        </button>
      </div>
      
      <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleSelect(theme.id)}
            className={clsx(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors",
              activeThemeId === theme.id
                ? "bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/50"
                : "text-gray-300 hover:bg-white/5 border border-transparent"
            )}
          >
            <span className="font-medium">{theme.name}</span>
            <div className="flex gap-1">
              {/* Preview dots */}
              <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: theme.theme.background }} title="Background" />
              <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: theme.theme.foreground }} title="Foreground" />
              <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: theme.theme.green }} title="Green" />
              <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: theme.theme.blue }} title="Blue" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
