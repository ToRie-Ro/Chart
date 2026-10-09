import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Lock, MessageSquare, ArrowRight, Sparkles, Smartphone, CheckCircle } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export const SplashPage: React.FC = () => {
  const { user, enableDemoMode } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <BrandLogo size="md" showTagline />
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/app"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <span>Open Bluewave</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white shadow-lg shadow-blue-600/25 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold mb-8 animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Next-Generation Real-Time Messaging Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          Connect. Chat. <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">Be Closer.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
          Inspired by Telegram and Discord. Featuring instant real-time messaging, authorized file sharing, dark and light modes, and seamless mobile responsiveness.
        </p>

        {/* Call to Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-white shadow-xl shadow-blue-600/30 flex items-center gap-2 transition transform active:scale-95"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <button
            onClick={() => {
              enableDemoMode();
              window.location.href = '/app';
            }}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-sm transition"
          >
            Launch Interactive Demo (Alex Johnson)
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure Messaging</h3>
            <p className="text-sm text-slate-400">
              Authenticated user tokens and PostgreSQL Row Level Security ensure only conversation members access chats.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Chat</h3>
            <p className="text-sm text-slate-400">
              Sub-second message delivery, live online presence, typing indicators, and immediate notification updates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Mobile & Desktop</h3>
            <p className="text-sm text-slate-400">
              Adaptive layouts designed specifically for phones, tablets, and full desktop displays with dark & light modes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Bluewave Chat. All rights reserved. Deployed on Render with Supabase.</p>
      </footer>
    </div>
  );
};
