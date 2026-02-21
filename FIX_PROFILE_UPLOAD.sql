-- FIX_PROFILE_UPLOAD.sql
-- Run this script in your Supabase SQL Editor to fix profile picture uploads

-- 1. Ensure the 'profile-images' bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to ensure we have a clean slate (avoids conflicts)
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Public Profile Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Insert" ON storage.objects;

-- 3. Create comprehensive policies for the 'profile-images' bucket

-- ALLOW INSERT: Users can upload files to their own folder: user_id/*
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ALLOW UPDATE: Users can replace files in their own folder
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ALLOW DELETE: Users can delete files in their own folder
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ALLOW SELECT: Everyone can view profile images (since profile pics are usually public)
CREATE POLICY "Profile images are publicly viewable"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-images' );


-- 4. Ensure 'profiles' table permissions allow updates (needed for saving the avatar_url)
-- We use a DO block to safely create policies only if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
        ON public.profiles FOR UPDATE
        USING ( auth.uid() = id );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Enable insert for authenticated users'
    ) THEN
         CREATE POLICY "Enable insert for authenticated users" 
         ON public.profiles FOR INSERT 
         WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

-- Grant usage just in case
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
