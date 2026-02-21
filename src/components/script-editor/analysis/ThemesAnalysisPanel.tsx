import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Sparkles } from 'lucide-react';
import { EnhancedScriptAnalytics } from '@/hooks/useEnhancedScriptAnalytics';

interface ThemesAnalysisPanelProps {
  analytics: EnhancedScriptAnalytics;
}

export const ThemesAnalysisPanel: React.FC<ThemesAnalysisPanelProps> = ({ analytics }) => {
  const primaryThemes = analytics.themes.filter(theme => theme.strength === 'primary');
  const secondaryThemes = analytics.themes.filter(theme => theme.strength === 'secondary');
  const subtleThemes = analytics.themes.filter(theme => theme.strength === 'subtle');

  return (
    <div className="space-y-6 text-white">
      {/* Theme Development */}
      <div>
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Theme Development:</span> 
          {analytics.themes.length === 0 
            ? ' No clear themes identified yet. Consider developing thematic elements.'
            : ` ${analytics.themes.length} theme${analytics.themes.length !== 1 ? 's' : ''} identified with ${Math.round(analytics.thematicDevelopment)}% development strength.`}
        </p>
      </div>

      {analytics.themes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Add dialogue and action to develop thematic elements in your script.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          {/* Primary Themes */}
          <div>
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Primary Themes ({primaryThemes.length})
            </h3>
            {primaryThemes.length === 0 ? (
              <p className="text-gray-400 text-sm">No primary themes identified yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {primaryThemes.map((theme, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">{theme.name}</span>
                      <div className="text-xs text-gray-400 mt-1">
                        Development: {theme.development}%
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Secondary Themes */}
          <div>
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Secondary Themes ({secondaryThemes.length})
            </h3>
            {secondaryThemes.length === 0 ? (
              <p className="text-gray-400 text-sm">No secondary themes identified yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {secondaryThemes.map((theme, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <div>
                      <span className="font-medium">{theme.name}</span>
                      <div className="text-xs text-gray-400 mt-1">
                        Development: {theme.development}%
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Subtle Themes */}
      {subtleThemes.length > 0 && (
        <div className="border-t border-slate-600 pt-4">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Subtle Themes ({subtleThemes.length})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {subtleThemes.map((theme, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                <span className="text-gray-300">{theme.name}</span>
                <span className="text-xs text-gray-500">({theme.development}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Development Score */}
      {analytics.themes.length > 0 && (
        <div className="border-t border-slate-600 pt-4">
          <h4 className="font-medium mb-2">Overall Theme Development</h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Development Score:</span>
            <span className={`font-medium ${
              analytics.thematicDevelopment >= 70 ? 'text-green-400' :
              analytics.thematicDevelopment >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {Math.round(analytics.thematicDevelopment)}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {analytics.thematicDevelopment >= 70 ? 'Themes are well-developed and integrated throughout the script.' :
             analytics.thematicDevelopment >= 50 ? 'Themes are present but could be developed more deeply.' :
             'Consider strengthening thematic elements throughout your script.'}
          </p>
        </div>
      )}
    </div>
  );
};