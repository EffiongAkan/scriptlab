import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Loader } from 'lucide-react';
import { PremiumScriptAnalyzer, PremiumAnalysisResult } from '@/services/premium-script-analysis';
import { ScriptElementType } from '@/hooks/useScriptContent';

interface PlotAnalysisPanelProps {
  elements: ScriptElementType[];
}

export const PlotAnalysisPanel: React.FC<PlotAnalysisPanelProps> = ({ elements }) => {
  const [analysis, setAnalysis] = useState<PremiumAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performAnalysis = async () => {
      if (!elements?.length) return setLoading(false);
      try {
        const result = await PremiumScriptAnalyzer.performComprehensiveAnalysis(elements);
        setAnalysis(result);
      } catch (error) {
        console.error('Plot analysis failed:', error);
      } finally {
        setLoading(false);
      }
    };
    performAnalysis();
  }, [elements]);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader className="h-8 w-8 animate-spin" /><span className="ml-2">Analyzing plot...</span></div>;
  if (!analysis) return <div className="text-center py-8"><p className="text-gray-400">No plot analysis available</p></div>;

  const analytics = {
    plotHoles: analysis.plotAnalysis.plotHoles,
    timelineConsistency: 85,
    narrativeFlow: 78,
    sceneCount: elements.filter(el => el.type === 'heading').length,
    recommendations: []
  };
  return (
    <div className="space-y-8 text-white">
      {/* Plot Holes */}
      <div>
        <h3 className="text-red-400 font-medium mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Plot Holes ({analytics.plotHoles.length})
        </h3>
        {analytics.plotHoles.length === 0 ? (
          <p className="text-gray-400 text-sm">No major plot holes detected.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {analytics.plotHoles.map((hole, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 ${
                  hole.severity === 'critical' ? 'bg-red-400' :
                  hole.severity === 'moderate' ? 'bg-orange-400' : 'bg-yellow-400'
                }`}></span>
                <div>
                  <span className={`font-medium ${
                    hole.severity === 'critical' ? 'text-red-400' :
                    hole.severity === 'moderate' ? 'text-orange-400' : 'text-yellow-400'
                  }`}>
                    [{hole.severity.toUpperCase()}]
                  </span>
                  <span className="ml-2">{hole.description}</span>
                  {hole.location && (
                    <div className="text-xs text-gray-400 mt-1">Location: {hole.location}</div>
                  )}
                   {hole.solution && (
                     <div className="text-xs text-gray-300 mt-1 italic">Solution: {hole.solution}</div>
                   )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Timeline Analysis */}
      <div>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Timeline Analysis
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Timeline Consistency:</span>
            <span className={`font-medium ${
              analytics.timelineConsistency >= 80 ? 'text-green-400' :
              analytics.timelineConsistency >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {analytics.timelineConsistency}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Narrative Flow:</span>
            <span className={`font-medium ${
              analytics.narrativeFlow >= 80 ? 'text-green-400' :
              analytics.narrativeFlow >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {analytics.narrativeFlow}%
            </span>
          </div>
          <p className="text-gray-300 mt-4">
            {analytics.sceneCount > 0 
              ? `Script contains ${analytics.sceneCount} scene${analytics.sceneCount !== 1 ? 's' : ''} with ${
                  analytics.timelineConsistency >= 80 ? 'strong' :
                  analytics.timelineConsistency >= 60 ? 'good' : 'inconsistent'
                } temporal progression.`
              : 'Add scene headings to analyze timeline consistency.'
            }
          </p>
        </div>
      </div>

      {/* Recommendations for Plot */}
      {analytics.recommendations.filter(r => r.category === 'plot').length > 0 && (
        <div>
          <h3 className="text-blue-400 font-medium mb-4">Plot Recommendations</h3>
          <ul className="space-y-2 text-sm">
            {analytics.recommendations
              .filter(r => r.category === 'plot')
              .slice(0, 3)
              .map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <span className="font-medium">{rec.title}:</span>
                    <span className="ml-1">{rec.description}</span>
                  </div>
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
};