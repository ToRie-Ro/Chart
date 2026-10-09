import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { MobileNav } from '../components/MobileNav';
import { ChatList } from '../components/ChatList';
import { ChatArea } from '../components/ChatArea';
import { NewChatModal } from '../components/NewChatModal';
import { Conversation, Message, UserProfile } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

// Demo conversations matching reference screenshot #5
const INITIAL_DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-alex',
    is_group: false,
    created_at: '2026-10-09T08:00:00Z',
    updated_at: '2026-10-09T10:24:00Z',
    unread_count: 5,
    members: [
      {
        id: 'm-1',
        conversation_id: 'conv-alex',
        user_id: 'user-alex',
        role: 'member',
        joined_at: '2026-10-09T08:00:00Z',
        last_read_at: '2026-10-09T08:00:00Z',
        profiles: {
          id: 'user-alex',
          display_name: 'Alex Johnson',
          username: 'alexsj',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: "Just a guy who loves tech, travel and good conversations. Let's connect! 🚀",
          status: 'online',
        },
      },
    ],
    last_message: {
      id: 'msg-alex-last',
      content: 'Hey! How are you today?',
      sender_id: 'user-alex',
      created_at: '2026-10-09T10:24:00Z',
    },
  },
  {
    id: 'conv-sarah',
    is_group: false,
    created_at: '2026-10-09T07:00:00Z',
    updated_at: '2026-10-09T09:42:00Z',
    unread_count: 0,
    members: [
      {
        id: 'm-2',
        conversation_id: 'conv-sarah',
        user_id: 'user-sarah',
        role: 'member',
        joined_at: '2026-10-09T07:00:00Z',
        last_read_at: '2026-10-09T09:42:00Z',
        profiles: {
          id: 'user-sarah',
          display_name: 'Sarah Wilson',
          username: 'sarahw',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          status: 'online',
        },
      },
    ],
    last_message: {
      id: 'msg-sarah-last',
      content: 'Sounds great! 👍',
      sender_id: 'user-sarah',
      created_at: '2026-10-09T09:42:00Z',
    },
  },
  {
    id: 'conv-design',
    title: 'Design Team',
    is_group: true,
    created_at: '2026-10-08T12:00:00Z',
    updated_at: '2026-10-09T09:15:00Z',
    unread_count: 0,
    members: [],
    last_message: {
      id: 'msg-design-last',
      content: 'Meeting at 2 PM',
      sender_id: 'other',
      created_at: '2026-10-09T09:15:00Z',
    },
  },
  {
    id: 'conv-mike',
    is_group: false,
    created_at: '2026-10-08T10:00:00Z',
    updated_at: '2026-10-09T08:33:00Z',
    unread_count: 0,
    members: [
      {
        id: 'm-4',
        conversation_id: 'conv-mike',
        user_id: 'user-mike',
        role: 'member',
        joined_at: '2026-10-08T10:00:00Z',
        last_read_at: '2026-10-09T08:33:00Z',
        profiles: {
          id: 'user-mike',
          display_name: 'Mike Chen',
          username: 'mikec',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          status: 'offline',
        },
      },
    ],
    last_message: {
      id: 'msg-mike-last',
      content: 'Check this out!',
      sender_id: 'user-mike',
      created_at: '2026-10-09T08:33:00Z',
    },
  },
  {
    id: 'conv-family',
    title: 'Family Group',
    is_group: true,
    created_at: '2026-10-07T14:00:00Z',
    updated_at: '2026-10-08T20:00:00Z',
    unread_count: 0,
    members: [],
    last_message: {
      id: 'msg-fam-last',
      content: 'Dinner tonight? 🍷',
      sender_id: 'other',
      created_at: '2026-10-08T20:00:00Z',
    },
  },
  {
    id: 'conv-emma',
    is_group: false,
    created_at: '2026-10-07T09:00:00Z',
    updated_at: '2026-10-08T18:00:00Z',
    unread_count: 0,
    members: [
      {
        id: 'm-6',
        conversation_id: 'conv-emma',
        user_id: 'user-emma',
        role: 'member',
        joined_at: '2026-10-07T09:00:00Z',
        last_read_at: '2026-10-08T18:00:00Z',
        profiles: {
          id: 'user-emma',
          display_name: 'Emma Davis',
          username: 'emmad',
          avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
          status: 'online',
        },
      },
    ],
    last_message: {
      id: 'msg-emma-last',
      content: 'See you soon!',
      sender_id: 'user-emma',
      created_at: '2026-10-08T18:00:00Z',
    },
  },
  {
    id: 'conv-alpha',
    title: 'Project Alpha',
    is_group: true,
    created_at: '2026-10-06T10:00:00Z',
    updated_at: '2026-10-08T15:30:00Z',
    unread_count: 0,
    members: [],
    last_message: {
      id: 'msg-alpha-last',
      content: 'Uploaded project specs',
      attachment_name: 'design_v2.pdf',
      sender_id: 'other',
      created_at: '2026-10-08T15:30:00Z',
    },
  },
  {
    id: 'conv-daniel',
    is_group: false,
    created_at: '2026-10-05T12:00:00Z',
    updated_at: '2026-10-06T11:00:00Z',
    unread_count: 0,
    members: [
      {
        id: 'm-8',
        conversation_id: 'conv-daniel',
        user_id: 'user-daniel',
        role: 'member',
        joined_at: '2026-10-05T12:00:00Z',
        last_read_at: '2026-10-06T11:00:00Z',
        profiles: {
          id: 'user-daniel',
          display_name: 'Daniel Brown',
          username: 'danielb',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          status: 'away',
        },
      },
    ],
    last_message: {
      id: 'msg-dan-last',
      content: 'Alright, got it.',
      sender_id: 'user-daniel',
      created_at: '2026-10-06T11:00:00Z',
    },
  },
];

