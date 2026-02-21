
import { ValidationIssue } from '@/types/validation';
import { ScriptElementType } from '@/hooks/useScriptContent';

export const calculateValidationScore = (
  elements: ScriptElementType[],
  issues: ValidationIssue[]
): { score: number; passedChecks: number; totalChecks: number } => {
  if (!elements || elements.length === 0) {
    return {
      score: 100,
      passedChecks: 0,
      totalChecks: 0,
    };
  }

  const totalChecks = 7; // Total number of validation checks
  
  // Count how many checks passed (checks that didn't produce issues)
  const checksWithIssues = new Set();
  
  issues.forEach(issue => {
    if (issue.id.includes('no-opening-scene')) checksWithIssues.add('opening-scene');
    if (issue.id.includes('character-caps')) checksWithIssues.add('character-format');
    if (issue.id.includes('scene-format')) checksWithIssues.add('scene-format');
    if (issue.id.includes('long-dialogue')) checksWithIssues.add('dialogue-length');
    if (issue.id.includes('character-consistency')) checksWithIssues.add('character-consistency');
    if (issue.id.includes('empty-element')) checksWithIssues.add('empty-elements');
    if (issue.id.includes('orphaned-dialogue')) checksWithIssues.add('orphaned-dialogue');
  });

  const passedChecks = totalChecks - checksWithIssues.size;
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return {
    score,
    passedChecks,
    totalChecks,
  };
};
