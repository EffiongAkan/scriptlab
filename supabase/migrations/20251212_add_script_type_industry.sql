-- Add script_type and film_industry columns to scripts table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.scripts
ADD COLUMN IF NOT EXISTS script_type TEXT,
ADD COLUMN IF NOT EXISTS film_industry TEXT;

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_scripts_script_type ON public.scripts(script_type);
CREATE INDEX IF NOT EXISTS idx_scripts_film_industry ON public.scripts(film_industry);

-- Add comment explaining the columns
COMMENT ON COLUMN public.scripts.script_type IS 'Type of script: Short Film, Feature Film, Skit, or Documentary';
COMMENT ON COLUMN public.scripts.film_industry IS 'Film industry style: Hollywood, Bollywood, Nollywood, etc.';
