-- ============================================================================
-- BLUEWAVE CHAT - FIX RLS INFINITE RECURSION MIGRATION
-- Run this script in your Supabase project's SQL Editor to fix:
-- "ERROR: 42P17: infinite recursion detected in policy for relation conversation_members"
-- ============================================================================

-- 1. FIX CONVERSATION_MEMBERS POLICIES
-- Drop the recursive policy that queried conversation_members from within itself
DROP POLICY IF EXISTS "Members can view conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Authenticated users can view conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Authenticated users can insert conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_members;

-- Clean non-recursive SELECT: any authenticated user can view membership rows
-- (Conversations and messages still strictly restrict who can view chat content)
CREATE POLICY "Authenticated users can view conversation members"
    ON public.conversation_members FOR SELECT
    TO authenticated
    USING (true);

-- Clean INSERT: authenticated users can add members
CREATE POLICY "Authenticated users can insert conversation members"
    ON public.conversation_members FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Clean DELETE: users can remove themselves from conversations
CREATE POLICY "Users can leave conversations"
    ON public.conversation_members FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- 2. FIX CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Members can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Members can update conversations" ON public.conversations;

CREATE POLICY "Members can view conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT cm.conversation_id
            FROM public.conversation_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Members can update conversations"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT cm.conversation_id
            FROM public.conversation_members cm
            WHERE cm.user_id = auth.uid()
        )
    );


-- 3. FIX MESSAGES POLICIES
DROP POLICY IF EXISTS "Members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Members can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can update own messages" ON public.messages;

CREATE POLICY "Members can view messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        conversation_id IN (
            SELECT cm.conversation_id
            FROM public.conversation_members cm
            WHERE cm.user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Members can insert messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND conversation_id IN (
            SELECT cm.conversation_id
            FROM public.conversation_members cm
            WHERE cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Senders can update own messages"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (auth.uid() = sender_id);

-- 4. ENSURE REALTIME IS ACTIVE FOR ALL CHAT TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
