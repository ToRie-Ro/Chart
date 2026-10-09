import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Trash2 } from 'lucide-react';
import { Conversation } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { isUserOnline, formatUserStatus } from '../lib/statusHelper';

interface ChatListProps {
  conversations: Conversation[];
  selectedConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
  loading?: boolean;
}

const Avatar: React.FC<{ name: string; url?: string | null; size?: number; online?: boolean }> = ({ name, url, size = 12, online }) => (
  <div className={`relative w-${size} h-${size} flex-shrink-0`}>
    <div className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center ring-2 ring-slate-800`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold" style={{ fontSize: `${size * 3.5}px` }}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </div>
    {online !== undefined && (
      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-950 ${online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
    )}
  </div>
);

export const ChatList: React.FC<ChatListProps> = ({
  conversations, selectedConversationId, onSelectConversation, onOpenNewChat, onDeleteConversation, loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const filtered = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (conv.title?.toLowerCase().includes(q)) return true;
    return conv.members?.some((m) =>
      m.profiles?.display_name?.toLowerCase().includes(q) ||
      m.profiles?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border-r border-slate-800/60">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Messages</h2>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenNewChat}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/25 transition"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Search conversations..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium text-sm">No conversations yet</p>
            <p className="text-slate-500 text-xs mt-1 mb-5">Start chatting by adding someone's email</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onOpenNewChat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
            >
              Start new chat
            </motion.button>
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            {filtered.map((conv, i) => {
              const isSelected = selectedConversationId === conv.id;
              const otherMember = conv.members?.find((m) => m.user_id !== user?.id)?.profiles;
              const chatName = conv.is_group ? (conv.title || 'Group Chat') : (otherMember?.display_name || 'Unknown');
              const avatarUrl = conv.is_group ? null : otherMember?.avatar_url;
              const isOnline = isUserOnline(otherMember);
              const lastMsg = conv.last_message;
              const isUnread = (conv.unread_count || 0) > 0;

              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 group relative ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Avatar name={chatName} url={avatarUrl} size={12} online={!conv.is_group ? isOnline : undefined} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-semibold truncate ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                        {chatName}
                      </span>
                      <span className="text-[11px] text-slate-500 flex-shrink-0 ml-2">
                        {formatTime(lastMsg?.created_at || conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate pr-2 ${isUnread ? 'text-slate-300' : 'text-slate-500'}`}>
                        {lastMsg ? (
                          lastMsg.attachment_name
                            ? `📎 ${lastMsg.attachment_name}`
                            : lastMsg.content
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            {conv.is_group ? 'Say hello!' : formatUserStatus(otherMember, { withDot: false })}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isUnread && (
                          <span className="min-w-[20px] h-5 px-1.5 text-[10px] font-bold bg-blue-500 text-white rounded-full flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                        {onDeleteConversation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 rounded transition"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
