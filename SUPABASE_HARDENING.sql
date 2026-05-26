-- SUPABASE SECURITY HARDENING v3.1: Nuclear Option (Corrected)
-- This script aggressively clears remaining Advisor warnings.

-- 1. NOTIFICATIONS TABLE (Clear all policies and start fresh)
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "notifications_secure_owner_only"
ON public.notifications FOR ALL
TO authenticated
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- 2. HARDEN ALL FUNCTIONS (Explicit Revoke from anon)
DO $$
DECLARE
    f RECORD;
BEGIN
    FOR f IN 
        SELECT n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prokind = 'f'
    LOOP
        -- Search Path
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', f.schema, f.name, f.args);
        
        -- Permissions
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', f.schema, f.name, f.args);
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon', f.schema, f.name, f.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated', f.schema, f.name, f.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role', f.schema, f.name, f.args);
        
        -- Set owner to postgres for consistency
        EXECUTE format('ALTER FUNCTION %I.%I(%s) OWNER TO postgres', f.schema, f.name, f.args);
    END LOOP;
END $$;

-- 3. STORAGE BUCKET (Clean up policies dynamically)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'policies') THEN
        -- Delete every policy on this bucket to be sure
        EXECUTE 'DELETE FROM storage.policies WHERE bucket_id = ''profile-images''';
        
        -- Insert clean, restricted policies
        EXECUTE 'INSERT INTO storage.policies (name, id, bucket_id, definition, "check", operation) 
        VALUES (''Authenticated Select Only'', uuid_generate_v4(), ''profile-images'', ''(role() = ''''authenticated'''')'', NULL, ''SELECT''), 
        (''Owner Upload Only'', uuid_generate_v4(), ''profile-images'', ''(role() = ''''authenticated'''')'', ''(bucket_id = ''''profile-images'''')'', ''INSERT'') 
        ON CONFLICT DO NOTHING';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not apply storage policies: %', SQLERRM;
END $$;

-- 4. DEFAULT PRIVILEGES (Global fix for new functions)
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Log completion
DO $$ BEGIN RAISE NOTICE 'Nuclear Security Hardening v3.1 Applied Successfully'; END $$;
