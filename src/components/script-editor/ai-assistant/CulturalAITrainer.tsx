
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrainingDataset {
  id: string;
  name: string;
  type: 'nollywood' | 'yoruba' | 'igbo' | 'hausa' | 'pidgin';
  size: number;
  status: 'ready' | 'training' | 'completed' | 'failed';
  accuracy: number;
}

interface CulturalAITrainerProps {
  scriptId: string;
  onModelTrained: (modelId: string) => void;
}

export const CulturalAITrainer: React.FC<CulturalAITrainerProps> = ({
  scriptId,
  onModelTrained
}) => {
  const [selectedDataset, setSelectedDataset] = useState('nollywood');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [customScript, setCustomScript] = useState('');
  const { toast } = useToast();

  const datasets: TrainingDataset[] = [
    {
      id: 'nollywood-classic',
      name: 'Classic Nollywood Scripts',
      type: 'nollywood',
      size: 150,
      status: 'completed',
      accuracy: 92
    },
    {
      id: 'yoruba-cinema',
      name: 'Yoruba Cinema Collection',
      type: 'yoruba',
      size: 85,
      status: 'completed',
      accuracy: 88
    },
    {
      id: 'igbo-stories',
      name: 'Igbo Traditional Stories',
      type: 'igbo',
      size: 65,
      status: 'ready',
      accuracy: 0
    },
    {
      id: 'hausa-films',
      name: 'Hausa Film Scripts',
      type: 'hausa',
      size: 45,
      status: 'training',
      accuracy: 75
    },
    {
      id: 'pidgin-dialogue',
      name: 'Nigerian Pidgin Dialogue',
      type: 'pidgin',
      size: 120,
      status: 'completed',
      accuracy: 94
    }
  ];

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          toast({
            title: "Training Complete",
            description: "AI model has been successfully trained on cultural data."
          });
          onModelTrained(`cultural-${selectedDataset}-${Date.now()}`);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  };

  const handleUploadScript = () => {
    if (!customScript.trim()) {
      toast({
        title: "No Script Content",
        description: "Please add script content to upload.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Script Uploaded",
      description: "Your script has been added to the training dataset."
    });
    setCustomScript('');
  };

  const getStatusColor = (status: TrainingDataset['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: TrainingDataset['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'failed': return <AlertCircle className="h-3 w-3" />;
      default: return <Brain className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Cultural AI Training
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Training Datasets */}
          <div>
            <h4 className="font-medium mb-3">Available Training Datasets</h4>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-sm">{dataset.name}</h5>
                        <p className="text-xs text-muted-foreground">
                          {dataset.size} scripts • {dataset.type} culture
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(dataset.status)} flex items-center gap-1`}>
                          {getStatusIcon(dataset.status)}
                          {dataset.status}
                        </Badge>
                        {dataset.accuracy > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {dataset.accuracy}% accuracy
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {dataset.status === 'training' && (
                      <Progress value={65} className="h-1" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Training Controls */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Train New Model</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Select Dataset</label>
                <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nollywood">Nollywood Scripts</SelectItem>
                    <SelectItem value="yoruba">Yoruba Cinema</SelectItem>
                    <SelectItem value="igbo">Igbo Stories</SelectItem>
                    <SelectItem value="hausa">Hausa Films</SelectItem>
                    <SelectItem value="pidgin">Pidgin Dialogue</SelectItem>
                    <SelectItem value="mixed">Mixed Cultural Dataset</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isTraining && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Training Progress</span>
                    <span className="text-sm text-muted-foreground">{Math.round(trainingProgress)}%</span>
                  </div>
                  <Progress value={trainingProgress} />
                </div>
              )}

              <Button
                onClick={handleStartTraining}
                disabled={isTraining}
                className="w-full"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isTraining ? 'Training in Progress...' : 'Start Cultural Training'}
              </Button>
            </div>
          </div>

          {/* Custom Script Upload */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Add Custom Training Data</h4>
            <div className="space-y-3">
              <Textarea
                placeholder="Paste your Nollywood script or dialogue here to improve AI training..."
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                onClick={handleUploadScript}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add to Training Dataset
              </Button>
            </div>
          </div>

          {/* Download Trained Models */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Export Trained Models</h4>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Cultural Models
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
