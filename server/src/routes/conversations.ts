import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createConversationSchema } from '../validators/schemas';
import { createUserClient, supabaseAdmin } from '../services/supabase';

const router = Router();

router.use(authenticateToken);

// GET /api/conversations - List conversations for authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userClient = createUserClient(req.token!);

    // 1. Get all conversation IDs where current user is a member
    const { data: memberRows, error: memberErr } = await userClient
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (memberErr) throw memberErr;

    if (!memberRows || memberRows.length === 0) {
      res.json([]);
      return;
    }

    const conversationIds = memberRows.map((m) => m.conversation_id);
    const lastReadMap = new Map(memberRows.map((m) => [m.conversation_id, m.last_read_at]));

    // 2. Fetch conversations details
    const { data: conversations, error: convErr } = await userClient
      .from('conversations')
      .select(`
        id,
        title,
        is_group,
        created_at,
        updated_at
      `)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (convErr) throw convErr;

    // 3. For each conversation, fetch members and their profiles
    const { data: allMembers, error: allMembersErr } = await userClient
      .from('conversation_members')
      .select(`
        conversation_id,
        user_id,
        role,
        profiles (
          id,
          display_name,
          username,
          avatar_url,
          bio,
          status,
          last_seen
        )
      `)
      .in('conversation_id', conversationIds);

    if (allMembersErr) throw allMembersErr;

    // 4. Fetch the last message for each conversation
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        const members = (allMembers || []).filter((m) => m.conversation_id === conv.id);

        const { data: lastMessages } = await userClient
          .from('messages')
          .select('id, content, sender_id, created_at, attachment_name')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = lastMessages && lastMessages.length > 0 ? lastMessages[0] : null;

        // Unread count
        const lastRead = lastReadMap.get(conv.id) || '1970-01-01T00:00:00Z';
        const { count: unreadCount } = await userClient
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .neq('sender_id', userId)
          .gt('created_at', lastRead);

        return {
          ...conv,
          members,
          last_message: lastMessage,
          unread_count: unreadCount || 0,
        };
      })
    );

    res.json(enrichedConversations);
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations - Create or find direct chat or create group
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createConversationSchema.parse(req.body);
    const userId = req.user!.id;
    const userClient = createUserClient(req.token!);

    // Handle Direct Message
    if (!validated.is_group && validated.recipient_id) {
      const recipientId = validated.recipient_id;

      if (recipientId === userId) {
        res.status(400).json({ error: 'Bad Request', message: 'Cannot start conversation with yourself' });
        return;
      }

      // Check if a direct conversation already exists between these 2 users
      const { data: myConvs } = await userClient
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (myConvs && myConvs.length > 0) {
        const myConvIds = myConvs.map((c) => c.conversation_id);
        const { data: existingShare } = await userClient
          .from('conversation_members')
          .select('conversation_id, conversations!inner(is_group)')
          .in('conversation_id', myConvIds)
          .eq('user_id', recipientId)
          .eq('conversations.is_group', false)
          .limit(1);

        if (existingShare && existingShare.length > 0) {
          // Already exists! Return this conversation ID
          res.json({ id: existingShare[0].conversation_id, existing: true });
          return;
        }
      }

      // Create new DM conversation
      const { data: newConv, error: createErr } = await userClient
        .from('conversations')
        .insert({ is_group: false })
        .select()
        .single();

      if (createErr) throw createErr;

      // Add both members
      const { error: membersErr } = await supabaseAdmin
        .from('conversation_members')
        .insert([
          { conversation_id: newConv.id, user_id: userId, role: 'admin' },
          { conversation_id: newConv.id, user_id: recipientId, role: 'member' },
        ]);

      if (membersErr) throw membersErr;

      res.status(201).json(newConv);
      return;
    }

    // Handle Group Conversation
    if (validated.is_group) {
      const participantIds = Array.from(new Set([...(validated.participant_ids || []), userId]));

      const { data: newGroup, error: groupErr } = await userClient
        .from('conversations')
        .insert({
          title: validated.title || 'New Group',
          is_group: true,
        })
        .select()
        .single();

      if (groupErr) throw groupErr;

      const membersToInsert = participantIds.map((pId) => ({
        conversation_id: newGroup.id,
        user_id: pId,
        role: pId === userId ? 'admin' : 'member',
      }));

      const { error: insertMembersErr } = await supabaseAdmin
        .from('conversation_members')
        .insert(membersToInsert);

      if (insertMembersErr) throw insertMembersErr;

      res.status(201).json(newGroup);
      return;
    }

    res.status(400).json({ error: 'Bad Request', message: 'Invalid conversation payload' });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id - Get conversation details
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const convId = req.params.id;
    const userId = req.user!.id;
    const userClient = createUserClient(req.token!);

    // 1. Verify membership
    const { data: membership, error: memErr } = await userClient
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', convId)
      .eq('user_id', userId)
      .single();

    if (memErr || !membership) {
      res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this conversation' });
      return;
    }

    // 2. Fetch conversation details & members
    const { data: conversation, error: convErr } = await userClient
      .from('conversations')
      .select('*')
      .eq('id', convId)
      .single();

    if (convErr || !conversation) {
      res.status(404).json({ error: 'Not Found', message: 'Conversation not found' });
      return;
    }

    const { data: members } = await userClient
      .from('conversation_members')
      .select(`
        user_id,
        role,
        joined_at,
        profiles (
          id,
          display_name,
          username,
          avatar_url,
          bio,
          status,
          last_seen
        )
      `)
      .eq('conversation_id', convId);

    // Update last_read_at timestamp for this member
    await userClient
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .eq('user_id', userId);

    res.json({
      ...conversation,
      members: members || [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
