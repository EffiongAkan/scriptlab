
-- 1. Add ai_credits to the profiles table for AI credit tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_credits integer NOT NULL DEFAULT 25;

-- 2. Ensure new users get default credits (handle_new_user may already exist)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, ai_credits)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    25
  );
  RETURN NEW;
END;
$function$;

-- 3. Table for analytics: Log every AI usage
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  usage_type text NOT NULL, -- e.g., 'generate-script', 'generate-plot'
  credit_delta integer NOT NULL,
  prompt text,
  result_excerpt text
);

-- 4. (Optional but recommended) Add index for querying usage logs by user
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);

