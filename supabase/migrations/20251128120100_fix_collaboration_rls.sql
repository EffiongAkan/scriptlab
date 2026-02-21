-- Fix RLS Policies for Shared Script Access
-- This migration fixes the collaboration access control to allow collaborators
-- to access scripts they've been invited to, not just their own scripts.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing restrictive policies that only allow owners to access
DROP POLICY IF EXISTS "Users can access their own scripts" ON public.scripts;
DROP POLICY IF EXISTS "Users can access their own script elements" ON public.script_elements;
DROP POLICY IF EXISTS "Users can access their own script characters" ON public.characters;

-- ============================================================================
-- SCRIPTS TABLE POLICIES
-- ============================================================================

-- Allow users to view scripts they own OR have been invited to collaborate on
CREATE POLICY "Users can access owned and collaborated scripts"
  ON public.scripts
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM script_collaborators sc
      WHERE sc.script_id = scripts.id
      AND sc.user_id = auth.uid()
    )
  );

-- Only owners can modify their scripts (INSERT, UPDATE, DELETE)
CREATE POLICY "Owners can modify their scripts"
  ON public.scripts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- SCRIPT ELEMENTS TABLE POLICIES
-- ============================================================================

-- Allow users to access elements from scripts they own or collaborate on
CREATE POLICY "Collaborators can access shared script elements"
  ON public.script_elements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (s.user_id = auth.uid() OR sc.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (s.user_id = auth.uid() OR sc.user_id = auth.uid())
    )
  );

-- ============================================================================
-- CHARACTERS TABLE POLICIES
-- ============================================================================

-- Allow users to access characters from scripts they own or collaborate on
CREATE POLICY "Collaborators can access shared script characters"
  ON public.characters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (s.user_id = auth.uid() OR sc.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (s.user_id = auth.uid() OR sc.user_id = auth.uid())
    )
  );

-- ============================================================================
-- SCRIPT INVITATIONS POLICIES
-- ============================================================================

-- Create script_invitations table if it doesn't exist (Defensive check)
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

-- Users can view invitations they sent or received
CREATE POLICY "Users can view their invitations"
  ON public.script_invitations
  FOR SELECT
  USING (
    inviter_id = auth.uid() OR
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can create invitations for scripts they own
CREATE POLICY "Owners can send invitations"
  ON public.script_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scripts s
      WHERE s.id = script_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can update invitations they sent or received
CREATE POLICY "Users can update their invitations"
  ON public.script_invitations
  FOR UPDATE
  USING (
    inviter_id = auth.uid() OR
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
