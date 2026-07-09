//EditorCanvas.tsx
'use client';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

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

interface EditorCanvasProps {
  activeNote: Note | null;
  updateActiveNote: (field: 'title' | 'content', value: string) => void;
  createNewNote: () => void;
  wordCount: number;
  folders: Folder[];
  setNoteFolder: (folderId: string | null) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  allNotes: Note[];
  noteHistory: string[];
  onSelectNote: (id: string) => void;
}

const WILT_THRESHOLD_SECONDS = 60 * 60 * 24 * 7; // 7 days

function isWilted(updatedAtStr: string, nowMs: number): boolean {
  if (!updatedAtStr) return false;
  const lastUpdate = new Date(updatedAtStr).getTime();
  const secondsPassed = (nowMs - lastUpdate) / 1000;
  return secondsPassed >= WILT_THRESHOLD_SECONDS;
}

function truncateLabel(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '~';
}

function VineBranchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M2 14L13.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.5 9.5L10 6.8" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M6.5 9.5L9.2 10.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M9.5 6.5L12 7.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9.5 6.5L11.8 4.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function FlowerIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} style={style}>
      <g>
        <ellipse cx="8" cy="4.2" rx="1.9" ry="2.6" fill="currentColor" opacity="0.85" />
        <ellipse cx="8" cy="11.8" rx="1.9" ry="2.6" fill="currentColor" opacity="0.85" />
        <ellipse cx="4.2" cy="8" rx="2.6" ry="1.9" fill="currentColor" opacity="0.85" />
        <ellipse cx="11.8" cy="8" rx="2.6" ry="1.9" fill="currentColor" opacity="0.85" />
        <ellipse cx="5.4" cy="5.4" rx="1.7" ry="2.2" fill="currentColor" opacity="0.7" transform="rotate(-45 5.4 5.4)" />
        <ellipse cx="10.6" cy="5.4" rx="1.7" ry="2.2" fill="currentColor" opacity="0.7" transform="rotate(45 10.6 5.4)" />
        <ellipse cx="5.4" cy="10.6" rx="1.7" ry="2.2" fill="currentColor" opacity="0.7" transform="rotate(45 5.4 10.6)" />
        <ellipse cx="10.6" cy="10.6" rx="1.7" ry="2.2" fill="currentColor" opacity="0.7" transform="rotate(-45 10.6 10.6)" />
        <circle cx="8" cy="8" r="1.6" fill="white" opacity="0.9" />
      </g>
    </svg>
  );
}

function VineSegment({ intensity, wilted }: { intensity: number; wilted: boolean }) {
  const strokeColor = wilted
    ? `rgba(180,150,90,${0.12 + intensity * 0.28})`
    : `rgba(16,185,129,${0.15 + intensity * 0.4})`;
  const leafColor = wilted
    ? `rgba(200,160,80,${0.12 + intensity * 0.25})`
    : `rgba(52,211,153,${0.15 + intensity * 0.35})`;

  return (
    <svg viewBox="0 0 60 24" preserveAspectRatio="none" className="lb-vine-segment flex-1 h-9 min-w-[20px] max-w-[48px] mx-0.5">
      <path
        d="M0 12 C 8 4, 14 20, 22 13 C 30 7, 34 18, 42 13 C 48 9, 52 15, 60 12"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        style={{ color: strokeColor, transition: 'color 600ms ease-out' }}
      />
      <ellipse cx="20" cy="7" rx="1.8" ry="1" transform="rotate(-20 20 7)" style={{ fill: leafColor, transition: 'fill 600ms ease-out' }} />
      <ellipse cx="42" cy="18" rx="1.8" ry="1" transform="rotate(20 42 18)" style={{ fill: leafColor, transition: 'fill 600ms ease-out' }} />
    </svg>
  );
}

