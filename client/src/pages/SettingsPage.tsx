import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Lock, 
  Palette, 
  LogOut, 
  ChevronRight, 
  Edit3, 
  Moon, 
  Sun,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { MobileNav } from '../components/MobileNav';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { EditProfileModal } from '../components/EditProfileModal';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState<'none' | 'account' | 'notifications' | 'privacy' | 'appearance'>('none');

  // Notification and privacy state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatusVisible, setOnlineStatusVisible] = useState(true);

  const displayName = profile?.display_name || 'Alex Johnson';
  const email = profile?.username ? `${profile.username}@example.com` : 'alex@example.com';
  const avatarUrl = profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      <Navbar unreadTotal={5} />

      {/* Main Settings Content matching screenshot #7 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center pb-20 md:pb-8">
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>

          {/* User Profile Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 shadow-md backdrop-blur">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-blue-900 ring-2 ring-blue-500/30 flex-shrink-0">
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              </div>
              <div className="truncate">
                <h2 className="text-base font-bold text-white truncate">{displayName}</h2>
                <p className="text-xs text-slate-400 truncate">{email}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs rounded-xl border border-slate-700/60 transition flex-shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Settings Navigation List */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-md">
            {/* Account */}
            <div
              onClick={() => setActiveSubPanel(activeSubPanel === 'account' ? 'none' : 'account')}
              className="p-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Account</h3>
                  <p className="text-xs text-slate-400">Change email, password</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition transform ${activeSubPanel === 'account' ? 'rotate-90' : ''}`} />
            </div>

            {activeSubPanel === 'account' && (
              <div className="p-4 bg-slate-950/60 space-y-3 text-xs">
                <p className="text-slate-300">Account security is powered by Supabase Auth.</p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
                >
                  Send Password Reset Link
                </button>
              </div>
            )}

            {/* Notifications */}
            <div
              onClick={() => setActiveSubPanel(activeSubPanel === 'notifications' ? 'none' : 'notifications')}
              className="p-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <p className="text-xs text-slate-400">Message, call, and app notifications</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition transform ${activeSubPanel === 'notifications' ? 'rotate-90' : ''}`} />
            </div>

            {activeSubPanel === 'notifications' && (
              <div className="p-4 bg-slate-950/60 space-y-3">
                <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                  <span>Enable Push Notifications</span>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-800"
                  />
                </label>
              </div>
            )}

            {/* Privacy */}
            <div
              onClick={() => setActiveSubPanel(activeSubPanel === 'privacy' ? 'none' : 'privacy')}
              className="p-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Privacy</h3>
                  <p className="text-xs text-slate-400">Who can see your information</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition transform ${activeSubPanel === 'privacy' ? 'rotate-90' : ''}`} />
            </div>

            {activeSubPanel === 'privacy' && (
              <div className="p-4 bg-slate-950/60 space-y-3">
                <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                  <span>Show Online Status</span>
                  <input
                    type="checkbox"
                    checked={onlineStatusVisible}
                    onChange={(e) => setOnlineStatusVisible(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-800"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-200 cursor-pointer">
                  <span>Read Receipts</span>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded bg-slate-800"
                  />
                </label>
              </div>
            )}

            {/* Appearance (Dark / Light Theme Toggle) */}
            <div
              onClick={() => setActiveSubPanel(activeSubPanel === 'appearance' ? 'none' : 'appearance')}
              className="p-4 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-cyan-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Appearance</h3>
                  <p className="text-xs text-slate-400">Dark mode, language, and more</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition transform ${activeSubPanel === 'appearance' ? 'rotate-90' : ''}`} />
            </div>

            {activeSubPanel === 'appearance' && (
              <div className="p-4 bg-slate-950/60 space-y-3">
                <p className="text-xs text-slate-400">Select your preferred color theme:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      theme === 'dark'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Moon className="w-4 h-4 text-cyan-400" />
                      <span>Dark Mode (Default)</span>
                    </div>
                    {theme === 'dark' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>

                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      theme === 'light'
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Light Mode</span>
                    </div>
                    {theme === 'light' && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Log Out button matching screenshot #7 */}
          <div className="pt-2">
            <button
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 font-semibold text-sm flex items-center gap-3 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <MobileNav />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
