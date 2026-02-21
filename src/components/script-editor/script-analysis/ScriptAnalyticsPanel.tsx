import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScriptAnalytics } from '@/hooks/useScriptAnalytics';
import { useScriptValidation } from '@/hooks/useScriptValidation';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ScriptAnalyticsPanelProps {
  scriptId: string;
  elements: ScriptElementType[];
}

export const ScriptAnalyticsPanel = ({ scriptId, elements }: ScriptAnalyticsPanelProps) => {
  const analytics = useScriptAnalytics(elements);
  const validation = useScriptValidation(elements);

  const elementTypeData = [
    { name: 'Scenes', value: analytics.sceneCount, color: '#3B82F6' },
    { name: 'Action', value: analytics.actionCount, color: '#10B981' },
    { name: 'Dialogue', value: analytics.dialogueCount, color: '#F59E0B' },
    { name: 'Characters', value: analytics.characterCount, color: '#EF4444' },
  ];

  const topCharacters = Object.entries(analytics.characterFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const getValidationColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Script Analysis
            <Badge variant={validation.score >= 80 ? 'default' : validation.score >= 60 ? 'secondary' : 'destructive'}>
              Score: {validation.score}/100
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="characters">Characters</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Elements</span>
                    <span className="font-semibold">{analytics.totalElements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estimated Pages</span>
                    <span className="font-semibold">{analytics.pageEstimate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reading Time</span>
                    <span className="font-semibold">{analytics.readingTime} min</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Scenes</span>
                    <span className="font-semibold">{analytics.sceneCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Characters</span>
                    <span className="font-semibold">{analytics.characterCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dialogue/Action</span>
                    <span className="font-semibold">{analytics.writingPace.dialogueToActionRatio.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={elementTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {elementTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="structure" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Scene Breakdown</h4>
                {analytics.sceneBreakdown.slice(0, 5).map((scene) => (
                  <div key={scene.sceneNumber} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">Scene {scene.sceneNumber}</span>
                      <Badge variant="outline">{scene.elementCount} elements</Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{scene.title}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{scene.characterCount} characters</span>
                      <span>{scene.dialogueLines} dialogue lines</span>
                    </div>
                  </div>
                ))}
                {analytics.sceneBreakdown.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {analytics.sceneBreakdown.length - 5} more scenes
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="characters" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Character Frequency</h4>
                {topCharacters.map((char) => (
                  <div key={char.name} className="flex justify-between items-center">
                    <span className="font-mono text-sm">{char.name}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(char.count / Math.max(...Object.values(analytics.characterFrequency))) * 100} className="w-16" />
                      <span className="text-sm">{char.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Writing Pace</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Avg Elements/Scene</span>
                    <span>{analytics.writingPace.averageElementsPerScene.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Dialogue Length</span>
                    <span>{analytics.writingPace.averageDialogueLength.toFixed(0)} chars</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Overall Quality Score</span>
                    <span className={`font-bold ${getValidationColor(validation.score)}`}>
                      {validation.score}/100
                    </span>
                  </div>
                  <Progress value={validation.score} className="h-2" />
                  <p className="text-sm text-gray-600 mt-1">
                    {validation.passedChecks}/{validation.totalChecks} checks passed
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Quality Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Character Consistency</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analytics.qualityMetrics.characterConsistency} className="w-16" />
                        <span className="text-sm">{analytics.qualityMetrics.characterConsistency.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Scene Balance</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analytics.qualityMetrics.sceneBalance} className="w-16" />
                        <span className="text-sm">{analytics.qualityMetrics.sceneBalance.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dialogue Variety</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analytics.qualityMetrics.dialogueVariety} className="w-16" />
                        <span className="text-sm">{analytics.qualityMetrics.dialogueVariety.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {validation.issues.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Issues Found</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {validation.issues.slice(0, 10).map((issue) => (
                        <div key={issue.id} className="border rounded p-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={issue.type === 'error' ? 'destructive' : issue.type === 'warning' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {issue.type}
                            </Badge>
                            <span className="text-xs text-gray-500">{issue.category}</span>
                            {issue.line && <span className="text-xs text-gray-500">Line {issue.line}</span>}
                          </div>
                          <p className="text-sm">{issue.message}</p>
                          {issue.suggestion && (
                            <p className="text-xs text-gray-600 italic">💡 {issue.suggestion}</p>
                          )}
                        </div>
                      ))}
                      {validation.issues.length > 10 && (
                        <p className="text-sm text-gray-500 text-center">
                          ... and {validation.issues.length - 10} more issues
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
