import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { env } from './config/env.js';
import { supabase } from './config/supabase.js';
import { mockConversations, mockMessages, mockUsers } from './data/mockData.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: env.appName, environment: env.environment });
});

app.get('/api/users', (_req, res) => {
  res.json(mockUsers);
});

app.get('/api/me', async (req, res) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token || !supabase) return res.status(401).json({ error: 'Authentication required.' });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    const { data, error } = await supabase.from('users').select('*').eq('id', payload.sub).single();
    if (error || !data) return res.status(404).json({ error: 'Account not found.' });
    return res.json({ user: publicUser(data) });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

app.get('/api/conversations', (_req, res) => {
  res.json(mockConversations);
});

app.get('/api/messages/:conversationId', async (req, res) => {
  const conversationId = req.params.conversationId;
  if (supabase) {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (!error) return res.json(data);
  }
  const messages = mockMessages.filter((message) => message.conversationId === conversationId);
  res.json(messages);
});

app.post('/api/messages/:conversationId', async (req, res) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const text = String(req.body?.text ?? '').trim();
  if (!token || !text) return res.status(400).json({ error: 'Authentication and message text are required.' });
  if (!supabase) return res.status(503).json({ error: 'Database is not configured.' });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    const { data, error } = await supabase.from('messages').insert({ conversation_id: req.params.conversationId, sender_id: payload.sub, text, status: 'sent' }).select('*').single();
    if (error) return res.status(500).json({ error: 'Could not save message.' });
    return res.status(201).json(data);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  void login(email, password).then((result) => res.status(result.status).json(result.body));
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!name || !normalizedEmail || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required.' });
  }

  void register(name, normalizedEmail, password).then((result) => res.status(result.status).json(result.body));
});

async function login(email: string, password: string) {
  if (!supabase) return { status: 503, body: { error: 'Database is not configured.' } };
  const { data, error } = await supabase.from('users').select('*').eq('email', String(email).trim().toLowerCase()).maybeSingle();
  if (error) return { status: 500, body: { error: 'Database request failed.' } };
  if (!data || !(await bcrypt.compare(password, data.password_hash))) return { status: 401, body: { error: 'Invalid credentials.' } };
  const user = publicUser(data);
  return { status: 200, body: { token: jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' }), user } };
}

async function register(name: unknown, email: string, password: string) {
  if (!supabase) return { status: 503, body: { error: 'Database is not configured.' } };
  const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;
  const { data, error } = await supabase.from('users').insert({ name: String(name).trim(), email, username, password_hash: await bcrypt.hash(password, 12) }).select('*').single();
  if (error) return { status: error.code === '23505' ? 409 : 500, body: { error: error.code === '23505' ? 'An account with this email already exists.' : 'Could not create account.' } };
  const user = publicUser(data);
  return { status: 201, body: { token: jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' }), user } };
}

function publicUser(user: Record<string, unknown>) {
  return { id: String(user.id), name: String(user.name), email: String(user.email), username: String(user.username), bio: String(user.bio ?? ''), isOnline: true, lastSeen: new Date().toISOString(), locale: user.locale === 'km' ? 'km' : 'en', role: user.role === 'admin' || user.role === 'moderator' ? user.role : 'user' };
}

const server = app.listen(env.port, () => {
  console.log(`${env.appName} backend running on port ${env.port}`);
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'message', payload: message }));
        }
      });
    } catch (error) {
      console.error('Failed to parse websocket message', error);
    }
  });

  ws.send(JSON.stringify({ type: 'connected', payload: { app: env.appName } }));
});
