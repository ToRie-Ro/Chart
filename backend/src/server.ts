import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { env } from './config/env.js';
import { supabase } from './config/supabase.js';
import { mockConversations, mockMessages, mockUsers } from './data/mockData.js';

const app = express();
const activeConnections = new Map<string, number>();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: env.appName, environment: env.environment });
});

app.get('/api/users', (_req, res) => {
  if (!supabase) return res.json(mockUsers);
  void supabase.from('users').select('id, name, email, username, bio, avatar_url, is_online, last_seen, locale, role').then(({ data, error }) => {
    if (error) return res.status(500).json({ error: 'Could not load users.' });
    return res.json((data ?? []).map(publicUser));
  });
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

app.get('/api/me/devices', async (req, res) => {
  const userId = authenticatedUserId(req);
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { data, error } = await supabase.from('device_sessions').select('id, device_name, platform, last_active_at, created_at, revoked_at').eq('user_id', userId).is('revoked_at', null).order('last_active_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Could not load devices.' });
  return res.json({ devices: data ?? [] });
});

app.patch('/api/me', async (req, res) => {
  const userId = authenticatedUserId(req);
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const updates: Record<string, string> = {};
  for (const [key, column] of [['name', 'name'], ['bio', 'bio'], ['avatarUrl', 'avatar_url']] as const) {
    if (typeof req.body?.[key] === 'string') updates[column] = req.body[key].trim();
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No profile changes supplied.' });
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select('*').single();
  if (error || !data) return res.status(500).json({ error: 'Could not update profile.' });
  return res.json({ user: publicUser(data) });
});

app.get('/api/premium/features', (_req, res) => {
  res.json({ plan: 'premium', features: ['HD voice and video calls', 'Custom themes and profile badges', 'Larger file uploads', 'Message editing and history', 'Priority support'] });
});

app.post('/api/me/devices', async (req, res) => {
  const userId = authenticatedUserId(req);
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const deviceName = String(req.body?.deviceName ?? '').trim();
  const platform = String(req.body?.platform ?? '').trim();
  if (!deviceName || !platform) return res.status(400).json({ error: 'Device name and platform are required.' });
  const { data, error } = await supabase.from('device_sessions').insert({ user_id: userId, device_name: deviceName, platform }).select('id, device_name, platform, last_active_at, created_at').single();
  if (error) return res.status(500).json({ error: 'Could not register device.' });
  return res.status(201).json({ device: data });
});

app.get('/api/conversations', async (req, res) => {
  const userId = authenticatedUserId(req);
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { data, error } = await supabase.from('conversation_participants').select('conversation_id, conversations(id, name, type, created_at)').eq('user_id', userId);
  if (error) return res.status(500).json({ error: 'Could not load conversations.' });
  return res.json((data ?? []).map((entry) => {
    const conversation = Array.isArray(entry.conversations) ? entry.conversations[0] : entry.conversations;
    return { id: conversation?.id ?? entry.conversation_id, name: conversation?.name, participants: [userId], type: conversation?.type ?? 'direct', updatedAt: conversation?.created_at ?? new Date().toISOString() };
  }));
});

app.get('/api/messages/:conversationId', async (req, res) => {
  const conversationId = req.params.conversationId;
  const userId = authenticatedUserId(req);
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const member = await isConversationMember(conversationId, userId);
  if (!member) return res.status(403).json({ error: 'You are not a member of this conversation.' });
  if (supabase) {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: 'Could not load messages.' });
    return res.json(data);
  }
});

app.post('/api/messages/:conversationId', async (req, res) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const text = String(req.body?.text ?? '').trim();
  if (!token || !text) return res.status(400).json({ error: 'Authentication and message text are required.' });
  if (!supabase) return res.status(503).json({ error: 'Database is not configured.' });

  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    if (!await isConversationMember(req.params.conversationId, String(payload.sub))) return res.status(403).json({ error: 'You are not a member of this conversation.' });
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
  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' });
  await supabase.from('device_sessions').insert({ user_id: user.id, device_name: 'Mobile device', platform: 'unknown' });
  return { status: 200, body: { token, user } };
}

async function isConversationMember(conversationId: string, userId: string) {
  if (!supabase) return false;
  const { data, error } = await supabase.from('conversation_participants').select('user_id').eq('conversation_id', conversationId).eq('user_id', userId).maybeSingle();
  return !error && data !== null;
}

async function register(name: unknown, email: string, password: string) {
  if (!supabase) return { status: 503, body: { error: 'Database is not configured.' } };
  const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;
  const { data, error } = await supabase.from('users').insert({ name: String(name).trim(), email, username, password_hash: await bcrypt.hash(password, 12) }).select('*').single();
  if (error) return { status: error.code === '23505' ? 409 : 500, body: { error: error.code === '23505' ? 'An account with this email already exists.' : 'Could not create account.' } };
  await supabase.from('conversation_participants').insert([
    { conversation_id: 'conv_1', user_id: data.id },
    { conversation_id: 'conv_2', user_id: data.id },
  ]);
  const user = publicUser(data);
  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: '7d' });
  await supabase.from('device_sessions').insert({ user_id: user.id, device_name: 'Mobile device', platform: 'unknown' });
  return { status: 201, body: { token, user } };
}

function publicUser(user: Record<string, unknown>) {
  return { id: String(user.id), name: String(user.name), email: String(user.email), username: String(user.username), bio: String(user.bio ?? ''), avatarUrl: user.avatar_url ? String(user.avatar_url) : undefined, plan: user.plan === 'premium' ? 'premium' : 'free', isOnline: user.is_online === true, lastSeen: String(user.last_seen ?? new Date().toISOString()), locale: user.locale === 'km' ? 'km' : 'en', role: user.role === 'admin' || user.role === 'moderator' ? user.role : 'user' };
}

async function setPresence(userId: string, isOnline: boolean) {
  if (!supabase) return;
  await supabase.from('users').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('id', userId);
}

function authenticatedUserId(req: express.Request) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    return String((jwt.verify(token, env.jwtSecret) as jwt.JwtPayload).sub);
  } catch {
    return null;
  }
}

const server = app.listen(env.port, () => {
  console.log(`${env.appName} backend running on port ${env.port}`);
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  if (url.pathname !== '/ws' || !verifyToken(url.searchParams.get('token'))) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
});

wss.on('connection', (ws, request) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const userId = verifyToken(url.searchParams.get('token'));
  if (!userId) return ws.close(1008, 'Authentication required.');
  activeConnections.set(userId, (activeConnections.get(userId) ?? 0) + 1);
  void setPresence(userId, true);
  const heartbeat = setInterval(() => void setPresence(userId, true), 30_000);

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (typeof message.conversationId !== 'string' || typeof message.text !== 'string' || !message.text.trim()) return;
      const payload = { ...message, senderId: userId, text: message.text.trim() };
      void supabase?.from('messages').insert({ conversation_id: payload.conversationId, sender_id: userId, text: payload.text, status: 'sent' });
      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client !== ws) {
          client.send(JSON.stringify({ type: 'message', payload }));
        }
      });
    } catch (error) {
      console.error('Failed to parse websocket message', error);
    }
  });

  ws.on('close', () => {
    clearInterval(heartbeat);
    const remaining = (activeConnections.get(userId) ?? 1) - 1;
    if (remaining <= 0) {
      activeConnections.delete(userId);
      void setPresence(userId, false);
    } else {
      activeConnections.set(userId, remaining);
    }
  });

  ws.send(JSON.stringify({ type: 'connected', payload: { app: env.appName, userId } }));
});

function verifyToken(token: string | null) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
