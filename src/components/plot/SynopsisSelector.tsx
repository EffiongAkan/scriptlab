
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Wifi, WifiOff, Bug, Zap, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePlotContent, checkUserCredits, PlotAIRequest } from "@/services/plot-ai-service";
import { Genre, SubGenre, Language } from "@/types";

interface SynopsisOption {
  id: string;
  title: string;
  content: string;
  tone: string;
  setting: string;
}

interface SynopsisSelectorProps {
  genre: Genre;
  language: Language;
  seedPlot: string;
  onSynopsisSelect: (synopsis: SynopsisOption) => void;
  selectedSynopsis?: SynopsisOption;
}

export const SynopsisSelector: React.FC<SynopsisSelectorProps> = ({
  genre,
  language,
  seedPlot,
  onSynopsisSelect,
  selectedSynopsis
}) => {
  const [synopsisOptions, setSynopsisOptions] = useState<SynopsisOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [errorState, setErrorState] = useState<{
    type: 'credits' | 'network' | 'auth' | 'service' | null;
    message: string;
  }>({ type: null, message: '' });
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  // Check user credits on component mount
  useEffect(() => {
    checkCredits();
  }, []);

  // Generate synopsis options when props change
  useEffect(() => {
    if (genre && seedPlot) {
      generateSynopsisOptions();
    }
  }, [genre, language, seedPlot]);

  const checkCredits = async () => {
    const { credits, error } = await checkUserCredits();
    setUserCredits(credits);
    
    if (error) {
      console.error('Error checking credits:', error);
    }
  };

  const generateSynopsisOptions = async () => {
    console.log("🚀 Starting synopsis generation...", { genre, language, seedPlot: seedPlot.substring(0, 50) + "..." });
    
    // Credit check removed - proceed without restrictions
    await checkCredits();
    
    setIsGenerating(true);
    setErrorState({ type: null, message: '' });
    setDebugInfo("");
    
    try {
      const options: SynopsisOption[] = [];
      
      // Generate 3 different synopsis options with different tones
      const scenarios = [
        { tone: "Dramatic", setting: "Urban Lagos", description: "Create a dramatic and emotionally intense story" },
        { tone: "Light-hearted", setting: "Rural Village", description: "Create a light-hearted and uplifting story" },
        { tone: "Suspenseful", setting: "Modern Abuja", description: "Create a suspenseful and thrilling story" }
      ];

      for (let i = 0; i < scenarios.length; i++) {
        const { tone, setting, description } = scenarios[i];
        
        console.log(`📝 Generating ${tone} synopsis (${i + 1}/3)...`);
        
        // Create a focused prompt for synopsis generation
        const synopsisPrompt = `${description} in the ${genre} genre set in ${setting}. 

Story concept: ${seedPlot}

Create a comprehensive synopsis (3-4 paragraphs) that includes:
- Main characters and their motivations
- Central conflict and how it develops
- Setting details and cultural atmosphere
- Key themes and emotional journey
- How the story resolves

Make it engaging and culturally authentic for Nigerian audiences.`;

        const request: PlotAIRequest = {
          promptType: 'plot',
          genre: genre,
          language: language,
          seedPlot: synopsisPrompt,
          culturalAuthenticity: 80,
          includeTraditional: false,
          setting: { region: setting }
        };

        try {
          console.log(`📤 Sending request for ${tone} synopsis...`);
          const response = await generatePlotContent(request);
          
          console.log(`📥 Response for ${tone}:`, { 
            success: response.success, 
            hasContent: !!response.content,
            errorType: response.errorType,
            credits: response.credits
          });
          
          if (response.success && response.content) {
            options.push({
              id: `synopsis-${tone.toLowerCase()}`,
              title: `${tone} ${genre} Story`,
              content: response.content.trim(),
              tone: tone,
              setting: setting
            });
            console.log(`✅ Successfully generated ${tone} synopsis`);
            
            // Update credits if provided
            if (response.credits !== undefined) {
              setUserCredits(response.credits);
            }
          } else {
            console.error(`❌ Failed to generate ${tone} synopsis:`, response.error);
            setDebugInfo(`Failed on ${tone}: ${response.error?.substring(0, 100) || 'Unknown error'}`);
            
            // Handle different error types
            if (response.errorType === 'credits') {
              setErrorState({
                type: 'credits',
                message: response.error || 'You have run out of AI credits.'
              });
              setUserCredits(response.credits || 0);
              break;
            } else if (response.errorType === 'auth') {
              setErrorState({
                type: 'auth',
                message: response.error || 'Authentication failed. Please sign in again.'
              });
              break;
            } else if (response.errorType === 'service') {
              setErrorState({
                type: 'service',
                message: response.error || 'AI service is temporarily unavailable.'
              });
              break;
            } else {
              setErrorState({
                type: 'service',
                message: response.error || 'Network connection issue detected.'
              });
              break;
            }
          }
        } catch (requestError) {
          console.error(`❌ Request error for ${tone}:`, requestError);
          setDebugInfo(`Request error on ${tone}: ${requestError.message}`);
          setErrorState({
            type: 'network',
            message: 'Failed to connect to AI service. Please check your connection.'
          });
          break;
        }
        
        // Small delay between requests to avoid overwhelming the service
        if (i < scenarios.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setSynopsisOptions(options);
      
      if (options.length === 0 && !errorState.type) {
        setDebugInfo("No options generated successfully");
        setErrorState({
          type: 'service',
          message: 'Unable to generate synopsis options at this time. Please try again.'
        });
      } else if (options.length > 0) {
        console.log(`🎉 Successfully generated ${options.length} synopsis options`);
        toast({
          title: "Synopsis Options Ready",
          description: `Successfully generated ${options.length} synopsis option${options.length > 1 ? 's' : ''}.`,
        });
      }
    } catch (error) {
      console.error("💥 Unexpected error in synopsis generation:", error);
      setDebugInfo(`Unexpected error: ${error.message}`);
      setErrorState({
        type: 'service',
        message: 'Something went wrong while generating synopsis options. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    console.log("🔄 Regenerating synopsis options...");
    setRetryCount(prev => prev + 1);
    setSynopsisOptions([]);
    setErrorState({ type: null, message: '' });
    generateSynopsisOptions();
  };

  const handleDebugToggle = () => {
    if (debugInfo) {
      toast({
        title: "Debug Information",
        description: debugInfo,
        variant: "default"
      });
    }
  };

  // Render credits insufficient error
  if (errorState.type === 'credits') {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">AI Credits Required</CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            Current balance: {userCredits} credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 mb-4">
            {errorState.message}
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/monetization'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Get More Credits
            </Button>
            <Button 
              variant="outline" 
              onClick={() => checkCredits()}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Balance
            </Button>
            {debugInfo && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDebugToggle}
                className="text-orange-600"
              >
                <Bug className="h-4 w-4 mr-1" />
                Debug
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render authentication error
  if (errorState.type === 'auth') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800">Authentication Required</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            {errorState.message}
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sign In Again
            </Button>
            {debugInfo && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDebugToggle}
                className="text-red-600"
              >
                <Bug className="h-4 w-4 mr-1" />
                Debug Info
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render service/network error
  if (errorState.type === 'service' || errorState.type === 'network') {
    const isNetwork = errorState.type === 'network';
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            {isNetwork ? <WifiOff className="h-5 w-5 text-red-600" /> : <AlertTriangle className="h-5 w-5 text-red-600" />}
            <CardTitle className="text-red-800">
              {isNetwork ? 'Connection Issue' : 'Service Issue'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            {errorState.message}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRegenerate}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {debugInfo && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDebugToggle}
                className="text-red-600"
              >
                <Bug className="h-4 w-4 mr-1" />
                Debug Info
              </Button>
            )}
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-red-600 mt-2">
              Retry attempts: {retryCount}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-naija-green" />
          <h3 className="text-lg font-semibold">Generating Synopsis Options</h3>
          <p className="text-muted-foreground">Creating detailed story concepts for you to choose from...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take 30-60 seconds</p>
          {userCredits > 0 && (
            <p className="text-xs text-green-600 mt-1">Credits available: {userCredits}</p>
          )}
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Pre-generation state
  if (!genre || !seedPlot) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please provide a genre and story concept to generate synopsis options.</p>
      </div>
    );
  }

  // Main synopsis selection interface
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Choose Your Story Direction</h3>
          <p className="text-muted-foreground">Select the synopsis that best matches your vision</p>
        </div>
        <div className="flex gap-2 items-center">
          {userCredits > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              <Zap className="h-3 w-3" />
              {userCredits} credits
            </div>
          )}
          <Button variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          {debugInfo && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDebugToggle}
            >
              <Bug className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {synopsisOptions.map((option) => (
          <Card 
            key={option.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSynopsis?.id === option.id ? 'ring-2 ring-naija-green bg-naija-green/5' : ''
            }`}
            onClick={() => onSynopsisSelect(option)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{option.title}</CardTitle>
                {selectedSynopsis?.id === option.id && (
                  <CheckCircle className="h-5 w-5 text-naija-green" />
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{option.tone}</Badge>
                <Badge variant="outline">{option.setting}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-h-40 overflow-y-auto">
                {option.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {synopsisOptions.length === 0 && !isGenerating && !errorState.type && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No synopsis options available. Try regenerating or check your story concept.</p>
          {debugInfo && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDebugToggle}
              className="mt-2"
            >
              <Bug className="h-4 w-4 mr-1" />
              Show Debug Info
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
