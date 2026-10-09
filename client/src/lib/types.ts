export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  status?: UserStatus;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  profiles?: UserProfile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sender?: UserProfile;
}

export interface Conversation {
  id: string;
  title?: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  members: ConversationMember[];
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    attachment_name?: string | null;
  } | null;
  unread_count?: number;
}
