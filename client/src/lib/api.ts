import { supabase } from './supabase';
import { Conversation, Message, UserProfile } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper to make authenticated requests to the Render backend
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // Ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Health check
  checkHealth: () => request<{ status: string; uptime: number }>('/health'),

  // Users & Profiles
  getCurrentProfile: () => request<UserProfile>('/api/users/me'),
  getUserProfile: (userId: string) => request<UserProfile>(`/api/users/${userId}`),
  updateProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  searchUsers: (query: string) =>
    request<UserProfile[]>(`/api/users/search?q=${encodeURIComponent(query)}`),

  // Conversations
  getConversations: () => request<Conversation[]>('/api/conversations'),
  getConversation: (id: string) => request<Conversation>(`/api/conversations/${id}`),
  createConversation: (payload: {
    recipient_id?: string;
    title?: string;
    is_group?: boolean;
    participant_ids?: string[];
  }) =>
    request<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Messages
  getMessages: (conversationId: string, limit = 50, before?: string) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    return request<Message[]>(`/api/conversations/${conversationId}/messages?${params.toString()}`);
  },
  sendMessage: (
    conversationId: string,
    payload: {
      content: string;
      attachment_url?: string | null;
      attachment_name?: string | null;
      attachment_type?: string | null;
      attachment_size?: number | null;
    }
  ) =>
    request<Message>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  editMessage: (messageId: string, content: string) =>
    request<Message>(`/api/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  deleteMessage: (messageId: string) =>
    request<{ success: boolean; message: string }>(`/api/messages/${messageId}`, {
      method: 'DELETE',
    }),
};
