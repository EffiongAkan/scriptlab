-- Create Tables for Real-Time Comments System
-- This migration creates tables for script comments and replies to replace mock data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SCRIPT COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  element_id TEXT,  -- Optional: link comment to specific script element
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to document the table
COMMENT ON TABLE script_comments IS 'Comments on scripts and specific script elements';
COMMENT ON COLUMN script_comments.element_id IS 'Optional ID of the script element this comment refers to';
COMMENT ON COLUMN script_comments.is_resolved IS 'Whether this comment thread has been resolved';

-- ============================================================================
-- COMMENT REPLIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS script_comment_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES script_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE script_comment_replies IS 'Replies to script comments for threaded discussions';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_script_comments_script ON script_comments(script_id);
CREATE INDEX IF NOT EXISTS idx_script_comments_element ON script_comments(element_id) WHERE element_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_script_comments_user ON script_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_script_comments_created ON script_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment ON script_comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_user ON script_comment_replies(user_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE script_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_comment_replies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR COMMENTS
-- ============================================================================

-- Collaborators can view comments on scripts they have access to
CREATE POLICY "Collaborators can view comments on accessible scripts"
  ON script_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (s.user_id = auth.uid() OR sc.user_id = auth.uid())
    )
  );

-- Collaborators can add comments to scripts they have access to
CREATE POLICY "Collaborators can add comments"
  ON script_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM scripts s
      LEFT JOIN script_collaborators sc ON s.id = sc.script_id
      WHERE s.id = script_id
      AND (s.user_id = auth.uid() OR sc.user_id = auth.uid())
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON script_comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON script_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Script owners and admins can delete any comment on their scripts
CREATE POLICY "Owners and admins can delete comments"
  ON script_comments
  FOR DELETE
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
  );

-- ============================================================================
-- RLS POLICIES FOR REPLIES
-- ============================================================================

-- Users can view replies to comments they can see
CREATE POLICY "Users can view replies to visible comments"
  ON script_comment_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM script_comments sc
      WHERE sc.id = comment_id
    )
  );

-- Users can add replies to comments they can see
CREATE POLICY "Users can add replies"
  ON script_comment_replies
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM script_comments sc
      WHERE sc.id = comment_id
    )
  );

-- Users can update their own replies
CREATE POLICY "Users can update their own replies"
  ON script_comment_replies
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
  ON script_comment_replies
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for comments
CREATE TRIGGER update_script_comments_updated_at
  BEFORE UPDATE ON script_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for replies
CREATE TRIGGER update_script_comment_replies_updated_at
  BEFORE UPDATE ON script_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
