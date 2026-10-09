import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SplashPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#090e17] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/5 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-3xl" />
        <motion.div animate={{ x: [0, -40, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-700/30">
            <span className="text-white font-extrabold text-base">B</span>
          </div>
          <span className="font-extrabold text-white tracking-tight text-lg">Bluewave</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/app"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-2">
              Open Bluewave <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition">
                Sign In
              </Link>
              <Link to="/signup"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white shadow-lg shadow-blue-600/25 transition">
                Get Started
              </Link>
            </>
          )}
        </div>
      </motion.header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Real-Time Messaging — Free Forever</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]">
          Connect. Chat.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
            Be Closer.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
          Instant real-time messaging with file sharing, mobile-friendly design, and full conversation history — all saved securely in the cloud.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/signup"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold text-white shadow-xl shadow-blue-600/30 flex items-center gap-2 transition active:scale-95">
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login"
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-sm transition">
            Sign In
          </Link>
        </motion.div>

        {/* Feature grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {[
            {
              icon: Shield,
              title: 'Secure Messaging',
              desc: 'JWT tokens and PostgreSQL Row Level Security ensure only conversation members can access your chats.',
            },
            {
              icon: Zap,
              title: 'Real-Time Chat',
              desc: 'Sub-second message delivery powered by Supabase Realtime — messages appear instantly on all devices.',
            },
            {
              icon: Smartphone,
              title: 'Mobile & Desktop',
              desc: 'Adaptive layouts crafted for every screen — phones, tablets, and full desktop displays.',
            },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title}
              whileHover={{ y: -2, borderColor: 'rgba(59,130,246,0.4)' }}
              transition={{ duration: 0.15 }}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 transition group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © 2026 Bluewave Chat. All rights reserved. Deployed on Render · Powered by Supabase.
      </footer>
    </div>
  );
};
