export type UserRole = 'user' | 'admin' | 'moderator';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  locale: 'en' | 'km';
  role: UserRole;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isEdited?: boolean;
  replyTo?: string;
}

export interface Conversation {
  id: string;
  name?: string;
  participants: string[];
  type: 'direct' | 'group' | 'channel';
  lastMessage?: Message;
  updatedAt: string;
}

export interface AppConfig {
  appName: string;
  brand: string;
  tagline: string;
  defaultLocale: 'en' | 'km';
  environment: 'development' | 'staging' | 'production';
}
