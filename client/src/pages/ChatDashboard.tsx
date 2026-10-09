import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User as UserIcon, Waves, AlertCircle, X } from 'lucide-react';
import { Conversation, Message, UserProfile } from '../lib/types';
import { ChatList } from '../components/ChatList';
import { ChatArea } from '../components/ChatArea';
import { NewChatModal } from '../components/NewChatModal';
import { UserProfileModal } from '../components/UserProfileModal';
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
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Load conversations from Supabase (safe multi-step fetch) ─────────────
  const loadConversations = useCallback(async () => {
    if (!user || !isConfigured) { setLoadingConversations(false); return; }
    try {
      // 1. Get all conversation memberships for the current user
      const { data: myMemberRows, error: myMemberErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myMemberErr) throw myMemberErr;
      if (!myMemberRows || myMemberRows.length === 0) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      const myConvIds = myMemberRows.map((m) => m.conversation_id);

      // 2. Fetch conversation records
      const { data: convRows, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .in('id', myConvIds)
        .order('updated_at', { ascending: false });

      if (convErr) throw convErr;
      if (!convRows || convRows.length === 0) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      // 3. Fetch all members across these conversations
      const { data: allMembers, error: allMemErr } = await supabase
        .from('conversation_members')
        .select('*')
        .in('conversation_id', myConvIds);

      if (allMemErr) throw allMemErr;

      // 4. Fetch profiles for all member user_ids
      const allUserIds = Array.from(new Set((allMembers || []).map((m) => m.user_id)));
      let profileMap = new Map<string, UserProfile>();
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', allUserIds);

        if (profilesData) {
          profileMap = new Map(profilesData.map((p) => [p.id, p]));
        }
      }

      // 5. Build enriched conversations with last message and unread count
      const enriched = await Promise.all(
        convRows.map(async (conv) => {
          const members = (allMembers || [])
            .filter((m) => m.conversation_id === conv.id)
            .map((m) => ({
              ...m,
              profiles: profileMap.get(m.user_id) || {
                id: m.user_id,
                display_name: 'User',
                username: 'user',
              },
            }));

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
            members,
            last_message: lastMsgData?.[0] ?? null,
            unread_count: count ?? 0,
          } as Conversation;
        })
      );

      // Deduplicate direct conversations by recipient user_id
      // Keeps the most recent / active conversation and eliminates duplicates
      const seenDirectRecipients = new Set<string>();
      const deduplicated: Conversation[] = [];

      for (const conv of enriched) {
        if (conv.is_group) {
          deduplicated.push(conv);
        } else {
          const otherMember = conv.members?.find((m) => m.user_id !== user.id);
          const otherId = otherMember?.user_id;
          if (otherId) {
            if (!seenDirectRecipients.has(otherId)) {
              seenDirectRecipients.add(otherId);
              deduplicated.push(conv);
            }
          } else {
            deduplicated.push(conv);
          }
        }
      }

      setConversations(deduplicated);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      if (err?.message?.includes('recursion') || err?.code === '42P17') {
        showToast('Database RLS recursion error. Please run the SQL fix in Supabase.');
      }
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
      const { data: rawMessages, error: msgErr } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (msgErr) throw msgErr;

      const senderIds = Array.from(new Set((rawMessages || []).map((m) => m.sender_id)));
      let senderMap = new Map<string, UserProfile>();
      if (senderIds.length > 0) {
        const { data: senders } = await supabase
          .from('profiles')
          .select('*')
          .in('id', senderIds);
        if (senders) {
          senderMap = new Map(senders.map((s) => [s.id, s]));
        }
      }

      const enriched = (rawMessages || []).map((m) => ({
        ...m,
        sender: senderMap.get(m.sender_id) || {
          id: m.sender_id,
          display_name: 'User',
          username: 'user',
        },
      }));

      setMessages(enriched as Message[]);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      if (err?.message?.includes('recursion') || err?.code === '42P17') {
        showToast('Database RLS recursion error. Please run the SQL fix in Supabase.');
      }
    } finally {
      setLoadingMessages(false);
    }
  }, [user, isConfigured]);

  // ─── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedConversationId || !isConfigured) return;

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
        const { data: rawMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('id', payload.new.id)
          .single();

        if (rawMsg) {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, status')
            .eq('id', rawMsg.sender_id)
            .maybeSingle();

          const enriched = {
            ...rawMsg,
            sender: senderProfile || undefined,
          };

          setMessages((prev) => {
            if (prev.find((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
        }
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
    attachment?: { url: string; name: string; type: string; size: number },
    replyToId?: string,
    voiceUrl?: string,
    voiceDuration?: number
  ) => {
    if (!selectedConversationId || !user || !isConfigured) return;

    const optimisticId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content: content || ' ',
      reply_to_id: replyToId,
      voice_url: voiceUrl,
      voice_duration: voiceDuration,
      attachment_url: attachment?.url,
      attachment_name: attachment?.name,
      attachment_type: attachment?.type,
      attachment_size: attachment?.size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: profile || {
        id: user.id,
        display_name: user.email?.split('@')[0] || 'You',
        username: user.email?.split('@')[0] || 'you',
      },
    };

    // Optimistically show message immediately
    setMessages((prev) => [...prev, optimisticMsg]);

    const msgData: Record<string, unknown> = {
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content: content || ' ',
    };

    if (replyToId) msgData.reply_to_id = replyToId;
    if (voiceUrl) {
      msgData.voice_url = voiceUrl;
      msgData.voice_duration = voiceDuration;
    }

    if (attachment) {
      msgData.attachment_url = attachment.url;
      msgData.attachment_name = attachment.name;
      msgData.attachment_type = attachment.type;
      msgData.attachment_size = attachment.size;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(msgData)
      .select('*')
      .single();

    if (!error && data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...data, sender: optimisticMsg.sender } : m))
      );
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversationId);
      loadConversations();
    } else if (error) {
      console.error('Send message error:', error);
      if (error.message?.includes('recursion') || error.code === '42P17') {
        showToast('Database RLS error. Please run the SQL fix script in Supabase.');
      } else {
        showToast(error.message || 'Failed to send message.');
      }
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

  // ─── Delete / Leave conversation ──────────────────────────────────────────
  const handleDeleteConversation = async (convId: string) => {
    if (!user || !isConfigured) return;
    try {
      await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', convId)
        .eq('user_id', user.id);

      await supabase
        .from('conversations')
        .delete()
        .eq('id', convId);

      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConversationId === convId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
      showToast('Conversation removed', 'success');
    } catch (err: any) {
      console.error('Delete conversation error:', err);
      showToast(err.message || 'Failed to remove conversation');
    }
  };

  // ─── Start new DM with found user ─────────────────────────────────────────
  const handleStartChatWithUser = async (recipient: UserProfile) => {
    if (!user || !isConfigured) return;
    setShowNewChatModal(false);

    try {
      // 1. Check if conversation already exists in memory with this recipient
      const memExisting = conversations.find((conv) =>
        !conv.is_group &&
        conv.members?.some((m) => m.user_id === recipient.id)
      );

      if (memExisting) {
        handleSelectConversation(memExisting.id);
        return;
      }

      let existingConvId: string | null = null;

      // Check DB directly for shared direct conversations
      const { data: myConvs } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myConvs && myConvs.length > 0) {
        const myConvIds = myConvs.map((c) => c.conversation_id);
        const { data: shared } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .in('conversation_id', myConvIds)
          .eq('user_id', recipient.id);

        if (shared && shared.length > 0) {
          const sharedIds = shared.map((s) => s.conversation_id);
          const { data: directConvs } = await supabase
            .from('conversations')
            .select('id')
            .in('id', sharedIds)
            .eq('is_group', false)
            .limit(1);

          if (directConvs && directConvs.length > 0) {
            existingConvId = directConvs[0].id;
          }
        }
      }

      if (existingConvId) {
        await loadConversations();
        handleSelectConversation(existingConvId);
        return;
      }

      // 2. Generate a client UUID so we don't need .select() returning row (avoids RLS SELECT barrier)
      const newConvId = crypto.randomUUID();

      // 3. Insert conversation record without .select()
      const { error: convErr } = await supabase
        .from('conversations')
        .insert({ id: newConvId, is_group: false });

      if (convErr) {
        console.error('Failed to create conversation:', convErr);
        showToast(convErr.message || 'Failed to start chat. Please try again.');
        return;
      }

      // 4. Add both members
      const { error: memErr } = await supabase
        .from('conversation_members')
        .insert([
          { conversation_id: newConvId, user_id: user.id, role: 'admin' },
          { conversation_id: newConvId, user_id: recipient.id, role: 'member' },
        ]);

      if (memErr) {
        console.error('Failed to add members:', memErr);
        showToast(memErr.message || 'Failed to add conversation members.');
        return;
      }

      // 5. Optimistically add conversation to state immediately so UI updates in 0ms
      const newConvObj: Conversation = {
        id: newConvId,
        title: null,
        is_group: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        members: [
          {
            id: crypto.randomUUID(),
            conversation_id: newConvId,
            user_id: user.id,
            role: 'admin',
            joined_at: new Date().toISOString(),
            last_read_at: new Date().toISOString(),
            profiles: profile || {
              id: user.id,
              display_name: user.email?.split('@')[0] || 'You',
              username: user.email?.split('@')[0] || 'you',
            },
          },
          {
            id: crypto.randomUUID(),
            conversation_id: newConvId,
            user_id: recipient.id,
            role: 'member',
            joined_at: new Date().toISOString(),
            last_read_at: new Date().toISOString(),
            profiles: recipient,
          },
        ],
        last_message: null,
        unread_count: 0,
      };

      setConversations((prev) => [newConvObj, ...prev.filter((c) => c.id !== newConvId)]);
      setSelectedConversationId(newConvId);
      setMessages([]);
      setShowMobileChat(true);

      // Background reload
      loadConversations();
      showToast('Chat started!', 'success');
    } catch (err: any) {
      console.error('Unexpected error starting chat:', err);
      showToast(err.message || 'An unexpected error occurred.');
    }
  };

  // ─── Create group channel ──────────────────────────────────────────────────
  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    if (!user || !isConfigured) return;
    setShowNewChatModal(false);

    try {
      const newGroupId = crypto.randomUUID();

      const { error: convErr } = await supabase
        .from('conversations')
        .insert({ id: newGroupId, is_group: true, title: name });

      if (convErr) {
        console.error('Failed to create group:', convErr);
        showToast(convErr.message || 'Failed to create group channel.');
        return;
      }

      const inserts = [
        { conversation_id: newGroupId, user_id: user.id, role: 'admin' },
        ...memberIds.map((id) => ({ conversation_id: newGroupId, user_id: id, role: 'member' })),
      ];

      const { error: memErr } = await supabase
        .from('conversation_members')
        .insert(inserts);

      if (memErr) {
        console.error('Failed to add group members:', memErr);
        showToast(memErr.message || 'Failed to add group members.');
        return;
      }

      await loadConversations();
      handleSelectConversation(newGroupId);
      showToast('Group channel created!', 'success');
    } catch (err: any) {
      console.error('Unexpected error creating group:', err);
      showToast(err.message || 'An unexpected error occurred.');
    }
  };

  // ─── Sign out ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) ?? null;

  return (
    <div className="h-[100dvh] flex bg-[#090e17] overflow-hidden relative">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium border max-w-sm w-full mx-4 ${
              toast.type === 'error'
                ? 'bg-red-950 border-red-500/40 text-red-300'
                : 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 transition">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-slate-900 flex items-center justify-center">
              <img src="/chart-logo.png" alt="Chart" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Chart</span>
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
            onDeleteConversation={handleDeleteConversation}
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
          onDeleteConversation={handleDeleteConversation}
          onViewProfile={setViewingProfileUser}
          onBackMobile={() => setShowMobileChat(false)}
          loading={loadingMessages}
        />
      </main>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={handleStartChatWithUser}
        onCreateGroup={handleCreateGroup}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        user={viewingProfileUser}
        isOpen={!!viewingProfileUser}
        onClose={() => setViewingProfileUser(null)}
        onStartChat={handleStartChatWithUser}
      />
    </div>
  );
};
