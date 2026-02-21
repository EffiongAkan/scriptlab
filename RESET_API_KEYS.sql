-- Clear corrupted API keys so they can be re-entered fresh
UPDATE public.system_settings
SET value = '""'::jsonb
WHERE key IN ('anthropic_api_key', 'openai_api_key')
  AND (
    value::text LIKE '%status%' 
    OR value::text LIKE '%diagnostics%'
    OR value::text ~ '^\"{10,}'
  );

-- Verify the reset
SELECT key, value::text, length(value::text) as length
FROM public.system_settings
WHERE key IN ('anthropic_api_key', 'openai_api_key', 'active_ai_provider', 'active_ai_model')
ORDER BY key;
