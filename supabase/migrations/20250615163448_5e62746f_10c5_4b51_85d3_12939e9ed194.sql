
-- Table for synopses saved by users
CREATE TABLE public.synopses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for synopses
ALTER TABLE public.synopses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view their own synopses"
  ON public.synopses FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "User can insert their own synopses"
  ON public.synopses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update their own synopses"
  ON public.synopses FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "User can delete their own synopses"
  ON public.synopses FOR DELETE
  USING (auth.uid() = user_id);

-- Table for characters saved by users (if not already sufficient)
CREATE TABLE IF NOT EXISTS public.saved_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  background TEXT,
  traits TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for saved_characters
ALTER TABLE public.saved_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view their own characters"
  ON public.saved_characters FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "User can insert their own characters"
  ON public.saved_characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update their own characters"
  ON public.saved_characters FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "User can delete their own characters"
  ON public.saved_characters FOR DELETE
  USING (auth.uid() = user_id);

-- Table for synopses, plots, and other content types can be extended similarly.
-- The "plots" table is already present, so only new content types need a new table.
