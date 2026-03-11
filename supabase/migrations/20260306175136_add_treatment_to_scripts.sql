-- Add treatment column to scripts table
ALTER TABLE public.scripts
ADD COLUMN IF NOT EXISTS treatment text;
