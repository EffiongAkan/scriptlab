
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, Star } from 'lucide-react';

interface CastingDatabaseManagerProps {
  scriptId: string;
  elements?: any[];
}

export const CastingDatabaseManager: React.FC<CastingDatabaseManagerProps> = ({
  scriptId,
  elements = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Extract character names from script elements
  const characters = elements
    .filter(el => el.type === 'character')
    .map(el => el.content)
    .filter((content, index, arr) => arr.indexOf(content) === index);

  const mockActors = [
    { id: 1, name: 'Sarah Johnson', age: 28, experience: 'Lead roles in 5+ films', rating: 4.8 },
    { id: 2, name: 'Michael Chen', age: 35, experience: 'Theater and film veteran', rating: 4.9 },
    { id: 3, name: 'Emily Davis', age: 24, experience: 'Rising star, 3 indie films', rating: 4.6 },
    { id: 4, name: 'David Wilson', age: 42, experience: 'Character actor, 20+ years', rating: 4.7 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Casting Database Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search actors by name, age, or experience..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Actor
            </Button>
          </div>

          {characters.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Characters in Script:</h4>
              <div className="flex flex-wrap gap-2">
                {characters.map((character, index) => (
                  <Badge
                    key={index}
                    variant={selectedRole === character ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedRole(selectedRole === character ? null : character)}
                  >
                    {character}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <h4 className="font-medium">Available Actors:</h4>
            {mockActors.map((actor) => (
              <Card key={actor.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{actor.name}</h5>
                    <p className="text-sm text-muted-foreground">Age: {actor.age}</p>
                    <p className="text-sm text-muted-foreground">{actor.experience}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{actor.rating}</span>
                    </div>
                    <Button size="sm">Contact</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
