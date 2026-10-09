import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit3, Check, X, Loader2, LogOut, Waves, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateUserProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ display_name: displayName, bio });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateUserProfile({ avatar_url: data.publicUrl });
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090e17] text-white">
      {/* Header */}
      <div className="h-16 px-4 bg-slate-950/80 border-b border-slate-800/60 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md">
        <button onClick={() => navigate('/app')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-400 flex items-center justify-center">
            <Waves className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">Profile</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Avatar section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 ring-4 ring-slate-800">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
                  {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <label className={`absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-500 rounded-full cursor-pointer transition shadow-lg ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            </label>
          </div>

          {/* Status badge */}
          <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            {profile?.status || 'online'}
          </span>
        </motion.div>

        {/* Profile info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-white">Your information</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditing(false); setDisplayName(profile?.display_name || ''); setBio(profile?.bio || ''); }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-xl transition">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Display name</label>
            {editing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
              />
            ) : (
              <p className="text-sm text-white font-medium">{profile?.display_name || '—'}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Username</label>
            <p className="text-sm text-slate-300">@{profile?.username || '—'}</p>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email</label>
            <p className="text-sm text-slate-300">{user?.email || '—'}</p>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Bio</label>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell others about yourself..."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none"
              />
            ) : (
              <p className="text-sm text-slate-300">{profile?.bio || <span className="italic text-slate-500">No bio yet. Click Edit to add one.</span>}</p>
            )}
          </div>

          {/* Joined date */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Member since</label>
            <p className="text-sm text-slate-300">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-semibold text-sm rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </motion.div>
      </div>
    </div>
  );
};