// Initial messages for the Alex conversation (matching reference screenshot #5)
const INITIAL_ALEX_MESSAGES: Message[] = [
  {
    id: 'm-init-1',
    conversation_id: 'conv-alex',
    sender_id: 'user-alex',
    content: 'Hey! How are you today?',
    created_at: '2026-10-09T10:18:00Z',
    updated_at: '2026-10-09T10:18:00Z',
  },
  {
    id: 'm-init-2',
    conversation_id: 'conv-alex',
    sender_id: 'current-user', // Will match current user
    content: "I'm good! Working on the project. How about you?",
    created_at: '2026-10-09T10:20:00Z',
    updated_at: '2026-10-09T10:20:00Z',
  },
  {
    id: 'm-init-3',
    conversation_id: 'conv-alex',
    sender_id: 'user-alex',
    content: 'Same here. Just finished the design draft. Looks great! 👍',
    created_at: '2026-10-09T10:22:00Z',
    updated_at: '2026-10-09T10:22:00Z',
  },
  {
    id: 'm-init-4',
    conversation_id: 'conv-alex',
    sender_id: 'current-user',
    content: 'Awesome! Can you send it over?',
    created_at: '2026-10-09T10:24:00Z',
    updated_at: '2026-10-09T10:24:00Z',
  },
  {
    id: 'm-init-5',
    conversation_id: 'conv-alex',
    sender_id: 'user-alex',
    content: '',
    attachment_name: 'design_draft.pdf',
    attachment_type: 'application/pdf',
    attachment_size: 2400000,
    attachment_url: '#',
    created_at: '2026-10-09T10:25:00Z',
    updated_at: '2026-10-09T10:25:00Z',
  },
];

