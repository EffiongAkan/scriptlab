import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScriptValidation } from '@/hooks/useScriptValidation';
import { ValidationIssue, ScriptValidation } from '@/types/validation';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { CheckCircle, AlertCircle, Lightbulb, Wand2 } from 'lucide-react';

interface SmartFormatSuggestionsProps {
  validation: ScriptValidation;
  scriptId: string;
}

export const SmartFormatSuggestions = ({ 
  validation,
  scriptId
}: SmartFormatSuggestionsProps) => {
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const handleApplySuggestion = (issue: ValidationIssue) => {
    if (issue.elementId && issue.suggestion) {
      // TODO: Implement actual suggestion application
      setAppliedSuggestions(prev => new Set([...prev, issue.id]));
    }
  };

  const getApplicableSuggestions = () => {
    return validation.issues.filter(issue => 
      issue.suggestion && 
      issue.elementId && 
      !appliedSuggestions.has(issue.id)
    );
  };

  const handleApplyAllFormatting = () => {
    const suggestions = getApplicableSuggestions()
      .filter(issue => issue.category === 'formatting');
    
    if (suggestions.length > 0) {
      suggestions.forEach(suggestion => {
        const issue = validation.issues.find(i => i.elementId === suggestion.elementId);
        if (issue) {
          setAppliedSuggestions(prev => new Set([...prev, issue.id]));
        }
      });
    }
  };

  const groupedIssues = {
    errors: validation.issues.filter(i => i.type === 'error'),
    warnings: validation.issues.filter(i => i.type === 'warning'),
    suggestions: validation.issues.filter(i => i.type === 'suggestion'),
  };

  const formatIssues = validation.issues.filter(i => i.category === 'formatting');
  const structureIssues = validation.issues.filter(i => i.category === 'structure');
  const contentIssues = validation.issues.filter(i => i.category === 'content');
  const consistencyIssues = validation.issues.filter(i => i.category === 'consistency');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Smart Suggestions
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={validation.score >= 80 ? 'default' : 'secondary'}>
              {validation.score}/100
            </Badge>
            {formatIssues.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleApplyAllFormatting}
                className="text-xs"
              >
                Fix All Formatting
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="improve">Improve</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{groupedIssues.errors.length} Errors</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{groupedIssues.warnings.length} Warnings</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Lightbulb className="h-4 w-4" />
                  <span className="font-medium">{groupedIssues.suggestions.length} Suggestions</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Formatting: {formatIssues.length}
                </div>
                <div className="text-sm text-gray-600">
                  Structure: {structureIssues.length}
                </div>
                <div className="text-sm text-gray-600">
                  Content: {contentIssues.length}
                </div>
                <div className="text-sm text-gray-600">
                  Consistency: {consistencyIssues.length}
                </div>
              </div>
            </div>

            {validation.issues.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-lg font-medium text-green-600">Perfect Script!</p>
                <p className="text-sm text-gray-600">No issues found in your script.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="critical" className="space-y-3">
            {[...groupedIssues.errors, ...groupedIssues.warnings].map((issue) => (
              <div key={issue.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={issue.type === 'error' ? 'destructive' : 'secondary'}>
                      {issue.type}
                    </Badge>
                    <span className="text-sm text-gray-600">{issue.category}</span>
                    {issue.line && (
                      <span className="text-xs text-gray-500">Line {issue.line}</span>
                    )}
                  </div>
                  {issue.suggestion && issue.elementId && !appliedSuggestions.has(issue.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplySuggestion(issue)}
                      className="text-xs"
                    >
                      Fix
                    </Button>
                  )}
                </div>
                <p className="text-sm">{issue.message}</p>
                {issue.suggestion && (
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-xs text-blue-800">
                      <Lightbulb className="h-3 w-3 inline mr-1" />
                      Suggestion: {issue.suggestion}
                    </p>
                  </div>
                )}
                {appliedSuggestions.has(issue.id) && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Applied
                  </div>
                )}
              </div>
            ))}
            {groupedIssues.errors.length === 0 && groupedIssues.warnings.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No critical issues found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="format" className="space-y-3">
            {formatIssues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">formatting</Badge>
                    {issue.line && (
                      <span className="text-xs text-gray-500">Line {issue.line}</span>
                    )}
                  </div>
                  {issue.suggestion && issue.elementId && !appliedSuggestions.has(issue.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplySuggestion(issue)}
                      className="text-xs"
                    >
                      Fix
                    </Button>
                  )}
                </div>
                <p className="text-sm">{issue.message}</p>
                {issue.suggestion && (
                  <div className="bg-green-50 rounded p-2">
                    <p className="text-xs text-green-800 font-mono">
                      Fix: {issue.suggestion}
                    </p>
                  </div>
                )}
                {appliedSuggestions.has(issue.id) && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Applied
                  </div>
                )}
              </div>
            ))}
            {formatIssues.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No formatting issues found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="improve" className="space-y-3">
            {groupedIssues.suggestions.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">suggestion</Badge>
                    <span className="text-sm text-gray-600">{issue.category}</span>
                    {issue.line && (
                      <span className="text-xs text-gray-500">Line {issue.line}</span>
                    )}
                  </div>
                  {issue.suggestion && issue.elementId && !appliedSuggestions.has(issue.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplySuggestion(issue)}
                      className="text-xs"
                    >
                      Apply
                    </Button>
                  )}
                </div>
                <p className="text-sm">{issue.message}</p>
                {issue.suggestion && (
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-xs text-blue-800">
                      <Lightbulb className="h-3 w-3 inline mr-1" />
                      {issue.suggestion}
                    </p>
                  </div>
                )}
                {appliedSuggestions.has(issue.id) && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    Applied
                  </div>
                )}
              </div>
            ))}
            {groupedIssues.suggestions.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No improvement suggestions available.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
