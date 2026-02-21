
-- Enable RLS and add policies for key user tables

-- Scripts Table
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own scripts"
  ON public.scripts
  FOR ALL
  USING (user_id = auth.uid());

-- Script Elements Table
ALTER TABLE public.script_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own script elements"
  ON public.script_elements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_id AND s.user_id = auth.uid()
    )
  );

-- Characters Table
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own script characters"
  ON public.characters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = script_id AND s.user_id = auth.uid()
    )
  );

-- Synopses Table
ALTER TABLE public.synopses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own synopses"
  ON public.synopses
  FOR ALL
  USING (user_id = auth.uid());

-- Plots Table
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own plots"
  ON public.plots
  FOR ALL
  USING (user_id = auth.uid());

-- AI Usage Logs Table
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI logs"
  ON public.ai_usage_logs
  FOR ALL
  USING (user_id = auth.uid());

-- script_collaborators Table (Primary owner + collaborators for access)
ALTER TABLE public.script_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Script collaborators can see their collaborations"
  ON public.script_collaborators
  FOR ALL
  USING (user_id = auth.uid());

-- profiles Table (user can only see their profile)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view and update their own profile"
  ON public.profiles
  FOR ALL
  USING (id = auth.uid());

-- Funding Related: allow only user access
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their funding applications"
  ON public.funding_applications
  FOR ALL
  USING (user_id = auth.uid());

-- Credits Purchases Policy
ALTER TABLE public.credits_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own credits purchases"
  ON public.credits_purchases
  FOR ALL
  USING (user_id = auth.uid());

-- Script Registrations Policy
ALTER TABLE public.script_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own script registrations"
  ON public.script_registrations
  FOR ALL
  USING (user_id = auth.uid());
