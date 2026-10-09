import React, { useState } from 'react';
import { Search, Plus, Users, Shield } from 'lucide-react';
import { Conversation } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatListProps {
  conversations: Conversation[];
  selectedConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onOpenNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const formatChatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (conv.title && conv.title.toLowerCase().includes(q)) return true;

    // Search inside members
    return conv.members?.some((m) =>
      m.profiles?.display_name?.toLowerCase().includes(q) ||
      m.profiles?.username?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col w-full md:w-80 lg:w-96 h-full bg-slate-900/60 dark:bg-slate-950/80 border-r border-slate-800/80 select-none">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-800/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Messages</h2>
          <button
            onClick={onOpenNewChat}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
            title="Start New Conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/70 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 px-2 py-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400">
            <p className="text-sm font-medium">No conversations found</p>
            <p className="text-xs text-slate-500 mt-1">Start a new chat to connect with your friends.</p>
            <button
              onClick={onOpenNewChat}
              className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition"
            >
              Start Chatting
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedConversationId === conv.id;

            // Determine other member info for DM
            const otherMember = conv.members?.find((m) => m.user_id !== user?.id)?.profiles;
            const chatName = conv.is_group
              ? conv.title || 'Group Chat'
              : otherMember?.display_name || 'User';
            const avatarUrl = conv.is_group ? null : otherMember?.avatar_url;
            const isOnline = otherMember?.status === 'online';

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`flex items-center gap-3 p-3 my-0.5 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600/20 border border-blue-500/40 shadow-sm'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {/* Avatar with online indicator */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-900 ring-2 ring-slate-800 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={chatName} className="w-full h-full object-cover" />
                    ) : conv.is_group ? (
                      <Users className="w-5 h-5 text-cyan-300" />
                    ) : (
                      <span className="text-base font-bold text-white">
                        {chatName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {!conv.is_group && (
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {chatName}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatChatTime(conv.last_message?.created_at || conv.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate pr-2">
                      {conv.last_message ? (
                        conv.last_message.attachment_name ? (
                          <span className="italic text-cyan-400">📎 {conv.last_message.attachment_name}</span>
                        ) : (
                          conv.last_message.content
                        )
                      ) : (
                        <span className="text-slate-500 italic">No messages yet</span>
                      )}
                    </p>

                    {(conv.unread_count || 0) > 0 && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500 text-slate-950 rounded-full shadow-sm">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
