//AuthGateway.tsx
'use client';
import React from 'react';

interface AuthGatewayProps {
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  statusMessage: { type: 'error' | 'success'; text: string } | null;
  setStatusMessage: (msg: { type: 'error' | 'success'; text: string } | null) => void;
  handleAuth: (e: React.FormEvent) => void;
}

export default function AuthGateway({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  statusMessage,
  setStatusMessage,
  handleAuth,
}: AuthGatewayProps) {

  // Dedicated welcome screen after a successful signup — replaces the form
  // entirely instead of showing an inline banner above it.
  if (statusMessage?.type === 'success') {
    return (
      <div className="w-screen h-screen bg-[#020604] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)] flex items-center justify-center font-sans antialiased p-6">
        <div className="w-full max-w-sm p-8 border border-emerald-900/40 bg-[#0b0910] flex flex-col items-center gap-5 text-center shadow-[0_0_80px_rgba(2,20,10,0.6)] rounded-sm relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#7CEA9C]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#7CEA9C]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#7CEA9C]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#7CEA9C]" />

          <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(124,234,156,0.15)]">
            🌱
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-[#7CEA9C] via-[#34D399] to-[#059669] bg-clip-text text-transparent">
              Welcome to the Garden of Growth
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your account has been planted. We've sent a confirmation link to
            </p>
            <p className="text-xs font-mono text-[#7CEA9C]">{email}</p>
          </div>

          <div className="text-[11px] text-zinc-500 leading-relaxed border-t border-emerald-950/40 pt-4 w-full">
            Check your inbox to verify your email before signing in. If you don't see it, check spam — the link expires after a while.
          </div>

          <button
            type="button"
            className="text-xs text-zinc-400 hover:text-[#7CEA9C] underline underline-offset-4 transition-colors font-medium mt-1"
            onClick={() => {
              setStatusMessage(null);
              setAuthMode('login');
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#020604] flex items-center justify-center font-sans antialiased">
      <form 
        onSubmit={handleAuth} 
        className="w-full max-w-sm p-8 border border-zinc-900 bg-[#0b0910] flex flex-col gap-5 shadow-2xl rounded-sm"
      >
        <div className="flex flex-col gap-1 text-center mb-2">
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            {authMode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-xs text-zinc-500">
            {authMode === 'login' ? 'Enter your details below to access Leafbook' : 'Get started with a free secure cloud account'}
          </p>
        </div>

        {statusMessage && statusMessage.type === 'error' && (
          <div className="text-xs p-3 border rounded-sm font-mono leading-relaxed text-red-400 bg-red-950/20 border-red-900/40">
            <span className="font-bold mr-1">[ERROR]:</span>
            {statusMessage.text}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 font-mono">
            Email Address
          </label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="bg-black/50 border border-zinc-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all rounded-sm p-2.5 text-sm text-zinc-200 focus:outline-none" 
            required 
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 font-mono">
            Password
          </label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="bg-black/50 border border-zinc-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all rounded-sm p-2.5 text-sm text-zinc-200 focus:outline-none" 
            required 
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-emerald-600 text-white font-semibold text-sm p-2.5 rounded-sm hover:bg-emerald-500 active:bg-emerald-700 transition-colors cursor-pointer text-center mt-2 shadow-sm"
        >
          {authMode === 'login' ? 'Sign In' : 'Sign Up'}
        </button>

        <div className="text-center mt-2">
          <button
            type="button"
            className="text-xs text-zinc-400 hover:text-[#7CEA9C] underline underline-offset-4 transition-colors font-medium" 
            onClick={() => {
              setStatusMessage(null);
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
            }}
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}