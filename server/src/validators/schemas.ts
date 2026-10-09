import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(50, 'Display name too long').optional(),
  bio: z.string().max(250, 'Bio cannot exceed 250 characters').optional(),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.enum(['online', 'away', 'busy', 'offline']).optional(),
});

export const createConversationSchema = z.object({
  recipient_id: z.string().uuid('Invalid user UUID').optional(),
  title: z.string().max(100).optional(),
  is_group: z.boolean().optional().default(false),
  participant_ids: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => (data.is_group && data.participant_ids && data.participant_ids.length > 0) || (!data.is_group && !!data.recipient_id),
  {
    message: 'Either recipient_id (for direct message) or participant_ids (for group) must be provided',
  }
);

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(4000, 'Message content too long'),
  attachment_url: z.string().url().optional().nullable(),
  attachment_name: z.string().max(255).optional().nullable(),
  attachment_type: z.string().max(100).optional().nullable(),
  attachment_size: z.number().int().nonnegative().optional().nullable(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(4000, 'Message content too long'),
});
