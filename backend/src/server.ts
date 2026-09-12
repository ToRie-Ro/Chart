import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { WebSocket, WebSocketServer } from 'ws';
import { env } from './config/env.js';
import { supabase } from './config/supabase.js';

const app = express();
const activeConnections = new Map<string, number>();
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const mailTransport = env.smtpUser && env.smtpPassword && env.emailFrom
  ? nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpPort === 465, auth: { user: env.smtpUser, pass: env.smtpPassword } })
  : null;
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const forwardedProtocol = req.header('x-forwarded-proto');
  if (env.environment === 'production' && forwardedProtocol && forwardedProtocol !== 'https') {
    return res.status(400).json({ error: 'HTTPS is required.' });
  }
  return next();
});
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.allowedOrigins.length === 0 || env.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed.'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '64kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use('/api', async (req, res, next) => {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) requestCounts.set(key, { count: 1, resetAt: now + 60_000 });
  else if (current.count >= 120) return res.status(429).json({ error: 'Too many requests. Try again later.' });
  else current.count += 1;

  if (req.path.startsWith('/auth/refresh') || req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register')) return next();
  const userId = await authenticatedUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });
  req.userId = userId;
  return next();
});

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${env.appName} API</title>
    <style>
      :root { color-scheme: dark; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; background: #071126; color: #f7f9ff; }
      main { width: min(560px, calc(100% - 40px)); padding: 40px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.12); border-radius: 28px; background: rgba(22,37,69,.72); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      .mark { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 16px; background: linear-gradient(135deg, #2b8cff, #1746c7); font-size: 27px; font-weight: 800; }
      h1 { margin: 24px 0 8px; font-size: 32px; } p { color: #aebbd4; line-height: 1.6; }
      .status { display: inline-flex; gap: 8px; align-items: center; margin-top: 12px; padding: 8px 12px; border-radius: 999px; background: rgba(45,211,144,.12); color: #5ee6b0; font-size: 14px; }
      code { color: #8dc2ff; }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">S</div>
      <h1>${env.appName} server</h1>
      <p>The SabayChat backend is running. Mobile clients connect through the secure REST API and WebSocket service.</p>
      <div class="status"><span>●</span> Production service online</div>
      <p>Health endpoint: <code>/health</code><br>WebSocket endpoint: <code>wss://${(_req.headers.host ?? 'chart-ztyk.onrender.com')}/ws</code></p>
    </main>
  </body>
</html>`);
});

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: env.appName, environment: env.environment, database: supabase ? 'configured' : 'not_configured', time: new Date().toISOString() });
});

app.get('/api/users', (_req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database is not configured.' });
  void supabase.from('users').select('id, name, username, bio, avatar_url, is_online, last_seen, locale, role').then(({ data, error }) => {
    if (error) return res.status(500).json({ error: 'Could not load users.' });
    return res.json((data ?? []).map(publicUser));
  });
});

app.get('/api/contacts', async (req, res) => {
  const userId = req.userId;
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { data, error } = await supabase.from('users').select('id, name, email, username, bio, avatar_url, is_online, last_seen, locale, role').neq('id', userId).order('is_online', { ascending: false }).order('name');
  if (error) return res.status(500).json({ error: 'Could not load contacts.' });
  return res.json((data ?? []).map(publicUser));
});

app.post('/api/contacts/requests', async (req, res) => {
  const userId = req.userId;
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { data: recipient } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (!recipient || recipient.id === userId) return res.status(404).json({ error: 'Account not found.' });
  const { error } = await supabase.from('friend_requests').insert({ requester_id: userId, recipient_id: recipient.id });
  if (error) return res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Friend request already sent.' : 'Could not send friend request.' });
  return res.status(201).json({ status: 'request_sent' });
});

app.get('/api/calls', async (req, res) => {
  const userId = req.userId;
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { data, error } = await supabase.from('call_history').select('*').or(`caller_id.eq.${userId},recipient_id.eq.${userId}`).order('started_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Could not load call history.' });
  return res.json(data ?? []);
});

app.get('/api/settings', async (req, res) => {
  const userId = req.userId;
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not load settings.' });
  return res.json(data ?? { user_id: userId, language: 'en', notifications_enabled: true, sounds_enabled: true, dark_mode: true });
});

app.patch('/api/settings', async (req, res) => {
  const userId = req.userId;
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const settings = { user_id: userId, language: req.body?.language === 'km' ? 'km' : 'en', notifications_enabled: req.body?.notificationsEnabled !== false, sounds_enabled: req.body?.soundsEnabled !== false, dark_mode: req.body?.darkMode !== false, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('user_settings').upsert(settings).select('*').single();
  if (error) return res.status(500).json({ error: 'Could not save settings.' });
  return res.json(data);
});

app.get('/api/me', async (req, res) => {
  if (!supabase || !req.userId) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.userId).single();
    if (error || !data) return res.status(404).json({ error: 'Account not found.' });
    return res.json({ user: publicUser(data) });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

app.get('/api/me/devices', async (req, res) => {
  const userId = req.userId;
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { data, error } = await supabase.from('device_sessions').select('id, device_name, platform, last_active_at, created_at, revoked_at').eq('user_id', userId).is('revoked_at', null).order('last_active_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Could not load devices.' });
  return res.json({ devices: data ?? [] });
});

app.patch('/api/me', async (req, res) => {
  const userId = req.userId;
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const updates: Record<string, string> = {};
  for (const [key, column] of [['name', 'name'], ['bio', 'bio'], ['avatarUrl', 'avatar_url'], ['phoneNumber', 'phone_number']] as const) {
    if (typeof req.body?.[key] === 'string') updates[column] = req.body[key].trim();
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No profile changes supplied.' });
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select('*').single();
  if (error || !data) return res.status(500).json({ error: 'Could not update profile.' });
  return res.json({ user: publicUser(data) });
});

app.post('/api/me/password', async (req, res) => {
  const userId = req.userId;
  const currentPassword = String(req.body?.currentPassword ?? '');
  const newPassword = String(req.body?.newPassword ?? '');
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  const { data, error } = await supabase.from('users').select('password_hash').eq('id', userId).single();
  if (error || !data || !(await bcrypt.compare(currentPassword, data.password_hash))) return res.status(401).json({ error: 'Current password is incorrect.' });
  const { error: updateError } = await supabase.from('users').update({ password_hash: await bcrypt.hash(newPassword, 12) }).eq('id', userId);
  if (updateError) return res.status(500).json({ error: 'Could not change password.' });
  return res.json({ status: 'password_changed' });
});

app.get('/api/premium/features', (_req, res) => {
  res.json({ plan: 'premium', features: ['HD voice and video calls', 'Custom themes and profile badges', 'Larger file uploads', 'Message editing and history', 'Priority support'] });
});

app.post('/api/premium/activate', async (req, res) => {
  const userId = req.userId;
  const licenseKey = String(req.body?.licenseKey ?? '').trim();
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  if (!licenseKey || !env.premiumLicenseKeys.includes(licenseKey)) return res.status(403).json({ error: 'Invalid premium license key.' });
  const { data, error } = await supabase.from('users').update({ plan: 'premium' }).eq('id', userId).select('*').single();
  if (error || !data) return res.status(500).json({ error: 'Could not activate premium.' });
  return res.json({ status: 'premium_activated', user: publicUser(data) });
});

app.post('/api/me/devices', async (req, res) => {
  const userId = req.userId;
  if (!userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const deviceName = String(req.body?.deviceName ?? '').trim();
  const platform = String(req.body?.platform ?? '').trim();
  if (!deviceName || !platform) return res.status(400).json({ error: 'Device name and platform are required.' });
  const { data, error } = await supabase.from('device_sessions').insert({ user_id: userId, device_name: deviceName, platform }).select('id, device_name, platform, last_active_at, created_at').single();
  if (error) return res.status(500).json({ error: 'Could not register device.' });
  return res.status(201).json({ device: data });
});

app.get('/api/conversations', async (req, res) => {
  const userId = req.userId;
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
  const userId = req.userId;
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
  const text = String(req.body?.text ?? '').trim();
  const userId = req.userId;
  if (!userId || !text) return res.status(400).json({ error: 'Authentication and message text are required.' });
  if (!supabase) return res.status(503).json({ error: 'Database is not configured.' });

  if (!await isConversationMember(req.params.conversationId, userId)) return res.status(403).json({ error: 'You are not a member of this conversation.' });
  const { data, error } = await supabase.from('messages').insert({ conversation_id: req.params.conversationId, sender_id: userId, text, status: 'sent' }).select('*').single();
  if (error) return res.status(500).json({ error: 'Could not save message.' });
  return res.status(201).json(data);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  void login(email, password).then((result) => res.status(result.status).json(result.body)).catch(() => res.status(500).json({ error: 'Could not start sign-in.' }));
});

app.post('/api/auth/verify-login-code', async (req, res) => {
  const challengeId = String(req.body?.challengeId ?? '');
  const code = String(req.body?.code ?? '').trim();
  if (!challengeId || !/^\d{6}$/.test(code) || !supabase) return res.status(400).json({ error: 'A valid verification code is required.' });
  const { data: challenge, error } = await supabase.from('email_login_challenges').select('id, user_id, code_hash, expires_at, attempts').eq('id', challengeId).is('consumed_at', null).maybeSingle();
  if (error || !challenge) return res.status(401).json({ error: 'This verification code is invalid or expired.' });
  if (new Date(challenge.expires_at).getTime() <= Date.now() || challenge.attempts >= 5) return res.status(401).json({ error: 'This verification code is invalid or expired.' });
  if (!(await bcrypt.compare(code, challenge.code_hash))) {
    await supabase.from('email_login_challenges').update({ attempts: challenge.attempts + 1 }).eq('id', challenge.id);
    return res.status(401).json({ error: 'This verification code is incorrect.' });
  }
  const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', challenge.user_id).single();
  if (userError || !user) return res.status(401).json({ error: 'Account not found.' });
  await supabase.from('email_login_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', challenge.id);
  const publicAccount = publicUser(user);
  return res.json({ ...(await createSession(publicAccount.id, 'Mobile device', 'unknown')), user: publicAccount });
});

app.post('/api/auth/resend-login-code', async (req, res) => {
  const challengeId = String(req.body?.challengeId ?? '');
  if (!challengeId || !supabase || !mailTransport || !env.emailFrom) return res.status(400).json({ error: 'Unable to resend verification code.' });
  const { data: challenge } = await supabase.from('email_login_challenges').select('id, user_id, created_at').eq('id', challengeId).is('consumed_at', null).maybeSingle();
  if (!challenge || Date.now() - new Date(challenge.created_at).getTime() < 60_000) return res.status(429).json({ error: 'Please wait before requesting another code.' });
  const { data: user } = await supabase.from('users').select('email').eq('id', challenge.user_id).single();
  if (!user) return res.status(400).json({ error: 'Unable to resend verification code.' });
  const code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
  await supabase.from('email_login_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', challenge.id);
  const { data: replacement, error } = await supabase.from('email_login_challenges').insert({ user_id: challenge.user_id, code_hash: await bcrypt.hash(code, 12), expires_at: new Date(Date.now() + 10 * 60_000).toISOString() }).select('id').single();
  if (error || !replacement) return res.status(500).json({ error: 'Unable to resend verification code.' });
  await mailTransport.sendMail({ from: env.emailFrom, to: user.email, subject: `${env.appName} sign-in code`, text: `Your ${env.appName} sign-in code is ${code}. It expires in 10 minutes.` });
  return res.status(202).json({ requiresVerification: true, challengeId: replacement.id, expiresIn: 600 });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body ?? {};
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!name || !normalizedEmail || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required.' });
  }

  void register(name, normalizedEmail, password)
    .then((result) => res.status(result.status).json(result.body))
    .catch((error) => {
      console.error('Registration failed:', error instanceof Error ? error.message : 'unknown error');
      return res.status(500).json({ error: 'Could not complete registration.' });
    });
});

async function login(email: string, password: string) {
  if (!supabase) return { status: 503, body: { error: 'Database is not configured.' } };
  if (!mailTransport || !env.emailFrom) return { status: 503, body: { error: 'Email delivery is not configured.' } };
  const { data, error } = await supabase.from('users').select('*').eq('email', String(email).trim().toLowerCase()).maybeSingle();
  if (error) return { status: 500, body: { error: 'Database request failed.' } };
  if (!data || !(await bcrypt.compare(password, data.password_hash))) return { status: 401, body: { error: 'Invalid credentials.' } };
  const code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
  const { data: challenge, error: challengeError } = await supabase.from('email_login_challenges').insert({
    user_id: data.id,
    code_hash: await bcrypt.hash(code, 12),
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  }).select('id').single();
  if (challengeError || !challenge) return { status: 500, body: { error: 'Could not create verification challenge.' } };
  await mailTransport.sendMail({
    from: env.emailFrom,
    to: String(data.email),
    subject: `${env.appName} sign-in code`,
    text: `Your ${env.appName} sign-in code is ${code}. It expires in 10 minutes. If you did not request this, secure your account immediately.`,
    html: `<p>Your ${env.appName} sign-in code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request this, secure your account immediately.</p>`,
  });
  return { status: 202, body: { requiresVerification: true, challengeId: challenge.id, expiresIn: 600 } };
}

async function isConversationMember(conversationId: string, userId: string) {
  if (!supabase) return false;
  const { data, error } = await supabase.from('conversation_participants').select('user_id').eq('conversation_id', conversationId).eq('user_id', userId).maybeSingle();
  return !error && data !== null;
}

async function register(name: unknown, email: string, password: string) {
  if (!supabase) return { status: 503, body: { error: 'Database is not configured.' } };
  if (!mailTransport || !env.emailFrom) return { status: 503, body: { error: 'Email delivery is not configured.' } };
  const username = email.split('@')[0].replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;
  const { data, error } = await supabase.from('users').insert({ name: String(name).trim(), email, username, password_hash: await bcrypt.hash(password, 12) }).select('*').single();
  if (error) return { status: error.code === '23505' ? 409 : 500, body: { error: error.code === '23505' ? 'An account with this email already exists.' : 'Could not create account.' } };
  const { error: participantError } = await supabase.from('conversation_participants').insert([
    { conversation_id: 'conv_1', user_id: data.id },
    { conversation_id: 'conv_2', user_id: data.id },
  ]);
  if (participantError) {
    console.error('Registration conversation setup failed:', participantError.message);
    await supabase.from('users').delete().eq('id', data.id);
    return { status: 500, body: { error: 'Could not finish account setup. Please try again.' } };
  }
  const code = String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, '0');
  const { data: challenge, error: challengeError } = await supabase.from('email_login_challenges').insert({
    user_id: data.id,
    code_hash: await bcrypt.hash(code, 12),
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  }).select('id').single();
  if (challengeError || !challenge) {
    console.error('Registration verification setup failed:', challengeError?.message ?? 'No challenge returned.');
    await supabase.from('users').delete().eq('id', data.id);
    return { status: 500, body: { error: 'Could not create email verification request.' } };
  }
  await mailTransport.sendMail({
    from: env.emailFrom,
    to: email,
    subject: `${env.appName} account verification code`,
    text: `Your ${env.appName} verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your ${env.appName} verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes.</p>`,
  });
  return { status: 202, body: { requiresVerification: true, challengeId: challenge.id, expiresIn: 600 } };
}

function publicUser(user: Record<string, unknown>) {
  return { id: String(user.id), name: String(user.name), email: String(user.email), username: String(user.username), bio: String(user.bio ?? ''), avatarUrl: user.avatar_url ? String(user.avatar_url) : undefined, plan: user.plan === 'premium' ? 'premium' : 'free', isOnline: user.is_online === true, lastSeen: String(user.last_seen ?? new Date().toISOString()), locale: user.locale === 'km' ? 'km' : 'en', role: user.role === 'admin' || user.role === 'moderator' ? user.role : 'user' };
}

async function setPresence(userId: string, isOnline: boolean) {
  if (!supabase) return;
  await supabase.from('users').update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq('id', userId);
}

async function authenticatedUserId(req: express.Request) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret, { issuer: env.appName }) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string' || !supabase) return null;
    const { data } = await supabase.from('device_sessions').select('user_id').eq('id', payload.sid).is('revoked_at', null).eq('user_id', payload.sub).maybeSingle();
    return data ? payload.sub : null;
  } catch {
    return null;
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function createSession(userId: string, deviceName: string, platform: string) {
  if (!supabase) throw new Error('Database is not configured.');
  const refreshToken = randomBytes(48).toString('base64url');
  const { data, error } = await supabase.from('device_sessions').insert({
    user_id: userId,
    device_name: deviceName,
    platform,
    refresh_token_hash: hashToken(refreshToken),
  }).select('id').single();
  if (error || !data) {
    console.error('Device session insert failed:', error?.message ?? 'No session returned.');
    throw new Error('Could not create device session.');
  }
  const accessToken = jwt.sign({ sub: userId, sid: data.id }, env.jwtSecret, { expiresIn: '15m', issuer: env.appName });
  return { token: accessToken, accessToken, refreshToken, expiresIn: 900 };
}

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = String(req.body?.refreshToken ?? '');
  if (!refreshToken || !supabase) return res.status(401).json({ error: 'Invalid refresh token.' });
  const { data: session } = await supabase.from('device_sessions').select('id, user_id').eq('refresh_token_hash', hashToken(refreshToken)).is('revoked_at', null).maybeSingle();
  if (!session) return res.status(401).json({ error: 'Invalid refresh token.' });
  const nextRefreshToken = randomBytes(48).toString('base64url');
  const { error } = await supabase.from('device_sessions').update({ refresh_token_hash: hashToken(nextRefreshToken), last_active_at: new Date().toISOString() }).eq('id', session.id);
  if (error) return res.status(500).json({ error: 'Could not rotate refresh token.' });
  const accessToken = jwt.sign({ sub: session.user_id, sid: session.id }, env.jwtSecret, { expiresIn: '15m', issuer: env.appName });
  return res.json({ token: accessToken, accessToken, refreshToken: nextRefreshToken, expiresIn: 900 });
});

app.post('/api/auth/logout', async (req, res) => {
  if (!req.userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const payload = token ? jwt.decode(token) as jwt.JwtPayload | null : null;
  if (payload?.sid) await supabase.from('device_sessions').update({ revoked_at: new Date().toISOString(), refresh_token_hash: null }).eq('id', payload.sid).eq('user_id', req.userId);
  return res.status(204).send();
});

app.post('/api/me/devices/logout-all', async (req, res) => {
  if (!req.userId || !supabase) return res.status(401).json({ error: 'Authentication required.' });
  const { error } = await supabase.from('device_sessions').update({ revoked_at: new Date().toISOString(), refresh_token_hash: null }).eq('user_id', req.userId).is('revoked_at', null);
  if (error) return res.status(500).json({ error: 'Could not end device sessions.' });
  return res.status(204).send();
});

const server = app.listen(env.port, () => {
  console.log(`${env.appName} backend running on port ${env.port}`);
});

const wss = new WebSocketServer({ noServer: true });
const connectionUsers = new Map<WebSocket, string>();

server.on('upgrade', async (request, socket, head) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const userId = await verifyWebSocketToken(url.searchParams.get('token'));
  if (url.pathname !== '/ws' || !userId) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request));
});

wss.on('connection', (ws, request) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const userId = verifyToken(url.searchParams.get('token'));
  if (!userId) return ws.close(1008, 'Authentication required.');
  connectionUsers.set(ws, userId);
  activeConnections.set(userId, (activeConnections.get(userId) ?? 0) + 1);
  void setPresence(userId, true);
  const heartbeat = setInterval(() => void setPresence(userId, true), 30_000);

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (typeof message.conversationId !== 'string' || typeof message.text !== 'string' || !message.text.trim() || message.text.length > 4000 || !supabase) return;
      void (async () => {
        if (!await isConversationMember(message.conversationId, userId)) {
          ws.send(JSON.stringify({ type: 'error', payload: { error: 'You are not a member of this conversation.' } }));
          return;
        }
        const { data, error } = await supabase.from('messages').insert({ conversation_id: message.conversationId, sender_id: userId, text: message.text.trim(), status: 'sent' }).select('*').single();
        if (error || !data) {
          ws.send(JSON.stringify({ type: 'error', payload: { error: 'Could not save message.' } }));
          return;
        }
        const serialized = JSON.stringify({ type: 'message', payload: data });
        for (const [client, clientUserId] of connectionUsers) {
          if (client.readyState === WebSocket.OPEN && await isConversationMember(message.conversationId, clientUserId)) client.send(serialized);
        }
      })().catch((error: unknown) => console.error('WebSocket message handling failed', error));
    } catch (error) {
      console.error('Failed to parse websocket message', error);
    }
  });

  ws.on('close', () => {
    connectionUsers.delete(ws);
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
    const payload = jwt.verify(token, env.jwtSecret, { issuer: env.appName }) as jwt.JwtPayload;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

async function verifyWebSocketToken(token: string | null) {
  if (!token || !supabase) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret, { issuer: env.appName }) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null;
    const { data } = await supabase.from('device_sessions').select('user_id').eq('id', payload.sid).eq('user_id', payload.sub).is('revoked_at', null).maybeSingle();
    return data ? payload.sub : null;
  } catch {
    return null;
  }
}
