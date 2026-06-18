'use client';
import React, { useState, useEffect } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Helper to format date as MM.DD for the tactical sidebar layout
  const formatSidebarDate = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  };

  // Hydration Guard: Load entries from localStorage only after client-side mounting
  useEffect(() => {
    const savedNotes = localStorage.getItem('leafbook_memory_vault');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
      if (parsedNotes.length > 0) {
        setActiveNoteId(parsedNotes[0].id);
      }
    } else {
      // Seed default structural records if the vault is empty
      const seedEntries: Note[] = [
        {
          id: 'seed-1',
          title: 'Weekly Progress Review',
          content: 'Core engine architecture is stable. Moving toward state management layout configurations...',
          updatedAt: '06.17'
        },
        {
          id: 'seed-2',
          title: 'Project Roadmap Planning',
          content: 'Decided on isolated linear learning progression: React, then TypeScript, then Next.js...',
          updatedAt: '06.12'
        }
      ];
      setNotes(seedEntries);
      setActiveNoteId('seed-1');
    }
    setIsMounted(true);
  }, []);

  // Sync state engine changes to local disk storage automatically
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('leafbook_memory_vault', JSON.stringify(notes));
    }
  }, [notes, isMounted]);

  // Extract currently active target document
  const activeNote = notes.find((note) => note.id === activeNoteId) || null;

  // Handle runtime value mutations inside the text fields
  const updateActiveNote = (field: 'title' | 'content', value: string) => {
    if (!activeNoteId) return;
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === activeNoteId
          ? { ...note, [field]: value, updatedAt: formatSidebarDate() }
          : note
      )
    );
  };

  // Create a clean node structure inside the memory stack
  const createNewNote = () => {
    const newId = crypto.randomUUID();
    const newNote: Note = {
      id: newId,
      title: '',
      content: '',
      updatedAt: formatSidebarDate()
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
  };

  // Purge record from state engine safely
  const deleteNote = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the deleted note trigger
    const filtered = notes.filter((note) => note.id !== idToDelete);
    setNotes(filtered);
    
    if (activeNoteId === idToDelete) {
      setActiveNoteId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  // Calculate dynamic data constraints
  const wordCount = activeNote?.content.trim() === '' || !activeNote
    ? 0 
    : activeNote.content.trim().split(/\s+/).length;

  const paddedCount = String(notes.length).padStart(2, '0');

  // Block rendering during Server-Side initialization to prevent visual flash
  if (!isMounted) {
    return <div className="w-screen h-screen bg-[#020604]" />;
  }

  return (
    <div className="w-screen h-screen bg-[#020604] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)] flex items-center justify-center p-6 font-sans">
      
      {/* OUTER CHASSIS */}
      <main className="w-[90vw] h-[85vh] max-w-6xl border border-emerald-950/60 bg-[#0b0910] relative flex overflow-hidden shadow-[0_0_80px_rgba(2,20,10,0.6)]">
        
        {/* TECH BRACKETS */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#7CEA9C] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#7CEA9C] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#7CEA9C] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#7CEA9C] pointer-events-none"></div>

        {/* BIOLUMINESCENT GLINT */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7CEA9C]/3 rounded-full blur-[120px] pointer-events-none" />

        {/* LEFT PANEL: Dynamic Sidebar */}
        <aside className="w-72 border-r border-emerald-950/40 bg-black/40 flex flex-col z-10">
          
          {/* Sidebar Header with Note Utility Actions */}
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

          {/* Note Feed Container - Maps through real local records */}
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
                      {note.updatedAt}
                      {/* Discrete inline trash protocol trigger */}
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

        </aside>

        {/* RIGHT PANEL: Writing Canvas Enclosure */}
        <div className="flex-1 flex flex-col bg-transparent relative z-10">
          
          {/* Top Info Bar */}
          <div className="px-8 py-3 border-b border-emerald-950/30 bg-black/20 flex justify-between items-center text-[10px] font-mono text-zinc-500 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-800 rounded-full"></span>
              <span className="text-zinc-400 font-semibold">LEAFBOOK // EDITOR</span>
            </div>
            <div className="text-zinc-400 uppercase">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
            </div>
          </div>

          {/* Interactive Input Layer */}
          {activeNote ? (
            <div className="flex-1 p-8 md:p-12 flex flex-col gap-6 relative">
              
              {/* Title Input Element (No box shadow, reactive clip gradient) */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Untitled Entry" 
                  value={activeNote.title}
                  onChange={(e) => updateActiveNote('title', e.target.value)}
                  className={`bg-transparent focus:outline-none text-3xl font-sans font-extrabold tracking-tight w-full caret-[#7CEA9C] selection:bg-emerald-500/10 transition-all duration-150 ${
                    activeNote.title 
                      ? 'bg-gradient-to-r from-[#7CEA9C] via-[#34D399] to-[#059669] bg-clip-text text-transparent' 
                      : 'text-zinc-100 placeholder-zinc-800'
                  }`}
                />
                <div className="absolute -bottom-3 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-950 via-emerald-900/20 to-transparent"></div>
              </div>

              {/* Textarea Workspace with Conditional Anode Ghost Execution */}
              <textarea 
                placeholder="Write your thoughts..."
                value={activeNote.content}
                onChange={(e) => updateActiveNote('content', e.target.value)}
                style={
                  activeNote.content 
                    ? { textShadow: '-1px -0.5px 0px rgba(34, 211, 238, 0.35), 1px 0.5px 0px rgba(52, 211, 153, 0.3)' } 
                    : {}
                }
                className="bg-transparent text-[#f8fafc] placeholder-zinc-800 focus:outline-none text-lg leading-relaxed flex-1 resize-none font-mono tracking-wide pt-4 caret-cyan-400 selection:bg-cyan-500/10"
              ></textarea>

              {/* Footer Panel Tracking Controls */}
              <div className="flex justify-between items-center text-[10px] font-mono border-t border-emerald-950/30 pt-4 text-zinc-500 tracking-widest">
                <div>
                  WORDS: <span className="text-zinc-300">{wordCount}</span>
                </div>
                <div className="text-[#7CEA9C]/80 flex items-center gap-2 font-semibold">
                  <span className="w-1 h-1 rounded-full bg-[#7CEA9C] shadow-[0_0_6px_#7CEA9C] animate-pulse"></span>
                  READY
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-zinc-600 uppercase tracking-widest gap-4">
              <span>No document mounted in engine view.</span>
              <button 
                onClick={createNewNote}
                className="border border-emerald-800/40 text-[#7CEA9C] px-3 py-1 bg-emerald-950/20 hover:bg-[#7CEA9C]/10 transition-colors duration-150 rounded-sm font-bold text-[11px]"
              >
                Initialize New Record
              </button>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}