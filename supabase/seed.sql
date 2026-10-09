-- Optional seed data for Bluewave Chat
-- Note: User profiles are automatically created when auth.users are inserted via trigger.
-- For local testing or reference:

COMMENT ON TABLE public.profiles IS 'Stores user profile metadata like avatar, bio, and status';
COMMENT ON TABLE public.conversations IS 'Stores private direct or group conversations';
COMMENT ON TABLE public.conversation_members IS 'Links users to conversations with membership metadata';
COMMENT ON TABLE public.messages IS 'Stores real-time chat messages and attachments';
