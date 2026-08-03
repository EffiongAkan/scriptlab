import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, Film, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardScript {
  id: string;
  title: string;
  genre?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface SeriesFolderCardProps {
  seriesName: string;
  episodes: DashboardScript[];
  onClick: () => void;
}

export function SeriesFolderCard({ seriesName, episodes, onClick }: SeriesFolderCardProps) {
  // Sort episodes by episode number roughly (or rely on passed sorting)
  const episodeCount = episodes.length;
  const lastUpdated = episodes.reduce((latest, current) => {
    return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
  }, episodes[0]);

  return (
    <Card 
      className="group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-md hover:border-naija-green/50 cursor-pointer flex flex-col h-[200px]"
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-naija-green transition-all duration-300 group-hover:h-1.5" />
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 flex-grow">
        <div className="space-y-1 w-full">
          <div className="flex justify-between items-start w-full">
            <h3 className="font-bold text-lg line-clamp-2 text-foreground pr-2 group-hover:text-naija-green transition-colors">
              {seriesName}
            </h3>
            <div className="flex-shrink-0 bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Folder className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
             <Badge variant="outline" className="bg-background text-xs font-normal border-primary/20">
               TV Series
             </Badge>
             <Badge variant="secondary" className="text-xs font-normal">
               {episodeCount} Episode{episodeCount !== 1 ? 's' : ''}
             </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 flex items-center gap-2">
          <Film className="h-4 w-4 shrink-0" />
          Click to view and manage all episodes in this season.
        </p>
      </CardContent>

      <CardFooter className="pt-0 pb-4 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="text-xs text-muted-foreground flex flex-col">
          <span>Last modified</span>
          <span className="font-medium flex items-center mt-0.5">
            {new Date(lastUpdated.updated_at).toLocaleDateString(undefined, { 
              year: 'numeric', month: 'short', day: 'numeric' 
            })}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-naija-green group-hover:bg-naija-green/10" onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}>
          Open Folder
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
