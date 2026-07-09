'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  folder_id: string | null;
  tags: string[];
}

interface Folder {
  id: string;
  name: string;
}

interface SidebarProps {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNewNote: () => void;
  deleteNote: (id: string, e: React.MouseEvent) => void;
  paddedCount: string;
  activeFolderId: string | null | 'all';
  setActiveFolderId: (id: string | null | 'all') => void;
  createFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

// Updated to accept any SVG props, including style
function LeafIcon({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} {...rest}>
      <path
        d="M3 13C3 13 2.5 7 6.5 4C9.5 1.8 13 2.5 13 2.5C13 2.5 13.5 6.5 11 9.5C8.5 12.5 3 13 3 13Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M3.5 12.5L9 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function BranchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 14L13.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.5 9.5L10 6.8" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M6.5 9.5L9.2 10.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M9.5 6.5L12 7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9.5 6.5L11.8 4.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4 12L6 12.8" stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      className={`${className} transition-transform duration-200 ${open ? 'rotate-90' : 'rotate-0'}`}
    >
      <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- GRADUAL LEAF WILTING (based on elapsed seconds) ----------
function getLeafStage(secondsPassed: number): { color: string; filter?: string } {
  if (secondsPassed < 60) {
    return { color: '#7CEA9C' };                           // fresh green
  } else if (secondsPassed < 3600) {
    return { color: '#6BBF8A' };                           // slightly duller green
  } else if (secondsPassed < 86400) {
    return { color: '#B8A56A' };                           // amber-green
  } else if (secondsPassed < 604800) {
    return { color: '#D4A76A' };                           // amber
  } else if (secondsPassed < 2592000) {
    return { color: '#A0784C' };                           // dark brown
  } else {
    return {
      color: '#1a1a1a',
      filter: 'drop-shadow(0 0 2px rgba(200,150,90,0.8))', // black with amber edge
    };
  }
}

function getLeafStyle(updatedAtStr: string, nowMs: number): React.CSSProperties {
  if (!updatedAtStr) return {};
  const lastUpdate = new Date(updatedAtStr).getTime();
  const secondsPassed = (nowMs - lastUpdate) / 1000;
  const stage = getLeafStage(secondsPassed);
  if (!stage) return {};
  return {
    color: stage.color,
    filter: stage.filter || undefined,
    transition: 'color 0.5s ease, filter 0.5s ease',
  };
}

export default function Sidebar({
  notes,
  folders,
  activeNoteId,
  setActiveNoteId,
  createNewNote,
  deleteNote,
  paddedCount,
  createFolder,
  deleteFolder,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || []))).sort();

  const matchesQuery = (n: Note) => {
    if (query.trim() === '') return true;
    const q = query.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  };
  const matchesTag = (n: Note) => !activeTag || (n.tags || []).includes(activeTag);
  const passesFilters = (n: Note) => matchesQuery(n) && matchesTag(n);
  const isFiltering = query.trim() !== '' || activeTag !== null;

