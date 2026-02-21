-- Fix RLS policies to prevent infinite recursion
-- Drop all existing policies first to start clean
DROP POLICY IF EXISTS "Users can access their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can view their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can insert their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can update their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON public.scripts;

-- Create simple, non-recursive policies for scripts
CREATE POLICY "scripts_user_select" ON public.scripts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "scripts_user_insert" ON public.scripts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "scripts_user_update" ON public.scripts
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "scripts_user_delete" ON public.scripts
FOR DELETE USING (user_id = auth.uid());

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile images are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');