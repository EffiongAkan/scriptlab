
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Plus, Star, DollarSign } from 'lucide-react';

interface LocationScoutingManagerProps {
  scriptId: string;
  elements?: any[];
}

export const LocationScoutingManager: React.FC<LocationScoutingManagerProps> = ({
  scriptId,
  elements = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Extract locations from script headings
  const locations = elements
    .filter(el => el.type === 'heading')
    .map(el => {
      const match = el.content.match(/(?:INT\.|EXT\.)\s+(.+?)\s+-/);
      return match ? match[1] : null;
    })
    .filter(Boolean)
    .filter((location, index, arr) => arr.indexOf(location) === index);

  const mockLocations = [
    { 
      id: 1, 
      name: 'Modern Office Building', 
      type: 'Interior', 
      cost: '$500/day', 
      rating: 4.7,
      description: 'Contemporary office space with floor-to-ceiling windows'
    },
    { 
      id: 2, 
      name: 'Downtown Coffee Shop', 
      type: 'Interior', 
      cost: '$300/day', 
      rating: 4.5,
      description: 'Cozy cafe with vintage decor and natural lighting'
    },
    { 
      id: 3, 
      name: 'City Park', 
      type: 'Exterior', 
      cost: '$200/day', 
      rating: 4.8,
      description: 'Beautiful park with trees, benches, and walking paths'
    },
    { 
      id: 4, 
      name: 'Warehouse District', 
      type: 'Exterior', 
      cost: '$400/day', 
      rating: 4.6,
      description: 'Industrial area perfect for urban scenes'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Scouting Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search locations by name, type, or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>

          {locations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Locations in Script:</h4>
              <div className="flex flex-wrap gap-2">
                {locations.map((location, index) => (
                  <Badge
                    key={index}
                    variant={selectedLocation === location ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedLocation(selectedLocation === location ? null : location)}
                  >
                    {location}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <h4 className="font-medium">Available Locations:</h4>
            {mockLocations.map((location) => (
              <Card key={location.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium">{location.name}</h5>
                    <p className="text-sm text-muted-foreground mb-2">{location.description}</p>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{location.type}</Badge>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{location.cost}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{location.rating}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm">Book</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
