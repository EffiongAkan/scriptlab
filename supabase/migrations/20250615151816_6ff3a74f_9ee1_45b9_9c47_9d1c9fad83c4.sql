
-- Create the ai_rate_limits table for tracking per-user AI request limits
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_key text NOT NULL,
  window_start bigint NOT NULL,
  count integer NOT NULL,
  PRIMARY KEY (user_key, window_start)
);
