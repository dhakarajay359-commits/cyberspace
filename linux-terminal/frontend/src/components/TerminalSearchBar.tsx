'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown, Type, Regex } from 'lucide-react';
import { clsx } from 'clsx';

interface TerminalSearchBarProps {
  onSearch: (term: string, options: { caseSensitive: boolean; regex: boolean }) => boolean;
  onSearchPrevious: (term: string, options: { caseSensitive: boolean; regex: boolean }) => boolean;
  onClose: () => void;
  isOpen: boolean;
}

export function TerminalSearchBar({ onSearch, onSearchPrevious, onClose, isOpen }: TerminalSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = () => {
    if (!searchTerm) return;
    onSearch(searchTerm, { caseSensitive: matchCase, regex: useRegex });
  };

  const handleSearchPrevious = () => {
    if (!searchTerm) return;
    onSearchPrevious(searchTerm, { caseSensitive: matchCase, regex: useRegex });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handleSearchPrevious();
      } else {
        handleSearch();
      }
    }
  };

  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    }
  }, [searchTerm, matchCase, useRegex]); // Trigger search on toggle

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-6 z-50 flex items-center bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center px-2 text-gray-400">
        <Search size={14} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in terminal..."
        className="w-48 bg-transparent text-sm text-gray-200 placeholder-gray-500 py-1.5 px-1 outline-none"
      />
      <div className="flex items-center gap-0.5 px-1 border-r border-[#30363d]">
        <button
          onClick={() => setMatchCase(!matchCase)}
          className={clsx(
            "p-1 rounded text-xs",
            matchCase ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          )}
          title="Match Case"
        >
          <Type size={14} />
        </button>
        <button
          onClick={() => setUseRegex(!useRegex)}
          className={clsx(
            "p-1 rounded text-xs mr-1",
            useRegex ? "bg-[#1f6feb]/20 text-[#58a6ff]" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          )}
          title="Use Regular Expression"
        >
          <Regex size={14} />
        </button>
      </div>
      <div className="flex items-center gap-0.5 px-1 border-r border-[#30363d]">
        <button
          onClick={handleSearchPrevious}
          className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-white/5"
          title="Previous Match (Shift+Enter)"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={handleSearch}
          className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-white/5 mr-1"
          title="Next Match (Enter)"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 mx-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-400/10"
        title="Close (Esc)"
      >
        <X size={16} />
      </button>
    </div>
  );
}
