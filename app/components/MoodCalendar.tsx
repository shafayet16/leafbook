'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MOOD_LEVELS = [
  { level: 7, label: 'Singularity', color: '#ffffff', shadow: 'rgba(255,255,255,0.7)', bg: 'bg-white text-black' },
  { level: 6, label: 'Ascended',   color: '#ec4899', shadow: 'rgba(236,72,153,0.5)', bg: 'bg-pink-600 text-white' },
  { level: 5, label: 'Overdrive',  color: '#a855f7', shadow: 'rgba(168,85,247,0.4)', bg: 'bg-purple-600 text-white' },
  { level: 4, label: 'Flow',       color: '#06b6d4', shadow: 'rgba(6,182,212,0.5)',  bg: 'bg-cyan-500 text-black' },
  { level: 3, label: 'Resonance',  color: '#10b981', shadow: 'rgba(16,185,129,0.3)', bg: 'bg-emerald-600 text-white' },
  { level: 2, label: 'Static',     color: '#27272a', shadow: 'rgba(39,39,42,0.2)',   bg: 'bg-zinc-800 text-zinc-200' },
  { level: 1, label: 'Void',       color: '#09090b', shadow: 'rgba(9,9,11,0.1)',     bg: 'bg-zinc-900 text-zinc-400' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ViewMode = 'grid' | 'details';   // compact removed

const GOOD_MOOD_THRESHOLD = 4; // Flow and above are “good”

export default function MoodCalendar() {
  const [moods, setMoods] = useState<Record<string, number>>({});
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [surgeState, setSurgeState] = useState<'idle' | 'transition-cyan' | 'returning-pink'>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Statistics state (fetched once, updated when moods change)
  const [stats, setStats] = useState<{
    streak: number;
    goodPercent: number;
    avgLast7: number;
    avgLast30: number;
    avgPrev7: number;
    recentMoods: { date: string; level: number; color: string }[];
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch month data for calendar
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

  // Fetch long‑term statistics for the details panel
  const fetchStats = async () => {
    setStatsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const from = oneYearAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('moods')
      .select('date, mood')
      .gte('date', from)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error || !data) {
      setStats(null);
      setStatsLoading(false);
      return;
    }

    const moodMap: Record<string, number> = {};
    data.forEach((d: any) => {
      const val = parseInt(d.mood);
      if (!isNaN(val)) moodMap[d.date] = val;
    });

    // Streak
    let streak = 0;
    const today = new Date();
    const check = new Date(today);
    while (true) {
      const key = check.toISOString().split('T')[0];
      if (moodMap[key] !== undefined) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }

    // Last 30 days
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const dates30: string[] = [];
    for (let d = new Date(today); d >= thirtyDaysAgo; d.setDate(d.getDate() - 1)) {
      dates30.push(d.toISOString().split('T')[0]);
    }
    const moods30 = dates30.map(d => moodMap[d]).filter(l => l !== undefined) as number[];
    const goodCount = moods30.filter(l => l >= GOOD_MOOD_THRESHOLD).length;
    const goodPercent = moods30.length ? Math.round((goodCount / moods30.length) * 100) : 0;
    const avgLast30 = moods30.length ? moods30.reduce((a, b) => a + b, 0) / moods30.length : 0;

    // Last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const dates7: string[] = [];
    for (let d = new Date(today); d >= sevenDaysAgo; d.setDate(d.getDate() - 1)) {
      dates7.push(d.toISOString().split('T')[0]);
    }
    const moods7 = dates7.map(d => moodMap[d]).filter(l => l !== undefined) as number[];
    const avgLast7 = moods7.length ? moods7.reduce((a, b) => a + b, 0) / moods7.length : 0;

    // Previous 7 days (for trend)
    const prev7DaysAgo = new Date(today);
    prev7DaysAgo.setDate(prev7DaysAgo.getDate() - 13);
    const datesPrev7: string[] = [];
    for (let d = new Date(sevenDaysAgo); d >= prev7DaysAgo; d.setDate(d.getDate() - 1)) {
      datesPrev7.push(d.toISOString().split('T')[0]);
    }
    const moodsPrev7 = datesPrev7.map(d => moodMap[d]).filter(l => l !== undefined) as number[];
    const avgPrev7 = moodsPrev7.length ? moodsPrev7.reduce((a, b) => a + b, 0) / moodsPrev7.length : 0;

    // Recent 7‑day visual (oldest to newest)
    const recentMoods = dates7.map(date => ({
      date,
      level: moodMap[date] || 0,
      color: getMoodColor(moodMap[date] || 0),
    })).reverse();

    setStats({ streak, goodPercent, avgLast7, avgLast30, avgPrev7, recentMoods });
    setStatsLoading(false);
  };

  useEffect(() => {
    // Fetch stats whenever the details view is opened
    if (viewMode === 'details') {
      fetchStats();
    }
  }, [viewMode, moods]); // re‑fetch when moods change (e.g., after saving)

  const getMoodColor = (level: number) => {
    const colors = ['#09090b', '#27272a', '#10b981', '#06b6d4', '#a855f7', '#ec4899', '#ffffff'];
    return colors[level] || '#27272a';
  };

  const triggerVisualFeedback = () => {
    setSurgeState('transition-cyan');
    setTimeout(() => {
      setSurgeState('returning-pink');
      setTimeout(() => setSurgeState('idle'), 500);
    }, 400);
  };

  const saveMood = async (level: number) => {
    if (!selectedDate) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    triggerVisualFeedback();
    await supabase.from('moods').upsert({ user_id: user.id, date: selectedDate, mood: level.toString() });
    setMoods(prev => ({ ...prev, [selectedDate]: level }));
    setSelectedDate(null);
    setHoverLevel(null);
  };

  const adjustMonth = (offset: number) => {
    setLoading(true);
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const getDaysForGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const gridCells = getDaysForGrid();

  const getBorderEffect = () => {
    if (surgeState === 'transition-cyan') return 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-[#040609]';
    if (surgeState === 'returning-pink') return 'border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.12)] bg-[#040609]';
    return 'border-zinc-900 bg-zinc-950/20';
  };

  const totalEntries = Object.keys(moods).length;
  const highFreq = Object.values(moods).filter(l => l >= 5).length;
  const syncRate = totalEntries ? Math.round((highFreq / totalEntries) * 100) : 0;

  const trend = stats ? stats.avgLast7 - stats.avgPrev7 : 0;

  return (
    <div className="w-full h-full text-zinc-300 selection:bg-zinc-800 p-4 sm:p-6 flex flex-col justify-start items-center">
      <style jsx global>{`
        .scifi-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .scifi-scroll::-webkit-scrollbar-track { background: rgba(9,9,11,0.4); border-left: 1px solid rgba(39,39,42,0.2); }
        .scifi-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 0px; transition: all 0.2s; }
        .scifi-scroll::-webkit-scrollbar-thumb:hover { background: #ec4899; box-shadow: 0 0 8px rgba(236,72,153,0.6); }
      `}</style>

      <div className="w-full transition-all duration-300 flex flex-col gap-5">
        
        {/* Header – no statistics icon needed; stats are inside details */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-sm md:text-base font-light tracking-[0.2em] text-zinc-100 uppercase">Mood Tracker</h1>
            </div>
            <p className="text-[8.5px] font-mono text-zinc-600 tracking-widest uppercase">Daily mood log</p>
          </div>

          <div className="flex items-center bg-black border border-zinc-900 p-0.5 rounded-sm font-mono text-[9px] tracking-wider select-none w-full sm:w-auto justify-between">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 transition-all rounded-sm uppercase ${viewMode === 'grid' ? 'bg-zinc-900 text-white font-bold border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}>Calendar</button>
            <button onClick={() => setViewMode('details')} className={`px-3 py-1.5 transition-all rounded-sm uppercase ${viewMode === 'details' ? 'bg-zinc-900 text-white font-bold border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}>Details</button>
          </div>
        </div>

        {/* Calendar grid and details sidebar */}
        <div className={`w-full flex flex-col gap-5 ${viewMode === 'details' ? 'lg:grid lg:grid-cols-4' : ''}`}>
          
          <div className={`transition-all duration-300 ${viewMode === 'details' ? 'lg:col-span-3' : 'w-full'}`}>
            <div className="w-full flex justify-between items-center mb-2.5 px-1">
              <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-zinc-500 uppercase">Month</span>
              <div className="flex items-center bg-zinc-950/40 border border-zinc-900 px-2 py-0.5 rounded-sm select-none">
                <button onClick={() => adjustMonth(-1)} className="text-zinc-600 hover:text-zinc-300 font-mono text-[10px] px-2">&lt;</button>
                <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-zinc-300 min-w-[70px] text-center">
                  {viewDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
                <button onClick={() => adjustMonth(1)} className="text-zinc-600 hover:text-zinc-300 font-mono text-[10px] px-2">&gt;</button>
              </div>
            </div>

            {loading ? (
              <div className="w-full aspect-[4/3] flex items-center justify-center bg-black/10 rounded-sm border border-zinc-950">
                <p className="text-[9px] font-mono text-zinc-600 animate-pulse tracking-[0.3em] uppercase">Loading...</p>
              </div>
            ) : (
              <div className={`w-full p-4 rounded-sm border transition-all duration-500 flex flex-col gap-3 overflow-y-auto scifi-scroll relative ${getBorderEffect()} max-h-[64vh]`}>
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/60 via-transparent to-zinc-900/40 pointer-events-none" />
                <div className="grid grid-cols-7 w-full text-center border-b border-zinc-900/60 pb-2 shrink-0 relative z-10">
                  {WEEKDAYS.map((day, idx) => (
                    <span key={day} className={`text-[9px] font-mono font-bold tracking-[0.15em] uppercase ${idx === 0 || idx === 6 ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {day.substring(0, 3)}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 w-full gap-2 md:gap-3 relative z-10">
                  {gridCells.map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} className="w-full aspect-square bg-zinc-950/20 border border-zinc-950/40 rounded-sm opacity-20" />;
                    const dateStr = cell.toISOString().split('T')[0];
                    const level = moods[dateStr];
                    const moodDef = MOOD_LEVELS.find(m => m.level === level);
                    const isToday = cell.toDateString() === new Date().toDateString();
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        style={{ backgroundColor: moodDef ? moodDef.color : undefined, boxShadow: moodDef ? `0 0 16px ${moodDef.shadow}` : undefined }}
                        className={`w-full aspect-square rounded-sm border flex flex-col justify-between items-start relative transition-all duration-200 group p-2 md:p-3 ${
                          !moodDef ? 'bg-zinc-950/40 border-zinc-900/80 hover:border-zinc-700/50 hover:bg-zinc-900/20' : 'border-transparent hover:scale-[1.03] z-10'
                        } ${isToday ? 'ring-1 ring-zinc-400 ring-offset-2 ring-offset-[#030508]' : ''}`}
                      >
                        <span className={`font-mono transition-colors text-[9px] md:text-[11px] ${
                          moodDef ? (level === 7 ? 'text-black font-bold' : 'text-white/90 font-bold') : 'text-zinc-600 group-hover:text-zinc-400'
                        }`}>
                          {cell.getDate().toString().padStart(2, '0')}
                        </span>
                        {moodDef && (
                          <span className={`text-[7px] md:text-[8px] font-mono uppercase tracking-wider hidden xs:block truncate max-w-full ${level === 7 ? 'text-black/60' : 'text-white/50'}`}>
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

          {/* DETAILS SIDEBAR (active only in details mode) */}
          {viewMode === 'details' && (
            <div className="w-full lg:col-span-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[64vh] overflow-y-auto scifi-scroll">
              {/* Monthly overview */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-sm flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase">Monthly Overview</span>
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase block">Entries this month</span>
                    <span className="text-xl font-mono tracking-wider font-light text-zinc-200">{totalEntries} <span className="text-xs text-zinc-600">/ 31</span></span>
                  </div>
                  <div className="border-b border-zinc-900 pb-2">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase block">High‑energy days</span>
                    <span className="text-xl font-mono tracking-wider font-light text-purple-400">{highFreq} <span className="text-xs text-zinc-600">days</span></span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase block">Synchronization rate</span>
                    <span className="text-xl font-mono tracking-wider font-light text-cyan-400">{syncRate}%</span>
                    <div className="w-full bg-zinc-900 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${syncRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Extended Statistics */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-sm flex flex-col gap-4">
                <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase">Mood Statistics</span>
                {statsLoading ? (
                  <div className="py-8 text-center text-xs text-zinc-600 animate-pulse">Crunching numbers...</div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 border border-zinc-800 p-3 rounded-sm text-center">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Current Streak</p>
                        <p className="text-2xl font-bold text-zinc-200">{stats.streak}</p>
                        <p className="text-[10px] text-zinc-500">days</p>
                      </div>
                      <div className="bg-black/30 border border-zinc-800 p-3 rounded-sm text-center">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Good Days</p>
                        <p className="text-2xl font-bold text-emerald-400">{stats.goodPercent}%</p>
                        <p className="text-[10px] text-zinc-500">last 30 days</p>
                      </div>
                      <div className="bg-black/30 border border-zinc-800 p-3 rounded-sm text-center">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">7‑Day Avg</p>
                        <p className="text-2xl font-bold text-zinc-200">{stats.avgLast7.toFixed(1)}</p>
                        <p className="text-[10px] text-zinc-500">out of 7</p>
                      </div>
                      <div className="bg-black/30 border border-zinc-800 p-3 rounded-sm text-center">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Trend</p>
                        <p className={`text-2xl font-bold ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}
                        </p>
                        <p className="text-[10px] text-zinc-500">vs last week</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider mb-2">Last 7 Days</p>
                      <div className="flex gap-1.5 items-center justify-center flex-wrap">
                        {stats.recentMoods.map(day => (
                          <div key={day.date} className="w-7 h-7 rounded-sm border border-zinc-800 flex items-center justify-center text-[10px] font-mono"
                            style={{ backgroundColor: day.level ? day.color : 'transparent', opacity: day.level ? 1 : 0.2 }}
                            title={`${day.date}: level ${day.level}`}>
                            {day.date.slice(8)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-black/20 border border-zinc-900 p-3 rounded-sm text-[10px] text-zinc-500 leading-relaxed">
                      <p className="font-bold text-zinc-300 mb-1">How we calculate</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li><strong>Streak</strong> – consecutive days with any mood logged.</li>
                        <li><strong>Good Days</strong> – percentage of days rated Flow or higher (≥4) in the last 30 days.</li>
                        <li><strong>7‑Day Avg</strong> – average mood level over the last 7 days.</li>
                        <li><strong>Trend</strong> – change in 7‑day average compared to the previous 7 days.</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-600">No mood data yet. Start logging to see statistics.</div>
                )}
              </div>

              {/* Mood scale (was in compact view, now here) */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-sm flex flex-col gap-3">
                <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest uppercase">Mood Scale</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MOOD_LEVELS.map((f) => (
                    <div key={f.level} className="bg-black/30 border border-zinc-900/80 p-2 rounded-sm flex flex-col gap-1 font-mono">
                      <div className="flex justify-between items-center">
                        <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: f.color, boxShadow: `0 0 6px ${f.shadow}` }} />
                        <span className="text-[7px] text-zinc-600">{f.level}</span>
                      </div>
                      <span className="text-[8.5px] font-bold text-zinc-400 truncate uppercase">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mood scale footer (only in grid view) */}
        {viewMode === 'grid' && (
          <div className="w-full bg-zinc-950/30 border border-zinc-900 p-3 rounded-sm flex flex-col gap-2 shrink-0">
            <span className="text-[8px] font-mono font-bold text-zinc-600 tracking-widest uppercase">Mood scale</span>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {MOOD_LEVELS.map((f) => (
                <div key={f.level} className="bg-black/30 border border-zinc-900/80 p-2 rounded-sm flex flex-col gap-1 font-mono">
                  <div className="flex justify-between items-center">
                    <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: f.color, boxShadow: `0 0 6px ${f.shadow}` }} />
                    <span className="text-[7px] text-zinc-600">{f.level}</span>
                  </div>
                  <span className="text-[8.5px] font-bold text-zinc-400 truncate uppercase">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mood picker modal (unchanged) */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { setSelectedDate(null); setHoverLevel(null); }}>
          <div className="w-full max-w-xs bg-[#06080d] border border-zinc-800 p-5 rounded-sm shadow-2xl flex flex-col gap-4"
            onClick={e => e.stopPropagation()}>
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[7.5px] font-mono text-zinc-500 tracking-widest block uppercase mb-0.5">Select mood</span>
              <h3 className="text-xs font-light text-zinc-200 tracking-wider uppercase font-mono">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
            </div>
            <div className="flex flex-col gap-1 bg-black/40 p-1 border border-zinc-900 rounded-sm" onMouseLeave={() => setHoverLevel(null)}>
              {MOOD_LEVELS.map(f => {
                const curr = moods[selectedDate] ?? 0;
                const isSelHov = (hoverLevel ?? curr) >= f.level;
                const isExact = (hoverLevel ?? curr) === f.level;
                return (
                  <button key={f.level}
                    onMouseEnter={() => setHoverLevel(f.level)}
                    onClick={() => saveMood(f.level)}
                    className="w-full flex items-center justify-between p-2 rounded-sm border border-transparent transition-all group relative overflow-hidden text-left focus:outline-none">
                    <div className={`absolute inset-0 transition-transform duration-200 origin-left -z-10 ${isSelHov ? 'scale-x-100 opacity-10' : 'scale-x-0'}`} style={{ backgroundColor: f.color }} />
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-sm transition-all" style={{ backgroundColor: isSelHov ? f.color : '#1f2937', boxShadow: isSelHov ? `0 0 10px ${f.shadow}` : 'none' }} />
                      <span className={`text-[11px] font-mono tracking-wide transition-colors ${isExact ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{f.label}</span>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-600 group-hover:text-zinc-400">[{f.level}]</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-1">
              <button onClick={() => { const upd = { ...moods }; delete upd[selectedDate]; setMoods(upd); setSelectedDate(null); }} className="text-[8.5px] font-mono text-red-400/60 hover:text-red-400 tracking-widest uppercase">Clear</button>
              <button onClick={() => { setSelectedDate(null); setHoverLevel(null); }} className="text-[8.5px] font-mono text-zinc-500 hover:text-zinc-300 tracking-widest uppercase">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}