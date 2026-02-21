import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Send, Eye, Clock, CheckCircle, XCircle, Star, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Producer {
  id: string;
  name: string;
  company: string;
  focus: string[];
  rating: number;
  projects: number;
  acceptingSubmissions: boolean;
  responseTime: string;
  budget: string;
}

interface Submission {
  id: string;
  scriptTitle: string;
  producer: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  submittedAt: string;
  feedback?: string;
}

export const ProducerPlatform: React.FC = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const [selectedScript, setSelectedScript] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFocus, setSelectedFocus] = useState('all');
  const { toast } = useToast();

  const producers: Producer[] = [
    {
      id: '1',
      name: 'Kunle Afolayan',
      company: 'Golden Effects Pictures',
      focus: ['Drama', 'Historical', 'Cultural'],
      rating: 4.8,
      projects: 25,
      acceptingSubmissions: true,
      responseTime: '2-3 weeks',
      budget: '$50K - $500K'
    },
    {
      id: '2',
      name: 'Genevieve Nnaji',
      company: 'The Entertainment Network',
      focus: ['Romance', 'Drama', 'Comedy'],
      rating: 4.9,
      projects: 18,
      acceptingSubmissions: true,
      responseTime: '1-2 weeks',
      budget: '$100K - $1M'
    },
    {
      id: '3',
      name: 'Stephanie Okereke',
      company: 'Next Page Productions',
      focus: ['Drama', 'Thriller', 'Social Issues'],
      rating: 4.7,
      projects: 22,
      acceptingSubmissions: false,
      responseTime: '3-4 weeks',
      budget: '$75K - $750K'
    },
    {
      id: '4',
      name: 'Tope Oshin',
      company: 'Aureus Media',
      focus: ['Television', 'Drama', 'Comedy'],
      rating: 4.6,
      projects: 31,
      acceptingSubmissions: true,
      responseTime: '2-3 weeks',
      budget: '$25K - $200K'
    }
  ];

  const mySubmissions: Submission[] = [
    {
      id: '1',
      scriptTitle: 'Lagos Love Story',
      producer: 'Genevieve Nnaji',
      status: 'reviewing',
      submittedAt: '2024-01-15'
    },
    {
      id: '2',
      scriptTitle: 'The Village Chief',
      producer: 'Kunle Afolayan',
      status: 'accepted',
      submittedAt: '2024-01-10',
      feedback: 'Excellent cultural representation and compelling storyline. We would like to discuss this further.'
    },
    {
      id: '3',
      scriptTitle: 'Modern Nigeria',
      producer: 'Tope Oshin',
      status: 'pending',
      submittedAt: '2024-01-20'
    }
  ];

  const userScripts = [
    { id: '1', title: 'Lagos Love Story' },
    { id: '2', title: 'The Village Chief' },
    { id: '3', title: 'Modern Nigeria' },
    { id: '4', title: 'Family Bonds' }
  ];

  const filteredProducers = producers.filter(producer => {
    const matchesSearch = producer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producer.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFocus = selectedFocus === 'all' || producer.focus.includes(selectedFocus);
    
    return matchesSearch && matchesFocus;
  });

  const handleSubmission = async (producerId: string) => {
    if (!selectedScript) {
      toast({
        title: "Please select a script",
        description: "You need to select a script to submit.",
        variant: "destructive"
      });
      return;
    }

    try {
      const userId = await getCurrentUserId();
      const script = userScripts.find(s => s.id === selectedScript);
      if (!script) throw new Error('Script not found');

      const { error } = await (window as any).supabase
        .from('producer_submissions')
        .insert([{
          user_id: userId,
          script_title: script.title,
          producer_id: producerId,
          status: 'pending'
        }]);
      if (error) throw error;
      toast({
        title: "Script Submitted",
        description: "Your script has been submitted successfully! You'll receive updates on its status."
      });
      setSelectedScript('');
    } catch (err) {
      toast({
        title: "Submission Error",
        description: "Failed to record producer submission.",
        variant: "destructive"
      });
    }
  };

  async function getCurrentUserId() {
    if ((window as any).supabase) {
      const { data: { user } } = await (window as any).supabase.auth.getUser();
      return user?.id;
    }
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewing':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'submit' ? 'default' : 'outline'}
          onClick={() => setActiveTab('submit')}
        >
          Submit Script
        </Button>
        <Button
          variant={activeTab === 'submissions' ? 'default' : 'outline'}
          onClick={() => setActiveTab('submissions')}
        >
          My Submissions
        </Button>
      </div>

      {/* Submit Script Tab */}
      {activeTab === 'submit' && (
        <div className="space-y-6">
          {/* Script Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Script to Submit</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedScript} onValueChange={setSelectedScript}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a script from your library" />
                </SelectTrigger>
                <SelectContent>
                  {userScripts.map(script => (
                    <SelectItem key={script.id} value={script.id}>
                      {script.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search producers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedFocus} onValueChange={setSelectedFocus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Genre Focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="Drama">Drama</SelectItem>
                    <SelectItem value="Comedy">Comedy</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Thriller">Thriller</SelectItem>
                    <SelectItem value="Historical">Historical</SelectItem>
                    <SelectItem value="Television">Television</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Producers List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProducers.map((producer) => (
              <Card key={producer.id} className={`${!producer.acceptingSubmissions ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{producer.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{producer.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{producer.rating}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{producer.projects} projects</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Focus Areas:</div>
                    <div className="flex flex-wrap gap-1">
                      {producer.focus.map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Response Time</div>
                      <div className="text-muted-foreground">{producer.responseTime}</div>
                    </div>
                    <div>
                      <div className="font-medium">Budget Range</div>
                      <div className="text-muted-foreground">{producer.budget}</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    disabled={!producer.acceptingSubmissions || !selectedScript}
                    onClick={() => handleSubmission(producer.id)}
                  >
                    {producer.acceptingSubmissions ? (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Script
                      </>
                    ) : (
                      'Not Accepting Submissions'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Script Submissions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track the status of your submitted scripts
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mySubmissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{submission.scriptTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            Submitted to {submission.producer} on {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(submission.status)}
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      {submission.feedback && (
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium text-sm mb-1">Producer Feedback:</div>
                          <p className="text-sm">{submission.feedback}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
