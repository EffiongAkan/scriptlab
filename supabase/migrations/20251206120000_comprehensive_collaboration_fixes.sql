-- ====================================================================================
-- COMPREHENSIVE COLLABORATION FIXES
-- Run this entire script in Supabase Dashboard > SQL Editor
-- ====================================================================================

-- 1. CREATE NOTIFICATIONS TABLE (if not exists)
-- ====================================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('invitation', 'collaboration', 'comment', 'system')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notifications_updated_at();

-- 2. FIX SCRIPT_COLLABORATORS TABLE (add role column if missing)
-- ====================================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'script_collaborators' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.script_collaborators 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin'));
    
    COMMENT ON COLUMN public.script_collaborators.role IS 'Permission level: viewer (read-only), editor (can edit), admin (can manage collaborators)';
  END IF;
END $$;

-- Create index for role column
CREATE INDEX IF NOT EXISTS idx_script_collaborators_role 
  ON public.script_collaborators(script_id, user_id, role);

-- 3. FIX SCRIPT_INVITATIONS TABLE (add role column if missing)
-- ====================================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'script_invitations' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.script_invitations 
    ADD COLUMN role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin'));
    
    COMMENT ON COLUMN public.script_invitations.role IS 'Invited user role: viewer, editor, or admin';
  END IF;
END $$;

-- 4. VERIFY SHARED_SCRIPTS TABLE EXISTS
-- ====================================================================================
-- This table should already exist, but verify it's properly configured
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' 
                 AND table_name = 'shared_scripts') THEN
    RAISE EXCEPTION 'shared_scripts table does not exist. Please check your migrations.';
  END IF;
END $$;

-- 5. UPDATE RLS POLICIES FOR SCRIPT_COLLABORATORS (if needed)
-- ====================================================================================
-- Ensure proper RLS policies are in place
-- Drop and recreate to ensure consistency

DROP POLICY IF EXISTS "Users can view collaborations for their scripts" ON public.script_collaborators;
DROP POLICY IF EXISTS "Users can view their collaborations" ON public.script_collaborators;

CREATE POLICY "Users can view collaborations for their scripts"
  ON public.script_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts
      WHERE scripts.id = script_collaborators.script_id
      AND scripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their collaborations"
  ON public.script_collaborators
  FOR SELECT
  USING (user_id = auth.uid());

-- ====================================================================================
-- VERIFICATION QUERIES
-- Run these to verify the changes worked
-- ====================================================================================

-- Check notifications table exists
SELECT 'Notifications table exists' as status, count(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notifications';

-- Check script_collaborators has role column
SELECT 'script_collaborators.role exists' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'script_collaborators' 
AND column_name = 'role';

-- Check script_invitations has role column
SELECT 'script_invitations.role exists' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'script_invitations' 
AND column_name = 'role';

-- Show notification table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'notifications'
ORDER BY ordinal_position;
