'use client';

import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { category: 'Terminal', items: [
    { keys: ['Ctrl', 'C'], desc: 'Interrupt process (SIGINT)' },
    { keys: ['Ctrl', 'D'], desc: 'End of file / Exit shell' },
    { keys: ['Ctrl', 'L'], desc: 'Clear terminal screen' },
    { keys: ['Ctrl', 'F'], desc: 'Find / Search in terminal' },
  ]},
  { category: 'Window Management', items: [
    { keys: ['Alt', 'N'], desc: 'New Terminal Tab' },
    { keys: ['Alt', 'W'], desc: 'Close Current Tab' },
    { keys: ['Alt', '1-9'], desc: 'Switch to Tab 1-9' },
    { keys: ['Ctrl', '\\'], desc: 'Split Pane Vertically' },
    { keys: ['Ctrl', '-'], desc: 'Split Pane Horizontally' },
    { keys: ['Ctrl', 'Arrow Keys'], desc: 'Navigate Split Panes' },
  ]},
  { category: 'General', items: [
    { keys: ['Ctrl', 'Shift', 'P'], desc: 'Open Command Palette' },
    { keys: ['?'], desc: 'Show this Help Modal' },
    { keys: ['Esc'], desc: 'Close Modal / Search' },
  ]},
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2 text-gray-200">
            <Keyboard size={20} className="text-[#58a6ff]" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-[#58a6ff] mb-4 uppercase tracking-wider">{section.category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((k, j) => (
                        <kbd key={j} className="px-2 py-1 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-gray-300 shadow-sm whitespace-nowrap">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-6 py-4 border-t border-[#30363d] bg-[#0d1117] text-xs text-gray-500 flex justify-between">
          <span>Shortcuts match standard Linux / VS Code conventions.</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
