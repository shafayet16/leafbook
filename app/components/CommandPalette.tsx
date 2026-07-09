//CommandPalette.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNewNote: () => void;
  deleteNote: (id: string, e: React.MouseEvent | React.KeyboardEvent) => void;
}

type ResultItem = {
  key: string;
  type: 'action' | 'note';
  label: string;
  sublabel: string;
  danger?: boolean;
  onRun: () => void;
};

// Height of the thin command bar only. The results dropdown floats below it
// independently and does not affect this value or the main window's layout.
export const PALETTE_HEIGHT_VH = 7;

export default function CommandPalette({
  isOpen,
  onClose,
  notes,
  activeNoteId,
  setActiveNoteId,
  createNewNote,
  deleteNote,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCommandMode = query.startsWith('>');
  const commandQuery = isCommandMode ? query.slice(1).trim().toLowerCase() : '';
  const searchQuery = query.toLowerCase();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  const actions: ResultItem[] = [
    {
      key: 'action-new',
      type: 'action',
      label: 'New Entry',
      sublabel: 'Initialize a fresh record',
      onRun: () => { createNewNote(); onClose(); },
    },
    {
      key: 'action-delete',
      type: 'action',
      label: 'Delete Active Entry',
      sublabel: activeNote ? (activeNote.title || 'Untitled Entry') : 'No active entry',
      danger: true,
      onRun: () => {
        if (activeNote) deleteNote(activeNote.id, {} as React.KeyboardEvent);
        onClose();
      },
    },
    {
      key: 'action-signout',
      type: 'action',
      label: 'Terminate Session',
      sublabel: 'Sign out of Leafbook',
      danger: true,
      onRun: () => { supabase.auth.signOut(); onClose(); },
    },
  ];

  const noteResults: ResultItem[] = notes
    .filter((n) => {
      if (isCommandMode) return false;
      if (searchQuery.trim() === '') return true;
      return n.title.toLowerCase().includes(searchQuery) || n.content.toLowerCase().includes(searchQuery);
    })
    .map((n) => ({
      key: `note-${n.id}`,
      type: 'note' as const,
      label: n.title.trim() === '' ? 'Untitled Entry' : n.title,
      sublabel: n.content.trim() === '' ? 'Empty stream data...' : n.content.slice(0, 60),
      onRun: () => { setActiveNoteId(n.id); onClose(); },
    }));

  const actionResults: ResultItem[] = isCommandMode
    ? actions.filter((a) => a.label.toLowerCase().includes(commandQuery))
    : [];

  const results: ResultItem[] = isCommandMode ? actionResults : noteResults;
  const showDropdown = isOpen && (query.trim() !== '' || noteResults.length > 0 || isCommandMode);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) results[selectedIndex].onRun();
    }
  };

  return (
    <>
      <style>{`
        @keyframes glow-breathe {
          0%, 100% { box-shadow: 0 10px 40px rgba(16,185,129,0.10); }
          50% { box-shadow: 0 10px 40px rgba(16,185,129,0.22); }
        }
        @keyframes scan-line-down {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(${PALETTE_HEIGHT_VH}vh); opacity: 0; }
        }
        .palette-glow { animation: glow-breathe 3.2s ease-in-out infinite; }
        .scan-line-down { animation: scan-line-down 0.55s ease-out; }
      `}</style>

      {/* Thin command bar — slides down from the top edge */}
      <div
        className="fixed top-0 left-0 w-screen z-50 overflow-hidden"
        style={{
          height: `${PALETTE_HEIGHT_VH}vh`,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div
          className="palette-glow relative w-full h-full border-b border-emerald-400/20 flex items-center backdrop-blur-xl px-3 sm:px-6 gap-2 sm:gap-3"
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
            background: 'linear-gradient(180deg, rgba(5,16,13,0.85) 0%, rgba(4,12,17,0.78) 100%)',
          }}
        >
          {isOpen && (
            <div className="absolute inset-x-0 top-0 h-px bg-cyan-300/70 pointer-events-none scan-line-down z-20" />
          )}

          <span className={`text-sm font-mono ${isCommandMode ? 'text-[#7CEA9C]' : 'text-zinc-500'}`}>
            {isCommandMode ? '❯' : '⌕'}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCommandMode ? 'run a command' : 'search entries — type > for commands'}
            className="w-full bg-transparent text-[13px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none tracking-wide"
          />
          <span className="w-1 h-3.5 bg-cyan-300/60 animate-pulse shrink-0" />
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest border border-white/10 rounded-sm px-1.5 py-0.5 shrink-0">
            esc
          </span>
        </div>
      </div>

      {/* Floating results dropdown — hovers over the sidebar/editor, independent height */}
      <div
        className="fixed left-0 w-screen z-40 flex justify-center px-3 sm:px-8"
        style={{
          top: `${PALETTE_HEIGHT_VH}vh`,
          pointerEvents: showDropdown && isOpen ? 'auto' : 'none',
          opacity: showDropdown && isOpen ? 1 : 0,
          transform: showDropdown && isOpen ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.99)',
          transformOrigin: 'top center',
          transition: 'opacity 180ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          className="w-full max-w-xl mt-2 rounded-md border border-white/10 backdrop-blur-xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(6,16,14,0.92) 0%, rgba(4,12,17,0.9) 100%)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 30px rgba(16,185,129,0.08)',
          }}
        >
          <div className="max-h-[46vh] overflow-y-auto py-1.5">
            {results.length === 0 && (
              <div className="px-4 py-6 text-center text-[11px] font-mono text-zinc-600 uppercase tracking-wider">
                {isCommandMode ? 'unknown command' : 'no matches'}
              </div>
            )}

            {results.map((item, i) => (
              <div
                key={item.key}
                onClick={item.onRun}
                onMouseEnter={() => setSelectedIndex(i)}
                className="relative px-4 py-2 cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div
                  className="absolute left-0 top-0.5 bottom-0.5 w-[2px] rounded-full transition-colors duration-150"
                  style={{
                    backgroundColor: i === selectedIndex
                      ? (item.danger ? 'rgba(248,113,113,0.7)' : 'rgba(124,234,156,0.7)')
                      : 'transparent',
                  }}
                />
                <div
                  className="absolute inset-0 transition-colors duration-150"
                  style={{
                    backgroundColor: i === selectedIndex
                      ? (item.danger ? 'rgba(127,29,29,0.15)' : 'rgba(16,185,129,0.08)')
                      : 'transparent',
                  }}
                />
                <div className="relative min-w-0">
                  <div className={`text-[13px] font-medium truncate ${item.danger ? 'text-red-300/90' : 'text-zinc-200'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10.5px] font-mono text-zinc-500 truncate mt-0.5">
                    {item.sublabel}
                  </div>
                </div>
                <span className={`relative shrink-0 text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                  item.type === 'action'
                    ? 'text-emerald-400/70'
                    : 'text-cyan-400/60'
                }`}>
                  {item.type === 'action' ? 'cmd' : 'note'}
                </span>
              </div>
            ))}
          </div>

          <div className="px-4 py-1.5 border-t border-white/[0.06] flex items-center justify-center gap-5 text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>&gt; commands</span>
          </div>
        </div>
      </div>
    </>
  );
}