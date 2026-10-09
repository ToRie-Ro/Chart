import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization token provided',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authorization token',
      });
      return;
    }

    req.user = data.user;
    req.token = token;
    next();
  } catch (err: any) {
    res.status(500).json({
      error: 'Authentication Error',
      message: err.message || 'Failed to authenticate request',
    });
  }
};