function TrailFlower({
  title,
  isActive,
  intensity,
  wilted,
  onClick,
}: {
  title: string;
  isActive: boolean;
  intensity: number;
  wilted: boolean;
  onClick: () => void;
}) {
  const size = 13 + intensity * 8;
  const glowStrength = wilted ? 0.12 + intensity * 0.3 : 0.15 + intensity * 0.75;
  const flowerColor = wilted
    ? `rgba(191,158,74,${0.35 + intensity * 0.45})`
    : `rgba(124,234,156,${0.35 + intensity * 0.65})`;
  const glowRgb = wilted ? '191,158,74' : '52,211,153';

  return (
    <button
      onClick={onClick}
      title={`${title || 'Untitled Entry'}${wilted ? ' — dormant' : ''}`}
      className="lb-flower-btn flex flex-col items-center justify-center gap-1 shrink-0 h-9 w-14"
      style={{
        transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <span
        className="flex items-center justify-center h-5 transition-all duration-500 ease-out"
        style={{
          filter: `drop-shadow(0 0 ${3 + intensity * 5}px rgba(${glowRgb},${glowStrength})) drop-shadow(0 0 ${6 + intensity * 10}px rgba(${glowRgb},${glowStrength * 0.5}))`,
        }}
      >
        <FlowerIcon
          className={isActive && !wilted ? 'animate-pulse' : ''}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            color: flowerColor,
            animationDuration: '2.6s',
            transition: 'width 300ms ease-out, height 300ms ease-out, color 500ms ease-out',
          } as React.CSSProperties}
        />
      </span>
      <span
        className="text-[9px] font-mono whitespace-nowrap w-14 text-center leading-none transition-all duration-500"
        style={{
          opacity: 0.3 + intensity * 0.7,
          color: isActive ? (wilted ? '#C9A45E' : '#7CEA9C') : '#a1a1aa',
        }}
      >
        {title.trim() === '' ? 'untitled' : truncateLabel(title, 8)}
      </span>
    </button>
  );
}

