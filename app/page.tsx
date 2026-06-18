'use client';
import React from 'react';
import { useState } from 'react';

export default function Home() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  return (
    <div className="w-screen h-screen bg-[#020604] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)] flex items-center justify-center p-6 font-sans">
      
      {/* OUTER CHASSIS: Sharp, deep slate/emerald container with heavy ambient shadow */}
      <main className="w-[90vw] h-[85vh] max-w-6xl border border-emerald-950/60 bg-[#0b0910] relative flex overflow-hidden shadow-[0_0_80px_rgba(2,20,10,0.6)]">
        
        {/* VISUAL DETAIL: High-end tech corner brackets in sharp mint-green */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#7CEA9C] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#7CEA9C] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#7CEA9C] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#7CEA9C] pointer-events-none"></div>

        {/* BIOLUMINESCENT GLINT: Subtle background aura filtering through the split grid */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7CEA9C]/3 rounded-full blur-[120px] pointer-events-none" />

        {/* LEFT PANEL: Sidebar Note Library */}
        <aside className="w-72 border-r border-emerald-950/40 bg-black/40 flex flex-col z-10">
          
          {/* Sidebar Header - Clean, professional layout with a single glowing state dot */}
          <div className="p-4 border-b border-emerald-950/30 bg-black/20 flex justify-between items-center">
            <h2 className="text-[11px] font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2 font-mono">
              <span className="w-1 h-1 bg-[#7CEA9C] inline-block shadow-[0_0_6px_#7CEA9C]"></span>
              All Entries
            </h2>
            <span className="text-[10px] font-mono border border-emerald-950/60 text-emerald-500/80 px-2 py-0.5 bg-emerald-950/10">
              03
            </span>
          </div>

          {/* Note Feed Container */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            
            {/* Active Selected Entry (Infused with a sharp green accent glint) */}
            <div className="p-3 bg-[#111c16]/40 border border-emerald-500/30 relative cursor-pointer group shadow-[inset_0_0_12px_rgba(114,234,156,0.03)]">
              {/* Micro-indicator glint inside the active item */}
              <div className="absolute top-0 right-0 w-1 h-1 bg-[#7CEA9C]"></div>
              
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-xs font-bold text-zinc-100 truncate tracking-wide">Weekly Progress Review</h3>
                <span className="text-[9px] text-zinc-500 font-mono ml-2">06.17</span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate leading-normal">Core engine architecture is stable. Moving toward state management layout configurations...</p>
            </div>

            {/* Past Entry 1 */}
            <div className="p-3 border border-emerald-950/30 bg-black/10 hover:border-emerald-800/40 cursor-pointer transition-all duration-150 group">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 truncate tracking-wide">Project Roadmap Planning</h3>
                <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 font-mono ml-2">06.12</span>
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 truncate leading-normal">Decided on isolated linear learning progression: React, then TypeScript, then Next.js...</p>
            </div>

            {/* Past Entry 2 */}
            <div className="p-3 border border-emerald-950/30 bg-black/10 hover:border-emerald-800/40 cursor-pointer transition-all duration-150 group">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 truncate tracking-wide">Initial Component Setup</h3>
                <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 font-mono ml-2">05.29</span>
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 truncate leading-normal">Configured basic Next.js setup with tailwind variables inside global configuration files...</p>
            </div>

          </div>

        </aside>

        {/* RIGHT PANEL: The Main Writing Canvas */}
        <div className="flex-1 flex flex-col bg-transparent relative z-10">
          
          {/* Top Info Bar - Zero text fluff, just clean tracking lines and date */}
          <div className="px-8 py-3 border-b border-emerald-950/30 bg-black/20 flex justify-between items-center text-[10px] font-mono text-zinc-500 tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-emerald-800 rounded-full"></span>
              <span className="text-zinc-400 font-semibold">LEAFBOOK // EDITOR</span>
            </div>
            <div className="text-zinc-400 uppercase">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
            </div>
          </div>

          {/* Writing Canvas Enclosure */}
          <div className="flex-1 p-8 md:p-12 flex flex-col gap-6 relative">
            
            {/* Title Block - Crisp, clean, large serif typography with subtle gradient boundary rule */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Untitled Entry" 
                className="bg-transparent text-zinc-100 placeholder-zinc-800 focus:outline-none text-3xl font-serif font-bold tracking-tight w-full caret-[#55D6BE]"
              />
              {/* Sharp architectural accent line under title */}
              <div className="absolute -bottom-3 left-0 w-full h-[1px] bg-gradient-to-r from-emerald-950 via-emerald-900/20 to-transparent"></div>
            </div>

            {/* Main Content Body (Pure distraction-free writing viewport) */}
            <textarea 
              placeholder="Write your thoughts..."
              className="bg-transparent text-zinc-300 placeholder-zinc-800 focus:outline-none text-lg leading-relaxed flex-1 resize-none font-serif tracking-wide pt-4 caret-[#7CEA9C]"
            ></textarea>

            {/* Premium Minimalist Footer */}
            <div className="flex justify-between items-center text-[10px] font-mono border-t border-emerald-950/30 pt-4 text-zinc-500 tracking-widest">
              <div>
                WORDS: <span className="text-zinc-300">0</span>
              </div>
              {/* Micro green glint pulsing node in the corner */}
              <div className="text-[#7CEA9C]/80 flex items-center gap-2 font-semibold">
                <span className="w-1 h-1 rounded-full bg-[#7CEA9C] shadow-[0_0_6px_#7CEA9C] animate-pulse"></span>
                READY
              </div>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}