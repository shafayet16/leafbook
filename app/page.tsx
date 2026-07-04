//main page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthGateway from './components/AuthGateway';
import Sidebar from './components/Sidebar';
import EditorCanvas from './components/EditorCanvas';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const formatSidebarDate = () => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  };

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
      return;
    }

    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, content, updated_at')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setNotes(data);
        if (data.length > 0) setActiveNoteId(data[0].id);
      }
    };

    fetchNotes();
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
    const newNote = { title: '', content: '', updated_at: formatSidebarDate(), user_id: user.id };
    const { data, error } = await supabase.from('notes').insert([newNote]).select().single();
    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setActiveNoteId(data.id);
    }
  };

  const updateActiveNote = (field: 'title' | 'content', value: string) => {
    if (!activeNoteId || !user) return;
    const updatedDate = formatSidebarDate();
    setNotes((prev) => prev.map((n) => n.id === activeNoteId ? { ...n, [field]: value, updated_at: updatedDate } : n));

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      await supabase.from('notes').update({ [field]: value, updated_at: updatedDate }).eq('id', activeNoteId);
    }, 500);
  };

  const deleteNote = async (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const { error } = await supabase.from('notes').delete().eq('id', idToDelete);
    if (!error) {
      const filtered = notes.filter((n) => n.id !== idToDelete);
      setNotes(filtered);
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
    <div className="w-screen h-screen bg-[#020604] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)] flex items-center justify-center p-6 font-sans">
      <main className="w-[90vw] h-[85vh] max-w-6xl border border-emerald-950/60 bg-[#0b0910] relative flex overflow-hidden shadow-[0_0_80px_rgba(2,20,10,0.6)]">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#7CEA9C] pointer-events-none" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#7CEA9C] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#7CEA9C] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#7CEA9C] pointer-events-none" />

        <Sidebar 
          notes={notes} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId}
          createNewNote={createNewNote} deleteNote={deleteNote} paddedCount={paddedCount}
        />

        <div className="flex-1 flex flex-col bg-transparent relative z-10">
          <div className="px-8 py-3 border-b border-emerald-950/30 bg-black/20 flex justify-between items-center text-[10px] font-mono text-zinc-500 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-800 rounded-full" />
              <span className="text-zinc-400 font-semibold">LEAFBOOK // EDITOR</span>
            </div>
            <div className="text-zinc-400 uppercase max-w-[200px] truncate">{user.email}</div>
          </div>

          <EditorCanvas 
            activeNote={activeNote} updateActiveNote={updateActiveNote}
            createNewNote={createNewNote} wordCount={wordCount}
          />
        </div>
      </main>
    </div>
  );
}