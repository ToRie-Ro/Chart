import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { env } from './config/env.js';
import { mockConversations, mockMessages, mockUsers } from './data/mockData.js';

const app = express();
const passwords = new Map<string, string>([
  ['darea@sabaychat.app', 'password'],
  ['sokha@sabaychat.app', 'password'],
  ['team@sabaychat.app', 'password'],
]);
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: env.appName, environment: env.environment });
});

app.get('/api/users', (_req, res) => {
  res.json(mockUsers);
});

app.get('/api/conversations', (_req, res) => {
  res.json(mockConversations);
});

app.get('/api/messages/:conversationId', (req, res) => {
  const conversationId = req.params.conversationId;
  const messages = mockMessages.filter((message) => message.conversationId === conversationId);
  res.json(messages);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = mockUsers.find((candidate) => candidate.email.toLowerCase() === String(email).toLowerCase());

  if (!user || passwords.get(user.email) !== password) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  return res.json({
    token: 'mock-jwt-token',
    user,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!name || !normalizedEmail || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required.' });
  }

  if (mockUsers.some((candidate) => candidate.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const id = `user_${mockUsers.length + 1}`;
  const username = normalizedEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');
  const user = {
    id,
    name: String(name).trim(),
    email: normalizedEmail,
    username: username || id,
    bio: '',
    isOnline: true,
    lastSeen: new Date().toISOString(),
    locale: 'en' as const,
    role: 'user' as const,
  };

  mockUsers.push(user);
  passwords.set(normalizedEmail, password);

  return res.status(201).json({
    token: 'mock-jwt-token',
    user,
  });
});

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
