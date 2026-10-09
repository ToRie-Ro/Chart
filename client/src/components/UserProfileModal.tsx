import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Copy, Check, Calendar, Shield } from 'lucide-react';
import { UserProfile } from '../lib/types';
import { supabase } from '../lib/supabase';
import { resolveBannerUrl } from '../lib/bannerHelper';
import { format } from 'date-fns';

interface UserProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onStartChat,
}) => {
  const [copied, setCopied] = useState(false);
  const [freshUser, setFreshUser] = useState<UserProfile | null>(null);
  const [resolvedBanner, setResolvedBanner] = useState<string | null>(null);

  const activeUser = freshUser || user;

  useEffect(() => {
    if (!user?.id || !isOpen) {
      setFreshUser(null);
      setResolvedBanner(null);
      return;
    }

    if (user.banner_url) {
      setResolvedBanner(user.banner_url);
    }

    // Always fetch latest profile & resolve GIF/Image banner
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setFreshUser(data as UserProfile);
          const bUrl = await resolveBannerUrl(user.id, (data as any).banner_url);
          if (bUrl) setResolvedBanner(bUrl);
        } else {
          const bUrl = await resolveBannerUrl(user.id, user.banner_url ?? undefined);
          if (bUrl) setResolvedBanner(bUrl);
        }
      } catch {
        const bUrl = await resolveBannerUrl(user.id, user.banner_url ?? undefined).catch(() => null);
        if (bUrl) setResolvedBanner(bUrl);
      }
    })();
  }, [user?.id, isOpen]);

  if (!user || !activeUser) return null;

  const handleCopyUsername = () => {
    if (activeUser.username) {
      navigator.clipboard.writeText(`@${activeUser.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOnline = activeUser.status === 'online';
  const bannerUrl = resolvedBanner || activeUser.banner_url;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-[92vw] max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden pointer-events-auto relative">
              {/* Top Banner (custom image, animated GIF, or dynamic animated gradient) */}
              <div className="h-32 sm:h-36 relative overflow-hidden flex items-start justify-end p-3 bg-slate-950">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-indigo-700 to-cyan-500 overflow-hidden">
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], rotate: [0, 90, 0] }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                      className="absolute -top-10 -left-10 w-44 h-44 bg-cyan-400/25 rounded-full blur-2xl pointer-events-none"
                    />
                    <motion.div
                      animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                      className="absolute -bottom-10 -right-10 w-44 h-44 bg-purple-500/30 rounded-full blur-2xl pointer-events-none"
                    />
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full transition backdrop-blur-md relative z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar floating over banner */}
              <div className="px-6 pb-6 pt-0 relative">
                <div className="flex items-end justify-between -mt-14 mb-4">
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 ring-4 ring-slate-900 shadow-2xl flex items-center justify-center relative group cursor-pointer"
                    >
                      {activeUser.avatar_url ? (
                        <img
                          src={activeUser.avatar_url}
                          alt={activeUser.display_name}
                          className="w-full h-full object-cover transition duration-300 group-hover:brightness-105"
                        />
                      ) : (
                        <span className="text-white font-extrabold text-3xl">
                          {activeUser.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </motion.div>
                    <span
                      className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ring-2 ring-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    />
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isOnline ? '🟢 Online' : 'Offline'}
                  </span>
                </div>

                {/* User Name & Handle */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white tracking-tight">{activeUser.display_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-cyan-400 font-medium">@{activeUser.username || 'user'}</p>
                    <button
                      onClick={handleCopyUsername}
                      className="p-1 text-slate-400 hover:text-white rounded transition"
                      title="Copy username"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Bio */}
                <div className="p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-2xl mb-4">
                  <p className="text-xs text-slate-400 font-medium mb-1">About</p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {activeUser.bio || <span className="italic text-slate-500">No bio provided.</span>}
                  </p>
                </div>

                {/* Extra Details */}
                <div className="space-y-2 mb-5 text-xs text-slate-400">
                  {activeUser.created_at && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Joined {format(new Date(activeUser.created_at), 'MMMM yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Verified Chart Account</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {onStartChat && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onStartChat(activeUser);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
