-- SETUP REALTIME COLLABORATION (SAFE VERSION)
-- 1. Create script_activities table if missing
-- 2. Enable Realtime for critical tables (checking if already enabled)

-- =====================================================================
-- 1. CREATE SCRIPT_ACTIVITIES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.script_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'edit', 'comment', 'join', 'leave'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.script_activities ENABLE ROW LEVEL SECURITY;

-- Create Policies for Activities
DROP POLICY IF EXISTS "Users can view activities for scripts they can access" ON public.script_activities;
CREATE POLICY "Users can view activities for scripts they can access"
ON public.script_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = script_activities.script_id 
    AND (scripts.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.shared_scripts 
      WHERE shared_scripts.script_id = scripts.id 
      AND (shared_scripts.created_by = auth.uid() OR shared_scripts.share_token IS NOT NULL)
    ))
  )
);

DROP POLICY IF EXISTS "Users can insert activities" ON public.script_activities;
CREATE POLICY "Users can insert activities"
ON public.script_activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- 2. ENABLE REALTIME REPLICATION (SAFE CHECK)
-- =====================================================================
DO $$
BEGIN
  -- script_elements
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'script_elements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE script_elements;
  END IF;

  -- script_comments
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'script_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE script_comments;
  END IF;

  -- script_comment_replies
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'script_comment_replies') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE script_comment_replies;
  END IF;

  -- script_activities
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'script_activities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE script_activities;
  END IF;
END $$;

-- =====================================================================
-- 3. VERIFICATION
-- =====================================================================
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
