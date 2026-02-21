-- Diagnostic script to check admin user status and permissions

-- 1. Check if admin_roles table exists and has Super Admin role
SELECT 'Admin Roles Table' as check_name, * FROM public.admin_roles;

-- 2. Check current admin users and their roles
SELECT 
  'Admin Users' as check_name,
  au.user_id,
  au.email,
  au.role,
  au.role_id,
  au.is_active,
  ar.name as role_name,
  ar.level as role_level
FROM public.admin_users au
LEFT JOIN public.admin_roles ar ON au.role_id = ar.id;

-- 3. Check if is_super_admin function exists
SELECT 
  'is_super_admin function' as check_name,
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'is_super_admin';

-- 4. Test is_super_admin function for current user
-- Replace 'YOUR_USER_ID' with actual user ID from step 2
-- SELECT public.is_super_admin('YOUR_USER_ID'::uuid);

-- 5. Check RLS policies on system_settings
SELECT 
  'System Settings Policies' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'system_settings';

-- 6. Check if system_settings has the AI keys
SELECT 
  'System Settings Keys' as check_name,
  key,
  CASE 
    WHEN key LIKE '%api_key%' THEN '***REDACTED***'
    ELSE value::text
  END as value,
  description
FROM public.system_settings
WHERE key IN (
  'active_ai_provider',
  'active_ai_model', 
  'openai_api_key',
  'anthropic_api_key',
  'xai_api_key',
  'deepseek_api_key'
);
