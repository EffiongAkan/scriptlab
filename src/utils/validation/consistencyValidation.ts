
import { ScriptElementType } from '@/hooks/useScriptContent';
import { ValidationIssue } from '@/types/validation';

export const validateConsistency = (elements: ScriptElementType[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Character consistency check
  const characterVariations = new Map<string, Set<string>>();
  elements.forEach((element, index) => {
    if (element.type === 'character') {
      const normalized = element.content.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const original = element.content.trim();
      
      if (!characterVariations.has(normalized)) {
        characterVariations.set(normalized, new Set());
      }
      characterVariations.get(normalized)!.add(original);
    }
  });

  let inconsistentCharacters = 0;
  characterVariations.forEach((variations, normalized) => {
    if (variations.size > 1) {
      inconsistentCharacters++;
      if (inconsistentCharacters <= 2) {
        issues.push({
          id: `character-consistency-${normalized}`,
          type: 'warning',
          category: 'consistency',
          message: `Inconsistent character name variations: ${Array.from(variations).join(', ')}`,
          suggestion: `Use consistent formatting for character names`
        });
      }
    }
  });

  return issues;
};
