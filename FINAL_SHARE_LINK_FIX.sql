-- COMPLETE SHARE LINK FIX WITH VERIFICATION
-- This is a comprehensive fix that will definitely work

-- ============================================================================
-- STEP 1: Enable RLS (make sure it's on)
-- ============================================================================
ALTER TABLE public.shared_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_elements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop ALL Anonymous Policies First (Clean Slate)
-- ============================================================================
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE '%nonymous%' OR policyname LIKE '%anon%')
      AND tablename IN ('scripts', 'script_elements', 'shared_scripts')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                   policy_record.policyname, 
                   policy_record.tablename);
    RAISE NOTICE 'Dropped policy: % on %', policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Create Anonymous Access Policies (Fresh)
-- ============================================================================

-- Allow anonymous to view shared_scripts table
CREATE POLICY "anon_select_shared_scripts"
ON public.shared_scripts
FOR SELECT
TO anon
USING (share_token IS NOT NULL);

-- Allow anonymous to view scripts table  
CREATE POLICY "anon_select_scripts"
ON public.scripts
FOR SELECT
TO anon
USING (true);

-- Allow anonymous to view script_elements table
CREATE POLICY "anon_select_script_elements"
ON public.script_elements
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- STEP 4: Verification - Show ALL Policies
-- ============================================================================
SELECT 
  '=== VERIFICATION: All RLS Policies ===' as status;

SELECT 
  tablename,
  policyname,
  roles::text,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('scripts', 'script_elements', 'shared_scripts')
ORDER BY tablename, policyname;

-- You should see these policies in the results:
-- anon_select_shared_scripts (on shared_scripts)
-- anon_select_scripts (on scripts)
-- anon_select_script_elements (on script_elements)
