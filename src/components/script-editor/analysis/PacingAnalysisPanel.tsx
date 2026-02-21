import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { EnhancedScriptAnalytics } from '@/hooks/useEnhancedScriptAnalytics';

interface PacingAnalysisPanelProps {
  analytics: EnhancedScriptAnalytics;
}

export const PacingAnalysisPanel: React.FC<PacingAnalysisPanelProps> = ({ analytics }) => {
  const slowIssues = analytics.pacingIssues.filter(issue => issue.type === 'slow');
  const rushedIssues = analytics.pacingIssues.filter(issue => issue.type === 'rushed');
  const unevenIssues = analytics.pacingIssues.filter(issue => issue.type === 'uneven');

  return (
    <div className="space-y-6 text-white">
      {/* Overall Pacing */}
      <div>
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Overall Pacing:</span> 
          {analytics.sceneBalance >= 80 ? ' Well-balanced with consistent scene flow.' :
           analytics.sceneBalance >= 60 ? ' Generally good with some minor variations.' :
           ' Needs better balance between scenes.'}
        </p>
        <div className="mt-2 text-xs text-gray-400">
          Scene Balance Score: {Math.round(analytics.sceneBalance)}% | 
          Dialogue/Action Ratio: {analytics.dialogueActionRatio.toFixed(1)}
        </div>
      </div>

      {/* Pacing Issues Analysis */}
      <div className="grid grid-cols-2 gap-8">
        {/* Issues */}
        <div>
          <h3 className="text-orange-400 font-medium mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Pacing Issues ({analytics.pacingIssues.length})
          </h3>
          {analytics.pacingIssues.length === 0 ? (
            <p className="text-gray-400 text-sm">No significant pacing issues detected.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {analytics.pacingIssues.slice(0, 4).map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 ${
                    issue.type === 'slow' ? 'bg-red-400' :
                    issue.type === 'rushed' ? 'bg-orange-400' : 'bg-yellow-400'
                  }`}></span>
                  <div>
                    <div className="font-medium text-xs uppercase text-gray-300 mb-1">
                      {issue.type} - {issue.scene}
                    </div>
                    <div>{issue.description}</div>
                    {issue.suggestion && (
                      <div className="text-xs text-gray-400 mt-1 italic">{issue.suggestion}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Strengths */}
        <div>
          <h3 className="text-green-400 font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Pacing Strengths
          </h3>
          <ul className="space-y-3 text-sm">
            {analytics.sceneBalance >= 80 && (
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Excellent scene balance and consistency</span>
              </li>
            )}
            {analytics.dialogueActionRatio >= 0.5 && analytics.dialogueActionRatio <= 2 && (
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Good balance between dialogue and action</span>
              </li>
            )}
            {analytics.pacingIssues.length === 0 && (
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>No major pacing issues identified</span>
              </li>
            )}
            {analytics.sceneCount >= 3 && (
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Good scene structure and progression</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Scene Statistics */}
      <div className="border-t border-slate-600 pt-4">
        <h4 className="font-medium mb-2">Scene Statistics</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Total Scenes:</span>
            <span className="text-white">{analytics.sceneCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Avg Length:</span>
            <span className="text-white">{Math.round(analytics.totalElements / Math.max(analytics.sceneCount, 1))} elements</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Balance Score:</span>
            <span className={`${
              analytics.sceneBalance >= 80 ? 'text-green-400' :
              analytics.sceneBalance >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>{Math.round(analytics.sceneBalance)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};