
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

  // Extract existing characters, locations, and transitions from script
  const scriptData = useMemo(() => {
    const characters = new Set<string>();
    const locations = new Set<string>();
    const transitions = new Set<string>();

    elements.forEach(element => {
      switch (element.type) {
        case 'character':
          if (element.content?.trim()) {
            characters.add(element.content.trim().toUpperCase());
          }
          break;
        case 'heading':
          // Extract location from scene headings like "INT. LIVING ROOM - DAY"
          const locationMatch = element.content?.match(/^(INT\.|EXT\.)\s+([^-]+)/i);
          if (locationMatch && locationMatch[2]) {
            locations.add(locationMatch[2].trim().toUpperCase());
          }
          break;
        case 'transition':
          if (element.content?.trim()) {
            transitions.add(element.content.trim().toUpperCase());
          }
          break;
      }
    });

    return {
      characters: Array.from(characters),
      locations: Array.from(locations),
      transitions: Array.from(transitions)
    };
  }, [elements]);

  // Common Nigerian/Nollywood-specific suggestions
  const commonSuggestions = useMemo(() => ({
    characters: [
      'ADAEZE', 'KEMI', 'TUNDE', 'CHIOMA', 'EMEKA', 'FATIMA', 'IBRAHIM', 'AMAKA',
      'SEGUN', 'BLESSING', 'DAVID', 'GRACE', 'SAMUEL', 'MERCY', 'JOSEPH'
    ],
    locations: [
      'LAGOS ISLAND', 'VICTORIA ISLAND', 'IKEJA', 'ABUJA CITY CENTER', 'PORT HARCOURT',
      'ENUGU MARKET', 'KANO PALACE', 'CALABAR BEACH', 'IBADAN UNIVERSITY',
      'VILLAGE SQUARE', 'FAMILY COMPOUND', 'CHURCH HALL', 'MOSQUE', 'SCHOOL COMPOUND'
    ],
    times: [
      'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'DAWN', 'DUSK', 'MIDNIGHT',
      'EARLY MORNING', 'LATE NIGHT', 'SUNSET', 'SUNRISE'
    ],
    transitions: [
      'FADE IN:', 'FADE OUT:', 'CUT TO:', 'DISSOLVE TO:', 'FADE TO BLACK:',
      'MONTAGE:', 'SERIES OF SHOTS:', 'MATCH CUT TO:', 'SMASH CUT TO:'
    ],
    actions: [
      'walks slowly towards', 'enters the room', 'sits down carefully',
      'looks around nervously', 'picks up the phone', 'opens the door',
      'closes the window', 'turns on the light', 'walks away quickly',
      'smiles warmly', 'frowns deeply', 'nods in agreement'
    ]
  }), []);

  const generateSuggestions = useCallback((
    input: string, 
    elementType: ScriptElementType['type'],
    cursorPosition: number
  ): AutoCompleteSuggestion[] => {
    const suggestions: AutoCompleteSuggestion[] = [];
    const lowercaseInput = input.toLowerCase();

    switch (elementType) {
      case 'character':
        // Suggest existing characters first
        scriptData.characters.forEach(char => {
          if (char.toLowerCase().includes(lowercaseInput)) {
            suggestions.push({
              text: char,
              type: 'character',
              description: 'Existing character'
            });
          }
        });
        
        // Add common Nigerian names
        commonSuggestions.characters.forEach(char => {
          if (char.toLowerCase().includes(lowercaseInput) && 
              !scriptData.characters.includes(char)) {
            suggestions.push({
              text: char,
              type: 'character',
              description: 'Common Nigerian name'
            });
          }
        });
        break;

      case 'heading':
        if (input.startsWith('INT.') || input.startsWith('EXT.')) {
          // Suggest locations
          const locationPart = input.split(' ').slice(1).join(' ').toLowerCase();
          
          scriptData.locations.forEach(loc => {
            if (loc.toLowerCase().includes(locationPart)) {
              const prefix = input.startsWith('INT.') ? 'INT. ' : 'EXT. ';
              suggestions.push({
                text: `${prefix}${loc} - DAY`,
                type: 'location',
                description: 'Existing location'
              });
            }
          });
          
          commonSuggestions.locations.forEach(loc => {
            if (loc.toLowerCase().includes(locationPart) &&
                !scriptData.locations.includes(loc)) {
              const prefix = input.startsWith('INT.') ? 'INT. ' : 'EXT. ';
              suggestions.push({
                text: `${prefix}${loc} - DAY`,
                type: 'location',
                description: 'Common location'
              });
            }
          });
        } else {
          // Suggest scene heading formats
          suggestions.push(
            { text: 'INT. LIVING ROOM - DAY', type: 'location', description: 'Interior scene' },
            { text: 'EXT. HOUSE - NIGHT', type: 'location', description: 'Exterior scene' }
          );
        }
        break;

      case 'transition':
        commonSuggestions.transitions.forEach(trans => {
          if (trans.toLowerCase().includes(lowercaseInput)) {
            suggestions.push({
              text: trans,
              type: 'transition',
              description: 'Transition'
            });
          }
        });
        break;

      case 'action':
        commonSuggestions.actions.forEach(action => {
          if (action.toLowerCase().includes(lowercaseInput)) {
            suggestions.push({
              text: action,
              type: 'action',
              description: 'Common action'
            });
          }
        });
        break;
    }

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }, [scriptData, commonSuggestions]);

  const showSuggestions = useCallback((
    input: string,
    elementType: ScriptElementType['type'],
    cursorPosition: number
  ) => {
    if (input.length < 2) {
      setIsVisible(false);
      return;
    }

    const newSuggestions = generateSuggestions(input, elementType, cursorPosition);
    setSuggestions(newSuggestions);
    setIsVisible(newSuggestions.length > 0);
  }, [generateSuggestions]);

  const hideSuggestions = useCallback(() => {
    setIsVisible(false);
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isVisible,
    showSuggestions,
    hideSuggestions,
    scriptData
  };
};
