'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Folder, FolderOpen, File, ChevronRight, ChevronDown,
  Upload, Download, Trash2, RefreshCw, Plus, FilePlus,
  FolderPlus, MoreHorizontal
} from 'lucide-react';
import clsx from 'clsx';

interface FileEntry {
  path: string;
  name: string;
  isDir: boolean;
  depth: number;
}

interface FileExplorerProps {
  sessionId: string | null;
  className?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function FileExplorer({ sessionId, className }: FileExplorerProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/home/user']));
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const fetchTree = useCallback(async (path = '/home/user') => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/files/tree?sessionId=${sessionId}&path=${encodeURIComponent(path)}`
      );
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('File tree error:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      const t = setTimeout(() => fetchTree(), 2000); // wait for container to be ready
      return () => clearTimeout(t);
    }
  }, [sessionId, fetchTree]);

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleDownload = async (filePath: string) => {
    if (!sessionId) return;
    const url = `${BACKEND_URL}/api/files/download?sessionId=${sessionId}&path=${encodeURIComponent(filePath)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'file';
    a.click();
  };

  const handleUpload = async (file: File, targetPath = '/home/user') => {
    if (!sessionId) return;
    const formData = new FormData();
    formData.append('file', file);
    await fetch(
      `${BACKEND_URL}/api/files/upload?sessionId=${sessionId}&path=${encodeURIComponent(targetPath)}`,
      { method: 'POST', body: formData }
    );
    fetchTree();
  };

  // Drag and drop upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) await handleUpload(f);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await handleUpload(f);
    e.target.value = '';
  };

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Get icon for a file
  const getIcon = (entry: FileEntry, isExpanded: boolean) => {
    if (entry.isDir) {
      return isExpanded
        ? <FolderOpen size={13} className="text-kali-yellow shrink-0" />
        : <Folder size={13} className="text-kali-yellow shrink-0" />;
    }
    const ext = entry.name.split('.').pop()?.toLowerCase();
    const colorMap: Record<string, string> = {
      py: 'text-blue-400', js: 'text-yellow-400', ts: 'text-blue-300',
      sh: 'text-green-400', md: 'text-gray-400', txt: 'text-gray-400',
      json: 'text-orange-400', html: 'text-orange-300', css: 'text-blue-400',
      go: 'text-cyan-400', rs: 'text-orange-500', c: 'text-blue-500',
      cpp: 'text-blue-500', java: 'text-red-400', rb: 'text-red-500',
      php: 'text-purple-400',
    };
    return <File size={13} className={clsx('shrink-0', ext ? colorMap[ext] : 'text-kali-muted')} />;
  };

  return (
    <div
      ref={dropRef}
      className={clsx(
        'flex flex-col h-full overflow-hidden border-r border-kali-border bg-kali-surface',
        isDragOver && 'drop-zone-active',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-kali-border shrink-0">
        <span className="text-xs font-semibold text-kali-muted uppercase tracking-wider">Explorer</span>
        <div className="flex items-center gap-1">
          <label
            className="p-1 rounded hover:bg-white/5 cursor-pointer text-kali-muted hover:text-kali-text transition-colors"
            title="Upload file"
          >
            <Upload size={12} />
            <input type="file" className="hidden" multiple onChange={handleFileInput} />
          </label>
          <button
            onClick={() => fetchTree()}
            className="p-1 rounded hover:bg-white/5 text-kali-muted hover:text-kali-text transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Drag hint */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-kali-bg bg-opacity-80 pointer-events-none">
          <div className="text-center">
            <Upload size={32} className="mx-auto mb-2 text-kali-purple" />
            <p className="text-kali-purple text-sm font-mono">Drop to upload</p>
          </div>
        </div>
      )}

      {/* No session */}
      {!sessionId && (
        <div className="flex-1 flex items-center justify-center text-xs text-kali-muted text-center px-4">
          <div>
            <Folder size={24} className="mx-auto mb-2 opacity-30" />
            <p>Start a terminal session<br />to browse files</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {sessionId && loading && entries.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xs text-kali-muted font-mono animate-pulse">Loading files...</div>
        </div>
      )}

      {/* File tree */}
      {entries.length > 0 && (
        <div className="flex-1 overflow-y-auto py-1">
          {entries.map((entry) => {
            const isExpanded = expanded.has(entry.path);
            const indent = entry.depth * 12;
            return (
              <div
                key={entry.path}
                className={clsx(
                  'file-item flex items-center gap-1.5 px-2 py-0.5 cursor-pointer text-xs font-mono',
                  selected === entry.path ? 'selected' : 'text-kali-text'
                )}
                style={{ paddingLeft: `${8 + indent}px` }}
                onClick={() => {
                  setSelected(entry.path);
                  if (entry.isDir) toggleExpand(entry.path);
                }}
                onContextMenu={(e) => handleContextMenu(e, entry)}
              >
                {entry.isDir && (
                  <span className="text-kali-muted">
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  </span>
                )}
                {!entry.isDir && <span className="w-2.5" />}
                {getIcon(entry, isExpanded)}
                <span className="truncate">{entry.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu fixed z-50 min-w-[160px] py-1 text-xs"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {!contextMenu.entry.isDir && (
            <button
              className="context-menu-item flex items-center gap-2 w-full px-3 py-1.5 text-kali-text"
              onClick={() => { handleDownload(contextMenu.entry.path); setContextMenu(null); }}
            >
              <Download size={11} /> Download
            </button>
          )}
          <button
            className="context-menu-item flex items-center gap-2 w-full px-3 py-1.5 text-kali-red"
            onClick={() => setContextMenu(null)}
          >
            <Trash2 size={11} /> Delete (use rm in terminal)
          </button>
        </div>
      )}
    </div>
  );
}
