
import { ScriptElementType } from '@/hooks/useScriptContent';
import { ValidationIssue } from '@/types/validation';

export const validateFormatting = (elements: ScriptElementType[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Check 1: Character names should be in ALL CAPS
  let characterFormatIssues = 0;
  elements.forEach((element, index) => {
    if (element.type === 'character') {
      const content = element.content.trim();
      if (content !== content.toUpperCase()) {
        characterFormatIssues++;
        if (characterFormatIssues <= 3) { // Limit to first 3 issues
          issues.push({
            id: `character-caps-${element.id}`,
            type: 'error',
            category: 'formatting',
            message: `Character name should be in ALL CAPS: "${content}"`,
            elementId: element.id,
            line: index + 1,
            suggestion: content.toUpperCase()
          });
        }
      }
    }
  });

  // Check 2: Scene headings should follow proper format
  let sceneHeadingIssues = 0;
  elements.forEach((element, index) => {
    if (element.type === 'heading') {
      const content = element.content.trim().toUpperCase();
      const validPrefixes = ['INT.', 'EXT.', 'INTERIOR.', 'EXTERIOR.'];
      const hasValidPrefix = validPrefixes.some(prefix => content.startsWith(prefix));
      
      if (!hasValidPrefix) {
        sceneHeadingIssues++;
        if (sceneHeadingIssues <= 2) {
          issues.push({
            id: `scene-format-${element.id}`,
            type: 'warning',
            category: 'formatting',
            message: `Scene heading should start with INT. or EXT.: "${element.content}"`,
            elementId: element.id,
            line: index + 1,
            suggestion: 'Use format: INT./EXT. LOCATION - TIME'
          });
        }
      }
    }
  });

  return issues;
};
