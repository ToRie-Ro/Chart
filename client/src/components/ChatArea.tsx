import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Send, 
  Smile, 
  FileText, 
  Download, 
  CheckCheck,
  ArrowLeft,
  Trash2,
  Edit2
} from 'lucide-react';
import { Message, Conversation } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';
import { format } from 'date-fns';

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string, attachment?: { url: string; name: string; type: string; size: number }) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onBackMobile?: () => void;
  onViewProfile?: (userId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  onSendMessage,
  onDeleteMessage,
  onBackMobile,
  onViewProfile,
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 bg-slate-950/40 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
          <Send className="w-8 h-8 -rotate-12 translate-x-0.5" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Select a conversation</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1">
          Choose a conversation from the sidebar or start a new chat to begin messaging with end-to-end security.
        </p>
      </div>
    );
  }

  // Determine chat partner
  const otherMember = conversation.members?.find((m) => m.user_id !== user?.id)?.profiles;
  const chatTitle = conversation.is_group
    ? conversation.title || 'Group Conversation'
    : otherMember?.display_name || 'Chat Member';
  const avatarUrl = conversation.is_group ? null : otherMember?.avatar_url;
  const isOnline = otherMember?.status === 'online';

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      let attachmentData;

      if (selectedFile) {
        // Upload file to Supabase storage if configured
        if (isSupabaseConfigured) {
          const fileExt = selectedFile.name.split('.').pop();
          const filePath = `${conversation.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, selectedFile);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('chat-attachments')
              .getPublicUrl(filePath);

            attachmentData = {
              url: urlData.publicUrl,
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
            };
          }
        } else {
          // Mock attachment for preview/demo
          attachmentData = {
            url: '#',
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
          };
        }
      }

      await onSendMessage(inputText, attachmentData);
      setInputText('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const emojis = ['👍', '❤️', '🔥', '🚀', '😊', '🎉', '👋', '🍷', '💡'];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/90 relative overflow-hidden">
      {/* Top Chat Header */}
      <div className="h-16 px-4 md:px-6 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* User Avatar with status */}
          <div 
            onClick={() => otherMember && onViewProfile && onViewProfile(otherMember.id)}
            className="relative w-10 h-10 rounded-full overflow-hidden bg-blue-900 flex-shrink-0 cursor-pointer ring-2 ring-blue-500/30"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={chatTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white bg-blue-600">
                {chatTitle.charAt(0).toUpperCase()}
              </div>
            )}
            {!conversation.is_group && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                }`}
              />
            )}
          </div>

          <div 
            onClick={() => otherMember && onViewProfile && onViewProfile(otherMember.id)}
            className="cursor-pointer"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2 hover:text-cyan-400 transition">
              {chatTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {conversation.is_group
                ? `${conversation.members?.length || 0} members`
                : isOnline
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2 text-slate-400">
          <button className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Search">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Voice Call">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Video Call">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition" title="More Options">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Feed Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm font-medium">No messages in this chat yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const timeStr = format(new Date(msg.created_at), 'HH:mm');

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-md transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-xs'
                      : 'bg-slate-800/90 dark:bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/50'
                  }`}
                >
                  {/* Sender Name in Group Chat */}
                  {conversation.is_group && !isMe && msg.sender && (
                    <p className="text-[11px] font-bold text-cyan-400 mb-1">
                      {msg.sender.display_name}
                    </p>
                  )}

                  {/* Attachment Card if present */}
                  {msg.attachment_name && (
                    <div className="mb-2 p-2.5 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-cyan-300">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">
                            {msg.attachment_name}
                          </p>
                          <p className="text-[10px] text-slate-300">
                            {msg.attachment_size
                              ? `${(msg.attachment_size / 1024 / 1024).toFixed(1)} MB`
                              : 'File'}
                          </p>
                        </div>
                      </div>

                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-200 hover:text-white transition"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.content && (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                      {msg.content}
                    </p>
                  )}

                  {/* Footer Timestamp & Delivery Status */}
                  <div
                    className={`flex items-center gap-1.5 mt-1 justify-end text-[10px] ${
                      isMe ? 'text-blue-200/90' : 'text-slate-400'
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />}
                  </div>
                </div>

                {/* Hover action menu (Delete for sender) */}
                {isMe && onDeleteMessage && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-2 pr-1">
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1 transition"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Badge */}
      {selectedFile && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium truncate max-w-xs">{selectedFile.name}</span>
            <span className="text-slate-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-xs text-red-400 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-2xl flex gap-1 z-20">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 md:p-4 bg-slate-900/95 border-t border-slate-800/80 flex items-center gap-2 md:gap-3 backdrop-blur-md"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setSelectedFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition"
          title="Attach File"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition hidden sm:flex"
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 py-2.5 px-4 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
        />

        <button
          type="submit"
          disabled={isSending || (!inputText.trim() && !selectedFile)}
          className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md shadow-blue-500/25 active:scale-95 transition"
          title="Send"
        >
          <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
        </button>
      </form>
    </div>
  );
};
