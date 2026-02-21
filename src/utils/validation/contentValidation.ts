
import { ScriptElementType } from '@/hooks/useScriptContent';
import { ValidationIssue } from '@/types/validation';

export const validateContent = (elements: ScriptElementType[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  // Check 1: Dialogue should not be too long
  let longDialogueIssues = 0;
  elements.forEach((element, index) => {
    if (element.type === 'dialogue') {
      const content = element.content.trim();
      if (content.length > 300) { // Arbitrary threshold
        longDialogueIssues++;
        if (longDialogueIssues <= 3) {
          issues.push({
            id: `long-dialogue-${element.id}`,
            type: 'suggestion',
            category: 'content',
            message: `Long dialogue block (${content.length} characters). Consider breaking it up.`,
            elementId: element.id,
            line: index + 1,
            suggestion: 'Break long dialogue into multiple speeches or add action beats'
          });
        }
      }
    }
  });

  // Check 2: Empty elements
  let emptyElements = 0;
  elements.forEach((element, index) => {
    if (!element.content || element.content.trim() === '') {
      emptyElements++;
      if (emptyElements <= 3) {
        issues.push({
          id: `empty-element-${element.id}`,
          type: 'error',
          category: 'content',
          message: `Empty ${element.type} element`,
          elementId: element.id,
          line: index + 1,
          suggestion: 'Add content or remove this element'
        });
      }
    }
  });

  return issues;
};
