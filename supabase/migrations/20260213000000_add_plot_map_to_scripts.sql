-- Add plot_map column to scripts table to store causal plot structures
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS plot_map JSONB;

COMMENT ON COLUMN public.scripts.plot_map IS 'Stores the causal relationship map between scenes (goals, storylines, causal links) for advanced AI generation.';
