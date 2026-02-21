-- Create shared_scripts table for persistent script sharing
CREATE TABLE public.shared_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL,
  share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_by UUID NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'read',
  expires_at TIMESTAMP WITH TIME ZONE,
  password_hash TEXT,
  allow_download BOOLEAN NOT NULL DEFAULT false,
  share_type TEXT NOT NULL DEFAULT 'link',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.shared_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create shares for their own scripts" 
ON public.shared_scripts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view shares for their own scripts" 
ON public.shared_scripts 
FOR SELECT 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update shares for their own scripts" 
ON public.shared_scripts 
FOR UPDATE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete shares for their own scripts" 
ON public.shared_scripts 
FOR DELETE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

-- Public access policy for valid share tokens (for reading shared scripts)
CREATE POLICY "Public can access valid shared scripts" 
ON public.shared_scripts 
FOR SELECT 
USING (
  (expires_at IS NULL OR expires_at > now()) AND
  share_token IS NOT NULL
);

-- Create index for performance
CREATE INDEX idx_shared_scripts_token ON public.shared_scripts(share_token);
CREATE INDEX idx_shared_scripts_script_id ON public.shared_scripts(script_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_shared_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_scripts_updated_at
  BEFORE UPDATE ON public.shared_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_shared_scripts_updated_at();