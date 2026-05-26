import { useState, useCallback, useEffect, useMemo } from 'react';
import { ScriptElementType } from './useScriptContent';

// Static dictionary of common misspellings and script-specific typos
const STATIC_DICTIONARY: Record<string, string> = {
  "teh": "the", "adn": "and", "fo": "of", "nad": "and", "hte": "the",
  "dont": "don't", "cant": "can't", "wont": "won't", "its": "it's",
  "recieve": "receive", "beleive": "believe", "occured": "occurred",
  "seperate": "separate", "definately": "definitely", "wich": "which",
  "becuase": "because", "accomodate": "accommodate", "alot": "a lot",
  "gk": "go", "th": "the", "realy": "really", "very": "very",
  // Screenplay specific
  "interoir": "interior", "exteroir": "exterior",
  "dialougue": "dialogue", "diagloue": "dialogue", "charcter": "character",
  "sceen": "scene", "montge": "montage", "disolvve": "dissolve",
  "continud": "continued", "voiceover": "voice-over", "voiceovr": "voice-over",
  "fadein": "fade in", "fadeout": "fade out", "continuious": "continuous",
  "narrarator": "narrator", "int.": "INT.", "ext.": "EXT."
};

// Simple Levenshtein distance implementation
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
};

export const useAutoCorrect = (elements: ScriptElementType[]) => {
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem('autocorrect-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('autocorrect-enabled', JSON.stringify(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    const handleToggle = () => setIsEnabled(prev => !prev);
    document.addEventListener('autocorrect-toggle', handleToggle);
    return () => document.removeEventListener('autocorrect-toggle', handleToggle);
  }, []);

  // Dynamically extract characters and locations from the script
  const dynamicDictionary = useMemo(() => {
    const characters = new Set<string>();
    const locations = new Set<string>();

    elements.forEach(element => {
      if (element.type === 'character' && element.content?.trim()) {
        // Strip out parenthesis parts like (V.O.)
        const name = element.content.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
        if (name) characters.add(name);
      } else if (element.type === 'heading' && element.content?.trim()) {
        const match = element.content.match(/^(INT\.|EXT\.|INT\/EXT\.)\s+([^-]+)/i);
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

  const correctWord = useCallback((word: string, elementType?: string): string | null => {
    if (!isEnabled || !word || word.length < 2) return null; // Don't correct very short words
    
    // Exact match for static dictionary
    const lowerWord = word.toLowerCase();
    if (STATIC_DICTIONARY[lowerWord]) {
      // Preserve original case roughly
      const corrected = STATIC_DICTIONARY[lowerWord];
      if (word === word.toUpperCase()) return corrected.toUpperCase();
      if (word[0] === word[0].toUpperCase()) return corrected.charAt(0).toUpperCase() + corrected.slice(1);
      return corrected;
    }

    // Dynamic matching (Characters and Locations)
    // Only attempt dynamic matching if the word looks somewhat like a name/location 
    // i.e., it's a character or heading field, or it's capitalized.
    const upperWord = word.toUpperCase();
    const isCapitalized = word === upperWord || word[0] === word[0].toUpperCase();
    
    if (elementType === 'character' || (isCapitalized && elementType !== 'action' && elementType !== 'dialogue')) {
        let bestMatch: string | null = null;
        let minDistance = 2; // Maximum allowed distance is 2 for a typo
        
        const candidates = elementType === 'character' 
            ? dynamicDictionary.characters 
            : [...dynamicDictionary.characters, ...dynamicDictionary.locations];

        for (const candidate of candidates) {
            // Optimization: avoid calculating distance if length difference is too large
            if (Math.abs(candidate.length - upperWord.length) > minDistance) continue;
            
            // Don't "correct" to the exact same string
            if (candidate === upperWord) continue;

            const dist = levenshteinDistance(upperWord, candidate);
            // Allow distance of 1 for shorter words (3-5), 2 for longer ones (6+)
            const maxAllowedDist = candidate.length <= 5 ? 1 : 2;

            if (dist <= maxAllowedDist && dist < minDistance) {
                minDistance = dist;
                bestMatch = candidate;
            }
        }

        if (bestMatch) {
             // If original was all upper, keep it all upper, else preserve first cap if it was character
             if (word === upperWord || elementType === 'character') return bestMatch;
             // Location might be mixed case if they typed it that way, but let's just uppercase it if it's a heading
             if (elementType === 'heading') return bestMatch;
             return bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1).toLowerCase();
        }
    }

    return null;
  }, [isEnabled, dynamicDictionary]);

  const autoCorrectText = useCallback((text: string, triggerChar: string, elementType?: string) => {
    if (!isEnabled) return { corrected: text, correction: null };

    // The 'text' passed here is already the text BEFORE the triggerChar
    const textBeforeTrigger = text;
    // Regex to match the last word before the trigger character
    // Support apostrophes, periods (for V.O., INT.), and letters
    const match = textBeforeTrigger.match(/([a-zA-Z0-9\u00C0-\u017F'.]+)$/);
    
    if (match) {
        const lastWord = match[1];
        // If the word ends in a period that is a trigger, don't include it in the word to correct
        const cleanWord = (triggerChar === '.' && lastWord.endsWith('.')) 
            ? lastWord.slice(0, -1) 
            : lastWord;
            
        if (cleanWord.length >= 3) {
            const correctedWord = correctWord(cleanWord, elementType);

            if (correctedWord && correctedWord !== cleanWord) {
                 const newText = textBeforeTrigger.slice(0, -lastWord.length) + correctedWord + triggerChar;
                 return {
                     corrected: newText,
                     correction: { original: cleanWord, corrected: correctedWord }
                 };
            }
        }
    }

    return { corrected: text + triggerChar, correction: null };

  }, [isEnabled, correctWord]);

  return { isEnabled, setIsEnabled, correctWord, autoCorrectText, getSuggestion: correctWord };
};
