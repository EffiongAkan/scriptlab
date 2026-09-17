
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, Film, ChevronRight, Download, FileText, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSeriesExport } from "@/hooks/useSeriesExport";

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
  const episodeCount = episodes.length;
  const lastUpdated = episodes.reduce((latest, current) => {
    return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
  }, episodes[0]);

  const { exportAllAsPDF, exportIndividualPDFs } = useSeriesExport();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    await exportAllAsPDF(seriesName, episodes);
    setIsExporting(false);
  };

  const handleExportIndividual = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    await exportIndividualPDFs(seriesName, episodes);
    setIsExporting(false);
  };

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
            <div className="flex items-center gap-1">
              {/* Export dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isExporting}
                    title="Export episodes"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Export {episodeCount} Episode{episodeCount !== 1 ? "s" : ""}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={handleExportAll}
                  >
                    <BookOpen className="h-4 w-4 text-naija-green" />
                    <div>
                      <p className="font-medium text-sm">All Episodes — One PDF</p>
                      <p className="text-xs text-muted-foreground">Single file with all episodes</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={handleExportIndividual}
                  >
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Individual Episode PDFs</p>
                      <p className="text-xs text-muted-foreground">One PDF per episode</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-shrink-0 bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Folder className="h-5 w-5 text-primary" />
              </div>
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2.5 text-xs gap-1.5 border-border hover:bg-accent text-foreground font-medium"
                onClick={(e) => e.stopPropagation()}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Export {episodeCount} Episode{episodeCount !== 1 ? "s" : ""}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleExportAll}>
                <BookOpen className="h-4 w-4 text-naija-green" />
                <div>
                  <p className="font-medium text-sm">All Episodes — One PDF</p>
                  <p className="text-xs text-muted-foreground">Single file with all episodes</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleExportIndividual}>
                <FileText className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Individual Episode PDFs</p>
                  <p className="text-xs text-muted-foreground">One PDF per episode</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" className="h-8 px-2 text-naija-green group-hover:bg-naija-green/10" onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}>
            Open Folder
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
