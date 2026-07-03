//Sidebar.tsx
'use client';
import React from 'react';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNewNote: () => void;
  deleteNote: (id: string, e: React.MouseEvent) => void;
  paddedCount: string;
}

export default function Sidebar({
  notes,
  activeNoteId,
  setActiveNoteId,
  createNewNote,
  deleteNote,
  paddedCount,
}: SidebarProps) {
  return (
    <aside className="w-72 border-r border-emerald-950/40 bg-black/40 flex flex-col z-10">
      <div className="p-4 border-b border-emerald-950/30 bg-black/20 flex justify-between items-center">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2 font-mono">
          <span className="w-1 h-1 bg-[#7CEA9C] inline-block shadow-[0_0_6px_#7CEA9C]"></span>
          All Entries
        </h2>
        <div className="flex items-center gap-2">
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

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {notes.map((note) => {
          const isActive = note.id === activeNoteId;
          return (
            <div
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`p-3 relative cursor-pointer group transition-all duration-150 border ${
                isActive
                  ? 'bg-[#111c16]/40 border-emerald-500/30 shadow-[inset_0_0_12px_rgba(114,234,156,0.03)]'
                  : 'border-emerald-950/30 bg-black/10 hover:border-emerald-800/40'
              }`}
            >
              {isActive && <div className="absolute top-0 right-0 w-1 h-1 bg-[#7CEA9C]"></div>}
              
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`text-xs truncate tracking-wide max-w-[170px] ${
                  isActive ? 'font-bold text-zinc-100' : 'font-medium text-zinc-400 group-hover:text-zinc-200'
                }`}>
                  {note.title.trim() === '' ? 'Untitled Entry' : note.title}
                </h3>
                <span className={`text-[9px] font-mono ml-2 flex items-center gap-1.5 ${
                  isActive ? 'text-zinc-500' : 'text-zinc-600 group-hover:text-zinc-400'
                }`}>
                  {note.updated_at}
                  <span 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-500/70 hover:text-red-400 font-sans px-1 font-bold text-[10px] transition-opacity duration-150"
                  >
                    ×
                  </span>
                </span>
              </div>
              <p className={`text-[11px] truncate leading-normal ${
                isActive ? 'text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-400'
              }`}>
                {note.content.trim() === '' ? 'Empty stream data...' : note.content}
              </p>
            </div>
          );
        })}

        {notes.length === 0 && (
          <div className="text-center py-8 text-[11px] font-mono text-zinc-600 uppercase tracking-wider">
            No active logs initialized.
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
  );
}