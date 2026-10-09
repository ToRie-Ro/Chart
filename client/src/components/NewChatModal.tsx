import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Search, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { UserProfile } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectUser }) => {
  const [email, setEmail] = useState('');
  const [found, setFound] = useState<UserProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFound(null);

    if (!email.trim()) return;

    setSearching(true);
    try {
      // Search by email through Supabase profiles
      // The profile username often maps to email prefix, but we need to look up auth.users by email
      // We use the profiles table joined with auth — search by display_name or username
      // Best approach: search by email prefix or try matching
      const searchTerm = email.trim().toLowerCase();

      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq('id', currentUser?.id || '')
        .limit(5);

      // Also try exact email match via auth email stored in metadata
      // Since we can't directly query auth.users from client, we search profiles
      if (searchError) throw searchError;

      if (data && data.length > 0) {
        setFound(data[0]);
      } else {
        // Try searching by the email part before @
        const emailPrefix = searchTerm.includes('@') ? searchTerm.split('@')[0] : searchTerm;
        const { data: data2 } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `${emailPrefix}%`)
          .neq('id', currentUser?.id || '')
          .limit(1);

        if (data2 && data2.length > 0) {
          setFound(data2[0]);
        } else {
          setError('No user found with that email or username. They must be registered on Bluewave Chat.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = () => {
    if (found) {
      onSelectUser(found);
      setEmail('');
      setFound(null);
      setError(null);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFound(null);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">New Conversation</h3>
                    <p className="text-xs text-slate-400">Find a user by email or username</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Form */}
              <div className="p-5">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Email or username..."
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFound(null); setError(null); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={searching || !email.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center gap-2"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {searching ? '' : 'Find'}
                  </motion.button>
                </form>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Found User Card */}
                <AnimatePresence>
                  {found && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0">
                          {found.avatar_url ? (
                            <img src={found.avatar_url} alt={found.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                              {found.display_name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-800 ${found.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{found.display_name}</p>
                          <p className="text-xs text-slate-400 truncate">@{found.username}</p>
                          {found.bio && <p className="text-xs text-slate-500 truncate mt-0.5">{found.bio}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${found.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                          {found.status || 'offline'}
                        </span>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleStartChat}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-600/20"
                      >
                        Start chatting with {found.display_name.split(' ')[0]}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
