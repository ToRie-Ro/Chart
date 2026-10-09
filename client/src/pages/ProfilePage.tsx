import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Camera, Edit3, Check, X, Loader2, LogOut, Waves, ArrowLeft,
  MessageSquare, Copy, Calendar, Shield
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../lib/types';
import { format } from 'date-fns';

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
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOwnProfile && myProfile) {
      setDisplayName(myProfile.display_name || '');
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
      {/* Header */}
      <div className="h-16 px-4 bg-slate-950/80 border-b border-slate-800/60 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-md">
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

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Avatar section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 ring-4 ring-slate-800 flex items-center justify-center">
              {activeProfile?.avatar_url ? (
                <img src={activeProfile.avatar_url} alt={activeProfile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
                  {activeProfile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {isOwnProfile && (
              <label className={`absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-500 rounded-full cursor-pointer transition shadow-lg ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            )}
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight mb-1">{activeProfile?.display_name}</h2>
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-sm text-cyan-400">@{activeProfile?.username || 'user'}</p>
            <button onClick={handleCopyUsername} className="p-1 text-slate-400 hover:text-white transition">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Status badge */}
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            activeProfile?.status === 'online'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {activeProfile?.status === 'online' ? '🟢 Online' : 'Offline'}
          </span>
        </motion.div>

        {/* Action button for other user */}
        {!isOwnProfile && otherUser && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <button
              onClick={() => navigate('/app')}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with {otherUser.display_name.split(' ')[0]}
            </button>
          </motion.div>
        )}

        {/* Profile info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-sm">Account Details</h3>
            {isOwnProfile && (
              !editing ? (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditing(false); setDisplayName(myProfile?.display_name || ''); setBio(myProfile?.bio || ''); }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-xl transition">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              )
            )}
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Display name</label>
            {editing && isOwnProfile ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
              />
            ) : (
              <p className="text-sm text-white font-medium">{activeProfile?.display_name || '—'}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Username</label>
            <p className="text-sm text-slate-300">@{activeProfile?.username || '—'}</p>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Bio</label>
            {editing && isOwnProfile ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell others about yourself..."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none"
              />
            ) : (
              <p className="text-sm text-slate-300">{activeProfile?.bio || <span className="italic text-slate-500">No bio provided.</span>}</p>
            )}
          </div>

          {/* Joined date */}
          {activeProfile?.created_at && (
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Member since</label>
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                {format(new Date(activeProfile.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          )}
        </motion.div>

        {/* Sign out (own profile only) */}
        {isOwnProfile && (
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
        )}
      </div>
    </div>
  );
};
