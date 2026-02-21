
-- Fix admin account creation by adding a trigger to auto-assign Super Admin role
-- This solves the schema cache issue where TypeScript types don't include role_id yet

-- 1. Create a function to auto-assign Super Admin role to new admins
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  super_admin_role_id UUID;
BEGIN
  -- Only assign role if role_id is NULL
  IF NEW.role_id IS NULL THEN
    -- Get the Super Admin role ID
    SELECT id INTO super_admin_role_id 
    FROM public.admin_roles 
    WHERE name = 'Super Admin' 
    LIMIT 1;
    
    -- Assign it to the new admin user
    IF super_admin_role_id IS NOT NULL THEN
      NEW.role_id := super_admin_role_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create a trigger that fires before insert on admin_users
DROP TRIGGER IF EXISTS assign_super_admin_role_trigger ON public.admin_users;
CREATE TRIGGER assign_super_admin_role_trigger
  BEFORE INSERT ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_super_admin_role();

-- 3. Backfill existing admin users without a role_id
DO $$
DECLARE
  super_admin_role_id UUID;
BEGIN
  SELECT id INTO super_admin_role_id 
  FROM public.admin_roles 
  WHERE name = 'Super Admin' 
  LIMIT 1;
  
  IF super_admin_role_id IS NOT NULL THEN
    UPDATE public.admin_users 
    SET role_id = super_admin_role_id 
    WHERE role_id IS NULL;
  END IF;
END $$;
