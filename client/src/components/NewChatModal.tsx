import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Mail, Search, Loader2, UserPlus, AlertCircle,
  Users, MessageSquare, Hash, ChevronRight
} from 'lucide-react';
import { UserProfile } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'choice' | 'dm' | 'group';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
}

// ─── Small Avatar ─────────────────────────────────────────────────────────────
const Mini: React.FC<{ name: string; url?: string | null }> = ({ name, url }) => (
  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0 flex items-center justify-center">
    {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : (
      <span className="text-white font-bold text-sm">{name?.charAt(0)?.toUpperCase()}</span>
    )}
  </div>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle: React.FC<{ label: string; on: boolean; onClick: () => void }> = ({ label, on, onClick }) => (
  <button onClick={onClick}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-700'}`}>
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-1'}`} />
    <span className="sr-only">{label}</span>
  </button>
);

// ─── DM Screen ────────────────────────────────────────────────────────────────
const DMScreen: React.FC<{
  onBack: () => void;
  onSelectUser: (u: UserProfile) => void;
  currentUserId?: string;
}> = ({ onBack, onSelectUser, currentUserId }) => {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<UserProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFound(null);
    if (!query.trim()) return;
    setSearching(true);
    try {
      const term = query.trim().toLowerCase();
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .neq('id', currentUserId || '')
        .limit(1);
      if (err) throw err;
      if (data && data.length > 0) setFound(data[0]);
      else {
        const prefix = term.includes('@') ? term.split('@')[0] : term;
        const { data: d2 } = await supabase
          .from('profiles').select('*').ilike('username', `${prefix}%`)
          .neq('id', currentUserId || '').limit(1);
        if (d2 && d2.length > 0) setFound(d2[0]);
        else setError('No user found. They must be registered on Chart.');
      }
    } catch (e: any) { setError(e.message || 'Search failed.'); }
    finally { setSearching(false); }
  };

  return (
    <div className="p-5 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-1">
        <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back
      </button>
      <p className="text-xs text-slate-400">Search by email or username to start a direct chat.</p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" autoFocus placeholder="Email or username..."
            value={query} onChange={(e) => { setQuery(e.target.value); setFound(null); setError(null); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
          />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={searching || !query.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </motion.button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{error}</p>
          </motion.div>
        )}
        {found && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0">
                {found.avatar_url
                  ? <img src={found.avatar_url} alt={found.display_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">{found.display_name?.charAt(0)?.toUpperCase()}</div>
                }
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-800 ${found.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{found.display_name}</p>
                <p className="text-xs text-slate-400 truncate">@{found.username}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${found.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                {found.status || 'offline'}
              </span>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSelectUser(found)}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-600/20">
              Start chatting with {found.display_name.split(' ')[0]}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Group Screen ─────────────────────────────────────────────────────────────
const GroupScreen: React.FC<{
  onBack: () => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
  currentUserId?: string;
}> = ({ onBack, onCreateGroup, currentUserId }) => {
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserProfile[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles').select('*')
        .or(`username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`)
        .neq('id', currentUserId || '')
        .limit(5);
      setResults((data || []).filter((u) => !members.find((m) => m.id === u.id)));
    } finally { setSearching(false); }
  };

  const addMember = (u: UserProfile) => {
    setMembers((prev) => prev.find((m) => m.id === u.id) ? prev : [...prev, u]);
    setResults([]); setQuery('');
  };

  const removeMember = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  const handleCreate = async () => {
    if (!groupName.trim()) { setError('Please enter a group name.'); return; }
    if (members.length < 1) { setError('Add at least one member.'); return; }
    setCreating(true);
    onCreateGroup(groupName.trim(), members.map((m) => m.id));
  };

  return (
    <div className="p-5 space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
        <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back
      </button>

      {/* Group name */}
      <div>
        <label className="text-xs font-medium text-slate-300 mb-1.5 block">Channel / Group name</label>
        <div className="relative">
          <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="e.g. Team Updates, Friends"
            value={groupName} onChange={(e) => setGroupName(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
          />
        </div>
      </div>

      {/* Member search */}
      <div>
        <label className="text-xs font-medium text-slate-300 mb-1.5 block">Add members</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by username..."
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>
          <button onClick={handleSearch} disabled={searching}
            className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition disabled:opacity-50">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div className="mt-2 rounded-xl border border-slate-700 divide-y divide-slate-800 overflow-hidden">
            {results.map((u) => (
              <button key={u.id} onClick={() => addMember(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition text-left">
                <Mini name={u.display_name} url={u.avatar_url} />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{u.display_name}</p>
                  <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                </div>
                <UserPlus className="w-4 h-4 text-cyan-400 ml-auto flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected members */}
      {members.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">{members.length} member{members.length !== 1 ? 's' : ''} added</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full">
                <Mini name={m.display_name} url={m.avatar_url} />
                <span className="text-xs font-medium text-blue-200">{m.display_name.split(' ')[0]}</span>
                <button onClick={() => removeMember(m.id)} className="text-blue-300 hover:text-white ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={creating}
        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
        Create Group Channel
      </motion.button>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen, onClose, onSelectUser, onCreateGroup,
}) => {
  const [screen, setScreen] = useState<Screen>('choice');
  const { user } = useAuth();

  const handleClose = () => {
    setScreen('choice');
    onClose();
  };

  const titles: Record<Screen, string> = {
    choice: 'New Conversation',
    dm: 'Direct Message',
    group: 'Create Group Channel',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400">
                    {screen === 'group' ? <Users className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <h3 className="font-bold text-white text-sm">{titles[screen]}</h3>
                </div>
                <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">
                <AnimatePresence mode="wait">
                  {screen === 'choice' && (
                    <motion.div key="choice" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="p-5 space-y-3">
                      <p className="text-xs text-slate-400 mb-4">What kind of conversation do you want to start?</p>

                      {/* DM option */}
                      <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => setScreen('dm')}
                        className="w-full flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 rounded-2xl transition text-left group">
                        <div className="w-12 h-12 rounded-xl bg-blue-600/15 text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">Direct Message</p>
                          <p className="text-xs text-slate-400 mt-0.5">Chat privately with one person via email or username</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      </motion.button>

                      {/* Group option */}
                      <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} onClick={() => setScreen('group')}
                        className="w-full flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 rounded-2xl transition text-left group">
                        <div className="w-12 h-12 rounded-xl bg-purple-600/15 text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                          <Hash className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">Group Channel</p>
                          <p className="text-xs text-slate-400 mt-0.5">Create a channel with multiple people — like a team room</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      </motion.button>
                    </motion.div>
                  )}

                  {screen === 'dm' && (
                    <motion.div key="dm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <DMScreen onBack={() => setScreen('choice')} onSelectUser={onSelectUser} currentUserId={user?.id} />
                    </motion.div>
                  )}

                  {screen === 'group' && (
                    <motion.div key="group" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <GroupScreen onBack={() => setScreen('choice')} onCreateGroup={onCreateGroup} currentUserId={user?.id} />
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
