import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Paperclip, Smile, Phone, Video, MoreVertical,
  ArrowLeft, Trash2, CheckCheck, FileText, Download, X, Loader2, User as UserIcon, Mic, Reply, Search, Plus
} from 'lucide-react';
import { Message, Conversation, UserProfile, MessageReaction } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format, isToday } from 'date-fns';
import { VoiceRecorder } from './VoiceRecorder';
import { MessageSearch } from './MessageSearch';
import { ReactionPicker } from './ReactionPicker';
import { useLiveStatus } from '../lib/statusHelper';

const EMOJIS = ['👍', '❤️', '🔥', '🚀', '😊', '🎉', '👋', '😂', '💯', '🙏'];

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (
    content: string, 
    attachment?: { url: string; name: string; type: string; size: number },
    replyToId?: string,
    voiceUrl?: string,
    voiceDuration?: number
  ) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
  onDeleteConversation?: (id: string) => Promise<void>;
  onViewProfile?: (user: UserProfile) => void;
  onBackMobile?: () => void;
  loading?: boolean;
}

const Avatar: React.FC<{ name: string; url?: string | null; sizeClass?: string }> = ({ name, url, sizeClass = "w-9 h-9" }) => (
  <div className={`${sizeClass} flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center`}>
    {url ? (
      <img src={url} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-white font-bold text-sm">{name?.charAt(0)?.toUpperCase() || '?'}</span>
    )}
  </div>
);

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation, messages, onSendMessage, onDeleteMessage, onDeleteConversation, onViewProfile, onBackMobile, loading = false,
}) => {
  const { user, profile } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // New states
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, MessageReaction[]>>({});
  
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Helpers to detect media type
  const isImageType = (type?: string | null, name?: string | null) => {
    if (type) return type.startsWith('image/');
    if (name) return /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i.test(name);
    return false;
  };
  const isVideoType = (type?: string | null, name?: string | null) => {
    if (type) return type.startsWith('video/');
    if (name) return /\.(mp4|webm|mov|mkv|avi|ogv)$/i.test(name);
    return false;
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Read Receipts
  const markAsRead = useCallback(async () => {
    if (!user || !conversation) return;
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversation.id)
      .eq('user_id', user.id);
  }, [user?.id, conversation?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  const getReadStatus = (msg: Message): 'sent' | 'delivered' | 'read' => {
    if (!conversation) return 'sent';
    const otherMembers = conversation.members.filter(m => m.user_id !== user?.id);
    const anyRead = otherMembers.some(m => 
      m.last_read_at && new Date(m.last_read_at) >= new Date(msg.created_at)
    );
    return anyRead ? 'read' : 'sent';
  };

  // Reactions
  const loadReactions = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    const { data } = await supabase
      .from('message_reactions')
      .select('*, profiles(display_name)')
      .in('message_id', messageIds);
    if (data) {
      const grouped: Record<string, MessageReaction[]> = {};
      data.forEach(r => {
        if (!grouped[r.message_id]) grouped[r.message_id] = [];
        grouped[r.message_id].push(r);
      });
      setReactions(prev => ({ ...prev, ...grouped }));
    }
  };

  useEffect(() => {
    const ids = messages.map(m => m.id);
    if (ids.length > 0) {
      loadReactions(ids);
    }
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    const channel = supabase.channel('message_reactions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (payload) => {
        // Reload reactions for safety, or update state manually. For simplicity we reload for the affected msg
        if (payload.new && (payload.new as any).message_id) {
           loadReactions([(payload.new as any).message_id]);
        } else if (payload.old && (payload.old as any).message_id) {
           loadReactions([(payload.old as any).message_id]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation?.id]);

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = reactions[messageId]?.find(r => r.emoji === emoji && r.user_id === user.id);
    if (existing) {
      // toggle off
      await supabase.from('message_reactions').delete().eq('id', existing.id);
      setReactions(prev => ({
        ...prev,
        [messageId]: (prev[messageId] || []).filter(r => r.id !== existing.id)
      }));
    } else {
      const { data } = await supabase.from('message_reactions')
        .insert({ message_id: messageId, user_id: user.id, emoji })
        .select('*, profiles(display_name)').single();
      if (data) {
        setReactions(prev => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), data as MessageReaction]
        }));
      }
    }
    setReactionPickerMsgId(null);
  };

  // Typing
  const handleTyping = () => {
    if (typingChannelRef.current) {
      typingChannelRef.current.track({ user_id: user?.id, display_name: profile?.display_name });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingChannelRef.current?.untrack();
    }, 2500);
  };

  useEffect(() => {
    if (!conversation?.id || !user) return;
    const channel = supabase.channel(`typing:${conversation.id}`, {
      config: { presence: { key: user.id } }
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typers = Object.values(state)
        .flat()
        .filter((p: any) => p.user_id !== user.id)
        .map((p: any) => p.display_name);
      setTypingUsers(typers);
    })
    .subscribe();
    typingChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversation?.id, user?.id]);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#090e17] text-center select-none">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6"
        >
          <Send className="w-9 h-9 -rotate-12" />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
        <p className="text-sm text-slate-400 max-w-xs">Choose a chat from the sidebar or start a new one to begin messaging.</p>
      </div>
    );
  }

  const otherMember = conversation.members?.find((m) => m.user_id !== user?.id)?.profiles;
  const chatTitle = conversation.is_group ? (conversation.title || 'Group Chat') : (otherMember?.display_name || 'Unknown');
  const avatarUrl = conversation.is_group ? null : otherMember?.avatar_url;
  const { isOnline, statusText } = useLiveStatus(otherMember);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      let attachment;
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const path = `${conversation.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('chat-attachments').upload(path, selectedFile);
        if (!upErr) {
          const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
          attachment = { url: data.publicUrl, name: selectedFile.name, type: selectedFile.type, size: selectedFile.size };
        }
      }
      await onSendMessage(inputText.trim(), attachment, replyTo?.id);
      setInputText('');
      setSelectedFile(null);
      setSelectedFilePreview(null);
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceRecorded = async (url: string, duration: number) => {
    setShowVoiceRecorder(false);
    await onSendMessage('', undefined, replyTo?.id, url, duration);
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      handleTyping();
    }
  };

  const scrollToMessage = (messageId: string) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-blue-500/20');
      setTimeout(() => el.classList.remove('bg-blue-500/20'), 2000);
    }
  };

  const groupedMessages = messages.reduce<{ date: string; messages: Message[] }[]>((acc, msg) => {
    const dateKey = isToday(new Date(msg.created_at)) ? 'Today' : format(new Date(msg.created_at), 'MMMM d, yyyy');
    const last = acc[acc.length - 1];
    if (last && last.date === dateKey) {
      last.messages.push(msg);
    } else {
      acc.push({ date: dateKey, messages: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090e17] overflow-hidden relative">
      {/* Header */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between backdrop-blur-md flex-shrink-0 z-10">
        <div
          onClick={() => {
            if (!conversation.is_group && otherMember && onViewProfile) {
              onViewProfile(otherMember);
            }
          }}
          className={`flex items-center gap-2.5 sm:gap-3 ${!conversation.is_group ? 'cursor-pointer hover:opacity-85 transition group/header' : ''}`}
          title={!conversation.is_group ? `View ${chatTitle}'s profile` : undefined}
        >
          {onBackMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackMobile();
              }}
              className="md:hidden p-2 -ml-1 text-slate-300 hover:text-white rounded-xl active:bg-slate-800 transition flex items-center justify-center"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <Avatar name={chatTitle} url={avatarUrl} sizeClass="w-10 h-10" />
            {!conversation.is_group && (
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white group-hover/header:text-cyan-400 transition">{chatTitle}</h2>
            <p className="text-xs text-slate-400">
              {conversation.is_group
                ? `${conversation.members?.length || 0} members`
                : statusText}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 relative">
          <button onClick={() => setShowSearch(p => !p)} className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition"><Search className="w-4 h-4" /></button>
          <button className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition"><Phone className="w-4 h-4" /></button>
          <button className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition"><Video className="w-4 h-4" /></button>
          <button onClick={() => setShowMenu((prev) => !prev)} className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition">
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-11 z-30 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5"
                >
                  {!conversation.is_group && otherMember && onViewProfile && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onViewProfile(otherMember);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition"
                    >
                      <UserIcon className="w-4 h-4 text-cyan-400" /> View Profile
                    </button>
                  )}
                  {onDeleteConversation && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteConversation(conversation.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Conversation
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <div className="absolute top-16 left-0 right-0 z-20 shadow-lg">
            <MessageSearch 
              conversationId={conversation.id} 
              onClose={() => setShowSearch(false)} 
              onScrollToMessage={scrollToMessage} 
            />
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative" onClick={() => setReactionPickerMsgId(null)}>
        {loading ? (
          <div className="flex flex-col gap-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-10 rounded-2xl bg-slate-800 animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center mb-4">
              <Avatar name={chatTitle} url={avatarUrl} sizeClass="w-10 h-10" />
            </div>
            <p className="text-white font-semibold">{chatTitle}</p>
            <p className="text-slate-400 text-sm mt-1">Send a message to start the conversation!</p>
          </motion.div>
        ) : (
          <>
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[11px] text-slate-500 font-medium px-2">{group.date}</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {group.messages.map((msg, i) => {
                  const isMe = msg.sender_id === user?.id;
                  const timeStr = format(new Date(msg.created_at), 'HH:mm');
                  const showAvatar = !isMe && (i === 0 || group.messages[i - 1]?.sender_id !== msg.sender_id);

                  return (
                    <motion.div
                      key={msg.id}
                      ref={el => messageRefs.current[msg.id] = el}
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      onHoverStart={() => setHoveredMsg(msg.id)}
                      onHoverEnd={() => setHoveredMsg(null)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setReactionPickerMsgId(msg.id);
                      }}
                      className={`flex group ${isMe ? 'justify-end' : 'justify-start'} mb-2 relative rounded transition-colors`}
                    >
                      {/* Other user avatar */}
                      {!isMe && (
                        <div
                          onClick={() => msg.sender && onViewProfile && onViewProfile(msg.sender)}
                          className={`w-8 flex-shrink-0 mr-2 mt-auto ${msg.sender ? 'cursor-pointer hover:opacity-80 transition' : ''}`}
                          title={msg.sender ? `View ${msg.sender.display_name}'s profile` : undefined}
                        >
                          {showAvatar && <Avatar name={msg.sender?.display_name || 'U'} url={msg.sender?.avatar_url} sizeClass="w-8 h-8" />}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] relative`}>
                        {/* Sender name in group */}
                        {conversation.is_group && !isMe && showAvatar && (
                          <span
                            onClick={() => msg.sender && onViewProfile && onViewProfile(msg.sender)}
                            className="text-[11px] font-semibold text-cyan-400 mb-1 ml-1 cursor-pointer hover:underline"
                            title={msg.sender ? `View ${msg.sender.display_name}'s profile` : undefined}
                          >
                            {msg.sender?.display_name}
                          </span>
                        )}

                        <div className={`relative rounded-2xl px-4 py-2.5 shadow-md ${
                          isMe
                            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50'
                        }`}>
                          
                          {/* Replied-to preview */}
                          {msg.reply_to && (
                            <div className="mb-2 pl-3 py-1 border-l-2 border-white/30 bg-black/10 rounded-r-md opacity-90 cursor-pointer"
                                 onClick={() => scrollToMessage(msg.reply_to!.id)}>
                              <p className="text-[10px] font-bold text-white/90">{msg.reply_to.sender?.display_name || 'User'}</p>
                              <p className="text-xs truncate text-white/80">{msg.reply_to.content || '🎤 Voice message'}</p>
                            </div>
                          )}

                          {/* ── Attachment: Image ── */}
                          {msg.attachment_url && isImageType(msg.attachment_type, msg.attachment_name) && (
                            <div className="mb-2 overflow-hidden rounded-xl cursor-pointer max-w-xs" onClick={() => setLightbox({ url: msg.attachment_url!, type: 'image' })}>
                              <img
                                src={msg.attachment_url}
                                alt={msg.attachment_name || 'image'}
                                className="w-full max-h-72 object-cover hover:opacity-90 transition rounded-xl"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* ── Attachment: Video ── */}
                          {msg.attachment_url && isVideoType(msg.attachment_type, msg.attachment_name) && (
                            <div className="mb-2 rounded-xl overflow-hidden max-w-xs bg-black cursor-pointer relative group/vid"
                                 onClick={() => setLightbox({ url: msg.attachment_url!, type: 'video' })}>
                              <video
                                src={msg.attachment_url}
                                className="w-full max-h-64 object-contain rounded-xl"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/vid:bg-black/50 transition rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                              {msg.attachment_name && (
                                <p className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] text-white bg-black/50 truncate">{msg.attachment_name}</p>
                              )}
                            </div>
                          )}

                          {/* ── Attachment: File (non-image, non-video) ── */}
                          {msg.attachment_name && !isImageType(msg.attachment_type, msg.attachment_name) && !isVideoType(msg.attachment_type, msg.attachment_name) && (
                            <div className="mb-2 p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-blue-500/20">
                                <FileText className="w-4 h-4 text-cyan-300" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate">{msg.attachment_name}</p>
                                {msg.attachment_size && (
                                  <p className="text-[10px] opacity-70">{(msg.attachment_size / 1024 / 1024).toFixed(1)} MB</p>
                                )}
                              </div>
                              {msg.attachment_url && msg.attachment_url !== '#' && (
                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                                  className="p-1 hover:bg-white/10 rounded-lg transition">
                                  <Download className="w-3.5 h-3.5 opacity-70" />
                                </a>
                              )}
                            </div>
                          )}
                          
                          {/* Voice Message */}
                          {msg.voice_url && (
                            <div className="flex items-center gap-3 min-w-[180px] mb-1">
                              <audio src={msg.voice_url} controls className="h-8 max-w-full" />
                              {msg.voice_duration && (
                                <span className="text-xs opacity-70">{Math.floor(msg.voice_duration / 60)}:{String(msg.voice_duration % 60).padStart(2, '0')}</span>
                              )}
                            </div>
                          )}

                          {/* Content */}
                          {msg.content && (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                          )}

                          {/* Time & status */}
                          <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-blue-200/80' : 'text-slate-400'} text-[10px]`}>
                            <span>{timeStr}</span>
                            {isMe && <CheckCheck className={`w-3 h-3 ${getReadStatus(msg) === 'read' ? 'text-cyan-400' : 'opacity-70'}`} />}
                          </div>
                        </div>

                        {/* Reaction display */}
                        {reactions[msg.id]?.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 z-10 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(
                              reactions[msg.id].reduce<Record<string, { count: number; mine: boolean; users: string[] }>>((acc, r) => {
                                if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false, users: [] };
                                acc[r.emoji].count++;
                                if (r.profiles?.display_name) acc[r.emoji].users.push(r.profiles.display_name);
                                if (r.user_id === user?.id) acc[r.emoji].mine = true;
                                return acc;
                              }, {})
                            ).map(([emoji, { count, mine, users }]) => (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction(msg.id, emoji)}
                                title={users.join(', ')}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition shadow-sm ${
                                  mine
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <span>{emoji}</span> <span className="text-[10px] font-medium">{count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Hover actions (Reply, Delete, React) */}
                        <AnimatePresence>
                          {hoveredMsg === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`absolute top-2 flex items-center gap-1 bg-slate-800 shadow-md border border-slate-700 rounded-lg p-1 ${isMe ? '-left-24' : '-right-24'}`}
                            >
                              <button onClick={() => setReactionPickerMsgId(msg.id)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-md transition" title="Add reaction">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setReplyTo(msg)} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-md transition" title="Reply">
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              {isMe && onDeleteMessage && (
                                <button onClick={() => onDeleteMessage(msg.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Reaction Picker Overlay */}
                        <AnimatePresence>
                          {reactionPickerMsgId === msg.id && (
                            <ReactionPicker
                              align={isMe ? 'right' : 'left'}
                              onSelect={(emoji) => handleAddReaction(msg.id, emoji)}
                              onClose={() => setReactionPickerMsgId(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </>
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <div className="flex gap-1 bg-slate-800 px-3 py-2 rounded-full border border-slate-700 shadow-sm">
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.8 }}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              ))}
            </div>
            <span className="text-xs text-slate-400">
              {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-slate-900/95 border-t border-slate-800 flex items-center gap-3 overflow-hidden shadow-[0_-4px_10px_rgba(0,0,0,0.2)] z-10"
          >
            <Reply className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 border-l-2 border-cyan-400 pl-3">
              <p className="text-xs font-semibold text-cyan-400">{replyTo.sender?.display_name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{replyTo.content || (replyTo.voice_url ? '🎤 Voice message' : '📎 Attachment')}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-red-400 transition p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File preview bar */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-slate-900/95 border-t border-slate-800 flex items-center gap-3 overflow-hidden z-10"
          >
            {selectedFilePreview && isImageType(selectedFile.type) ? (
              <img src={selectedFilePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-700" />
            ) : selectedFilePreview && isVideoType(selectedFile.type) ? (
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                <svg className="w-5 h-5 text-cyan-400 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            ) : (
              <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-xs text-slate-300 truncate block">{selectedFile.name}</span>
              <span className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</span>
            </div>
            <button onClick={() => { setSelectedFile(null); setSelectedFilePreview(null); }} className="text-slate-400 hover:text-red-400 transition p-1">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-4 bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-2xl flex gap-1.5 z-20 flex-wrap w-64"
          >
            {EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => { setInputText(p => p + emoji); setShowEmoji(false); }}
                className="p-1.5 hover:bg-slate-700 rounded-xl text-xl transition w-10 h-10 flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="p-2 sm:p-3 bg-slate-900/95 border-t border-slate-800/80 flex items-end gap-1.5 sm:gap-2 backdrop-blur-md flex-shrink-0 relative pb-[max(0.625rem,env(safe-area-inset-bottom))] z-10">
        {showVoiceRecorder ? (
          <VoiceRecorder 
            conversationId={conversation.id} 
            onRecorded={handleVoiceRecorded} 
            onCancel={() => setShowVoiceRecorder(false)} 
          />
        ) : (
          <form onSubmit={handleSend} className="flex flex-1 items-end gap-1.5 sm:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setSelectedFile(f);
                if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
                  const url = URL.createObjectURL(f);
                  setSelectedFilePreview(url);
                } else {
                  setSelectedFilePreview(null);
                }
                e.target.value = '';
              }}
              className="hidden"
            />

            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition flex-shrink-0"
              title="Attach file">
              <Paperclip className="w-5 h-5" />
            </button>

            <button type="button" onClick={() => setShowEmoji(p => !p)}
              className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition flex-shrink-0 hidden sm:block" title="Emojis">
              <Smile className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); autoResizeTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 py-2.5 px-4 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition resize-none min-h-[42px] max-h-[120px]"
            />

            {!inputText.trim() && !selectedFile ? (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition flex-shrink-0" title="Record Voice Message"
              >
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="submit"
                disabled={isSending}
                className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex-shrink-0"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />}
              </motion.button>
            )}
          </form>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2 transition"
              onClick={() => setLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            >
              {lightbox.type === 'image' ? (
                <img
                  src={lightbox.url}
                  alt="Full size"
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                />
              ) : (
                <video
                  src={lightbox.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl bg-black"
                />
              )}
            </motion.div>
            <a
              href={lightbox.url}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2 transition"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
