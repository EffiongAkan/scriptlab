-- Check if shared_scripts table exists and create it if not
CREATE TABLE IF NOT EXISTS public.shared_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'comment', 'edit')),
  expires_at TIMESTAMP WITH TIME ZONE,
  allow_download BOOLEAN NOT NULL DEFAULT false,
  share_type TEXT NOT NULL DEFAULT 'link' CHECK (share_type IN ('link', 'email', 'social')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_scripts
CREATE POLICY "Users can view their own shared scripts" 
ON public.shared_scripts 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create shared scripts for their own scripts" 
ON public.shared_scripts 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.scripts 
    WHERE scripts.id = shared_scripts.script_id 
    AND scripts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own shared scripts" 
ON public.shared_scripts 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own shared scripts" 
ON public.shared_scripts 
FOR DELETE 
USING (created_by = auth.uid());

-- Anyone can view shared scripts using the share token (for public access)
CREATE POLICY "Public access to shared scripts via token" 
ON public.shared_scripts 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_shared_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shared_scripts_updated_at
BEFORE UPDATE ON public.shared_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_shared_scripts_updated_at();