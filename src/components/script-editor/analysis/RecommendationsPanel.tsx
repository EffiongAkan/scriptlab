import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lightbulb, CheckCircle, ArrowRight } from 'lucide-react';
import { EnhancedScriptAnalytics, ScriptRecommendation } from '@/hooks/useEnhancedScriptAnalytics';

interface RecommendationsPanelProps {
  analytics: EnhancedScriptAnalytics;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ analytics }) => {
  const getTypeIcon = (type: ScriptRecommendation['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'improvement': return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      case 'strength': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: ScriptRecommendation['type']) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'improvement': return 'secondary';
      case 'strength': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: ScriptRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const criticalRecs = analytics.recommendations.filter(rec => rec.type === 'critical');
  const improvementRecs = analytics.recommendations.filter(rec => rec.type === 'improvement');
  const strengthRecs = analytics.recommendations.filter(rec => rec.type === 'strength');

  return (
    <div className="space-y-8 text-white">
      {/* Critical Issues */}
      <div>
        <h3 className="text-red-400 font-medium mb-4">Critical Issues ({criticalRecs.length})</h3>
        {criticalRecs.length === 0 ? (
          <p className="text-gray-400 text-sm">No critical issues identified.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {criticalRecs.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>{rec.title}:</strong> {rec.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Improvements */}
      <div>
        <h3 className="text-orange-400 font-medium mb-4">Improvements ({improvementRecs.length})</h3>
        {improvementRecs.length === 0 ? (
          <p className="text-gray-400 text-sm">No improvement suggestions at this time.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {improvementRecs.slice(0, 5).map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>{rec.title}:</strong> {rec.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Strengths */}
      <div>
        <h3 className="text-green-400 font-medium mb-4">Script Strengths ({strengthRecs.length + analytics.strengths.length})</h3>
        {strengthRecs.length === 0 && analytics.strengths.length === 0 ? (
          <p className="text-gray-400 text-sm">Continue developing your script to identify strengths.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {strengthRecs.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>{rec.title}:</strong> {rec.description}</span>
              </li>
            ))}
            {analytics.strengths.map((strength, index) => (
              <li key={`strength-${index}`} className="flex items-start gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};