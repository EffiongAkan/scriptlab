-- Diagnostic script to check if necessary tables and functions exist
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_roles') as roles_table_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') as settings_table_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_super_admin') as function_exists;

-- Check system_settings keys
SELECT key FROM public.system_settings WHERE key IN (
  'active_ai_provider', 
  'active_ai_model', 
  'openai_api_key', 
  'anthropic_api_key', 
  'xai_api_key', 
  'deepseek_api_key'
);

-- Check if current user is admin in admin_users
SELECT au.user_id, au.role, ar.name as role_name, ar.level
FROM public.admin_users au
LEFT JOIN public.admin_roles ar ON au.role_id = ar.id;
