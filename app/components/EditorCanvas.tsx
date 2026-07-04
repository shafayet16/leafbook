//EditorCanvas.tsx
'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

interface EditorCanvasProps {
  activeNote: Note | null;
  updateActiveNote: (field: 'title' | 'content', value: string) => void;
  createNewNote: () => void;
  wordCount: number;
}

export default function EditorCanvas({
  activeNote,
  updateActiveNote,
  createNewNote,
  wordCount,
}: EditorCanvasProps) {
  const [isPreview, setIsPreview] = useState(false);

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-zinc-600 uppercase tracking-widest gap-4">
        <span>No document mounted in engine view.</span>
        <button 
          onClick={createNewNote}
          className="border border-emerald-800/40 text-[#7CEA9C] px-3 py-1 bg-emerald-950/20 hover:bg-[#7CEA9C]/10 transition-colors duration-150 rounded-sm font-bold text-[11px]"
        >
          Initialize New Record
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 flex flex-col gap-6 relative">
      <div className="relative flex items-start justify-between gap-4">
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
        <button
          onClick={() => setIsPreview((prev) => !prev)}
          className={`shrink-0 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border rounded-sm font-bold transition-colors duration-150 ${
            isPreview
              ? 'border-[#7CEA9C]/50 text-[#7CEA9C] bg-emerald-950/30'
              : 'border-emerald-950/50 text-zinc-500 hover:text-zinc-300 hover:border-emerald-800/40'
          }`}
        >
          {isPreview ? 'Editing' : 'Preview'}
        </button>
        <div className="absolute -bottom-3 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-950 via-emerald-900/20 to-transparent"></div>
      </div>

      {isPreview ? (
        <div
          style={
            activeNote.content 
              ? { textShadow: '-1px -0.5px 0px rgba(34, 211, 238, 0.35), 1px 0.5px 0px rgba(52, 211, 153, 0.3)' } 
              : {}
          }
          className="flex-1 overflow-y-auto text-[#f8fafc] text-lg leading-relaxed pt-4 font-mono tracking-wide
            [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:mb-3 [&_h1]:mt-2
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3
            [&_p]:mb-3
            [&_strong]:font-bold
            [&_em]:italic
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
            [&_li]:mb-1
            [&_a]:underline [&_a]:underline-offset-2
            [&_code]:bg-black/30 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-sm [&_code]:text-[0.9em]
            [&_pre]:bg-black/30 [&_pre]:border [&_pre]:border-white/10 [&_pre]:p-4 [&_pre]:rounded-sm [&_pre]:overflow-x-auto [&_pre]:mb-3
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:opacity-70 [&_blockquote]:italic
            [&_hr]:border-white/10 [&_hr]:my-4"
        >
          {activeNote.content.trim() === '' ? (
            <p className="opacity-40 italic">Nothing to preview yet.</p>
          ) : (
            <ReactMarkdown>{activeNote.content}</ReactMarkdown>
          )}
        </div>
      ) : (
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
      )}

      <div className="flex justify-between items-center text-[10px] font-mono border-t border-emerald-950/30 pt-4 text-zinc-500 tracking-widest">
        <div>
          WORDS: <span className="text-zinc-300">{wordCount}</span>
        </div>
        <div className="text-[#7CEA9C]/80 flex items-center gap-2 font-semibold">
          <span className="w-1 h-1 rounded-full bg-[#7CEA9C] shadow-[0_0_6px_#7CEA9C] animate-pulse"></span>
          SECURE_CLOUD_LINKED
        </div>
      </div>
    </div>
  );
}