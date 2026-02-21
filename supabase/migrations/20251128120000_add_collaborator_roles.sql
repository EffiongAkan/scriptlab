-- Add Role-Based Permissions to Collaboration
-- This migration adds role column to script_collaborators and updates RLS policies
-- to respect different permission levels (viewer, editor, admin)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENSURE BASE TABLES EXIST (Fix for missing migrations)
-- ============================================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  ai_credits INTEGER DEFAULT 25,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create scripts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  content JSONB
);

-- Enable RLS on scripts
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Create script_elements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.script_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  "order" INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on script_elements
ALTER TABLE public.script_elements ENABLE ROW LEVEL SECURITY;

-- Create characters table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traits JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE TABLE IF NOT EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.script_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(script_id, user_id)
);

-- Enable RLS on the new table
ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;

-- Create script_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.script_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_email TEXT,
  invitee_email TEXT NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  role TEXT DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on script_invitations
ALTER TABLE public.script_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADD ROLE COLUMN
-- ============================================================================

-- Add role column with check constraint
ALTER TABLE script_collaborators
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'editor'
CHECK (role IN ('viewer', 'editor', 'admin'));

-- Add comment to document the roles
COMMENT ON COLUMN script_collaborators.role IS 'Permission level: viewer (read-only), editor (can edit), admin (can manage collaborators)';

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_script_collaborators_role ON script_collaborators(script_id, user_id, role);

-- ============================================================================
-- UPDATE RLS POLICIES FOR ROLE-BASED ACCESS
-- ============================================================================

-- Drop the generic collaborator access policy
DROP POLICY IF EXISTS "Collaborators can access shared script elements" ON public.script_elements;

-- Viewers, Editors, and Admins can all READ script elements
CREATE POLICY "Collaborators can read shared script elements"
  ON public.script_elements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role IN ('viewer', 'editor', 'admin'))
      )
    )
  );

-- Only Editors and Admins can INSERT, UPDATE, DELETE script elements
CREATE POLICY "Editors can modify shared script elements"
  ON public.script_elements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role IN ('editor', 'admin'))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role IN ('editor', 'admin'))
      )
    )
  );

-- ============================================================================
-- UPDATE CHARACTERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Collaborators can access shared script characters" ON public.characters;

-- All collaborators can read characters
CREATE POLICY "Collaborators can read shared script characters"
  ON public.characters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role IN ('viewer', 'editor', 'admin'))
      )
    )
  );

-- Only editors and admins can modify characters
CREATE POLICY "Editors can modify shared script characters"
  ON public.characters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role IN ('editor', 'admin'))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role IN ('editor', 'admin'))
      )
    )
  );

-- ============================================================================
-- COLLABORATOR MANAGEMENT POLICIES
-- ============================================================================

-- Only admins can manage other collaborators
CREATE POLICY "Admins can manage collaborators"
  ON public.script_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (
        s.user_id = auth.uid() OR
        (sc.user_id = auth.uid() AND sc.role = 'admin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts s
      WHERE s.id = script_id
      AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM script_collaborators sc
      WHERE sc.script_id = script_id
      AND sc.user_id = auth.uid()
      AND sc.role = 'admin'
    )
  );
