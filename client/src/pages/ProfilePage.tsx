import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Edit3, Check, X, Loader2, LogOut, Waves, ArrowLeft,
  MessageSquare, Copy, Calendar, Shield, AlertCircle, Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../lib/types';
import { format } from 'date-fns';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'current';

export const ProfilePage: React.FC = () => {
  const { user, profile: myProfile, updateUserProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();

  const isOwnProfile = !paramId || paramId === user?.id;

  // Other user state
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loadingOther, setLoadingOther] = useState(!isOwnProfile);

  // Own edit state
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOwnProfile && myProfile) {
      setDisplayName(myProfile.display_name || '');
      setUsernameInput(myProfile.username || '');
      setBio(myProfile.bio || '');
    }
  }, [isOwnProfile, myProfile]);

  useEffect(() => {
    if (!isOwnProfile && paramId) {
      setLoadingOther(true);
      supabase
        .from('profiles')
        .select('*')
        .eq('id', paramId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setOtherUser(data as UserProfile);
          }
          setLoadingOther(false);
        });
    }
  }, [isOwnProfile, paramId]);

  const activeProfile = isOwnProfile ? myProfile : otherUser;

  // ─── Username Availability Check (Debounced) ───────────────────────────────
  const checkUsernameAvailability = useCallback(
    async (val: string) => {
      const clean = val.trim().toLowerCase();

      if (!clean) {
        setUsernameStatus('invalid');
        setUsernameError('Username cannot be empty');
        return;
      }

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
        setUsernameStatus('invalid');
        setUsernameError('Must be 3-20 characters (letters, numbers, underscores)');
        return;
      }

      if (clean === myProfile?.username?.toLowerCase()) {
        setUsernameStatus('current');
        setUsernameError(null);
        return;
      }

      setUsernameStatus('checking');
      setUsernameError(null);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', clean)
          .neq('id', user?.id || '')
          .limit(1);

        if (error) {
          console.error('Error checking username:', error);
          setUsernameStatus('idle');
          return;
        }

        if (data && data.length > 0) {
          setUsernameStatus('taken');
          setUsernameError(`@${clean} is already taken`);
        } else {
          setUsernameStatus('available');
          setUsernameError(null);
        }
      } catch {
        setUsernameStatus('idle');
      }
    },
    [myProfile?.username, user?.id]
  );

  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(() => {
      checkUsernameAvailability(usernameInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [usernameInput, editing, checkUsernameAvailability]);

  // ─── Save Profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking') {
      return;
    }

    setSaving(true);
    setSaveError(null);

    const cleanUsername = usernameInput.trim().toLowerCase();

    try {
      const result = await updateUserProfile({
        display_name: displayName.trim(),
        username: cleanUsername,
        bio: bio.trim(),
      });

      if (result && !result.success) {
        setSaveError(result.error || 'Failed to update profile');
      } else {
        setEditing(false);
      }
    } catch (err: any) {
      setSaveError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // ─── Avatar Upload (Supports animated GIF) ──────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      // Append cache buster so browser refreshes immediately
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await updateUserProfile({ avatar_url: publicUrl });
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ─── Banner Upload (Supports animated GIF) ──────────────────────────────────
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingBanner(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `banners/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      await updateUserProfile({ banner_url: publicUrl });
    } catch (err: any) {
      console.error('Banner upload failed:', err);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleCopyUsername = () => {
    if (activeProfile?.username) {
      navigator.clipboard.writeText(`@${activeProfile.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOwnProfile && loadingOther) {
    return (
      <div className="min-h-screen bg-[#090e17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090e17] text-white">
      {/* App Header */}
      <div className="h-16 px-4 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-400 flex items-center justify-center">
              <Waves className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">
              {isOwnProfile ? 'Your Profile' : `${activeProfile?.display_name || 'User'}'s Profile`}
            </span>
          </div>
        </div>

        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Card Container with Banner & Avatar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative mb-6">
          {/* ─── Animated Banner ─────────────────────────────────────────── */}
          <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-slate-950">
            {activeProfile?.banner_url ? (
              <img
                src={activeProfile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              /* Dynamic animated wave banner */
              <div className="w-full h-full relative bg-gradient-to-tr from-blue-900 via-indigo-950 to-cyan-900 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 20, 0],
                    y: [0, -10, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-12 -left-12 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"
                />
                <motion.div
                  animate={{
                    scale: [1.1, 1, 1.1],
                    x: [0, -25, 0],
                    y: [0, 15, 0],
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-10 -right-10 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-medium text-cyan-300">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Bluewave Animated Theme
                </div>
              </div>
            )}

            {/* Banner Upload Button (Own profile) */}
            {isOwnProfile && (
              <label
                className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-xs font-semibold text-white cursor-pointer transition shadow-lg ${
                  uploadingBanner ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingBanner ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>Change Banner (GIF/Image)</span>
                <input
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* ─── Avatar & User Overview ──────────────────────────────────── */}
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-4 gap-4">
              {/* Avatar with optional GIF support */}
              <div className="relative inline-block">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 ring-4 ring-slate-900 shadow-2xl flex items-center justify-center relative group"
                >
                  {activeProfile?.avatar_url ? (
                    <img
                      src={activeProfile.avatar_url}
                      alt={activeProfile.display_name}
                      className="w-full h-full object-cover transition duration-300 group-hover:brightness-105"
                    />
                  ) : (
                    <span className="text-white font-extrabold text-4xl">
                      {activeProfile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </motion.div>

                {/* Change Avatar Button */}
                {isOwnProfile && (
                  <label
                    className={`absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-500 rounded-full cursor-pointer transition shadow-lg ring-2 ring-slate-900 ${
                      uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Change Profile Picture (supports GIF)"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*,.gif"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto sm:mb-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    activeProfile?.status === 'online'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {activeProfile?.status === 'online' ? '🟢 Online' : 'Offline'}
                </span>

                {!isOwnProfile && otherUser && (
                  <button
                    onClick={() => navigate('/app')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Send Message
                  </button>
                )}
              </div>
            </div>

            {/* Profile Titles */}
            <div className="mb-4">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {activeProfile?.display_name || 'Bluewave User'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-cyan-400">
                  @{activeProfile?.username || 'user'}
                </span>
                <button
                  onClick={handleCopyUsername}
                  className="p-1 text-slate-400 hover:text-white rounded transition"
                  title="Copy username"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Bio Display (Non-editing) */}
            {!editing && (
              <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl mb-4">
                <p className="text-xs text-slate-400 font-medium mb-1">About</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeProfile?.bio || <span className="italic text-slate-500">No bio provided.</span>}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Profile Details / Edit Section ───────────────────────────── */}
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="font-bold text-white text-base">Edit Account Details</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setDisplayName(myProfile?.display_name || '');
                      setUsernameInput(myProfile?.username || '');
                      setBio(myProfile?.bio || '');
                      setUsernameStatus('idle');
                      setUsernameError(null);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-lg transition"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </div>

              {saveError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Display Name Input */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
              </div>

              {/* Username Input with Live Availability Indicator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Username (@handle)</label>
                  {/* Status Indicator */}
                  {usernameStatus === 'checking' && (
                    <span className="flex items-center gap-1 text-[11px] text-blue-400">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking availability...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <Check className="w-3 h-3" /> Available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="flex items-center gap-1 text-[11px] text-red-400 font-semibold">
                      <AlertCircle className="w-3 h-3" /> Already taken
                    </span>
                  )}
                  {usernameStatus === 'current' && (
                    <span className="text-[11px] text-slate-400">Your current username</span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                    @
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setUsernameInput(clean);
                    }}
                    placeholder="username"
                    className={`w-full pl-8 pr-10 py-2.5 bg-slate-800 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                      usernameStatus === 'taken' || usernameStatus === 'invalid'
                        ? 'border-red-500/60 focus:ring-red-500/30'
                        : usernameStatus === 'available'
                        ? 'border-emerald-500/60 focus:ring-emerald-500/30'
                        : 'border-slate-700 focus:ring-blue-500/50'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                    {usernameStatus === 'available' && <Check className="w-4 h-4 text-emerald-400" />}
                    {usernameStatus === 'taken' && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>

                {usernameError && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {usernameError}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  Unique handle for finding your account. Only letters, numbers, and underscores (3-20 chars).
                </p>
              </div>

              {/* Bio Input */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Bio / About</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell others what you do..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition resize-none"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="viewing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-white text-sm mb-3">Account Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-0.5">Display Name</p>
                  <p className="text-sm font-semibold text-white">{activeProfile?.display_name || '—'}</p>
                </div>

                <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-0.5">Username</p>
                  <p className="text-sm font-semibold text-cyan-400">@{activeProfile?.username || '—'}</p>
                </div>

                {isOwnProfile && (
                  <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800">
                    <p className="text-xs text-slate-400 mb-0.5">Email Address</p>
                    <p className="text-sm font-semibold text-slate-200">{user?.email || '—'}</p>
                  </div>
                )}

                <div className="p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-0.5">Member Since</p>
                  <p className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {activeProfile?.created_at
                      ? format(new Date(activeProfile.created_at), 'MMMM d, yyyy')
                      : 'Recently'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Verified Bluewave Chat Account</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign Out (Own profile only) */}
        {isOwnProfile && (
          <div className="mt-6">
            <button
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-semibold text-sm rounded-2xl transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
