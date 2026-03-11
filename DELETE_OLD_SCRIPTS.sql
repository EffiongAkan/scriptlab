-- Deletes all scripts that have not been updated in the last 2 months.
-- Due to the cascade rules and indexes we set up earlier, this will automatically
-- and safely clean up all scenes, elements, characters, and activities associated with these old scripts.

DELETE FROM public.scripts 
WHERE updated_at < NOW() - INTERVAL '2 months';

-- You can optionally run this SELECT query first to see how many scripts will be deleted:
-- SELECT count(*) FROM public.scripts WHERE updated_at < NOW() - INTERVAL '2 months';
