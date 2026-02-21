import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Users } from 'lucide-react';
import { EnhancedScriptAnalytics } from '@/hooks/useEnhancedScriptAnalytics';

interface CulturalElementsPanelProps {
  analytics: EnhancedScriptAnalytics;
}

export const CulturalElementsPanel: React.FC<CulturalElementsPanelProps> = ({ analytics }) => {
  const languageElements = analytics.culturalElements.filter(el => el.type === 'language');
  const traditionElements = analytics.culturalElements.filter(el => el.type === 'tradition');
  const socialElements = analytics.culturalElements.filter(el => el.type === 'social');
  const religiousElements = analytics.culturalElements.filter(el => el.type === 'religious');

  return (
    <div className="space-y-6 text-white">
      {/* Cultural Authenticity Assessment */}
      <div>
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Cultural Authenticity:</span> 
          {analytics.culturalAuthenticity >= 80 ? ' Excellent cultural representation with authentic elements.' :
           analytics.culturalAuthenticity >= 60 ? ' Good cultural foundation with some authentic elements.' :
           analytics.culturalAuthenticity >= 40 ? ' Some cultural elements present but could be enhanced.' :
           ' Consider adding more cultural context and authenticity.'}
        </p>
        <div className="mt-2 text-xs text-gray-400">
          Authenticity Score: {analytics.culturalAuthenticity}% | Elements Found: {analytics.culturalElements.length}
        </div>
      </div>

      {analytics.culturalElements.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Add dialogue and action with cultural context to see cultural analysis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Language Elements */}
          {languageElements.length > 0 && (
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 mt-1 text-purple-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-400 mb-2">Language Usage ({languageElements.length})</h4>
                {languageElements.map((element, index) => (
                  <div key={index} className="text-sm mb-2">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      element.accuracy === 'authentic' ? 'bg-green-400' :
                      element.accuracy === 'questionable' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></span>
                    {element.description}
                    {element.suggestion && (
                      <div className="text-xs text-gray-400 mt-1 ml-4 italic">{element.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traditional Elements */}
          {traditionElements.length > 0 && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-1 text-blue-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Traditional Elements ({traditionElements.length})</h4>
                {traditionElements.map((element, index) => (
                  <div key={index} className="text-sm mb-2">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      element.accuracy === 'authentic' ? 'bg-green-400' :
                      element.accuracy === 'questionable' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></span>
                    {element.description}
                    {element.suggestion && (
                      <div className="text-xs text-gray-400 mt-1 ml-4 italic">{element.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Elements */}
          {socialElements.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-1 text-green-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-400 mb-2">Social Dynamics ({socialElements.length})</h4>
                {socialElements.map((element, index) => (
                  <div key={index} className="text-sm mb-2">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      element.accuracy === 'authentic' ? 'bg-green-400' :
                      element.accuracy === 'questionable' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></span>
                    {element.description}
                    {element.suggestion && (
                      <div className="text-xs text-gray-400 mt-1 ml-4 italic">{element.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Religious Elements */}
          {religiousElements.length > 0 && (
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 mt-1 text-yellow-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-400 mb-2">Religious Context ({religiousElements.length})</h4>
                {religiousElements.map((element, index) => (
                  <div key={index} className="text-sm mb-2">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      element.accuracy === 'authentic' ? 'bg-green-400' :
                      element.accuracy === 'questionable' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></span>
                    {element.description}
                    {element.suggestion && (
                      <div className="text-xs text-gray-400 mt-1 ml-4 italic">{element.suggestion}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhancement Suggestions */}
          <div className="border-t border-slate-600 pt-4">
            <h4 className="font-medium mb-2">Enhancement Suggestions</h4>
            <div className="text-sm text-gray-300">
              {analytics.culturalAuthenticity < 60 && (
                <p className="mb-2">• Consider adding more Nigerian expressions, proverbs, or cultural references</p>
              )}
              {languageElements.length === 0 && (
                <p className="mb-2">• Include authentic Nigerian dialogue patterns and code-switching</p>
              )}
              {traditionElements.length === 0 && (
                <p className="mb-2">• Reference traditional customs, ceremonies, or cultural practices</p>
              )}
              {socialElements.length === 0 && (
                <p className="mb-2">• Show authentic social dynamics and family structures</p>
              )}
              {analytics.culturalElements.length < 3 && (
                <p className="mb-2">• Add more cultural depth to enhance authenticity</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};