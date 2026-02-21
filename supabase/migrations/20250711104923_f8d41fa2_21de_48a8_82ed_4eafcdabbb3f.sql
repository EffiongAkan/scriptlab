-- Fix shared_scripts RLS policies to prevent violations
DROP POLICY IF EXISTS "Users can create shares for their own scripts" ON public.shared_scripts;
DROP POLICY IF EXISTS "Users can view shares for their own scripts" ON public.shared_scripts;
DROP POLICY IF EXISTS "Users can update shares for their own scripts" ON public.shared_scripts;
DROP POLICY IF EXISTS "Users can delete shares for their own scripts" ON public.shared_scripts;

-- Create new, more permissive policies
CREATE POLICY "Users can create shares for their scripts" 
ON public.shared_scripts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their script shares" 
ON public.shared_scripts 
FOR SELECT 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their script shares" 
ON public.shared_scripts 
FOR UPDATE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their script shares" 
ON public.shared_scripts 
FOR DELETE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

-- Add RLS policies for script_invitations
ALTER TABLE public.script_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations they sent or received" 
ON public.script_invitations 
FOR SELECT 
USING (
  inviter_id = auth.uid() OR 
  invitee_email = auth.email() OR
  invitee_id = auth.uid()
);

CREATE POLICY "Users can create invitations for their scripts" 
ON public.script_invitations 
FOR INSERT 
WITH CHECK (
  inviter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM scripts 
    WHERE scripts.id = script_invitations.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update invitations they received" 
ON public.script_invitations 
FOR UPDATE 
USING (
  invitee_email = auth.email() OR 
  invitee_id = auth.uid()
);

-- Add email field to profiles table to avoid auth table dependencies
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create function to get user email safely
CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT email FROM public.profiles WHERE id = user_id),
    (SELECT email FROM auth.users WHERE id = user_id)
  );
$$;