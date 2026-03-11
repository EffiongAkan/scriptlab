-- Add missing indexes to referencing tables to optimize ON DELETE CASCADE
-- Using IF NOT EXISTS to prevent errors if they already exist

-- Core Script Entities
CREATE INDEX IF NOT EXISTS idx_scenes_script_id ON public.scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_script_elements_script_id ON public.script_elements(script_id);
CREATE INDEX IF NOT EXISTS idx_characters_script_id ON public.characters(script_id);

-- Collaboration & Activities
CREATE INDEX IF NOT EXISTS idx_script_activities_script_id ON public.script_activities(script_id);
CREATE INDEX IF NOT EXISTS idx_script_invitations_script_id ON public.script_invitations(script_id);

-- We omit the optional tables (script_copyrights, script_registrations, funding_applications, producer_submissions)
-- as they may not have a script_id column or may not exist in this environment.