  const toggleFolder = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddFolder = () => {
    if (newFolderName.trim() === '') { setIsAddingFolder(false); return; }
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const rootNotes = notes.filter((n) => n.folder_id === null && passesFilters(n));

  const renderNoteLeaf = (note: Note, inFolder: boolean = true) => {
    const isActive = note.id === activeNoteId;
    const leafStyle = getLeafStyle(note.updated_at, nowMs);

    return (
      <div
        key={note.id}
        onClick={() => setActiveNoteId(note.id)}
        className={`group relative ${inFolder ? 'pl-7' : 'pl-3'} pr-2 py-1.5 cursor-pointer flex items-start gap-2 rounded-sm transition-colors duration-700 ${
          isActive ? 'bg-emerald-400/[0.07]' : 'hover:bg-white/[0.03]'
        }`}
      >
        {inFolder && (
          <>
            <span
              className="absolute left-3 top-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(180deg, rgba(124,234,156,0.15), rgba(124,234,156,0.03))' }}
            />
            <span className="absolute left-3 top-3.5 w-2.5 h-px bg-emerald-400/15" />
          </>
        )}

        {/* LeafIcon: no conflicting Tailwind color classes, just size and positioning */}
        <LeafIcon
          style={leafStyle}
          className="w-3 h-3 mt-0.5 shrink-0 transition-all duration-500"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs truncate ${
              isActive ? 'font-semibold text-zinc-100' : 'font-medium text-zinc-400 group-hover:text-zinc-200'
            }`}>
              {note.title.trim() === '' ? 'Untitled Entry' : note.title}
            </span>
            <span
              onClick={(e) => deleteNote(note.id, e)}
              className="opacity-0 group-hover:opacity-100 text-red-500/60 hover:text-red-400 font-bold text-[10px] shrink-0 leading-none"
            >
              ×
            </span>
          </div>
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {note.tags.map((tag) => (
                <span key={tag} className="text-[8.5px] font-mono text-emerald-600/60">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        onClick={onMobileClose}
        className="sm:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-200"
        style={{
          opacity: isMobileOpen ? 1 : 0,
          pointerEvents: isMobileOpen ? 'auto' : 'none',
        }}
      />

      <aside
        className="lb-mobile-sidebar w-72 max-w-[80vw] border-r border-emerald-950/40 bg-black/40 flex flex-col z-40 fixed sm:static inset-y-0 left-0 sm:z-10 h-full"
        style={{ transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
      <style>{`
        @media (max-width: 639px) {
          .lb-mobile-sidebar {
            transform: ${isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'};
          }
        }
      `}</style>
      <div className="p-4 border-b border-emerald-950/30 bg-black/20 flex justify-between items-center">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2 font-mono">
          <span className="w-1 h-1 bg-[#7CEA9C] inline-block shadow-[0_0_6px_#7CEA9C]"></span>
          The Tree
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingFolder(true)}
            title="New branch"
            className="text-zinc-500 hover:text-[#7CEA9C] border border-emerald-800/30 hover:border-emerald-700/40 px-1.5 py-1 rounded-sm transition-colors flex items-center"
          >
            <BranchIcon className="w-3 h-3" />
          </button>
          <button 
            onClick={createNewNote}
            className="text-[11px] font-mono border border-emerald-800/40 text-[#7CEA9C] px-2 py-0.5 bg-emerald-950/20 hover:bg-[#7CEA9C]/10 transition-colors duration-150 rounded-sm font-bold"
          >
            + NEW
          </button>
          <span className="text-[10px] font-mono border border-emerald-950/60 text-emerald-500/80 px-2 py-0.5 bg-emerald-950/10">
            {paddedCount}
          </span>
        </div>
      </div>

      <div className="px-3 pt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the tree..."
          className="w-full bg-black/30 border border-emerald-950/40 focus:border-emerald-700/50 rounded-sm px-2.5 py-1.5 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none transition-colors"
        />
      </div>

      {allTags.length > 0 && (
        <div className="px-3 pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <span
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                  activeTag === tag
                    ? 'border-[#7CEA9C]/60 text-[#7CEA9C] bg-emerald-950/30'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The tree itself */}
      <div className="flex-1 overflow-y-auto px-2 py-3 mt-1">
        {isAddingFolder && (
          <div className="px-2 pb-2">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleAddFolder}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setIsAddingFolder(false); }}
              placeholder="Branch name..."
              className="w-full bg-black/30 border border-emerald-800/40 rounded-sm px-2 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
            />
          </div>
        )}

        {folders.map((folder) => {
          const folderNotes = notes.filter((n) => n.folder_id === folder.id && passesFilters(n));
          const isOpen = isFiltering ? folderNotes.length > 0 : !!expanded[folder.id];
          if (isFiltering && folderNotes.length === 0) return null;

          return (
            <div key={folder.id} className="mb-0.5">
              <div
                onClick={() => !isFiltering && toggleFolder(folder.id)}
                className="group relative px-2 py-1.5 cursor-pointer flex items-center gap-1.5 rounded-sm hover:bg-white/[0.03] transition-colors duration-100"
              >
                <ChevronIcon open={isOpen} className="w-2.5 h-2.5 text-zinc-600 shrink-0" />
                <BranchIcon className="w-3.5 h-3.5 text-emerald-600/80 shrink-0" />
                <span className="text-xs font-medium text-zinc-300 truncate flex-1">{folder.name}</span>
                <span className="text-[9px] font-mono text-zinc-600 shrink-0">{folderNotes.length}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-500/60 hover:text-red-400 font-bold text-[10px] shrink-0 leading-none ml-1"
                >
                  ×
                </span>
              </div>

              <div
                className="overflow-hidden transition-all duration-200 ease-out"
                style={{ maxHeight: isOpen ? `${folderNotes.length * 60 + 20}px` : '0px' }}
              >
                <div className="flex flex-col py-0.5">
                  {folderNotes.length === 0 ? (
                    <div className="pl-7 py-1 text-[10px] font-mono text-zinc-700 italic">Empty branch</div>
                  ) : (
                    folderNotes.map((note) => renderNoteLeaf(note))
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {rootNotes.length > 0 && (
          <div className={folders.length > 0 ? 'mt-2 pt-2 border-t border-emerald-950/20' : ''}>
            {rootNotes.map((note) => renderNoteLeaf(note, false))}
          </div>
        )}

        {notes.length === 0 && (
          <div className="text-center py-8 text-[11px] font-mono text-zinc-600 uppercase tracking-wider">
            The tree is bare. Plant your first entry.
          </div>
        )}
      </div>

      <div className="p-3 border-t border-emerald-950/30 text-center bg-black/10">
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="text-[10px] font-mono text-zinc-600 hover:text-red-400 transition-colors uppercase tracking-widest block w-full text-center"
        >
          // Terminate Session
        </button>
      </div>
    </aside>
    </>
  );
}