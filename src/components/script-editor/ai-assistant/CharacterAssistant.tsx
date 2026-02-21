import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { generateDeepseekContent } from '@/services/deepseek-ai-service';

interface Character {
  id: string;
  name: string;
  description: string;
  background: string;
  traits: string[];
  goals: string[];
  conflicts: string[];
}

interface CharacterAssistantProps {
  scriptId: string;
  elements: any[];
  onApplySuggestion: (elementId: string, content: string) => void;
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
}

export const CharacterAssistant: React.FC<CharacterAssistantProps> = ({
  scriptId,
  elements,
  onApplySuggestion,
  isGenerating,
  onGenerate
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [characterPrompt, setCharacterPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateCharacter = async () => {
    if (!newCharacterName.trim()) return;
    setLoading(true);

    const prompt = `Create a deeply detailed and culturally authentic Nigerian character named "${newCharacterName}". Background: ${characterPrompt}`;
    const { content, success } = await generateDeepseekContent({
      prompt,
      feature: 'character',
      maxTokens: 300,
      temperature: 0.7
    });

    setLoading(false);
    if (success && content) {
      // Let Deepseek return a markdown/json-like breakdown
      // Parse out known fields: name, description, background, traits, goals, conflicts
      // Use a loose parse for now
      const newCharacter: Character = (() => {
        try {
          // Try to parse as JSON if possible
          if (content.startsWith('{')) {
            return JSON.parse(content);
          }
          // Otherwise do a simple parse
          const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
          const getField = (label: string) => {
            const line = lines.find(l => l.toLowerCase().startsWith(label));
            return line ? line.split(':').slice(1).join(':').trim() : '';
          };
          return {
            id: Date.now().toString(),
            name: getField('name') || newCharacterName,
            description: getField('description'),
            background: getField('background'),
            traits: (getField('traits') || '').split(',').map(s => s.trim()).filter(Boolean),
            goals: (getField('goals') || '').split(',').map(s => s.trim()).filter(Boolean),
            conflicts: (getField('conflicts') || '').split(',').map(s => s.trim()).filter(Boolean)
          };
        } catch {
          return {
            id: Date.now().toString(),
            name: newCharacterName,
            description: content,
            background: '',
            traits: [],
            goals: [],
            conflicts: []
          };
        }
      })();

      setCharacters(prev => [newCharacter, ...prev]);
      setNewCharacterName('');
      setCharacterPrompt('');
    }
  };

  const handleEnhanceCharacter = async (character: Character) => {
    setLoading(true);
    const { content, success } = await generateDeepseekContent({
      prompt: `Enhance and deepen this character's Nigerian authenticity:\nName: ${character.name}\nDescription: ${character.description}\nBackground: ${character.background}\nTraits: ${character.traits.join(', ')}\nGoals: ${character.goals.join(', ')}\nConflicts: ${character.conflicts.join(', ')}`,
      feature: 'character',
      maxTokens: 250,
      temperature: 0.7
    });
    setLoading(false);
    if (success && content) {
      const enhanced: Character = {
        ...character,
        description: content
      };
      setCharacters(prev =>
        prev.map(c => (c.id === character.id ? enhanced : c))
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Character Development Assistant
          {loading && <RefreshCw className="h-5 w-5 text-primary animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Character Creation */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Character
            </h4>
            <div className="space-y-3">
              <Input
                placeholder="Character name..."
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
              />
              <Textarea
                placeholder="Describe the character's role, background, or any specific traits..."
                value={characterPrompt}
                onChange={(e) => setCharacterPrompt(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleGenerateCharacter}
                disabled={loading || !newCharacterName.trim()}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate Character"}
              </Button>
            </div>
          </div>

          {/* Existing Characters */}
          <div>
            <h4 className="font-medium mb-3">Current Characters</h4>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {characters.map((character) => (
                  <div key={character.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{character.name}</h5>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnhanceCharacter(character)}
                        disabled={loading}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Enhance
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{character.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">{character.background}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium">Traits:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {character.traits.map((trait, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium">Goals:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {character.goals.map((goal, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium">Conflicts:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {character.conflicts.map((conflict, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {conflict}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
