-- Create script_analyses table to store persistent analysis results
-- This allows modular loading and prevents redundant expensive AI calls

CREATE TABLE IF NOT EXISTS public.script_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_type TEXT NOT NULL, -- 'overview', 'plot', 'character', 'pacing', 'theme', 'cultural', 'technical', 'industry'
    content JSONB NOT NULL,
    script_hash TEXT, -- To detect if script has changed since last analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient querying by script and module
CREATE INDEX IF NOT EXISTS idx_script_analyses_script_module 
ON public.script_analyses(script_id, module_type);

-- RLS Policies
ALTER TABLE public.script_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own script analyses" 
ON public.script_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own script analyses" 
ON public.script_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own script analyses" 
ON public.script_analyses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own script analyses" 
ON public.script_analyses FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_script_analyses_updated_at
    BEFORE UPDATE ON public.script_analyses
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
