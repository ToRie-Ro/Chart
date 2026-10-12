import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lf9quctAAAAAOXpwr0aoNhbuP2Y8dag1zNTO6mf';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isConfigured } = useAuth();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleCaptchaChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  const resetCaptcha = () => {
    recaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!agreeTerms) { setError('You must agree to the Terms of Service'); return; }
    if (!captchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      return;
    }

    setLoading(true);
    try {
      // Server-side reCAPTCHA verification
      const verifyRes = await fetch(`${API_BASE}/api/verify-recaptcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        setError('reCAPTCHA verification failed. Please try again.');
        resetCaptcha();
        return;
      }

      const res = await signUp(email, password, fullName);
      if (res.success) {
        navigate(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setError(res.error || 'Failed to create account.');
        resetCaptcha();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090e17] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 mb-4 bg-slate-900 border border-slate-800">
            <img src="/chart-logo.png" alt="Chart" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">Join Chart today</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {!isConfigured && (
            <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs leading-relaxed">
              ⚠️ Supabase is not configured yet. Add <code className="bg-amber-900/30 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-900/30 px-1 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code> to Render environment variables.
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" required placeholder="Your name" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} required minLength={6}
                  placeholder="At least 6 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} required
                  placeholder="Re-enter password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 pt-1">
              <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <span>I agree to the <span className="text-cyan-400">Terms of Service</span> and <span className="text-cyan-400">Privacy Policy</span></span>
            </label>

            {/* reCAPTCHA v2 */}
            <div className="flex justify-center pt-1">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={SITE_KEY}
                onChange={handleCaptchaChange}
                onExpired={() => setCaptchaToken(null)}
                theme="dark"
              />
            </div>

            <motion.button whileTap={{ scale: 0.98 }} type="submit"
              disabled={loading || !captchaToken}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Account
            </motion.button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:underline font-semibold">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-4">
          Protected by reCAPTCHA &mdash;{' '}
          <a href="https://policies.google.com/privacy" className="hover:text-slate-400 transition" target="_blank" rel="noopener noreferrer">Privacy</a>
          {' '}·{' '}
          <a href="https://policies.google.com/terms" className="hover:text-slate-400 transition" target="_blank" rel="noopener noreferrer">Terms</a>
        </p>
      </motion.div>
    </div>
  );
};
