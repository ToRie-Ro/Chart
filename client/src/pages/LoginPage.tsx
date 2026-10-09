import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, MessageSquare, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, enableDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn(email, password);
      if (res.success) {
        navigate('/app');
      } else {
        setError(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    enableDemoMode();
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container matching screenshot #1 */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="relative p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-950 overflow-hidden border-b md:border-b-0 md:border-r border-slate-800/60">
          {/* Subtle wave gradient background glow */}
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <BrandLogo size="lg" showTagline />

            <p className="text-slate-400 text-sm leading-relaxed pt-4">
              Step into the future of messaging. Built for privacy, speed, and beautiful conversations.
            </p>
          </div>

          {/* Feature Bullets */}
          <div className="relative z-10 space-y-5 my-8">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Secure messaging</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Real-time chat</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-200">Your data, your control</span>
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-500">
            Render Node.js Backend • Supabase Auth & PostgreSQL
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-slate-900/90">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Sign In</span>
            </button>
          </form>

          {/* Switch to Sign Up */}
          <p className="text-center text-xs text-slate-400 mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-400 hover:underline font-semibold">
              Sign Up
            </Link>
          </p>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">or continue with</span>
            </div>
          </div>

          {/* Quick Demo Sign In Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-2"
          >
            <span>Preview as Alex Johnson (Instant Demo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
