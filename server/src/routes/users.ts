import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { updateProfileSchema } from '../validators/schemas';
import { createUserClient, supabaseAdmin } from '../services/supabase';

const router = Router();

// Apply auth middleware to all user routes
router.use(authenticateToken);

// GET /api/users/me - Get current user profile
router.get('/me', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userClient = createUserClient(req.token!);

    const { data: profile, error } = await userClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!profile) {
      // Create fallback profile if trigger had a timing issue
      const defaultName = req.user!.user_metadata?.full_name || req.user!.email?.split('@')[0] || 'User';
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          display_name: defaultName,
          username: `${req.user!.email?.split('@')[0]}_${userId.slice(0, 4)}`,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      res.json(newProfile);
      return;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/search?q=query - Search registered users
router.get('/search', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = (req.query.q as string || '').trim();
    const currentUserId = req.user!.id;
    const userClient = createUserClient(req.token!);

    let queryBuilder = userClient
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio, status, last_seen')
      .neq('id', currentUserId)
      .limit(20);

    if (query) {
      queryBuilder = queryBuilder.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
    }

    const { data: users, error } = await queryBuilder;

    if (error) throw error;
    res.json(users || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - Get profile by user ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const userClient = createUserClient(req.token!);

    const { data: profile, error } = await userClient
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio, status, last_seen, created_at')
      .eq('id', targetUserId)
      .single();

    if (error || !profile) {
      res.status(404).json({ error: 'Not Found', message: 'User profile not found' });
      return;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/profile - Update current user profile
router.patch('/profile', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const userId = req.user!.id;
    const userClient = createUserClient(req.token!);

    const { data: updatedProfile, error } = await userClient
      .from('profiles')
      .update(validatedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedProfile);
  } catch (err) {
    next(err);
  }
});

export default router;
