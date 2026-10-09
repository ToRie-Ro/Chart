import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageSquare, 
  MoreHorizontal, 
  Mail, 
  Calendar, 
  MapPin, 
  Globe, 
  Edit3,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../lib/types';
import { api } from '../lib/api';
import { EditProfileModal } from '../components/EditProfileModal';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile: myProfile, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'About' | 'Media' | 'Files'>('About');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isMe = !id || id === user?.id || id === myProfile?.id;

  useEffect(() => {
    if (isMe) {
      setProfile(myProfile);
      return;
    }

    if (id) {
      api.getUserProfile(id)
        .then((data) => setProfile(data))
        .catch(() => {
          // Fallback user if demo
          setProfile({
            id,
            display_name: 'Alex Johnson',
            username: 'alexsj',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: "Just a guy who loves tech, travel and good conversations. Let's connect! 🚀",
            status: 'online',
          });
        });
    }
  }, [id, isMe, myProfile, user]);

  const displayName = profile?.display_name || (isMe ? 'Alex Johnson' : 'User');
  const username = profile?.username || 'alexsj';
  const bio = profile?.bio || "Just a guy who loves tech, travel and good conversations. Let's connect! 🚀";
  const avatarUrl = profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const isOnline = profile?.status === 'online';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Container matching screenshot #8 */}
      <div className="w-full max-w-4xl bg-slate-900 border-x border-b border-slate-800 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur sticky top-0 z-20">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chats</span>
          </button>

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isMe ? 'My Profile' : 'User Profile'}
          </span>

          {isMe ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>

        {/* Cover Photo Banner (Scenic Landscape matching screenshot #8) */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80"
            alt="Profile Cover"
            className="w-full h-full object-cover opacity-85 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>

        {/* Profile Card Header */}
        <div className="relative px-6 sm:px-10 pb-6 flex flex-col items-center text-center -mt-16 z-10">
          {/* Overlapping circular avatar */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-slate-900 shadow-2xl bg-slate-800">
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            <span
              className={`absolute bottom-2 right-2 w-4 h-4 rounded-full ring-4 ring-slate-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Name & Handle */}
          <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">{displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-medium">@{username}</span>
          </div>

          {/* Bio */}
          <p className="mt-3 text-sm text-slate-300 max-w-lg leading-relaxed">{bio}</p>

          {/* Stats Bar (matching screenshot #8: 12 Posts, 248 Followers, 362 Following) */}
          <div className="mt-6 flex items-center justify-center divide-x divide-slate-800 bg-slate-800/40 border border-slate-800 rounded-2xl py-3 px-6 max-w-sm w-full">
            <div className="px-5 text-center">
              <p className="text-lg font-bold text-white">12</p>
              <p className="text-[11px] text-slate-400 font-medium">Posts</p>
            </div>
            <div className="px-5 text-center">
              <p className="text-lg font-bold text-white">248</p>
              <p className="text-[11px] text-slate-400 font-medium">Followers</p>
            </div>
            <div className="px-5 text-center">
              <p className="text-lg font-bold text-white">362</p>
              <p className="text-[11px] text-slate-400 font-medium">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message</span>
            </button>

            <button
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="More Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs: About, Media, Files */}
        <div className="border-b border-slate-800 flex justify-center gap-8 px-6 text-sm font-semibold select-none">
          {(['About', 'Media', 'Files'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 relative transition ${
                activeTab === tab
                  ? 'text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab}</span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-10 flex-1">
          {activeTab === 'About' && (
            <div className="space-y-6 max-w-lg mx-auto text-sm text-slate-300">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Email Address</p>
                  <p className="text-slate-200 font-medium">alex@example.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="text-slate-200 font-medium">San Francisco, CA</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <Calendar className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Member Since</p>
                  <p className="text-slate-200 font-medium">January 2026</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Media' && (
            <div className="grid grid-cols-3 gap-3">
              {[
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&auto=format&fit=crop&q=80',
              ].map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-800 group">
                  <img src={src} alt="Shared media" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Files' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">design_draft.pdf</p>
                    <p className="text-[10px] text-slate-400">2.4 MB • Today at 10:25</p>
                  </div>
                </div>
                <button className="text-xs text-cyan-400 hover:underline">Download</button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">project_specs_v2.docx</p>
                    <p className="text-[10px] text-slate-400">1.1 MB • Yesterday</p>
                  </div>
                </div>
                <button className="text-xs text-cyan-400 hover:underline">Download</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
