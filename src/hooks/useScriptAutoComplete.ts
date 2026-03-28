
import { useState, useCallback, useMemo } from 'react';
import { ScriptElementType } from './useScriptContent';

export type AutoCompleteType = 'character' | 'location' | 'time' | 'action' | 'transition';

interface AutoCompleteSuggestion {
  text: string;
  type: AutoCompleteType;
  description?: string;
}

export const useScriptAutoComplete = (elements: ScriptElementType[]) => {
  const [suggestions, setSuggestions] = useState<AutoCompleteSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Extract existing characters and locations from the script once, memoized
  const scriptData = useMemo(() => {
    const characters = new Set<string>();
    const locations = new Set<string>();

    elements.forEach(element => {
      if (element.type === 'character' && element.content?.trim()) {
        characters.add(element.content.trim().toUpperCase());
      } else if (element.type === 'heading') {
        const match = element.content?.match(/^(INT\.|EXT\.)\s+([^-]+)/i);
        if (match?.[2]) {
          locations.add(match[2].trim().toUpperCase());
        }
      }
    });

    return {
      characters: Array.from(characters),
      locations: Array.from(locations),
    };
  }, [elements]);

  // Stable reference for common transitions
  const commonTransitions = useMemo(() => [
    'FADE IN:', 'FADE OUT:', 'CUT TO:', 'DISSOLVE TO:',
    'FADE TO BLACK:', 'MONTAGE:', 'SERIES OF SHOTS:',
    'MATCH CUT TO:', 'SMASH CUT TO:'
  ], []);

  const generateSuggestions = useCallback((
    input: string,
    elementType: ScriptElementType['type'],
  ): AutoCompleteSuggestion[] => {
    if (!input.trim()) return [];
    const lower = input.trim().toLowerCase();
    const result: AutoCompleteSuggestion[] = [];

    switch (elementType) {
      case 'character': {
        // Only suggest characters already in the script that start with the typed prefix
        scriptData.characters.forEach(char => {
          if (char.toLowerCase().startsWith(lower)) {
            result.push({ text: char, type: 'character', description: 'In this script' });
          }
        });
        break;
      }

      case 'heading': {
        const upperInput = input.toUpperCase().trim();

        // Extract full headings from the script for richer suggestions
        const fullHeadings = new Set<string>();
        elements.forEach(el => {
          if (el.type === 'heading' && el.content?.trim()) {
            fullHeadings.add(el.content.trim().toUpperCase());
          }
        });

        if (upperInput.startsWith('INT.') || upperInput.startsWith('EXT.')) {
          // User has specified a prefix — extract the location part typed so far
          const prefix = upperInput.startsWith('INT.') ? 'INT.' : 'EXT.';
          const otherPrefix = prefix === 'INT.' ? 'EXT.' : 'INT.';
          // The text after e.g. "INT. " 
          const locationTyped = upperInput.replace(/^(INT\.|EXT\.)\s*/i, '').trim();

          // 1) Suggest matching full headings already in the script
          fullHeadings.forEach(heading => {
            if (heading.startsWith(prefix) && heading.includes(locationTyped)) {
              result.push({ text: heading, type: 'location', description: 'In this script' });
            }
          });

          // 2) Suggest cross-prefixed versions (INT. → also EXT. variants) 
          scriptData.locations.forEach(loc => {
            if (loc.startsWith(locationTyped)) {
              // Both time variants for the opposite prefix too
              const dayText = `${otherPrefix} ${loc} - DAY`;
              const nightText = `${otherPrefix} ${loc} - NIGHT`;
              if (!Array.from(fullHeadings).some(h => h === dayText)) {
                result.push({ text: dayText, type: 'location', description: 'Used location' });
              }
              if (!Array.from(fullHeadings).some(h => h === nightText)) {
                result.push({ text: nightText, type: 'location', description: 'Used location' });
              }
            }
          });
        } else {
          // User hasn't typed INT./EXT. yet — suggest all existing full headings
          // filtered by whatever they have typed so far
          const matchedHeadings: string[] = [];
          fullHeadings.forEach(heading => {
            if (heading.includes(upperInput)) {
              matchedHeadings.push(heading);
            }
          });

          if (matchedHeadings.length > 0) {
            matchedHeadings.forEach(h =>
              result.push({ text: h, type: 'location', description: 'In this script' })
            );
          } else {
            // Fallback templates when no existing headings match
            result.push(
              { text: 'INT. LIVING ROOM - DAY', type: 'location', description: 'Interior' },
              { text: 'EXT. HOUSE - NIGHT', type: 'location', description: 'Exterior' }
            );
          }
        }
        break;
      }

      case 'transition': {
        commonTransitions.forEach(trans => {
          if (trans.toLowerCase().startsWith(lower)) {
            result.push({ text: trans, type: 'transition', description: 'Transition' });
          }
        });
        break;
      }

      default:
        break;
    }

    return result.slice(0, 8);
  }, [scriptData, commonTransitions, elements]);

  const showSuggestions = useCallback((
    input: string,
    elementType: ScriptElementType['type'],
    cursorPosition: number
  ) => {
    if (!input || input.trim().length < 1) {
      setIsVisible(false);
      setSuggestions([]);
      return;
    }

    const newSuggestions = generateSuggestions(input.trim(), elementType);
    setSuggestions(newSuggestions);
    setIsVisible(newSuggestions.length > 0);
  }, [generateSuggestions]);

  const hideSuggestions = useCallback(() => {
    setIsVisible(false);
    setSuggestions([]);
  }, []);

  return { suggestions, isVisible, showSuggestions, hideSuggestions, scriptData };
};
