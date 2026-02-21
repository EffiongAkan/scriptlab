
export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: 'formatting' | 'structure' | 'content' | 'consistency';
  message: string;
  elementId?: string;
  line?: number;
  suggestion?: string;
}

export interface ScriptValidation {
  issues: ValidationIssue[];
  score: number; // 0-100
  passedChecks: number;
  totalChecks: number;
}
