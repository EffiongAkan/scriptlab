-- First, drop any existing public policies that might conflict
DROP POLICY IF EXISTS "Public can view scripts via valid share links" ON public.scripts;
DROP POLICY IF EXISTS "Public can view script elements via valid share links" ON public.script_elements;
DROP POLICY IF EXISTS "Public can access valid shared scripts" ON public.shared_scripts;

-- Allow public access to scripts that are shared via valid share links
CREATE POLICY "Public can view scripts via valid share links"
ON public.scripts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_scripts ss 
    WHERE ss.script_id = scripts.id 
    AND (ss.expires_at IS NULL OR ss.expires_at > now())
  )
);

-- Allow public access to script elements for shared scripts
CREATE POLICY "Public can view script elements via valid share links"
ON public.script_elements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_scripts ss 
    WHERE ss.script_id = script_elements.script_id 
    AND (ss.expires_at IS NULL OR ss.expires_at > now())
  )
);

-- Create the shared_scripts policy for public access
CREATE POLICY "Public can access valid shared scripts"
ON public.shared_scripts
FOR SELECT
USING (
  (expires_at IS NULL OR expires_at > now()) 
  AND share_token IS NOT NULL
);