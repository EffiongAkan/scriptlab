-- migration to fix script deletion by adding missing cascades
BEGIN;

-- 1. FIX SCENES (Highly likely culprit)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scenes') THEN
        ALTER TABLE public.scenes
        DROP CONSTRAINT IF EXISTS scenes_script_id_fkey,
        ADD CONSTRAINT scenes_script_id_fkey
          FOREIGN KEY (script_id)
          REFERENCES public.scripts(id)
          ON DELETE CASCADE;
    END IF;
END $$;

-- 2. FIX SHARED_SCRIPTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_scripts') THEN
        ALTER TABLE public.shared_scripts
        DROP CONSTRAINT IF EXISTS shared_scripts_script_id_fkey,
        ADD CONSTRAINT shared_scripts_script_id_fkey
          FOREIGN KEY (script_id)
          REFERENCES public.scripts(id)
          ON DELETE CASCADE;
    END IF;
END $$;

-- 3. FIX SCRIPT_ACTIVITIES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'script_activities') THEN
        ALTER TABLE public.script_activities
        DROP CONSTRAINT IF EXISTS script_activities_script_id_fkey,
        ADD CONSTRAINT script_activities_script_id_fkey
          FOREIGN KEY (script_id)
          REFERENCES public.scripts(id)
          ON DELETE CASCADE;
    END IF;
END $$;

-- 4. FIX OTHER POTENTIAL TABLES
-- Characters
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'characters') THEN
        ALTER TABLE public.characters
        DROP CONSTRAINT IF EXISTS characters_script_id_fkey,
        ADD CONSTRAINT characters_script_id_fkey
          FOREIGN KEY (script_id)
          REFERENCES public.scripts(id)
          ON DELETE CASCADE;
    END IF;
END $$;

-- Script Elements
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'script_elements') THEN
        ALTER TABLE public.script_elements
        DROP CONSTRAINT IF EXISTS script_elements_script_id_fkey,
        ADD CONSTRAINT script_elements_script_id_fkey
          FOREIGN KEY (script_id)
          REFERENCES public.scripts(id)
          ON DELETE CASCADE;
    END IF;
END $$;

-- Script Collaborators
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'script_collaborators') THEN
        ALTER TABLE public.script_collaborators
        DROP CONSTRAINT IF EXISTS script_collaborators_script_id_fkey,
        ADD CONSTRAINT script_collaborators_script_id_fkey
          FOREIGN KEY (script_id)
          REFERENCES public.scripts(id)
          ON DELETE CASCADE;
    END IF;
END $$;

-- Script Invitations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'script_invitations') THEN
        ALTER TABLE public.script_invitations
        DROP CONSTRAINT IF EXISTS script_invitations_script_id_fkey,
        ADD CONSTRAINT script_invitations_script_id_fkey
          FOREIGN KEY (script_id)
          REFERENCES public.scripts(id)
          ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;
