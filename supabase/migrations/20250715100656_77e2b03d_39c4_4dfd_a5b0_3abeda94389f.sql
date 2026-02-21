-- Fix infinite recursion in RLS policies for scripts table
-- Drop ALL existing policies first to avoid conflicts

-- Drop all possible existing policies on scripts table
DROP POLICY IF EXISTS "scripts_user_select" ON public.scripts;
DROP POLICY IF EXISTS "scripts_user_insert" ON public.scripts;  
DROP POLICY IF EXISTS "scripts_user_update" ON public.scripts;
DROP POLICY IF EXISTS "scripts_user_delete" ON public.scripts;
DROP POLICY IF EXISTS "Public can view scripts via valid share links" ON public.scripts;
DROP POLICY IF EXISTS "Users can view their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can insert their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can update their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON public.scripts;

-- Create new, safe policies that don't cause recursion
CREATE POLICY "Users can view their own scripts" ON public.scripts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own scripts" ON public.scripts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scripts" ON public.scripts
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own scripts" ON public.scripts
FOR DELETE USING (user_id = auth.uid());