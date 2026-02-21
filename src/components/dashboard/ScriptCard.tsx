
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EditScriptDialog } from "./EditScriptDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useScriptExport } from "@/hooks/useScriptExport";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScriptCardProps {
  script: {
    id: string;
    title: string;
    updated_at?: string;
    created_at?: string;
    description?: string;
    genre?: string;
  };
  onUpdate?: () => void;
}

export function ScriptCard({ script, onUpdate }: ScriptCardProps) {
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { exportAsPDF, exportAsTXT } = useScriptExport();
  const { toast } = useToast();

  const handleExport = async (e: React.MouseEvent, format: 'pdf' | 'txt') => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from('script_elements')
        .select('*')
        .eq('script_id', script.id)
        .order('position', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Export Failed",
          description: "This script has no content to export.",
          variant: "destructive"
        });
        return;
      }

      if (format === 'pdf') {
        await exportAsPDF(script.title, data);
      } else {
        await exportAsTXT(script.title, data);
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Could not fetch script content for export.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', script.id);

      if (error) throw error;

      toast({
        title: "Script Deleted",
        description: `Successfully deleted "${script.title}".`
      });

      onUpdate?.();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formattedDate = script.updated_at || script.created_at
    ? new Date(script.updated_at || script.created_at || '').toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "New Script";

  const handleClick = () => {
    navigate(`/editor/${script.id}`);
  };

  return (
    <>
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer group relative"
        onClick={handleClick}
      >
        <div className="h-1 bg-naija-green w-full"></div>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-start">
            <div className="flex flex-col gap-1 flex-1 min-w-0 pr-2">
              <span className="truncate text-base font-bold">{script.title || "Untitled Script"}</span>
              {script.genre && (
                <Badge
                  variant="outline"
                  className="w-fit bg-naija-green/10 text-naija-green-dark border-naija-green-light text-[10px] px-1.5 py-0"
                >
                  {script.genre}
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  disabled={isExporting}
                  onClick={(e) => handleExport(e, 'pdf')}
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export PDF
                </DropdownMenuItem>

                <DropdownMenuItem
                  disabled={isExporting}
                  onClick={(e) => handleExport(e, 'txt')}
                >
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Export TXT
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Script
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <p className="line-clamp-2 h-10 text-xs leading-relaxed">
            {script.description || "No description provided."}
          </p>
          <div className="flex items-center mt-4 text-[10px] text-gray-400 font-medium">
            <FileText className="h-3 w-3 mr-1" />
            <span>Script</span>
            <span className="mx-2">•</span>
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="text-naija-green hover:text-naija-green-dark hover:bg-naija-green/10 h-7 text-xs w-full justify-between"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/editor/${script.id}`);
            }}
          >
            Open Editor
            <FileText className="h-3 w-3 ml-2 opacity-50" />
          </Button>
        </CardFooter>
      </Card>

      <EditScriptDialog
        script={script}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={() => onUpdate?.()}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the script "{script.title}" and all of its elements.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete Script"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
