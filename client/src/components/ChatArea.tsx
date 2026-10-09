import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Paperclip, Smile, Phone, Video, MoreVertical,
  ArrowLeft, Trash2, CheckCheck, FileText, Download, X, Loader2
} from 'lucide-react';
import { Message, Conversation } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { format, isToday } from 'date-fns';
import { api } from '../lib/api';

const EMOJIS = ['👍', '❤️', '🔥', '🚀', '😊', '🎉', '👋', '😂', '💯', '🙏'];

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string, attachment?: { url: string; name: string; type: string; size: number }) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
  onDeleteConversation?: (id: string) => Promise<void>;
  onBackMobile?: () => void;
  loading?: boolean;
}

const Avatar: React.FC<{ name: string; url?: string | null; size?: number }> = ({ name, url, size = 9 }) => (
  <div className={`w-${size} h-${size} flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center`}>
    {url ? (
      <img src={url} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-white font-bold text-sm">{name?.charAt(0)?.toUpperCase() || '?'}</span>
    )}
  </div>
);

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation, messages, onSendMessage, onDeleteMessage, onDeleteConversation, onBackMobile, loading = false,
}) => {
  const { user, profile } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  const isOnline = otherMember?.status === 'online';

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
      await onSendMessage(inputText.trim(), attachment);
      setInputText('');
      setSelectedFile(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    <div className="flex-1 flex flex-col h-full bg-[#090e17] overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBackMobile && (
            <button onClick={onBackMobile} className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <Avatar name={chatTitle} url={avatarUrl} size={10} />
            {!conversation.is_group && (
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{chatTitle}</h2>
            <p className="text-xs text-slate-400">
              {conversation.is_group
                ? `${conversation.members?.length || 0} members`
                : isOnline ? '🟢 Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 relative">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
              <Avatar name={chatTitle} url={avatarUrl} size={10} />
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
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      onHoverStart={() => setHoveredMsg(msg.id)}
                      onHoverEnd={() => setHoveredMsg(null)}
                      className={`flex group ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      {/* Other user avatar */}
                      {!isMe && (
                        <div className="w-8 flex-shrink-0 mr-2 mt-auto">
                          {showAvatar && <Avatar name={msg.sender?.display_name || 'U'} url={msg.sender?.avatar_url} size={8} />}
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {/* Sender name in group */}
                        {conversation.is_group && !isMe && showAvatar && (
                          <span className="text-[11px] font-semibold text-cyan-400 mb-1 ml-1">
                            {msg.sender?.display_name}
                          </span>
                        )}

                        <div className={`relative rounded-2xl px-4 py-2.5 shadow-md ${
                          isMe
                            ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50'
                        }`}>
                          {/* Attachment */}
                          {msg.attachment_name && (
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

                          {/* Content */}
                          {msg.content && (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                          )}

                          {/* Time & status */}
                          <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-blue-200/80' : 'text-slate-500'} text-[10px]`}>
                            <span>{timeStr}</span>
                            {isMe && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>

                        {/* Delete hover action */}
                        <AnimatePresence>
                          {isMe && hoveredMsg === msg.id && onDeleteMessage && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => onDeleteMessage(msg.id)}
                              className="mt-1 flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </motion.button>
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
        <div ref={messagesEndRef} />
      </div>

      {/* File preview bar */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center gap-3 overflow-hidden"
          >
            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-xs text-slate-300 truncate flex-1">{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-400 transition">
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
      <form onSubmit={handleSend} className="p-3 bg-slate-900/95 border-t border-slate-800/80 flex items-end gap-2 backdrop-blur-md flex-shrink-0 relative">
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} className="hidden" />

        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition flex-shrink-0">
          <Paperclip className="w-5 h-5" />
        </button>

        <button type="button" onClick={() => setShowEmoji(p => !p)}
          className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition flex-shrink-0 hidden sm:block">
          <Smile className="w-5 h-5" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); autoResizeTextarea(); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          disabled={isSending}
          className="flex-1 py-2.5 px-4 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition resize-none min-h-[42px] max-h-[120px]"
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={isSending || (!inputText.trim() && !selectedFile)}
          className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex-shrink-0"
        >
          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />}
        </motion.button>
      </form>
    </div>
  );
};
