import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'you@example.com';
  const { resetPasswordForEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setResending(true);
    // Simulate/resend
    setTimeout(() => {
      setResending(false);
      setResendSuccess(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="mb-8">
        <BrandLogo size="md" />
      </div>

      {/* Card matching screenshot #3 */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        {/* Envelope Icon Badge */}
        <div className="w-20 h-20 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-cyan-400 mb-6 shadow-inner animate-bounce duration-1000">
          <div className="relative">
            <Mail className="w-10 h-10" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">Check Your Email</h2>

        <p className="text-slate-300 text-sm mt-3 leading-relaxed">
          We've sent a verification link to <br />
          <span className="font-semibold text-cyan-400 break-all">{email}</span>
        </p>

        <p className="text-slate-400 text-xs mt-4 leading-relaxed max-w-sm">
          Please check your inbox and click the link to verify your account. If you don't see the email, check your spam folder.
        </p>

        {resendSuccess && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verification email resent successfully!</span>
          </div>
        )}

        {/* Back to Login Button */}
        <div className="w-full mt-8 space-y-3">
          <Link
            to="/login"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-cyan-400 font-medium transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>{resending ? 'Sending...' : 'Resend email'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