export const ChatDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_DEMO_CONVERSATIONS);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>('conv-alex');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Sync user id in initial messages
  const effectiveUserId = user?.id || 'current-user';

  // Load conversations from backend if available, fallback to demo
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const backendConvs = await api.getConversations();
        if (backendConvs && backendConvs.length > 0) {
          setConversations(backendConvs);
          if (!selectedConversationId) {
            setSelectedConversationId(backendConvs[0].id);
          }
        }
      } catch {
        // Use demo conversations
      }
    };

    loadConversations();
  }, [user]);

  // Load messages for the selected conversation
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      if (selectedConversationId === 'conv-alex') {
        const customized = INITIAL_ALEX_MESSAGES.map((m) =>
          m.sender_id === 'current-user' ? { ...m, sender_id: effectiveUserId } : m
        );
        setMessages(customized);
        return;
      }

      try {
        const fetchedMessages = await api.getMessages(selectedConversationId);
        setMessages(fetchedMessages);
      } catch {
        setMessages([]);
      }
    };

    loadMessages();

    // Setup Supabase Realtime subscription
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel(`chat:${selectedConversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversationId, effectiveUserId]);

  const activeConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  const handleSendMessage = async (
    content: string,
    attachment?: { url: string; name: string; type: string; size: number }
  ) => {
    if (!selectedConversationId) return;

    const optimisticId = `msg-${Date.now()}`;
    const newMsg: Message = {
      id: optimisticId,
      conversation_id: selectedConversationId,
      sender_id: effectiveUserId,
      content,
      attachment_url: attachment?.url,
      attachment_name: attachment?.name,
      attachment_type: attachment?.type,
      attachment_size: attachment?.size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);

    // Update conversation's last message snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversationId
          ? {
              ...c,
              last_message: {
                id: optimisticId,
                content: content || `📎 ${attachment?.name || 'File'}`,
                sender_id: effectiveUserId,
                created_at: new Date().toISOString(),
                attachment_name: attachment?.name,
              },
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    // Call Render backend API if real conversation
    if (selectedConversationId !== 'conv-alex') {
      try {
        await api.sendMessage(selectedConversationId, {
          content,
          attachment_url: attachment?.url,
          attachment_name: attachment?.name,
          attachment_type: attachment?.type,
          attachment_size: attachment?.size,
        });
      } catch (err) {
        console.error('Failed to post message to backend:', err);
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await api.deleteMessage(messageId);
    } catch {
      // Ignore
    }
  };

  const handleStartChatWithUser = async (targetUser: UserProfile) => {
    try {
      const conv = await api.createConversation({ recipient_id: targetUser.id });
      setConversations((prev) => [
        {
          id: conv.id,
          is_group: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          members: [
            {
              id: `mem-${targetUser.id}`,
              conversation_id: conv.id,
              user_id: targetUser.id,
              role: 'member',
              joined_at: new Date().toISOString(),
              last_read_at: new Date().toISOString(),
              profiles: targetUser,
            },
          ],
        },
        ...prev,
      ]);
      setSelectedConversationId(conv.id);
    } catch {
      // Offline / demo fallback
      const fakeId = `conv-${targetUser.id}`;
      const newConv: Conversation = {
        id: fakeId,
        is_group: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        members: [
          {
            id: `mem-${targetUser.id}`,
            conversation_id: fakeId,
            user_id: targetUser.id,
            role: 'member',
            joined_at: new Date().toISOString(),
            last_read_at: new Date().toISOString(),
            profiles: targetUser,
          },
        ],
      };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversationId(fakeId);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Desktop Left Navigation Bar */}
      <Navbar
        unreadTotal={5}
        onOpenNewChat={() => setIsNewChatOpen(true)}
      />

      {/* 2. Middle Column: Conversations List */}
      <div
        className={`h-full ${
          selectedConversationId ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-80 lg:w-96 flex-shrink-0`}
      >
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id) => setSelectedConversationId(id)}
          onOpenNewChat={() => setIsNewChatOpen(true)}
        />
      </div>

      {/* 3. Right Column: Active Chat Feed Area */}
      <div
        className={`flex-1 h-full ${
          !selectedConversationId ? 'hidden md:flex' : 'flex'
        } flex-col`}
      >
        <ChatArea
          conversation={activeConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onBackMobile={() => setSelectedConversationId(null)}
          onViewProfile={(userId) => navigate(`/profile/${userId}`)}
        />
      </div>

      {/* 4. Mobile Bottom Navigation Bar */}
      {!selectedConversationId && <MobileNav />}

      {/* 5. New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectUser={handleStartChatWithUser}
      />
    </div>
  );
};
