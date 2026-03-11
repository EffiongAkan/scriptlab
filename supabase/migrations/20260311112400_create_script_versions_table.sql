-- Create sequence for version numbers
-- Create script_versions table
CREATE TABLE IF NOT EXISTS public.script_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  commit_message TEXT NOT NULL,
  content_snapshot JSONB NOT NULL,
  branch TEXT NOT NULL DEFAULT 'main'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_script_versions_script_id ON public.script_versions(script_id);
CREATE INDEX IF NOT EXISTS idx_script_versions_created_by ON public.script_versions(created_by);

-- Enable RLS
ALTER TABLE public.script_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view versions of scripts they own or collaborate on
CREATE POLICY "Users can view versions of their scripts" 
  ON public.script_versions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_versions.script_id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.script_collaborators sc
      WHERE sc.script_id = script_versions.script_id AND sc.user_id = auth.uid()
    )
  );

-- Users can create versions of scripts they own or have edit/admin access to
CREATE POLICY "Users can create versions of their scripts" 
  ON public.script_versions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_versions.script_id AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.script_collaborators sc
      WHERE sc.script_id = script_versions.script_id 
        AND sc.user_id = auth.uid() 
        AND sc.role IN ('editor', 'admin')
    )
  );
