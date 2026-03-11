-- Add missing indexes to referencing tables to optimize ON DELETE CASCADE
-- Using IF NOT EXISTS to prevent migration errors

-- Core Script Entities
CREATE INDEX IF NOT EXISTS idx_scenes_script_id ON public.scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_script_elements_script_id ON public.script_elements(script_id);
CREATE INDEX IF NOT EXISTS idx_characters_script_id ON public.characters(script_id);

-- Collaboration & Activities
CREATE INDEX IF NOT EXISTS idx_script_activities_script_id ON public.script_activities(script_id);
CREATE INDEX IF NOT EXISTS idx_script_invitations_script_id ON public.script_invitations(script_id);

-- Optional/Additional dependent tables
CREATE INDEX IF NOT EXISTS idx_script_copyrights_script_id ON public.script_copyrights(script_id);
CREATE INDEX IF NOT EXISTS idx_script_registrations_script_id ON public.script_registrations(script_id);
CREATE INDEX IF NOT EXISTS idx_funding_applications_script_id ON public.funding_applications(script_id);
CREATE INDEX IF NOT EXISTS idx_producer_submissions_script_id ON public.producer_submissions(script_id);
