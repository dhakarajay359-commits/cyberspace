'use client';

import { useState, useCallback } from 'react';
import { X, Plus, Terminal } from 'lucide-react';
import clsx from 'clsx';
import { ConnectionStatus } from '@/hooks/useTerminal';

export interface Tab {
  id: string;
  label: string;
  status: ConnectionStatus;
  isSplit?: boolean;
  splitDirection?: 'horizontal' | 'vertical';
  pane2Id?: string;
  pane2Status?: ConnectionStatus;
  activePaneIndex?: 1 | 2;
}

interface TerminalTabBarProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onStatusChange: (id: string, status: ConnectionStatus) => void;
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  connecting: 'bg-yellow-400',
  connected: 'bg-kali-green',
  disconnected: 'bg-kali-muted',
  error: 'bg-kali-red',
};

export default function TerminalTabBar({
  tabs, activeId, onSelect, onAdd, onClose, onStatusChange,
}: TerminalTabBarProps) {
  return (
    <div className="flex items-center h-9 bg-kali-surface border-b border-kali-border overflow-x-auto shrink-0 select-none">
      {/* Traffic lights */}
      <div className="flex items-center gap-1.5 px-3 shrink-0">
        <div className="w-3 h-3 rounded-full traffic-red opacity-80 hover:opacity-100 cursor-pointer transition-opacity" title="Close" />
        <div className="w-3 h-3 rounded-full traffic-yellow opacity-80 hover:opacity-100 cursor-pointer transition-opacity" title="Minimize" />
        <div className="w-3 h-3 rounded-full traffic-green opacity-80 hover:opacity-100 cursor-pointer transition-opacity" title="Fullscreen" />
      </div>

      <div className="w-px h-5 bg-kali-border mx-1 shrink-0" />

      {/* Tabs */}
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={clsx(
            'tab-btn flex items-center gap-2 px-3 h-full text-xs font-mono whitespace-nowrap shrink-0 group',
            tab.id === activeId ? 'active text-kali-text' : 'text-kali-muted'
          )}
        >
          {/* Status dots */}
          <div className="flex gap-[2px]">
            <div className={clsx('status-dot', STATUS_COLORS[tab.status])} />
            {tab.isSplit && tab.pane2Status && (
              <div className={clsx('status-dot', STATUS_COLORS[tab.pane2Status])} />
            )}
          </div>

          <Terminal size={10} className="opacity-60" />
          <span>{tab.label}</span>

          {tabs.length > 1 && (
            <div 
              className={clsx(
                "w-4 h-4 rounded flex items-center justify-center transition-colors ml-1",
                tab.id === activeId ? "hover:bg-white/10" : "hover:bg-white/5 opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
            >
              <X size={10} />
            </div>
          )}
        </button>
      ))}

      {/* Add tab */}
      <button
        onClick={onAdd}
        className="flex items-center justify-center w-7 h-7 mx-1 rounded text-kali-muted hover:text-kali-text hover:bg-white/5 transition-all shrink-0"
        title="New Terminal Tab"
      >
        <Plus size={13} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side info */}
      <div className="flex items-center gap-2 px-3 text-xs text-kali-muted font-mono shrink-0">
        <span className="text-kali-purple opacity-70">node-pty</span>
        <span className="text-kali-border">│</span>
        <span className="text-kali-cyan opacity-70">Docker</span>
      </div>
    </div>
  );
}
