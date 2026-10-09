import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Waves, User, Bell, Lock, Palette, LogOut,
  ChevronRight, Moon, Sun, Monitor, Mail, Key, Loader2,
  Check, AlertCircle, Smartphone, Cpu, Globe, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type Panel = 'none' | 'account' | 'device' | 'notifications' | 'privacy' | 'appearance';

// ─── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; label?: string }> = ({ on, onChange, label }) => (
  <button onClick={() => onChange(!on)} aria-label={label}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${on ? 'bg-blue-600' : 'bg-slate-700'}`}>
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

// ─── Row ───────────────────────────────────────────────────────────────────────
const SettingRow: React.FC<{
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle: string;
  open?: boolean;
  onClick: () => void;
}> = ({ icon, iconBg = 'bg-blue-500/10 text-cyan-400', title, subtitle, open, onClick }) => (
  <button onClick={onClick}
    className="w-full p-4 flex items-center gap-3.5 hover:bg-slate-800/50 transition text-left">
    <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-400 truncate">{subtitle}</p>
    </div>
    <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
  </button>
);

// ─── Expandable panel wrapper ──────────────────────────────────────────────────
const Panel: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
        className="overflow-hidden border-t border-slate-800/60 bg-slate-950/60">
        <div className="p-5 space-y-4">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Main component ────────────────────────────────────────────────────────────
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, updateUserPassword, resetPasswordForEmail } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [panel, setPanel] = useState<Panel>('none');
  const toggle = (p: Panel) => setPanel((prev) => (prev === p ? 'none' : p));

  // Account
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // Notifications & Privacy
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSounds, setNotifSounds] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    if (newPassword.length < 6) { setAccountMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    if (newPassword !== confirmPassword) { setAccountMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    setSavingPw(true);
    const res = await updateUserPassword(newPassword);
    if (res.success) {
      setAccountMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword(''); setConfirmPassword('');
    } else {
      setAccountMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
    setSavingPw(false);
  };

  const handleResetEmail = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    setAccountMsg(null);
    const res = await resetPasswordForEmail(user.email);
    if (res.success) setAccountMsg({ type: 'success', text: `Reset link sent to ${user.email}` });
    else setAccountMsg({ type: 'error', text: res.error || 'Failed to send reset email.' });
    setSendingReset(false);
  };

  // Device info
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'Unknown';
  const lang = navigator.language || 'Unknown';
  const deviceType = /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop / Laptop';
  const now = new Date();

  return (
    <div className="min-h-screen bg-[#090e17] text-white">
      {/* Header */}
      <div className="h-16 px-4 bg-slate-950/80 border-b border-slate-800/60 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md">
        <button onClick={() => navigate('/app')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-slate-900 flex items-center justify-center">
            <img src="/chart-logo.png" alt="Chart" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm">Settings</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0 flex items-center justify-center">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-2xl">{profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-white text-base truncate">{profile?.display_name || 'Your Name'}</h2>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {profile?.status || 'online'}
            </span>
          </div>
          <button onClick={() => navigate('/app/profile')}
            className="flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-xl border border-slate-700 transition">
            Edit Profile
          </button>
        </motion.div>

        {/* Settings sections */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">

          {/* ── Account ─────────────────────────────────────────────────────── */}
          <SettingRow icon={<User className="w-5 h-5" />} title="Account"
            subtitle="Change email & password" open={panel === 'account'} onClick={() => toggle('account')} />
          <Panel open={panel === 'account'}>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Current email</p>
              <p className="text-sm text-slate-400 break-all">{user?.email || '—'}</p>
            </div>

            {accountMsg && (
              <div className={`flex items-start gap-2 p-3 rounded-xl text-xs ${
                accountMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {accountMsg.type === 'success' ? <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                {accountMsg.text}
              </div>
            )}

            {/* Password reset via email */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">Forgot / Change Password by email</p>
              <button onClick={handleResetEmail} disabled={sendingReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-cyan-400 transition disabled:opacity-50">
                {sendingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                Send reset link to {user?.email}
              </button>
            </div>

            {/* Change password directly */}
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <p className="text-xs font-semibold text-slate-300">Set new password</p>
              <div className="relative">
                <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" placeholder="New password (min 6 chars)" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                />
              </div>
              <div className="relative">
                <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" placeholder="Confirm new password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
                />
              </div>
              <button type="submit" disabled={savingPw || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5">
                {savingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Update Password
              </button>
            </form>
          </Panel>

          {/* ── Device ──────────────────────────────────────────────────────── */}
          <SettingRow icon={<Monitor className="w-5 h-5" />} iconBg="bg-emerald-500/10 text-emerald-400"
            title="This Device" subtitle="Hardware, browser & region info"
            open={panel === 'device'} onClick={() => toggle('device')} />
          <Panel open={panel === 'device'}>
            {[
              { icon: Smartphone, label: 'Device type', value: deviceType },
              { icon: Cpu, label: 'Platform / OS', value: platform },
              { icon: Globe, label: 'Browser language', value: lang },
              { icon: Clock, label: 'Local time', value: now.toLocaleString() },
              { icon: Monitor, label: 'Screen', value: `${window.screen.width} × ${window.screen.height} px` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-slate-400 flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                  <p className="text-sm text-slate-200 font-medium break-all">{value}</p>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-[11px] text-slate-500 font-medium mb-1">User-Agent</p>
              <p className="text-[10px] text-slate-400 break-all leading-relaxed">{ua}</p>
            </div>
          </Panel>

          {/* ── Notifications ────────────────────────────────────────────────── */}
          <SettingRow icon={<Bell className="w-5 h-5" />} iconBg="bg-amber-500/10 text-amber-400"
            title="Notifications" subtitle="Message alerts and sounds"
            open={panel === 'notifications'} onClick={() => toggle('notifications')} />
          <Panel open={panel === 'notifications'}>
            {[
              { label: 'Message notifications', value: notifMessages, set: setNotifMessages },
              { label: 'Notification sounds', value: notifSounds, set: setNotifSounds },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{label}</span>
                <Toggle on={value} onChange={set} label={label} />
              </div>
            ))}
          </Panel>

          {/* ── Privacy ─────────────────────────────────────────────────────── */}
          <SettingRow icon={<Lock className="w-5 h-5" />} iconBg="bg-rose-500/10 text-rose-400"
            title="Privacy" subtitle="Online status and read receipts"
            open={panel === 'privacy'} onClick={() => toggle('privacy')} />
          <Panel open={panel === 'privacy'}>
            {[
              { label: 'Show online status', value: showOnline, set: setShowOnline },
              { label: 'Read receipts', value: readReceipts, set: setReadReceipts },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{label}</span>
                <Toggle on={value} onChange={set} label={label} />
              </div>
            ))}
          </Panel>

          {/* ── Appearance ──────────────────────────────────────────────────── */}
          <SettingRow icon={<Palette className="w-5 h-5" />} iconBg="bg-purple-500/10 text-purple-400"
            title="Appearance" subtitle="Theme: dark or light mode"
            open={panel === 'appearance'} onClick={() => toggle('appearance')} />
          <Panel open={panel === 'appearance'}>
            <p className="text-xs text-slate-400">Select your colour theme:</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'dark', icon: Moon, label: 'Dark Mode', iconClass: 'text-cyan-400', desc: 'Default' },
                { id: 'light', icon: Sun, label: 'Light Mode', iconClass: 'text-amber-400', desc: '' },
              ].map(({ id, icon: Icon, label, iconClass, desc }) => (
                <button key={id} onClick={() => id !== theme && toggleTheme()}
                  className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition text-left ${
                    theme === id
                      ? 'bg-blue-600/15 border-blue-500/60 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${iconClass}`} />
                    {theme === id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <p className="text-xs font-semibold">{label}</p>
                  {desc && <p className="text-[10px] text-slate-500">{desc}</p>}
                </button>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <button onClick={async () => { await signOut(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 text-red-400 hover:text-red-300 font-semibold text-sm rounded-2xl transition">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
};
