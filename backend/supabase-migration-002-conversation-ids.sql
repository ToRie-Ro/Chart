-- Run this only if supabase-schema.sql was already run before the conversation ID fix.
alter table public.messages drop constraint if exists messages_conversation_id_fkey;
alter table public.messages alter column conversation_id type text using conversation_id::text;
alter table public.conversations alter column id type text using id::text;
alter table public.conversations alter column id set default gen_random_uuid()::text;
alter table public.messages add constraint messages_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade;

insert into public.conversations (id, name, type)
values ('conv_1', 'Da Rea', 'direct'), ('conv_2', 'Design Team', 'group')
on conflict (id) do nothing;
