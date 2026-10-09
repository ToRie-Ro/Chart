import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, MessageSquare, Lock, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await resetPasswordForEmail(email);
      if (res.success) {
        setSentSuccess(true);
      } else {
        setError(res.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Container matching screenshot #4 */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 shadow-2xl backdrop-blur-xl">
        {/* Left Side: Brand Showcase */}
        <div className="relative p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-950 overflow-hidden border-b md:border-b-0 md:border-r border-slate-800/60">
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <BrandLogo size="lg" showTagline />

            <p className="text-slate-400 text-sm leading-relaxed pt-4">
              Rest assured your messages and account are safe with Supabase encrypted authentication.
            </p>
          </div>

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

        {/* Right Side: Reset Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center bg-slate-900/90">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Reset Your Password</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          {sentSuccess ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Reset Link Sent!</p>
                  <p className="text-xs text-emerald-400/80 mt-1">
                    Check your email inbox at <span className="underline font-mono">{email}</span> for instructions to reset your password.
                  </p>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Send Reset Link</span>
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-cyan-400 transition inline-flex items-center gap-1.5 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