function VineNav({
  folderName,
  trail,
  activeNoteId,
  onSelectNote,
  nowMs,
}: {
  folderName: string | null;
  trail: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  nowMs: number;
}) {
  const hasFolder = folderName !== null;

  return (
    <div className="w-full">
      <style>{`
        .lb-trail-scroll::-webkit-scrollbar { display: none; }
        .lb-trail-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .lb-flower-btn:hover { transform: translateY(-5px) !important; }
        .lb-flower-btn:active { transform: translateY(-1px) !important; }
      `}</style>
      <div className="lb-trail-scroll flex items-center w-full overflow-x-auto py-3 select-none">
        {hasFolder ? (
          <div className="flex items-center gap-1.5 shrink-0 h-9 w-24">
            <VineBranchIcon className="w-3.5 h-3.5 text-emerald-600/80 shrink-0" />
            <span className="text-[11px] font-mono text-zinc-500 tracking-wide whitespace-nowrap">
              {truncateLabel(folderName, 10)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0 h-9 w-24">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
            <span className="text-[11px] font-mono text-zinc-600 italic tracking-wide whitespace-nowrap">loose leaf</span>
          </div>
        )}

        {trail.map((note, i) => {
          const intensity = trail.length <= 1 ? 1 : i / (trail.length - 1);
          return (
            <React.Fragment key={note.id}>
              <VineSegment intensity={intensity} wilted={isWilted(note.updated_at, nowMs)} />
              <TrailFlower
                title={note.title}
                isActive={note.id === activeNoteId}
                intensity={Math.max(intensity, 0.15)}
                wilted={isWilted(note.updated_at, nowMs)}
                onClick={() => onSelectNote(note.id)}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function EditorCanvas({
  activeNote,
  updateActiveNote,
  createNewNote,
  wordCount,
  folders,
  setNoteFolder,
  addTag,
  removeTag,
  allNotes,
  noteHistory,
  onSelectNote,
}: EditorCanvasProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [linkQuery, setLinkQuery] = useState<string | null>(null);
  const [linkQueryStart, setLinkQueryStart] = useState<number>(0);
  const [linkSelectedIndex, setLinkSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const linkMatches = useMemo(() => {
    if (linkQuery === null || !activeNote) return [];
    const q = linkQuery.toLowerCase();
    return allNotes
      .filter((n) => n.id !== activeNote.id)
      .filter((n) => n.title.toLowerCase().includes(q))
      .slice(0, 6);
  }, [linkQuery, allNotes, activeNote?.id]);

  const backlinks = useMemo(() => {
    if (!activeNote || !activeNote.title.trim()) return [];
    const needle = `[[${activeNote.title.trim().toLowerCase()}]]`;
    return allNotes.filter((n) => n.id !== activeNote.id && n.content.toLowerCase().includes(needle));
  }, [allNotes, activeNote?.id, activeNote?.title]);

  const renderableContent = useMemo(() => {
    if (!activeNote) return '';
    return activeNote.content.replace(/\[\[([^\[\]]+)\]\]/g, (match, rawTitle) => {
      const title = rawTitle.trim();
      const target = allNotes.find((n) => n.title.trim().toLowerCase() === title.toLowerCase());
      if (target) return `[${title}](leafbook-note:${target.id})`;
      return `[${title}](leafbook-missing:${encodeURIComponent(title)})`;
    });
  }, [activeNote?.content, allNotes]);

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

  const activeFolderName = activeNote.folder_id
    ? folders.find((f) => f.id === activeNote.folder_id)?.name ?? null
    : null;

  const trail = noteHistory
    .map((id) => allNotes.find((n) => n.id === id))
    .filter((n): n is Note => Boolean(n));

  // we keep the variable for the VineNav, but no longer use it for editor visuals
  // const wilted = isWilted(activeNote.updated_at, nowMs); // removed

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      addTag(tagInput.trim().toLowerCase().replace(/\s+/g, '-'));
      setTagInput('');
    }
  };

  const checkForLinkTrigger = (value: string, caret: number) => {
    const uptoCaret = value.slice(0, caret);
    const triggerIndex = uptoCaret.lastIndexOf('[[');
    if (triggerIndex === -1) { setLinkQuery(null); return; }
    const between = uptoCaret.slice(triggerIndex + 2);
    if (between.includes(']]') || between.includes('\n') || between.includes('[[')) {
      setLinkQuery(null);
      return;
    }
    setLinkQuery(between);
    setLinkQueryStart(triggerIndex);
    setLinkSelectedIndex(0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    updateActiveNote('content', value);
    checkForLinkTrigger(value, e.target.selectionStart);
  };

  const insertLink = (title: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    const before = activeNote.content.slice(0, linkQueryStart);
    const after = activeNote.content.slice(caret);
    const inserted = `[[${title}]]`;
    const newValue = before + inserted + after;
    updateActiveNote('content', newValue);
    setLinkQuery(null);
    requestAnimationFrame(() => {
      const newCaret = before.length + inserted.length;
      ta.focus();
      ta.setSelectionRange(newCaret, newCaret);
    });
  };

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (linkQuery === null || linkMatches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setLinkSelectedIndex((i) => Math.min(i + 1, linkMatches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setLinkSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertLink(linkMatches[linkSelectedIndex].title || 'Untitled Entry');
    } else if (e.key === 'Escape') {
      setLinkQuery(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 md:p-12 flex flex-col gap-4 sm:gap-5 relative min-w-0">
      <VineNav
        folderName={activeFolderName}
        trail={trail}
        activeNoteId={activeNote.id}
        onSelectNote={onSelectNote}
        nowMs={nowMs}
      />

      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <input 
          type="text" 
          placeholder="Untitled Entry" 
          value={activeNote.title}
          onChange={(e) => updateActiveNote('title', e.target.value)}
          className={`bg-transparent focus:outline-none text-xl sm:text-2xl md:text-3xl font-sans font-extrabold tracking-tight w-full caret-[#7CEA9C] selection:bg-emerald-500/10 transition-all duration-500 ${
            activeNote.title
              ? 'bg-gradient-to-r from-[#7CEA9C] via-[#34D399] to-[#059669] bg-clip-text text-transparent'
              : 'text-zinc-100 placeholder-zinc-800'
          }`}
        />
        <button
          onClick={() => setIsPreview((prev) => !prev)}
          className={`shrink-0 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 border rounded-sm font-bold transition-colors duration-150 ${
            isPreview
              ? 'border-[#7CEA9C]/50 text-[#7CEA9C] bg-emerald-950/30'
              : 'border-emerald-950/50 text-zinc-500 hover:text-zinc-300 hover:border-emerald-800/40'
          }`}
        >
          {isPreview ? 'Editing' : 'Preview'}
        </button>
        <div className="absolute -bottom-3 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-950 via-emerald-900/20 to-transparent"></div>
      </div>

      {/* Folder + tags row */}
      <div className="flex flex-wrap items-center gap-3 -mt-2">
        <select
          value={activeNote.folder_id ?? ''}
          onChange={(e) => setNoteFolder(e.target.value === '' ? null : e.target.value)}
          className="bg-black/30 border border-emerald-950/50 rounded-sm px-2 py-1 text-[10px] font-mono text-zinc-400 focus:outline-none focus:border-emerald-700/50"
        >
          <option value="">Unfiled</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-1.5">
          {(activeNote.tags || []).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-800/40 text-emerald-500/80 bg-emerald-950/20 flex items-center gap-1"
            >
              #{tag}
              <span
                onClick={() => removeTag(tag)}
                className="cursor-pointer text-red-500/60 hover:text-red-400 font-bold"
              >
                ×
              </span>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="+ tag"
            className="bg-transparent text-[10px] font-mono text-zinc-500 placeholder-zinc-700 focus:outline-none w-16 focus:w-24 transition-all"
          />
        </div>
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
            <ReactMarkdown
              components={{
                a: ({ href, children }) => {
                  if (href?.startsWith('leafbook-note:')) {
                    const noteId = href.replace('leafbook-note:', '');
                    return (
                      <span
                        onClick={() => onSelectNote(noteId)}
                        className="cursor-pointer underline decoration-dotted underline-offset-2 text-[#7CEA9C] hover:text-emerald-300"
                      >
                        {children}
                      </span>
                    );
                  }
                  if (href?.startsWith('leafbook-missing:')) {
                    return (
                      <span
                        title="No note with this title yet"
                        className="cursor-help underline decoration-dotted decoration-red-500/50 underline-offset-2 text-red-400/70"
                      >
                        {children}
                      </span>
                    );
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                },
              }}
            >
              {renderableContent}
            </ReactMarkdown>
          )}
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col min-h-0">
          <textarea 
            ref={textareaRef}
            placeholder="Write your thoughts... type [[ to link a note"
            value={activeNote.content}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            onClick={(e) => checkForLinkTrigger(activeNote.content, e.currentTarget.selectionStart)}
            style={
              activeNote.content 
                ? { textShadow: '-1px -0.5px 0px rgba(34, 211, 238, 0.35), 1px 0.5px 0px rgba(52, 211, 153, 0.3)' } 
                : {}
            }
            className="bg-transparent text-[#f8fafc] placeholder-zinc-800 focus:outline-none text-lg leading-relaxed flex-1 resize-none font-mono tracking-wide pt-4 caret-cyan-400 selection:bg-cyan-500/10"
          ></textarea>

          {linkQuery !== null && (
            <div className="absolute left-0 bottom-2 w-full max-w-sm rounded-sm border border-emerald-400/25 bg-[#070f0d]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.1)] overflow-hidden z-20">
              <div className="px-3 py-1.5 border-b border-white/[0.06] text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                link a note {linkQuery && `— "${linkQuery}"`}
              </div>
              {linkMatches.length === 0 ? (
                <div className="px-3 py-3 text-[11px] font-mono text-zinc-600 italic">no matching notes</div>
              ) : (
                <div className="py-1">
                  {linkMatches.map((n, i) => (
                    <div
                      key={n.id}
                      onMouseDown={(e) => { e.preventDefault(); insertLink(n.title || 'Untitled Entry'); }}
                      onMouseEnter={() => setLinkSelectedIndex(i)}
                      className={`px-3 py-1.5 text-xs font-mono cursor-pointer truncate ${
                        i === linkSelectedIndex ? 'bg-emerald-400/10 text-[#7CEA9C]' : 'text-zinc-300'
                      }`}
                    >
                      {n.title.trim() === '' ? 'Untitled Entry' : n.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {backlinks.length > 0 && (
        <div className="border-t border-emerald-950/30 pt-3 -mb-1">
          <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-600 mb-1.5">
            Linked from ({backlinks.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {backlinks.map((n) => (
              <span
                key={n.id}
                onClick={() => onSelectNote(n.id)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-800/40 text-emerald-500/80 bg-emerald-950/10 cursor-pointer hover:border-emerald-600/50 hover:text-[#7CEA9C] transition-colors"
              >
                {n.title.trim() === '' ? 'Untitled Entry' : n.title}
              </span>
            ))}
          </div>
        </div>
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