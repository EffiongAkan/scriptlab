-- Admin Invitation System Migration

-- 0. Ensure unique constraint on admin_users(user_id) for ON CONFLICT
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_users_user_id_key'
    ) THEN
        ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 1. Create admin_invitations table
CREATE TABLE IF NOT EXISTS public.admin_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    role_id UUID REFERENCES public.admin_roles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure named constraints exist for Postgrest joins
DO $$ 
BEGIN
    -- Role FK
    ALTER TABLE public.admin_invitations DROP CONSTRAINT IF EXISTS admin_invitations_role_fkey;
    ALTER TABLE public.admin_invitations ADD CONSTRAINT admin_invitations_role_fkey 
        FOREIGN KEY (role_id) REFERENCES public.admin_roles(id) ON DELETE CASCADE;

    -- Created By FK (Linked to profiles for joins)
    ALTER TABLE public.admin_invitations DROP CONSTRAINT IF EXISTS admin_invitations_created_by_fkey;
    ALTER TABLE public.admin_invitations ADD CONSTRAINT admin_invitations_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id);

    -- Used By FK (Linked to profiles for joins)
    ALTER TABLE public.admin_invitations DROP CONSTRAINT IF EXISTS admin_invitations_used_by_fkey;
    ALTER TABLE public.admin_invitations ADD CONSTRAINT admin_invitations_used_by_fkey 
        FOREIGN KEY (used_by) REFERENCES public.profiles(id);
EXCEPTION
    WHEN others THEN NULL; -- Ignore if table/columns don't exist yet
END $$;

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only Super Admins can manage invitations
DROP POLICY IF EXISTS "Super Admins can manage invitations" ON public.admin_invitations;
CREATE POLICY "Super Admins can manage invitations"
    ON public.admin_invitations
    FOR ALL
    TO authenticated
    USING (public.is_super_admin(auth.uid()));

-- 1.1 Grant read access to roles and profiles for admins
DO $$ 
BEGIN
    -- Policy for admin_roles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view roles') THEN
        CREATE POLICY "Admins can view roles" ON public.admin_roles
            FOR SELECT USING (public.is_admin(auth.uid()));
    END IF;

    -- Policy for profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles') THEN
        CREATE POLICY "Admins can view all profiles" ON public.profiles
            FOR SELECT USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- 2. Function to generate a secure random passcode
CREATE OR REPLACE FUNCTION public.generate_admin_passcode()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Avoid confusing chars
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- 3. RPC to create an invitation (Admin only)
CREATE OR REPLACE FUNCTION public.create_admin_invitation(role_name TEXT, expires_in_hours INTEGER DEFAULT 24)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role_id UUID;
    v_code TEXT;
BEGIN
    -- Check if sender is super admin
    IF NOT public.is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only Super Admins can create invitations';
    END IF;

    -- Get role ID
    SELECT id INTO v_role_id FROM public.admin_roles WHERE name = role_name;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', role_name;
    END IF;

    -- Generate code
    v_code := public.generate_admin_passcode();

    -- Insert invitation
    INSERT INTO public.admin_invitations (code, role_id, created_by, expires_at)
    VALUES (v_code, v_role_id, auth.uid(), NOW() + (expires_in_hours || ' hours')::interval);

    RETURN v_code;
END;
$$;

-- 4. RPC to claim an invitation
CREATE OR REPLACE FUNCTION public.claim_admin_invitation(passcode TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invite RECORD;
BEGIN
    -- Find a valid, unused, non-expired invite
    SELECT * INTO v_invite 
    FROM public.admin_invitations 
    WHERE code = passcode 
      AND is_used = false 
      AND expires_at > NOW()
    FOR UPDATE;

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Invalid, expired, or already used passcode';
    END IF;

    -- Upsert into admin_users
    INSERT INTO public.admin_users (user_id, email, role_id, is_active)
    VALUES (auth.uid(), auth.email(), v_invite.role_id, true)
    ON CONFLICT (user_id) DO UPDATE 
    SET email = EXCLUDED.email, role_id = v_invite.role_id, is_active = true, updated_at = NOW();

    -- Mark invite as used
    UPDATE public.admin_invitations 
    SET is_used = true, used_by = auth.uid(), used_at = NOW()
    WHERE id = v_invite.id;

    RETURN true;
END;
$$;

-- 5. Seed requested Super Admins
DO $$
DECLARE
    v_role_id UUID;
    v_user_email TEXT;
    v_user_emails TEXT[] := ARRAY['uploadakan@gmail.com', 'pelicanink2025@gmail.com'];
BEGIN
    -- Get Super Admin role
    SELECT id INTO v_role_id FROM public.admin_roles WHERE name = 'Super Admin';
    
    FOREACH v_user_email IN ARRAY v_user_emails LOOP
        -- If user exists in auth.users, promote them
        INSERT INTO public.admin_users (user_id, email, role_id, is_active)
        SELECT id, email, v_role_id, true
        FROM auth.users
        WHERE email = v_user_email
        ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, role_id = v_role_id, is_active = true;
    END LOOP;
END $$;

-- 6. Enhance handle_new_user to auto-promote these specific emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role_id UUID;
    v_super_emails TEXT[] := ARRAY['uploadakan@gmail.com', 'pelicanink2025@gmail.com'];
BEGIN
    -- Existing profile creation
    INSERT INTO public.profiles (id, username, full_name, avatar_url, email, ai_credits)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email,
        25
    );

    -- Auto-promote if email is in the super list
    IF NEW.email = ANY(v_super_emails) THEN
        SELECT id INTO v_role_id FROM public.admin_roles WHERE name = 'Super Admin';
        IF v_role_id IS NOT NULL THEN
            INSERT INTO public.admin_users (user_id, email, role_id, is_active)
            VALUES (NEW.id, NEW.email, v_role_id, true)
            ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, role_id = v_role_id, is_active = true;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
