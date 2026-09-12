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
create table if not exists public.device_sessions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.users(id) on delete cascade,
	device_name text not null,
	platform text not null,
	last_active_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	revoked_at timestamptz
);

alter table public.messages drop constraint if exists messages_conversation_id_fkey;
alter table public.messages alter column conversation_id type text using conversation_id::text;
alter table public.conversations alter column id type text using id::text;
alter table public.conversations alter column id set default gen_random_uuid()::text;
alter table public.messages add constraint messages_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade;

insert into public.conversations (id, name, type)
values ('conv_1', 'Da Rea', 'direct'), ('conv_2', 'Design Team', 'group')
on conflict (id) do nothing;
