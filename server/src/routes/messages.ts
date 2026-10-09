import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { actionLimiter } from '../middleware/rateLimiter';
import { sendMessageSchema, updateMessageSchema } from '../validators/schemas';
import { createUserClient } from '../services/supabase';

const router = Router();

router.use(authenticateToken);

// Helper: check if user is a member of a conversation
async function verifyMembership(userClient: any, conversationId: string, userId: string): Promise<boolean> {
  const { data, error } = await userClient
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}

// GET /api/conversations/:id/messages - Fetch messages for conversation
router.get('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const userId = req.user!.id;
    const userClient = createUserClient(req.token!);

    const isMember = await verifyMembership(userClient, conversationId, userId);
    if (!isMember) {
      res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this conversation' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const before = req.query.before as string; // Optional timestamp cursor

    let query = userClient
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        attachment_url,
        attachment_name,
        attachment_type,
        attachment_size,
        created_at,
        updated_at,
        deleted_at,
        sender:profiles!sender_id (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    // Mark as read
    await userClient
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    res.json(messages || []);
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:id/messages - Send a message
router.post(
  '/conversations/:id/messages',
  actionLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversationId = req.params.id;
      const userId = req.user!.id;
      const validated = sendMessageSchema.parse(req.body);
      const userClient = createUserClient(req.token!);

      const isMember = await verifyMembership(userClient, conversationId, userId);
      if (!isMember) {
        res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this conversation' });
        return;
      }

      // Insert message
      const { data: message, error: msgError } = await userClient
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: validated.content,
          attachment_url: validated.attachment_url,
          attachment_name: validated.attachment_name,
          attachment_type: validated.attachment_type,
          attachment_size: validated.attachment_size,
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          attachment_url,
          attachment_name,
          attachment_type,
          attachment_size,
          created_at,
          updated_at,
          sender:profiles!sender_id (
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .single();

      if (msgError) throw msgError;

      // Update conversation timestamp
      await userClient
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Update sender's last_read_at
      await userClient
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      res.status(201).json(message);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/messages/:id - Edit an existing message
router.patch('/messages/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const messageId = req.params.id;
    const userId = req.user!.id;
    const validated = updateMessageSchema.parse(req.body);
    const userClient = createUserClient(req.token!);

    // Check message ownership
    const { data: existing, error: findError } = await userClient
      .from('messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .is('deleted_at', null)
      .single();

    if (findError || !existing) {
      res.status(404).json({ error: 'Not Found', message: 'Message not found' });
      return;
    }

    if (existing.sender_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only edit your own messages' });
      return;
    }

    const { data: updated, error: updateError } = await userClient
      .from('messages')
      .update({
        content: validated.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/messages/:id - Soft-delete a message
router.delete('/messages/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const messageId = req.params.id;
    const userId = req.user!.id;
    const userClient = createUserClient(req.token!);

    // Verify ownership
    const { data: existing, error: findError } = await userClient
      .from('messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .is('deleted_at', null)
      .single();

    if (findError || !existing) {
      res.status(404).json({ error: 'Not Found', message: 'Message not found' });
      return;
    }

    if (existing.sender_id !== userId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own messages' });
      return;
    }

    const { error: deleteError } = await userClient
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (deleteError) throw deleteError;
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
