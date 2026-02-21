-- ============================================================================
-- FIX: Ensure all admin users have Super Admin role assigned
-- ============================================================================

-- Step 1: Check current state
SELECT 
  'Current Admin Users' as status,
  au.user_id,
  au.email,
  au.role,
  au.role_id,
  au.is_active,
  ar.name as role_name,
  ar.level as role_level
FROM public.admin_users au
LEFT JOIN public.admin_roles ar ON au.role_id = ar.id;

-- Step 2: Get Super Admin role ID
DO $$
DECLARE
  super_admin_id UUID;
  updated_count INTEGER;
BEGIN
  -- Get the Super Admin role ID
  SELECT id INTO super_admin_id 
  FROM public.admin_roles 
  WHERE name = 'Super Admin' 
  LIMIT 1;
  
  IF super_admin_id IS NULL THEN
    RAISE EXCEPTION 'Super Admin role not found! Please run the consolidated migration first.';
  END IF;
  
  -- Update all admin users without a role_id
  UPDATE public.admin_users 
  SET role_id = super_admin_id 
  WHERE role_id IS NULL OR role_id != super_admin_id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % admin user(s) with Super Admin role (ID: %)', updated_count, super_admin_id;
END $$;

-- Step 3: Verify the fix
SELECT 
  'After Fix - Admin Users' as status,
  au.user_id,
  au.email,
  au.role,
  au.role_id,
  au.is_active,
  ar.name as role_name,
  ar.level as role_level,
  CASE 
    WHEN ar.level >= 10 THEN '✅ Can modify AI settings'
    ELSE '❌ Cannot modify AI settings'
  END as ai_config_access
FROM public.admin_users au
LEFT JOIN public.admin_roles ar ON au.role_id = ar.id;

-- Step 4: Test is_super_admin function for each admin user
DO $$
DECLARE
  admin_record RECORD;
  is_super BOOLEAN;
BEGIN
  FOR admin_record IN 
    SELECT user_id, email FROM public.admin_users WHERE is_active = true
  LOOP
    SELECT public.is_super_admin(admin_record.user_id) INTO is_super;
    RAISE NOTICE 'User % (%): is_super_admin = %', 
      admin_record.email, 
      admin_record.user_id, 
      is_super;
  END LOOP;
END $$;
