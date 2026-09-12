create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  username text not null unique,
  password_hash text not null,
  bio text not null default '',
  locale text not null default 'en',
  role text not null default 'user',
  created_at timestamptz not null default now()
);

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

create index if not exists messages_conversation_created_at_idx on public.messages (conversation_id, created_at);

alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_participants enable row level security;

insert into public.conversations (id, name, type)
values ('conv_1', 'Da Rea', 'direct'), ('conv_2', 'Design Team', 'group')
on conflict (id) do nothing;
