-- Fix Script Element Reordering Bug
-- This migration renames the "order" column to "position" to match the codebase
-- and avoid using SQL reserved keywords

-- Rename "order" to position (ORDER is a SQL reserved word)
ALTER TABLE public.script_elements
RENAME COLUMN "order" TO position;

-- Add index for better query performance on position-based queries
CREATE INDEX IF NOT EXISTS idx_script_elements_position 
ON public.script_elements(script_id, position);

-- Add check constraint to ensure positions are non-negative
ALTER TABLE public.script_elements
ADD CONSTRAINT position_non_negative CHECK (position >= 0);

-- Add comment to document the column
COMMENT ON COLUMN public.script_elements.position IS 'Sequential position of the element within the script (0-indexed)';
