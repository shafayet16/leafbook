'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthGateway from './components/AuthGateway';
import Sidebar from './components/Sidebar';
import EditorCanvas from './components/EditorCanvas';
import CommandPalette, { PALETTE_HEIGHT_VH } from './components/CommandPalette';

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

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null | 'all'>('all');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [noteHistory, setNoteHistory] = useState<string[]>([]);

  // ── Helper: proper ISO 8601 timestamp ──
  const nowISO = () => new Date().toISOString();

  useEffect(() => {
    if (!activeNoteId) return;
    setNoteHistory((prev) => {
      const withoutCurrent = prev.filter((id) => id !== activeNoteId);
      return [...withoutCurrent, activeNoteId].slice(-6);
    });
  }, [activeNoteId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    setIsMounted(true);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setNotes([]);
      setFolders([]);
      return;
    }

    const fetchData = async () => {
      const [notesRes, foldersRes] = await Promise.all([
        supabase
          .from('notes')
          .select('id, title, content, updated_at, folder_id, tags')
          .order('updated_at', { ascending: false }),
        supabase
          .from('folders')
          .select('id, name')
          .order('created_at', { ascending: true }),
      ]);

      if (!notesRes.error && notesRes.data) {
        setNotes(notesRes.data);
        if (notesRes.data.length > 0) setActiveNoteId(notesRes.data[0].id);
      }
      if (!foldersRes.error && foldersRes.data) {
        setFolders(foldersRes.data);
      }
    };

    fetchData();
  }, [user?.id]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else if (data?.user && data.user.identities?.length === 0) {
        setStatusMessage({ type: 'error', text: 'This email address is already registered. Please navigate to the sign-in screen.' });
      } else {
        setStatusMessage({ type: 'success', text: 'Account created successfully! A secure confirmation link has been transmitted to your inbox. Please verify your email before logging in.' });
        setEmail(''); setPassword('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let friendlyError = error.message;
        if (error.message === 'Invalid login credentials') {
          friendlyError = 'Invalid email address or password. Please verify your credentials and try again.';
        } else if (error.message === 'Email not confirmed') {
          friendlyError = 'Access denied. Your email address has not been verified yet. Please check your inbox for the confirmation link.';
        }
        setStatusMessage({ type: 'error', text: friendlyError });
      }
    }
  };

  const createNewNote = async () => {
    if (!user) return;
    const newNote = {
      title: '', content: '', updated_at: nowISO(), user_id: user.id,
      folder_id: null,
      tags: [],
    };
    const { data, error } = await supabase.from('notes').insert([newNote]).select().single();
    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setActiveNoteId(data.id);
    }
  };

  const createFolder = async (name: string) => {
    if (!user) return;
    const { data, error } = await supabase.from('folders').insert([{ name, user_id: user.id }]).select().single();
    if (!error && data) {
      setFolders((prev) => [...prev, data]);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) return;
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (!error) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setNotes((prev) => prev.map((n) => n.folder_id === folderId ? { ...n, folder_id: null } : n));
      if (activeFolderId === folderId) setActiveFolderId('all');
    }
  };

  const setNoteFolder = async (folderId: string | null) => {
    if (!activeNoteId) return;
    setNotes((prev) => prev.map((n) => n.id === activeNoteId ? { ...n, folder_id: folderId } : n));
    await supabase.from('notes').update({ folder_id: folderId }).eq('id', activeNoteId);
  };

  const addTag = async (tag: string) => {
    if (!activeNoteId) return;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note || (note.tags || []).includes(tag)) return;
    const newTags = [...(note.tags || []), tag];
    setNotes((prev) => prev.map((n) => n.id === activeNoteId ? { ...n, tags: newTags } : n));
    await supabase.from('notes').update({ tags: newTags }).eq('id', activeNoteId);
  };

  const removeTag = async (tag: string) => {
    if (!activeNoteId) return;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;
    const newTags = (note.tags || []).filter((t) => t !== tag);
    setNotes((prev) => prev.map((n) => n.id === activeNoteId ? { ...n, tags: newTags } : n));
    await supabase.from('notes').update({ tags: newTags }).eq('id', activeNoteId);
  };

  const updateActiveNote = (field: 'title' | 'content', value: string) => {
    if (!activeNoteId || !user) return;
    const updatedDate = nowISO();                  // ✅ ISO timestamp
    setNotes((prev) => prev.map((n) => n.id === activeNoteId ? { ...n, [field]: value, updated_at: updatedDate } : n));

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await supabase.from('notes').update({ [field]: value, updated_at: updatedDate }).eq('id', activeNoteId);
    }, 500);
  };

  const deleteNote = async (idToDelete: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!user) return;
    const { error } = await supabase.from('notes').delete().eq('id', idToDelete);
    if (!error) {
      const filtered = notes.filter((n) => n.id !== idToDelete);
      setNotes(filtered);
      setNoteHistory((prev) => prev.filter((id) => id !== idToDelete));
      if (activeNoteId === idToDelete) setActiveNoteId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  if (!isMounted) return <div className="w-screen h-screen bg-[#020604]" />;

  if (!user) {
    return (
      <AuthGateway 
        authMode={authMode} setAuthMode={setAuthMode}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        statusMessage={statusMessage} setStatusMessage={setStatusMessage}
        handleAuth={handleAuth}
      />
    );
  }

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;
  const wordCount = !activeNote || activeNote.content.trim() === '' ? 0 : activeNote.content.trim().split(/\s+/).length;
  const paddedCount = String(notes.length).padStart(2, '0');

  return (
    <div className="w-screen h-screen bg-[#020604] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)] overflow-hidden relative font-sans">
      <div
        style={{
          position: 'fixed',
          top: isPaletteOpen ? `${PALETTE_HEIGHT_VH}vh` : 0,
          left: 0,
          right: 0,
          bottom: 0,
          transition: 'top 420ms cubic-bezier(0.16, 1, 0.3, 1), padding 420ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={isPaletteOpen ? 'flex items-center justify-center p-0' : 'flex items-center justify-center p-0 sm:p-6'}
      >
        <main
          className="border-emerald-950/60 bg-[#0b0910] relative flex overflow-hidden w-screen sm:w-[90vw]"
          style={{
            width: isPaletteOpen ? '100vw' : undefined,
            maxWidth: isPaletteOpen ? '100vw' : '72rem',
            height: '100%',
            borderWidth: isPaletteOpen ? '0px' : undefined,
            boxShadow: isPaletteOpen ? 'none' : '0 0 80px rgba(2,20,10,0.6)',
            filter: isPaletteOpen ? 'blur(1px) brightness(0.75)' : 'blur(0px) brightness(1)',
            transition: 'width 420ms cubic-bezier(0.16, 1, 0.3, 1), max-width 420ms cubic-bezier(0.16, 1, 0.3, 1), border-width 420ms ease, box-shadow 420ms ease, filter 420ms ease',
          }}
        >
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#7CEA9C] pointer-events-none" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#7CEA9C] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#7CEA9C] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#7CEA9C] pointer-events-none" />

        <Sidebar 
          notes={notes} folders={folders} activeNoteId={activeNoteId}
          setActiveNoteId={(id) => { setActiveNoteId(id); setIsSidebarOpen(false); }}
          createNewNote={() => { createNewNote(); setIsSidebarOpen(false); }}
          deleteNote={deleteNote} paddedCount={paddedCount}
          activeFolderId={activeFolderId} setActiveFolderId={setActiveFolderId}
          createFolder={createFolder} deleteFolder={deleteFolder}
          isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col bg-transparent relative z-10 min-w-0">
          <div className="px-4 sm:px-8 py-3 border-b border-emerald-950/30 bg-black/20 flex justify-between items-center text-[10px] font-mono text-zinc-500 tracking-wider">
            <div className="flex items-center gap-2 sm:gap-2">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="sm:hidden flex flex-col gap-[3px] p-1 -ml-1 mr-1"
                aria-label="Open tree"
              >
                <span className="w-4 h-[1.5px] bg-zinc-400" />
                <span className="w-4 h-[1.5px] bg-zinc-400" />
                <span className="w-4 h-[1.5px] bg-zinc-400" />
              </button>
              <span className="w-1 h-1 bg-emerald-800 rounded-full hidden sm:inline-block" />
              <span className="text-zinc-400 font-semibold">LEAFBOOK</span>
            </div>
            <div className="text-zinc-400 uppercase max-w-[120px] sm:max-w-[200px] truncate">{user.email}</div>
          </div>

          <EditorCanvas 
            activeNote={activeNote} updateActiveNote={updateActiveNote}
            createNewNote={createNewNote} wordCount={wordCount}
            folders={folders} setNoteFolder={setNoteFolder}
            addTag={addTag} removeTag={removeTag}
            allNotes={notes} noteHistory={noteHistory} onSelectNote={setActiveNoteId}
          />
        </div>
      </main>
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        notes={notes}
        activeNoteId={activeNoteId}
        setActiveNoteId={setActiveNoteId}
        createNewNote={createNewNote}
        deleteNote={deleteNote}
      />
    </div>
  );
}