-- IMMEDIATE FIX FOR SHARE LINKS
-- Run this in Supabase Dashboard > SQL Editor NOW
-- This will make share links work immediately

-- 1. Drop all existing policies that might be blocking access
DROP POLICY IF EXISTS "Public can access valid shared scripts" ON public.shared_scripts;
DROP POLICY IF EXISTS "Public can view scripts via valid share links" ON public.scripts;
DROP POLICY IF EXISTS "Public can view script elements via valid share links" ON public.script_elements;

-- 2. Create SIMPLE policy that allows ALL shared_scripts access
-- This removes the expiration check entirely for now
CREATE POLICY "Public can access all shared scripts"
ON public.shared_scripts
FOR SELECT
TO public
USING (share_token IS NOT NULL);

-- 3. Allow public to view scripts that have any share link
CREATE POLICY "Public can view shared scripts"
ON public.scripts
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.shared_scripts ss 
    WHERE ss.script_id = scripts.id
  )
);

-- 4. Allow public to view script elements for shared scripts  
CREATE POLICY "Public can view shared script elements"
ON public.script_elements
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.shared_scripts ss 
    WHERE ss.script_id = script_elements.script_id
  )
);

-- 5. Verify the policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('shared_scripts', 'scripts', 'script_elements')
  AND policyname LIKE '%Public%'
ORDER BY tablename, policyname;
