-- Run this only if supabase-schema.sql was already run before the conversation ID fix.
create table if not exists public.conversation_participants (
	conversation_id text not null references public.conversations(id) on delete cascade,
	user_id uuid not null references public.users(id) on delete cascade,
	joined_at timestamptz not null default now(),
	primary key (conversation_id, user_id)
);

alter table public.users add column if not exists plan text not null default 'free';
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists phone_number text;
alter table public.users add column if not exists is_online boolean not null default false;
alter table public.users add column if not exists last_seen timestamptz not null default now();
create table if not exists public.friend_requests (
	id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.users(id) on delete cascade, recipient_id uuid not null references public.users(id) on delete cascade, status text not null default 'pending', created_at timestamptz not null default now(), unique (requester_id, recipient_id)
);
create table if not exists public.call_history (
	id uuid primary key default gen_random_uuid(), caller_id uuid not null references public.users(id) on delete cascade, recipient_id uuid not null references public.users(id) on delete cascade, call_type text not null default 'voice', status text not null default 'completed', started_at timestamptz not null default now(), duration_seconds integer not null default 0
);
create table if not exists public.user_settings (
	user_id uuid primary key references public.users(id) on delete cascade, language text not null default 'en', notifications_enabled boolean not null default true, sounds_enabled boolean not null default true, dark_mode boolean not null default true, updated_at timestamptz not null default now()
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
alter table public.device_sessions add column if not exists refresh_token_hash text;
alter table public.device_sessions add column if not exists push_token text;
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

alter table public.messages drop constraint if exists messages_conversation_id_fkey;
alter table public.messages alter column conversation_id type text using conversation_id::text;
alter table public.conversations alter column id type text using id::text;
alter table public.conversations alter column id set default gen_random_uuid()::text;
alter table public.messages add constraint messages_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade;

insert into public.conversations (id, name, type)
values ('conv_1', 'Da Rea', 'direct'), ('conv_2', 'Design Team', 'group')
on conflict (id) do nothing;
