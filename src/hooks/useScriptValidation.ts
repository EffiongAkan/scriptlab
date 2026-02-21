
import { useMemo } from 'react';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { ValidationIssue, ScriptValidation } from '@/types/validation';
import { validateStructure } from '@/utils/validation/structureValidation';
import { validateFormatting } from '@/utils/validation/formatValidation';
import { validateContent } from '@/utils/validation/contentValidation';
import { validateConsistency } from '@/utils/validation/consistencyValidation';
import { calculateValidationScore } from '@/utils/validation/validationScoring';

export const useScriptValidation = (elements: ScriptElementType[]): ScriptValidation => {
  return useMemo(() => {
    if (!elements || elements.length === 0) {
      return {
        issues: [],
        score: 100,
        passedChecks: 0,
        totalChecks: 0,
      };
    }

    // Collect all validation issues from different validators
    const issues: ValidationIssue[] = [
      ...validateStructure(elements),
      ...validateFormatting(elements),
      ...validateContent(elements),
      ...validateConsistency(elements),
    ];

    // Calculate the overall score
    const { score, passedChecks, totalChecks } = calculateValidationScore(elements, issues);

    return {
      issues,
      score,
      passedChecks,
      totalChecks,
    };
  }, [elements]);
};

// Re-export types for backward compatibility
export type { ValidationIssue, ScriptValidation } from '@/types/validation';
