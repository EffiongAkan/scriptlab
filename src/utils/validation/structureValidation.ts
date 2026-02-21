
import { ScriptElementType } from '@/hooks/useScriptContent';
import { ValidationIssue } from '@/types/validation';

export const validateStructure = (elements: ScriptElementType[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Check 1: Script should start with a scene heading
  if (elements.length > 0 && elements[0].type !== 'heading') {
    issues.push({
      id: 'no-opening-scene',
      type: 'warning',
      category: 'structure',
      message: 'Script should typically start with a scene heading (INT./EXT.)',
      elementId: elements[0].id,
      line: 1,
      suggestion: 'Add a scene heading like "INT. LOCATION - DAY" or "EXT. LOCATION - NIGHT"'
    });
  }

  // Check 2: Orphaned dialogue (dialogue without character)
  let orphanedDialogue = 0;
  elements.forEach((element, index) => {
    if (element.type === 'dialogue') {
      // Check if previous element is a character or parenthetical
      const prevElement = index > 0 ? elements[index - 1] : null;
      if (!prevElement || (prevElement.type !== 'character' && prevElement.type !== 'parenthetical')) {
        orphanedDialogue++;
        if (orphanedDialogue <= 2) {
          issues.push({
            id: `orphaned-dialogue-${element.id}`,
            type: 'error',
            category: 'structure',
            message: 'Dialogue must be preceded by a character name',
            elementId: element.id,
            line: index + 1,
            suggestion: 'Add a character name before this dialogue'
          });
        }
      }
    }
  });

  return issues;
};
