
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScriptCard } from "@/components/dashboard/ScriptCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { FileText, Search, Plus, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Script {
  id: string;
  title: string;
  genre?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function Scripts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast({
        title: "Error",
        description: "Failed to load scripts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !selectedGenre || script.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const genres = Array.from(new Set(scripts.map(script => script.genre).filter(Boolean)));

  const handleCreateScript = () => {
    navigate("/dashboard");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-3xl font-bold">My Scripts</h1>
        </div>
        <Button onClick={handleCreateScript} className="bg-naija-green hover:bg-naija-green-dark">
          <Plus className="mr-2 h-4 w-4" />
          New Script
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search scripts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedGenre === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre("")}
              >
                All Genres
              </Button>
              {genres.map(genre => (
                <Button
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          [1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : filteredScripts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedGenre ? "No scripts found" : "No scripts yet"}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              {searchTerm || selectedGenre
                ? "Try adjusting your search criteria"
                : "Create your first professional script to start writing"
              }
            </p>
            <Button onClick={handleCreateScript} className="bg-naija-green hover:bg-naija-green-dark">
              <Plus className="mr-2 h-4 w-4" />
              Create New Script
            </Button>
          </div>
        ) : (
          filteredScripts.map(script => (
            <ScriptCard key={script.id} script={script} onUpdate={fetchScripts} />
          ))
        )}
      </div>

      {/* Stats */}
      {scripts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-naija-green">{scripts.length}</div>
                <div className="text-sm text-muted-foreground">Total Scripts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-naija-gold">{genres.length}</div>
                <div className="text-sm text-muted-foreground">Genres</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-naija-accent">
                  {scripts.filter(s => {
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    return new Date(s.updated_at) > lastWeek;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Updated This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {scripts.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length}
                </div>
                <div className="text-sm text-muted-foreground">Created Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
