
import { useState, useEffect, useRef } from "react";
import { getCachedSuggestions, setCachedSuggestions } from "@/utils/aisuggestionCache";

export type Suggestion = {
  id: string;
  type: "improvement" | "addition" | "alternative";
  content: string;
  reason: string;
  confidence: number;
  elementId: string;
};

export function useRealTimeSuggestions({
  scriptId,
  currentElement,
  elements,
  preferences,
  isGenerating,
}: {
  scriptId: string;
  currentElement: any;
  elements: any[];
  preferences: string[];
  isGenerating: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const fetchSuggestionsStream = async () => {
      if (!currentElement) return;
      setLoading(true);
      setSuggestions([]);

      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      (async () => {
        try {
          const context = elements
            .map((el) => `[${el.type}] ${el.content}`)
            .slice(-10)
            .join("\n");
          const cacheKey =
            context + "|" + (currentElement.content || "");
          const cached = getCachedSuggestions(scriptId, cacheKey);
          if (cached && cached.length > 0) {
            setSuggestions(cached.filter((s) => preferences.includes(s.type)));
            setLoading(false);
            return;
          }

          setLoading(true);
          setSuggestions([]);

          const response = await fetch(
            "/functions/v1/stream-script-suggestions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt: `Please suggest next lines for: "${currentElement.content || ""}"`,
                context,
                preferences,
              }),
              signal: abortRef.current.signal,
            }
          );

          if (!response.body) throw new Error("No stream received");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let received: Suggestion[] = [];

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() || "";
            for (const eventText of events) {
              if (!eventText.startsWith("data:")) continue;
              try {
                const event = JSON.parse(eventText.replace("data: ", ""));
                const suggestion: Suggestion = {
                  id: event.id,
                  type: event.type || "improvement",
                  content: event.suggestion,
                  reason: event.reason || "",
                  confidence: event.confidence || 85,
                  elementId: "current",
                };
                received.push(suggestion);
                setSuggestions((prev) => {
                  const uniq = [...prev, suggestion].filter(
                    (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i
                  );
                  return uniq.filter((s) => preferences.includes(s.type));
                });
              } catch {}
            }
          }
          setCachedSuggestions(scriptId, cacheKey, received);
        } catch (err) {
          console.error("Streaming AI failed:", err);
        }
        setLoading(false);
      })();
    };

    fetchSuggestionsStream();
  }, [currentElement?.content, preferences]);

  const handleApplySuggestion = (suggestion: Suggestion, onApplySuggestion: (elementId: string, content: string) => void) => {
    onApplySuggestion(suggestion.elementId, suggestion.content);
    setAppliedSuggestions((prev) => new Set([...prev, suggestion.id]));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  };

  return {
    suggestions,
    setSuggestions,
    loading,
    appliedSuggestions,
    handleApplySuggestion,
    handleDismissSuggestion,
  };
}
