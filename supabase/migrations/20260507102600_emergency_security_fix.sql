-- 20260507102600_emergency_security_fix.sql
-- EMERGENCY SECURITY FIX: Comprehensive Coverage and Recursion Fix

-- 1. ENABLE ROW LEVEL SECURITY
ALTER TABLE IF EXISTS public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.script_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.script_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.script_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.edit_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTION (To break RLS recursion)
CREATE OR REPLACE FUNCTION public.check_is_collaborator(check_script_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.script_collaborators
        WHERE script_id = check_script_id
        AND user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SCRIPTS TABLE
DROP POLICY IF EXISTS "scripts_select_owner_collab" ON public.scripts;
DROP POLICY IF EXISTS "scripts_all_owner_only" ON public.scripts;
DROP POLICY IF EXISTS "scripts_select_public" ON public.scripts;
DROP POLICY IF EXISTS "scripts_select_secure" ON public.scripts;

CREATE POLICY "scripts_select_secure"
ON public.scripts FOR SELECT
TO PUBLIC
USING (
    user_id::text = auth.uid()::text 
    OR (SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scripts' AND column_name='is_public') AND is_public = true)
    OR public.check_is_collaborator(id, auth.uid())
);

CREATE POLICY "scripts_all_owner_only"
ON public.scripts FOR ALL
TO authenticated
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- 4. SCRIPT ELEMENTS TABLE
DROP POLICY IF EXISTS "Collaborators can access shared script elements" ON public.script_elements;
DROP POLICY IF EXISTS "script_elements_secure_access" ON public.script_elements;

CREATE POLICY "script_elements_secure_access"
ON public.script_elements FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.scripts s
        WHERE s.id = script_id
        AND (s.user_id::text = auth.uid()::text OR public.check_is_collaborator(s.id, auth.uid()))
    )
);

-- 5. CHARACTERS TABLE
DROP POLICY IF EXISTS "characters_secure_access" ON public.characters;
CREATE POLICY "characters_secure_access"
ON public.characters FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.scripts s
        WHERE s.id = script_id
        AND (s.user_id::text = auth.uid()::text OR public.check_is_collaborator(s.id, auth.uid()))
    )
);

-- 6. COLLABORATORS TABLE
DROP POLICY IF EXISTS "collaborators_secure_access" ON public.script_collaborators;
CREATE POLICY "collaborators_secure_access"
ON public.script_collaborators FOR SELECT
TO authenticated
USING (
    user_id::text = auth.uid()::text 
    OR EXISTS (
        SELECT 1 FROM public.scripts s
        WHERE s.id = script_id
        AND s.user_id::text = auth.uid()::text
    )
);

-- 7. MESSAGES & MENTIONS
DROP POLICY IF EXISTS "messages_select_involved" ON public.messages;
CREATE POLICY "messages_select_involved" ON public.messages FOR SELECT TO authenticated USING (from_user::text = auth.uid()::text OR to_user::text = auth.uid()::text);
DROP POLICY IF EXISTS "mentions_select_involved" ON public.mentions;
CREATE POLICY "mentions_select_involved" ON public.mentions FOR SELECT TO authenticated USING (from_user::text = auth.uid()::text OR mentioned_user::text = auth.uid()::text);

-- 8. COMMENTS
DROP POLICY IF EXISTS "script_comments_select_collab" ON public.script_comments;
CREATE POLICY "script_comments_select_collab" ON public.script_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.scripts s WHERE s.id = script_id AND (s.user_id::text = auth.uid()::text OR public.check_is_collaborator(s.id, auth.uid()))));

-- 9. NOTIFICATIONS & RATE LIMITS
DROP POLICY IF EXISTS "edit_notifications_select_owner" ON public.edit_notifications;
CREATE POLICY "edit_notifications_select_owner" ON public.edit_notifications FOR SELECT TO authenticated USING (user_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "ai_rate_limits_select_owner" ON public.ai_rate_limits;
CREATE POLICY "ai_rate_limits_select_owner" ON public.ai_rate_limits FOR SELECT TO authenticated USING (user_key::text = auth.uid()::text);
