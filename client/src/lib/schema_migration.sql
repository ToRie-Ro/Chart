-- Add to messages table
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS voice_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

-- Message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_reaction UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.message_reactions(message_id);

-- RLS for reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Members can view reactions"
  ON public.message_reactions FOR SELECT TO authenticated
  USING (
    message_id IN (
      SELECT m.id FROM public.messages m
      WHERE m.conversation_id IN (
        SELECT cm.conversation_id FROM public.conversation_members cm WHERE cm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Members can add reactions"
  ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can remove own reactions"
  ON public.message_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Add reactions to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
