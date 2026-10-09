import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User as UserIcon, Waves, Loader2 } from 'lucide-react';
import { Conversation, Message, UserProfile } from '../lib/types';
import { ChatList } from '../components/ChatList';
import { ChatArea } from '../components/ChatArea';
import { NewChatModal } from '../components/NewChatModal';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const ChatDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, isConfigured } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ─── Load conversations from Supabase ─────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user || !isConfigured) { setLoadingConversations(false); return; }
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          members:conversation_members(
            id, conversation_id, user_id, role, joined_at, last_read_at,
            profiles(id, display_name, username, avatar_url, bio, status)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // For each conversation, get last message + unread count
      const withExtras = await Promise.all(
        (data || []).map(async (conv) => {
          // Check if current user is a member
          const isMember = conv.members?.some((m: any) => m.user_id === user.id);
          if (!isMember) return null;

          const [{ data: lastMsgData }, { count }] = await Promise.all([
            supabase
              .from('messages')
              .select('id, content, sender_id, created_at, attachment_name')
              .eq('conversation_id', conv.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(1),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .is('deleted_at', null)
              .neq('sender_id', user.id),
          ]);

          return {
            ...conv,
            last_message: lastMsgData?.[0] ?? null,
            unread_count: count ?? 0,
          };
        })
      );

      const filtered = withExtras.filter(Boolean) as Conversation[];
      setConversations(filtered);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user, isConfigured]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ─── Load messages for selected conversation ───────────────────────────────
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user || !isConfigured) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, display_name, username, avatar_url, status)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [user, isConfigured]);

  // ─── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedConversationId || !isConfigured) return;

    // Cleanup old subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversationId}`,
      }, async (payload) => {
        // Fetch with sender profile
        const { data } = await supabase
          .from('messages')
          .select(`*, sender:profiles!sender_id(id, display_name, username, avatar_url, status)`)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
        }
        // Refresh conversation list to update last_message
        loadConversations();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversationId}`,
      }, (payload) => {
        setMessages((prev) =>
          prev.map((m) => m.id === payload.new.id ? { ...m, ...payload.new } : m)
        );
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, isConfigured, loadConversations]);

  // ─── Select conversation ───────────────────────────────────────────────────
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setMessages([]);
    setShowMobileChat(true);
    loadMessages(id);
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (
    content: string,
    attachment?: { url: string; name: string; type: string; size: number }
  ) => {
    if (!selectedConversationId || !user || !isConfigured) return;

    const msgData: Record<string, unknown> = {
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content,
    };

    if (attachment) {
      msgData.attachment_url = attachment.url;
      msgData.attachment_name = attachment.name;
      msgData.attachment_type = attachment.type;
      msgData.attachment_size = attachment.size;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(msgData)
      .select(`*, sender:profiles!sender_id(id, display_name, username, avatar_url, status)`)
      .single();

    if (!error && data) {
      setMessages((prev) => {
        if (prev.find((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      // Update conversation's updated_at so it bubbles to top
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversationId);
      loadConversations();
    }
  };

  // ─── Delete message ────────────────────────────────────────────────────────
  const handleDeleteMessage = async (id: string) => {
    if (!isConfigured) return;
    await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // ─── Start new chat with found user ───────────────────────────────────────
  const handleStartChatWithUser = async (recipient: UserProfile) => {
    if (!user || !isConfigured) return;
    setShowNewChatModal(false);

    // Check if conversation already exists between these two users
    const existing = conversations.find((conv) =>
      !conv.is_group &&
      conv.members?.length === 2 &&
      conv.members.some((m) => m.user_id === recipient.id) &&
      conv.members.some((m) => m.user_id === user.id)
    );

    if (existing) {
      handleSelectConversation(existing.id);
      return;
    }

    // Create new direct conversation
    const { data: newConv, error: convErr } = await supabase
      .from('conversations')
      .insert({ is_group: false, created_by: user.id })
      .select()
      .single();

    if (convErr || !newConv) {
      console.error('Failed to create conversation:', convErr);
      return;
    }

    // Add both members
    await supabase.from('conversation_members').insert([
      { conversation_id: newConv.id, user_id: user.id, role: 'admin' },
      { conversation_id: newConv.id, user_id: recipient.id, role: 'member' },
    ]);

    await loadConversations();
    handleSelectConversation(newConv.id);
  };

  // ─── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? null;

  return (
    <div className="h-screen flex bg-[#090e17] overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-800/60 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}
      >
        {/* App header in sidebar */}
        <div className="h-16 px-4 bg-slate-950/80 border-b border-slate-800/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-400 flex items-center justify-center shadow-lg">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">Bluewave</span>
          </div>

          {/* Profile menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-xl transition"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex-shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                    {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowProfileMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-12 z-30 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2"
                  >
                    <div className="px-3 py-2 mb-1 border-b border-slate-800">
                      <p className="text-sm font-bold text-white truncate">{profile?.display_name || 'You'}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => { navigate('/app/profile'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition">
                      <UserIcon className="w-4 h-4" /> Profile
                    </button>
                    <button onClick={() => { navigate('/app/settings'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setShowNewChatModal(true)}
            loading={loadingConversations}
          />
        </div>
      </motion.aside>

      {/* Chat area */}
      <main className={`flex-1 flex flex-col overflow-hidden ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatArea
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onBackMobile={() => setShowMobileChat(false)}
          loading={loadingMessages}
        />
      </main>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={handleStartChatWithUser}
      />
    </div>
  );
};
