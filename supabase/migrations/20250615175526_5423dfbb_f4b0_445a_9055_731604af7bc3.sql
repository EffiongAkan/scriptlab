
-- Table to register copyright/IP for scripts
CREATE TABLE public.script_copyrights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  copyright_claim TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registration_certificate_url TEXT -- optional link to generated certificate
);
ALTER TABLE public.script_copyrights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage their copyrights" ON public.script_copyrights FOR ALL
  USING (user_id = auth.uid());

-- Table for script registration records (can overlap with copyright, kept separate for extensibility)
CREATE TABLE public.script_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_url TEXT -- digital receipt/certificate
);
ALTER TABLE public.script_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage their registrations" ON public.script_registrations FOR ALL
  USING (user_id = auth.uid());

-- Table for verified producers/discovery platform (admin can insert)
CREATE TABLE public.verified_producers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  focus_genres TEXT[],
  profile_url TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verified_producers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can view producers" ON public.verified_producers FOR SELECT USING (true);

-- Table for funding opportunities
CREATE TABLE public.funding_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  eligibility TEXT,
  url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funding_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All can view funding" ON public.funding_opportunities FOR SELECT USING (true);

-- Log user applications/interest for funding opportunities
CREATE TABLE public.funding_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  funding_id UUID REFERENCES funding_opportunities(id) ON DELETE CASCADE,
  script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, reviewed, accepted, rejected
  notes TEXT
);
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage their applications" ON public.funding_applications FOR ALL
  USING (user_id = auth.uid());
