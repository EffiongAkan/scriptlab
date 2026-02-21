
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Users, MapPin } from 'lucide-react';

interface ProductionSchedulerProps {
  scriptId: string;
  elements?: any[];
}

export const ProductionScheduler: React.FC<ProductionSchedulerProps> = ({
  scriptId,
  elements = []
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Extract scenes from script elements
  const scenes = elements
    .filter(el => el.type === 'heading')
    .map((el, index) => ({
      id: index + 1,
      title: el.content,
      location: el.content.includes('INT.') ? 'Interior' : 'Exterior',
      estimatedTime: Math.floor(Math.random() * 4) + 2, // 2-6 hours
      complexity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    }));

  const mockSchedule = [
    {
      day: 1,
      date: '2024-03-15',
      scenes: scenes.slice(0, 2),
      crew: 8,
      equipment: 'Basic Camera Setup'
    },
    {
      day: 2,
      date: '2024-03-16',
      scenes: scenes.slice(2, 4),
      crew: 12,
      equipment: 'Full Production Setup'
    },
    {
      day: 3,
      date: '2024-03-17',
      scenes: scenes.slice(4, 6),
      crew: 10,
      equipment: 'Location Equipment'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Production Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Production Timeline</h3>
              <p className="text-sm text-muted-foreground">
                Estimated {mockSchedule.length} shooting days for {scenes.length} scenes
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Shooting Day
            </Button>
          </div>

          <div className="grid gap-4">
            {mockSchedule.map((day) => (
              <Card key={day.day} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Day {day.day}</h4>
                    <p className="text-sm text-muted-foreground">{day.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{day.crew} crew</span>
                    </div>
                    <Badge variant="outline">{day.equipment}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Scheduled Scenes:</h5>
                  {day.scenes.map((scene) => (
                    <div key={scene.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{scene.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Scene {scene.id}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{scene.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{scene.estimatedTime}h</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={scene.complexity === 'High' ? 'destructive' : 
                               scene.complexity === 'Medium' ? 'default' : 'secondary'}
                      >
                        {scene.complexity}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <Button size="sm" variant="outline">
                    Edit Schedule
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-blue-50">
            <h4 className="font-medium mb-2">Production Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Scenes:</span>
                <p className="font-medium">{scenes.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Shooting Days:</span>
                <p className="font-medium">{mockSchedule.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Est. Total Hours:</span>
                <p className="font-medium">
                  {scenes.reduce((total, scene) => total + scene.estimatedTime, 0)}h
                </p>
              </div>
              <div>
                <span className="text-gray-600">Avg. Crew Size:</span>
                <p className="font-medium">
                  {Math.round(mockSchedule.reduce((total, day) => total + day.crew, 0) / mockSchedule.length)}
                </p>
              </div>
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
