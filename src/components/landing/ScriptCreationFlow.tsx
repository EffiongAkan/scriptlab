
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { PenTool, Bot, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Genre, Language } from "@/types";

export const ScriptCreationFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSynopsisDialog, setShowSynopsisDialog] = useState(false);
  const [synopsis, setSynopsis] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<Genre>();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleWriteScript = () => {
    // Navigate directly to script editor with a new script
    navigate("/editor/new");
  };

  const handleGenerateWithAI = () => {
    setShowSynopsisDialog(true);
  };

  const handleSynopsisSubmit = async () => {
    if (!synopsis.trim() || !scriptTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and synopsis",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Store the synopsis and metadata for script generation
      const scriptData = {
        title: scriptTitle,
        synopsis: synopsis,
        genre: selectedGenre,
        language: selectedLanguage,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('pendingScriptGeneration', JSON.stringify(scriptData));
      
      // Navigate to plot generator with the synopsis data
      navigate("/plot", { state: { 
        fromSynopsis: true, 
        synopsis: synopsis,
        title: scriptTitle,
        genre: selectedGenre,
        language: selectedLanguage
      }});
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process synopsis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setShowSynopsisDialog(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Start Your Script Journey
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Choose how you'd like to create your screenplay
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Write Script Option */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-naija-green/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-naija-green/20 transition-colors">
              <PenTool className="h-8 w-8 text-naija-green" />
            </div>
            <CardTitle className="text-xl">Write Script</CardTitle>
            <CardDescription>
              Start writing your screenplay from scratch with our powerful editor
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleWriteScript}
              className="w-full bg-naija-green hover:bg-naija-green/90 text-white"
              size="lg"
            >
              <FileText className="mr-2 h-5 w-5" />
              Start Writing
            </Button>
          </CardContent>
        </Card>

        {/* Generate with AI Option */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-naija-gold/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-naija-gold/20 transition-colors">
              <Bot className="h-8 w-8 text-naija-gold" />
            </div>
            <CardTitle className="text-xl">Generate Script with AI</CardTitle>
            <CardDescription>
              Let AI help you create a full script from your story concept
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Dialog open={showSynopsisDialog} onOpenChange={setShowSynopsisDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleGenerateWithAI}
                  className="w-full bg-naija-gold hover:bg-naija-gold/90 text-black"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate with AI
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Script from Synopsis</DialogTitle>
                  <DialogDescription>
                    Provide your story details and let AI generate a full screenplay
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Script Title</Label>
                    <Input
                      id="title"
                      value={scriptTitle}
                      onChange={(e) => setScriptTitle(e.target.value)}
                      placeholder="Enter your script title..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="genre">Genre</Label>
                      <Select value={selectedGenre} onValueChange={(value) => setSelectedGenre(value as Genre)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Genre.DRAMA}>Drama</SelectItem>
                          <SelectItem value={Genre.COMEDY}>Comedy</SelectItem>
                          <SelectItem value={Genre.ACTION}>Action</SelectItem>
                          <SelectItem value={Genre.THRILLER}>Thriller</SelectItem>
                          <SelectItem value={Genre.ROMANCE}>Romance</SelectItem>
                          <SelectItem value={Genre.HORROR}>Horror</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as Language)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Language.ENGLISH}>English</SelectItem>
                          <SelectItem value={Language.YORUBA}>Yoruba</SelectItem>
                          <SelectItem value={Language.IGBO}>Igbo</SelectItem>
                          <SelectItem value={Language.HAUSA}>Hausa</SelectItem>
                          <SelectItem value={Language.PIDGIN}>Pidgin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="synopsis">Synopsis</Label>
                    <Textarea
                      id="synopsis"
                      value={synopsis}
                      onChange={(e) => setSynopsis(e.target.value)}
                      placeholder="Describe your story concept, main characters, plot, setting, tone, and period..."
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSynopsisDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSynopsisSubmit}
                    disabled={isGenerating}
                    className="bg-naija-gold hover:bg-naija-gold/90 text-black"
                  >
                    {isGenerating ? (
                      <>
                        <Bot className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Full Script
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Need inspiration? Check out our{" "}
          <Button variant="link" className="p-0 h-auto text-naija-green" onClick={() => navigate("/plot")}>
            AI Plot Generator
          </Button>
        </p>
      </div>
    </div>
  );
};
