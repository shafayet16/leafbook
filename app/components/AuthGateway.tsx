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
        
        {statusMessage && (
          <div className={`text-xs p-3 border rounded-sm font-mono leading-relaxed ${
            statusMessage.type === 'error'
              ? 'text-red-400 bg-red-950/20 border-red-900/40'
              : 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40'
          }`}>
            <span className="font-bold mr-1">
              {statusMessage.type === 'error' ? '[ERROR]:' : '[SUCCESS]:'}
            </span>
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