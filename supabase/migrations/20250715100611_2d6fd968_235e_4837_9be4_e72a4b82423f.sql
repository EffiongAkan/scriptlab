-- Fix infinite recursion in RLS policies for scripts table
-- Remove problematic policies that reference the same table

-- Drop the current policies that cause recursion
DROP POLICY IF EXISTS "scripts_user_select" ON public.scripts;
DROP POLICY IF EXISTS "scripts_user_insert" ON public.scripts;  
DROP POLICY IF EXISTS "scripts_user_update" ON public.scripts;
DROP POLICY IF EXISTS "scripts_user_delete" ON public.scripts;

-- Drop the problematic policy that causes circular dependency with shared_scripts
DROP POLICY IF EXISTS "Public can view scripts via valid share links" ON public.scripts;

-- Create new, safe policies
CREATE POLICY "Users can view their own scripts" ON public.scripts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own scripts" ON public.scripts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scripts" ON public.scripts
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own scripts" ON public.scripts
FOR DELETE USING (user_id = auth.uid());