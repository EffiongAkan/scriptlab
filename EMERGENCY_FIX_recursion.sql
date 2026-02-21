-- EMERGENCY FIX - Remove Circular Dependencies
-- Run this IMMEDIATELY in Supabase Dashboard > SQL Editor

-- Step 1: Drop ALL the policies I just created that caused the recursion
DROP POLICY IF EXISTS "Public can access all shared scripts" ON public.shared_scripts;
DROP POLICY IF EXISTS "Public can view shared scripts" ON public.scripts;
DROP POLICY IF EXISTS "Public can view shared script elements" ON public.script_elements;

-- Step 2: Make sure authenticated users can access their own scripts (critical!)
DROP POLICY IF EXISTS "Users can select their own scripts" ON public.scripts;
CREATE POLICY "Users can select their own scripts"
ON public.scripts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Make sure users can see their script elements
DROP POLICY IF EXISTS "Users can select their script elements" ON public.script_elements;
CREATE POLICY "Users can select their script elements"
ON public.script_elements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scripts
    WHERE scripts.id = script_elements.script_id
    AND scripts.user_id = auth.uid()
  )
);

-- Step 4: Simple shared_scripts access for AUTHENTICATED users only (safer)
DROP POLICY IF EXISTS "Authenticated users can view shares" ON public.shared_scripts;
CREATE POLICY "Authenticated users can view shares"
ON public.shared_scripts
FOR SELECT
TO authenticated
USING (true);

-- Step 5: Allow ANONYMOUS (not logged in) users to access shared_scripts directly
-- This is the key - we allow anon users to see the shared_scripts table
DROP POLICY IF EXISTS "Anonymous can view shared_scripts" ON public.shared_scripts;
CREATE POLICY "Anonymous can view shared_scripts"
ON public.shared_scripts
FOR SELECT
TO anon
USING (share_token IS NOT NULL);

-- Step 6: Allow anonymous users to view scripts ONLY via script_id from shared_scripts
-- This is done in the application code, not via policy, to avoid recursion

-- Verification: Check what policies exist now
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('scripts', 'script_elements', 'shared_scripts')
ORDER BY tablename, policyname;
