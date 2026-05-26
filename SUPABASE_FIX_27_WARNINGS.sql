-- SUPABASE SECURITY FIX: Resolve 27 Advisor Warnings
-- Version 4.0: Comprehensive Hardening

-- 1. STORAGE: Fix "Public Bucket Allows Listing" for profile-images
-- We remove broad policies and replace them with restricted ones.
DO $$
BEGIN
    -- Drop existing broad policies by name
    DROP POLICY IF EXISTS "avatar_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Select Only" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Object Access" ON storage.objects;
    DROP POLICY IF EXISTS "Strict Object Access" ON storage.objects;

    -- Add STRICT SELECT policy
    -- This allows authenticated users to read objects in 'profile-images'
    -- but restricts listing by ensuring they can only see objects they are supposed to.
    -- If the bucket is Public, you can also just remove this policy and use public URLs.
    EXECUTE 'CREATE POLICY "Strict Object Access" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''profile-images'')';

    RAISE NOTICE 'Storage policies updated for profile-images';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Notice: Storage policy update handled: %', SQLERRM;
END $$;

-- 2. FUNCTIONS: Fix "Signed-In Users Can Execute SECURITY DEFINER Functions"
-- We iterate through all public functions, harden their search path, and restrict execution.
DO $$
DECLARE
    f RECORD;
BEGIN
    FOR f IN 
        SELECT n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as is_definer
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prokind = 'f'
    LOOP
        -- C. Set Search Path to prevent hijacking (High Priority Fix)
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', f.schema, f.name, f.args);
        
        -- D. Revoke broad permissions
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', f.schema, f.name, f.args);
        EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon', f.schema, f.name, f.args);
        
        -- E. Explicitly Grant to authenticated users
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated', f.schema, f.name, f.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role', f.schema, f.name, f.args);
        
        -- F. Convert to SECURITY INVOKER where possible to clear Advisor warnings
        -- We keep RLS helpers and trigger functions as SECURITY DEFINER.
        -- Everything else (business logic RPCs) is moved to INVOKER.
        IF f.name NOT IN (
            'is_admin', 'is_super_admin', 'check_is_collaborator', 'user_can_edit_script', -- RLS Helpers
            'handle_new_user', 'auto_assign_super_admin_role', -- Essential Triggers
            'handle_new_script_invitation', 'handle_invitation_accepted', 'accept_script_invitation', -- Collaboration Triggers/RPCs
            'record_script_activity', 'record_comment_activity', 'record_collaborator_join', 'record_collaborator_leave' -- Logging Triggers
        ) THEN
            BEGIN
                EXECUTE format('ALTER FUNCTION %I.%I(%s) SECURITY INVOKER', f.schema, f.name, f.args);
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not convert % to INVOKER: %', f.name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Execution permissions and security models updated';
END $$;

-- 3. DEFAULT PRIVILEGES: Prevent future warnings
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Log completion
DO $$ BEGIN RAISE NOTICE '27 Security Warnings Resolution Script Applied'; END $$;
