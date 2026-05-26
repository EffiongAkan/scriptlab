-- CHECK STORAGE POLICIES
SELECT 
    p.name as policy_name,
    p.bucket_id,
    p.operation,
    p.definition,
    p.check
FROM storage.policies p;

-- CHECK FUNCTIONS SECURITY
SELECT 
    n.nspname as schema, 
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_function_identity_arguments(p.oid) as args
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND p.prokind = 'f'
AND p.prosecdef = true;
