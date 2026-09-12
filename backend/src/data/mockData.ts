import type { Conversation, Message, User } from '../types.js';

export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'Da Rea',
    email: 'darea@sabaychat.app',
    username: 'darea',
    bio: 'Product designer',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    locale: 'en',
    role: 'user',
  },
  {
    id: 'user_2',
    name: 'Sokha Mean',
    email: 'sokha@sabaychat.app',
    username: 'sokha',
    bio: 'Engineering lead',
    isOnline: false,
    lastSeen: new Date(Date.now() - 60000).toISOString(),
    locale: 'km',
    role: 'admin',
  },
  {
    id: 'user_3',
    name: 'Cambodia Team',
    email: 'team@sabaychat.app',
    username: 'cambodia-team',
    bio: 'Local collaborations',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    locale: 'en',
    role: 'moderator',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'user_2',
    text: 'Welcome to SabayChat! We are live in Cambodia.',
    createdAt: new Date().toISOString(),
    status: 'read',
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'user_1',
    text: 'Looks great. Let’s keep the design consistent across both platforms.',
    createdAt: new Date(Date.now() - 120000).toISOString(),
    status: 'delivered',
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    name: 'Da Rea',
    participants: ['user_1', 'user_2'],
    type: 'direct',
    lastMessage: mockMessages[0],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conv_2',
    name: 'Design Team',
    participants: ['user_1', 'user_2', 'user_3'],
    type: 'group',
    lastMessage: mockMessages[1],
    updatedAt: new Date().toISOString(),
  },
];
