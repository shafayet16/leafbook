'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FREQUENCY_SPECTRUM = [
  { level: 7, label: 'Singularity', color: '#ffffff', shadow: 'rgba(255,255,255,0.7)', bg: 'bg-white text-black' },
  { level: 6, label: 'Ascended',   color: '#ec4899', shadow: 'rgba(236,72,153,0.5)', bg: 'bg-pink-600 text-white' },
  { level: 5, label: 'Overdrive',  color: '#a855f7', shadow: 'rgba(168,85,247,0.4)', bg: 'bg-purple-600 text-white' },
  { level: 4, label: 'Flow',       color: '#06b6d4', shadow: 'rgba(6,182,212,0.5)',  bg: 'bg-cyan-500 text-black' },
  { level: 3, label: 'Resonance',  color: '#10b981', shadow: 'rgba(16,185,129,0.3)', bg: 'bg-emerald-600 text-white' },
  { level: 2, label: 'Static',     color: '#27272a', shadow: 'rgba(39,39,42,0.2)',   bg: 'bg-zinc-800 text-zinc-200' },
  { level: 1, label: 'Void',       color: '#09090b', shadow: 'rgba(9,9,11,0.1)',     bg: 'bg-zinc-900 text-zinc-400' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ViewMode = 'pure' | 'detail' | 'minimized';

export default function MoodCalendar() {
  const [moods, setMoods] = useState<Record<string, number>>({});
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [surgeState, setSurgeState] = useState<'idle' | 'transition-cyan' | 'returning-pink'>('idle');
  
  // Tactical view state controller
  const [viewMode, setViewMode] = useState<ViewMode>('pure');

  const fetchMonthData = async (targetDate: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('moods')
      .select('date, mood')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .eq('user_id', user.id);

    if (data) {
      const map: Record<string, number> = {};
      data.forEach((d: any) => {
        let val = parseInt(d.mood);
        if (!isNaN(val)) map[d.date] = val;
      });
      setMoods(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMonthData(viewDate);
  }, [viewDate]);

  const triggerNaniteSurgeSequence = () => {
    setSurgeState('transition-cyan');
    setTimeout(() => {
      setSurgeState('returning-pink');
      setTimeout(() => {
        setSurgeState('idle');
      }, 500); 
    }, 400); 
  };

  const saveMood = async (level: number) => {
    if (!selectedDate) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    triggerNaniteSurgeSequence();
    
    await supabase.from('moods').upsert({ 
      user_id: user.id, 
      date: selectedDate, 
      mood: level.toString() 
    });
    
    setMoods(prev => ({ ...prev, [selectedDate]: level }));
    setSelectedDate(null);
    setHoverLevel(null);
  };

  const adjustMonth = (offset: number) => {
    setLoading(true);
    const updatedDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(updatedDate);
  };

  const getDaysForGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayInstance = new Date(year, month, 1);
    const structuralOffset = firstDayInstance.getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const gridCells: (Date | null)[] = [];
    for (let i = 0; i < structuralOffset; i++) gridCells.push(null);
    for (let day = 1; day <= totalDaysInMonth; day++) gridCells.push(new Date(year, month, day));
    while (gridCells.length % 7 !== 0) gridCells.push(null);

    return gridCells;
  };

  const gridCells = getDaysForGrid();

  const getSurgeBorderClass = () => {
    if (surgeState === 'transition-cyan') return 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-[#040609]';
    if (surgeState === 'returning-pink') return 'border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.12)] bg-[#040609]';
    return 'border-zinc-900 bg-zinc-950/20';
  };

  // Generate mock telemetry analytics metrics for Detail View mode
  const totalEntries = Object.keys(moods).length;
  const highFrequencyCount = Object.values(moods).filter(lvl => lvl >= 5).length;
  const systemSyncRate = totalEntries > 0 ? Math.round((highFrequencyCount / totalEntries) * 100) : 0;

  return (
    <div className="w-full h-full text-zinc-300 selection:bg-zinc-800 p-4 sm:p-6 flex flex-col justify-start items-center">
      
      {/* Sci-Fi Embedded Custom Scrollbar Styling Injection */}
      <style jsx global>{`
        .scifi-scroll::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scifi-scroll::-webkit-scrollbar-track {
          background: rgba(9, 9, 11, 0.4);
          border-left: 1px solid rgba(39, 39, 42, 0.2);
        }
        .scifi-scroll::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 0px;
          transition: all 0.2s;
        }
        .scifi-scroll::-webkit-scrollbar-thumb:hover {
          background: #ec4899;
          box-shadow: 0 0 8px rgba(236, 72, 153, 0.6);
        }
      `}</style>

      {/* Main Structural Boundary Frame */}
      <div className={`w-full transition-all duration-300 flex flex-col gap-5 ${viewMode === 'minimized' ? 'max-w-xl' : 'max-w-full'}`}>
        
        {/* Upper Master Controls Block */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-sm md:text-base font-light tracking-[0.2em] text-zinc-100 uppercase">Leafbook Continuum</h1>
              <span className="text-[7px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-widest">{viewMode}_MODE</span>
            </div>
            <p className="text-[8.5px] font-mono text-zinc-600 tracking-widest uppercase">Granular chronographic layer optimization array</p>
          </div>

          {/* VIEW MODE TOGGLE CONSOLE BOARD */}
          <div className="flex items-center bg-black border border-zinc-900 p-0.5 rounded-sm font-mono text-[9px] tracking-wider select-none w-full sm:w-auto justify-between">
            <button 
              onClick={() => setViewMode('pure')}
              className={`px-3 py-1.5 transition-all rounded-sm uppercase ${viewMode === 'pure' ? 'bg-zinc-900 text-white font-bold border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              // PURE_GRID
            </button>
            <button 
              onClick={() => setViewMode('detail')}
              className={`px-3 py-1.5 transition-all rounded-sm uppercase ${viewMode === 'detail' ? 'bg-zinc-900 text-white font-bold border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              // SYSTEM_REPORTS
            </button>
            <button 
              onClick={() => setViewMode('minimized')}
              className={`px-3 py-1.5 transition-all rounded-sm uppercase ${viewMode === 'minimized' ? 'bg-zinc-900 text-white font-bold border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              // MICRO_MATRIX
            </button>
          </div>
        </div>

        {/* Calendar Core Section Wrapper (With responsive Layout Engine dependent on viewMode) */}
        <div className={`w-full flex flex-col gap-5 ${viewMode === 'detail' ? 'lg:grid lg:grid-cols-4' : ''}`}>
          
          {/* Main Matrix Board Grid */}
          <div className={`transition-all duration-300 ${viewMode === 'detail' ? 'lg:col-span-3' : 'w-full'}`}>
            
            {/* Navigational Bar Anchor */}
            <div className="w-full flex justify-between items-center mb-2.5 px-1">
              <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-zinc-500 uppercase">CHRONO_INDEX</span>
              
              <div className="flex items-center bg-zinc-950/40 border border-zinc-900 px-2 py-0.5 rounded-sm select-none">
                <button onClick={() => adjustMonth(-1)} className="text-zinc-600 hover:text-zinc-300 font-mono text-[10px] px-2 focus:outline-none">&lt;</button>
                <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-zinc-300 min-w-[70px] text-center">
                  {viewDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
                <button onClick={() => adjustMonth(1)} className="text-zinc-600 hover:text-zinc-300 font-mono text-[10px] px-2 focus:outline-none">&gt;</button>
              </div>
            </div>

            {loading ? (
              <div className="w-full aspect-[4/3] flex items-center justify-center bg-black/10 rounded-sm border border-zinc-950">
                <p className="text-[9px] font-mono text-zinc-600 animate-pulse tracking-[0.3em] uppercase">Realigning array matrices...</p>
              </div>
            ) : (
              /* THE VIEWPORT WRAPPER: Handles vertical scaling seamlessly via scifi-scroll if boxes hit max ceiling constraints */
              <div className={`w-full p-4 rounded-sm border transition-all duration-500 flex flex-col gap-3 overflow-y-auto scifi-scroll ${getSurgeBorderClass()} ${
                viewMode === 'minimized' ? 'max-h-[360px]' : 'max-h-[64vh]'
              }`}>
                
                {/* Weekday Strip Headers */}
                <div className="grid grid-cols-7 w-full text-center border-b border-zinc-900/60 pb-2 shrink-0">
                  {WEEKDAYS.map((day, idx) => (
                    <span key={day} className={`text-[9px] font-mono font-bold tracking-[0.15em] uppercase ${idx === 0 || idx === 6 ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {day.substring(0, viewMode === 'minimized' ? 1 : 3)}
                    </span>
                  ))}
                </div>

                {/* Grid Sizing System Based on Mode States */}
                <div className={`grid grid-cols-7 w-full ${viewMode === 'minimized' ? 'gap-1' : 'gap-2 md:gap-3'}`}>
                  {gridCells.map((cell, idx) => {
                    if (!cell) {
                      return <div key={`empty-${idx}`} className="w-full aspect-square bg-zinc-950/20 border border-zinc-950/40 rounded-sm opacity-20" />;
                    }

                    const dateStr = cell.toISOString().split('T')[0];
                    const currentLevel = moods[dateStr];
                    const moodDef = FREQUENCY_SPECTRUM.find(m => m.level === currentLevel);
                    const isToday = cell.toDateString() === new Date().toDateString();

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        style={{
                          backgroundColor: moodDef ? moodDef.color : undefined,
                          boxShadow: moodDef ? `0 0 16px ${moodDef.shadow}` : undefined,
                        }}
                        className={`w-full aspect-square rounded-sm border flex flex-col justify-between items-start relative transition-all duration-200 group ${
                          viewMode === 'minimized' ? 'p-1' : 'p-2 md:p-3'
                        } ${
                          !moodDef 
                            ? 'bg-zinc-950/40 border-zinc-900/80 hover:border-zinc-700/50 hover:bg-zinc-900/20' 
                            : 'border-transparent hover:scale-[1.03] z-10'
                        } ${isToday ? 'ring-1 ring-zinc-400 ring-offset-2 ring-offset-[#030508]' : ''}`}
                      >
                        {/* Cell Numerical Label */}
                        <span className={`font-mono transition-colors ${viewMode === 'minimized' ? 'text-[8px]' : 'text-[9px] md:text-[11px]'} ${
                          moodDef ? (currentLevel === 7 ? 'text-black font-bold' : 'text-white/90 font-bold') : 'text-zinc-600 group-hover:text-zinc-400'
                        }`}>
                          {cell.getDate().toString().padStart(2, '0')}
                        </span>

                        {/* Text Label Layer (Hidden automatically in minimized micro-deck view) */}
                        {moodDef && viewMode !== 'minimized' && (
                          <span className={`text-[7px] md:text-[8px] font-mono uppercase tracking-wider hidden xs:block truncate max-w-full ${
                            currentLevel === 7 ? 'text-black/60' : 'text-white/50'
                          }`}>
                            {moodDef.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DETAIL STATE VIEW SIDEBAR: Active only during System Reports Mode */}
          {viewMode === 'detail' && (
            <div className="w-full lg:col-span-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-sm flex flex-col gap-4 h-full justify-between">
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase">// CONTINUUM_DIAGNOSTICS</span>
                  
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase block">NODE LOGS LOGGED</span>
                    <span className="text-xl font-mono tracking-wider font-light text-zinc-200">{totalEntries} <span className="text-xs text-zinc-600">/ 31</span></span>
                  </div>

                  <div className="border-b border-zinc-900 pb-2">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase block">OVERDRIVE BURST FREQ</span>
                    <span className="text-xl font-mono tracking-wider font-light text-purple-400">{highFrequencyCount} <span className="text-xs text-zinc-600">DAYS</span></span>
                  </div>

                  <div>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase block">HIGH-FREQUENCY SYNC RATE</span>
                    <span className="text-xl font-mono tracking-wider font-light text-cyan-400">{systemSyncRate}%</span>
                    <div className="w-full bg-zinc-900 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${systemSyncRate}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 border border-zinc-900/60 p-2 rounded-sm text-[7.5px] font-mono text-zinc-500 uppercase tracking-wider leading-relaxed">
                  SYSTEM TELEMETRY IS ACTIVE. RECORDED LAYER FREQUENCIES STREAM SECURELY TO THE HORIZON REPOSITORY.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lower Reference Spectrum Deck (Condensed horizontally into neat sci-fi columns) */}
        <div className="w-full bg-zinc-950/30 border border-zinc-900 p-3 rounded-sm flex flex-col gap-2 shrink-0">
          <span className="text-[8px] font-mono font-bold text-zinc-600 tracking-widest uppercase">// SPECTRUM_INDEX_CHART</span>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {FREQUENCY_SPECTRUM.map((f) => (
              <div key={f.level} className="bg-black/30 border border-zinc-900/80 p-2 rounded-sm flex flex-col gap-1 font-mono">
                <div className="flex justify-between items-center">
                  <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: f.color, boxShadow: `0 0 6px ${f.shadow}` }} />
                  <span className="text-[7px] text-zinc-600">0{f.level}</span>
                </div>
                <span className="text-[8.5px] font-bold text-zinc-400 truncate uppercase">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Frequency Modification Modal Drawer */}
      {selectedDate && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { setSelectedDate(null); setHoverLevel(null); }}
        >
          <div 
            className="w-full max-w-xs bg-[#06080d] border border-zinc-800 p-5 rounded-sm shadow-2xl flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[7.5px] font-mono text-zinc-500 tracking-widest block uppercase mb-0.5">TARGET INTERVAL DATELINE</span>
              <h3 className="text-xs font-light text-zinc-200 tracking-wider uppercase font-mono">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
            </div>

            <div 
              className="flex flex-col gap-1 bg-black/40 p-1 border border-zinc-900 rounded-sm"
              onMouseLeave={() => setHoverLevel(null)}
            >
              {FREQUENCY_SPECTRUM.map((f) => {
                const currentVal = moods[selectedDate] ?? 0;
                const isSelectedOrHovered = (hoverLevel ?? currentVal) >= f.level;
                const isExactTarget = (hoverLevel ?? currentVal) === f.level;

                return (
                  <button
                    key={f.level}
                    onMouseEnter={() => setHoverLevel(f.level)}
                    onClick={() => saveMood(f.level)}
                    className="w-full flex items-center justify-between p-2 rounded-sm border border-transparent transition-all group relative overflow-hidden text-left focus:outline-none"
                  >
                    <div 
                      className={`absolute inset-0 transition-transform duration-200 origin-left -z-10 ${
                        isSelectedOrHovered ? 'scale-x-100 opacity-10' : 'scale-x-0'
                      }`}
                      style={{ backgroundColor: f.color }}
                    />

                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-2 h-2 rounded-sm transition-all"
                        style={{ 
                          backgroundColor: isSelectedOrHovered ? f.color : '#1f2937',
                          boxShadow: isSelectedOrHovered ? `0 0 10px ${f.shadow}` : 'none' 
                        }}
                      />
                      <span className={`text-[11px] font-mono tracking-wide transition-colors ${isExactTarget ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                        {f.label}
                      </span>
                    </div>

                    <span className="text-[8px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      [0{f.level}]
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-1">
              <button 
                onClick={() => {
                  const updated = { ...moods };
                  delete updated[selectedDate];
                  setMoods(updated);
                  setSelectedDate(null);
                }}
                className="text-[8.5px] font-mono text-red-400/60 hover:text-red-400 tracking-widest uppercase transition-colors"
              >
                [ Clear ]
              </button>
              <button 
                onClick={() => { setSelectedDate(null); setHoverLevel(null); }}
                className="text-[8.5px] font-mono text-zinc-500 hover:text-zinc-300 tracking-widest uppercase transition-colors"
              >
                [ Close ]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}