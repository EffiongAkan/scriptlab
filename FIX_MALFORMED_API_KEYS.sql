-- ============================================================================
-- FIX SUPER-MALFORMED API KEYS IN SYSTEM_SETTINGS
-- ============================================================================
-- This migration cleans up API keys that have been "super-stringified" with
-- multiple layers of JSON encoding, objects, or escaped quotes.

-- Helper function to recursively unwrap JSON-encoded strings
CREATE OR REPLACE FUNCTION clean_json_value(input_val TEXT) 
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
  temp_val TEXT;
BEGIN
  cleaned := input_val;
  
  -- Remove all outer quotes first
  cleaned := TRIM(BOTH '"' FROM cleaned);
  
  -- Try to parse as JSON and extract if it's a simple string or object with one key
  BEGIN
    -- If it's a JSON string, unwrap it
    IF cleaned ~ '^[\[\{]' THEN
      -- Try to extract the first value from an object or array
      temp_val := (SELECT jsonb_extract_path_text(cleaned::jsonb, 
        (SELECT jsonb_object_keys(cleaned::jsonb) LIMIT 1)));
      IF temp_val IS NOT NULL AND temp_val != '' THEN
        cleaned := temp_val;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If JSON parsing fails, just continue with string cleanup
    NULL;
  END;
  
  -- Remove escaped quotes
  cleaned := REPLACE(cleaned, '\"', '"');
  cleaned := REPLACE(cleaned, '\\', '');
  
  -- Final trim
  cleaned := TRIM(cleaned);
  
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql;

-- Clean all API keys in system_settings
UPDATE public.system_settings
SET value = jsonb_build_object('key', clean_json_value(value::text))::jsonb -> 'key'
WHERE key IN ('anthropic_api_key', 'openai_api_key', 'xai_api_key', 'deepseek_api_key')
  AND value::text != '""';

-- Clean provider and model settings
UPDATE public.system_settings
SET value = to_jsonb(clean_json_value(value::text))
WHERE key IN ('active_ai_provider', 'active_ai_model')
  AND value::text != '""';

-- Drop the helper function
DROP FUNCTION clean_json_value(TEXT);

-- Verify the cleanup
SELECT key, 
       value::text as cleaned_value,
       length(value::text) as length
FROM public.system_settings
WHERE key IN ('anthropic_api_key', 'openai_api_key', 'active_ai_provider', 'active_ai_model')
ORDER BY key;
