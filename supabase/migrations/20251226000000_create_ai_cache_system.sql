-- ============================================================================
-- AI CACHING SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Creates tables for intelligent AI response caching with monitoring

-- ============================================================================
-- 1. AI Cache Table - Stores cached AI responses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'xai', 'deepseek')),
  model TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  response_content TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  cache_type TEXT NOT NULL DEFAULT 'session' CHECK (cache_type IN ('session', 'popular', 'template')),
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_prompt_hash ON public.ai_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_ai_cache_user_id ON public.ai_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at ON public.ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_script_id ON public.ai_cache(script_id) WHERE script_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_cache_type_expires ON public.ai_cache(cache_type, expires_at);

-- ============================================================================
-- 2. Cache Analytics Table - Tracks cache performance metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cache_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_requests INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  cache_misses INTEGER NOT NULL DEFAULT 0,
  tokens_saved INTEGER NOT NULL DEFAULT 0,
  cost_saved_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_cache_analytics_user_date ON public.cache_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_cache_analytics_date ON public.cache_analytics(date);

-- ============================================================================
-- 3. Cache Warming Jobs Table - Manages background cache warming
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cache_warming_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('synopsis', 'script', 'suggestions')),
  priority INTEGER NOT NULL DEFAULT 0,
  last_warmed TIMESTAMPTZ,
  next_warm_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_warming_next_warm ON public.cache_warming_jobs(next_warm_at);
CREATE INDEX IF NOT EXISTS idx_cache_warming_priority ON public.cache_warming_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_cache_warming_script ON public.cache_warming_jobs(script_id);

-- ============================================================================
-- 4. Helper Functions
-- ============================================================================

-- Function to update cache analytics
CREATE OR REPLACE FUNCTION public.update_cache_analytics(
  p_user_id UUID,
  p_is_hit BOOLEAN,
  p_tokens_saved INTEGER DEFAULT 0,
  p_cost_saved NUMERIC DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.cache_analytics (
    user_id,
    date,
    total_requests,
    cache_hits,
    cache_misses,
    tokens_saved,
    cost_saved_usd
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    1,
    CASE WHEN p_is_hit THEN 1 ELSE 0 END,
    CASE WHEN p_is_hit THEN 0 ELSE 1 END,
    p_tokens_saved,
    p_cost_saved
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_requests = cache_analytics.total_requests + 1,
    cache_hits = cache_analytics.cache_hits + CASE WHEN p_is_hit THEN 1 ELSE 0 END,
    cache_misses = cache_analytics.cache_misses + CASE WHEN p_is_hit THEN 0 ELSE 1 END,
    tokens_saved = cache_analytics.tokens_saved + p_tokens_saved,
    cost_saved_usd = cache_analytics.cost_saved_usd + p_cost_saved,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_cache
  WHERE expires_at < NOW()
    AND cache_type = 'session';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cache hit rate for a user
CREATE OR REPLACE FUNCTION public.get_user_cache_stats(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS TABLE (
  total_requests BIGINT,
  cache_hits BIGINT,
  cache_misses BIGINT,
  hit_rate_percent NUMERIC,
  tokens_saved BIGINT,
  cost_saved_usd NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(ca.total_requests)::BIGINT as total_requests,
    SUM(ca.cache_hits)::BIGINT as cache_hits,
    SUM(ca.cache_misses)::BIGINT as cache_misses,
    CASE 
      WHEN SUM(ca.total_requests) > 0 
      THEN ROUND((SUM(ca.cache_hits)::NUMERIC / SUM(ca.total_requests)::NUMERIC) * 100, 2)
      ELSE 0
    END as hit_rate_percent,
    SUM(ca.tokens_saved)::BIGINT as tokens_saved,
    SUM(ca.cost_saved_usd)::NUMERIC as cost_saved_usd
  FROM public.cache_analytics ca
  WHERE ca.user_id = p_user_id
    AND ca.date >= CURRENT_DATE - p_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_warming_jobs ENABLE ROW LEVEL SECURITY;

-- ai_cache policies
CREATE POLICY "Users can read their own cache entries"
  ON public.ai_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cache entries"
  ON public.ai_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cache entries"
  ON public.ai_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cache entries"
  ON public.ai_cache FOR DELETE
  USING (auth.uid() = user_id);

-- cache_analytics policies
CREATE POLICY "Users can read their own analytics"
  ON public.cache_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage analytics"
  ON public.cache_analytics FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- cache_warming_jobs policies
CREATE POLICY "Users can read warming jobs for their scripts"
  ON public.cache_warming_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scripts s
      WHERE s.id = cache_warming_jobs.script_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage warming jobs"
  ON public.cache_warming_jobs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Update updated_at timestamp on cache_analytics
CREATE OR REPLACE FUNCTION public.update_cache_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cache_analytics_timestamp
  BEFORE UPDATE ON public.cache_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cache_analytics_timestamp();

-- ============================================================================
-- 7. Initial Data
-- ============================================================================

-- Create template caches for common prompts (optional)
-- These will be populated by the warming jobs

COMMENT ON TABLE public.ai_cache IS 'Stores cached AI responses to reduce API costs';
COMMENT ON TABLE public.cache_analytics IS 'Tracks cache performance metrics per user per day';
COMMENT ON TABLE public.cache_warming_jobs IS 'Manages background jobs for keeping popular content warm';
