
// Simple in-memory cache for AI suggestions (per script and context hash)
type Suggestion = {
  id: string;
  type: 'improvement' | 'addition' | 'alternative';
  content: string;
  reason: string;
  confidence: number;
  elementId: string;
};

const suggestionCache = new Map<string, Suggestion[]>();

function hashContext(scriptId: string, context: string) {
  return `${scriptId}:${btoa(encodeURIComponent(context)).slice(0, 40)}`;
}

export function getCachedSuggestions(scriptId: string, context: string): Suggestion[] | undefined {
  const key = hashContext(scriptId, context);
  return suggestionCache.get(key);
}

export function setCachedSuggestions(scriptId: string, context: string, suggestions: Suggestion[]) {
  const key = hashContext(scriptId, context);
  suggestionCache.set(key, suggestions);
}
