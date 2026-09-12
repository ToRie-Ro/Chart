create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  bio text not null default '',
  locale text not null default 'en',
  role text not null default 'user',
  plan text not null default 'free',
  avatar_url text,
  phone_number text,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_name text not null,
  platform text not null,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  refresh_token_hash text,
  push_token text
);

create index if not exists device_sessions_user_idx on public.device_sessions (user_id, last_active_at desc);
create unique index if not exists device_sessions_refresh_token_idx on public.device_sessions (refresh_token_hash) where refresh_token_hash is not null;

create table if not exists public.email_login_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_login_challenges_user_idx on public.email_login_challenges (user_id, created_at desc);
create index if not exists users_presence_idx on public.users (is_online, last_seen desc);

create table if not exists public.conversations (
  id text primary key default gen_random_uuid()::text,
  name text,
  type text not null default 'direct',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  text text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id text not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (requester_id, recipient_id)
);

create table if not exists public.call_history (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  call_type text not null default 'voice',
  status text not null default 'completed',
  started_at timestamptz not null default now(),
  duration_seconds integer not null default 0
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  language text not null default 'en',
  notifications_enabled boolean not null default true,
  sounds_enabled boolean not null default true,
  dark_mode boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_at_idx on public.messages (conversation_id, created_at);

alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.device_sessions enable row level security;
alter table public.friend_requests enable row level security;
alter table public.call_history enable row level security;
alter table public.user_settings enable row level security;

insert into public.conversations (id, name, type)
values ('conv_1', 'Da Rea', 'direct'), ('conv_2', 'Design Team', 'group')
on conflict (id) do nothing;
