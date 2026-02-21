
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Eye } from "lucide-react";
import { useState } from "react";
import { SynopsisPreviewModal } from "./SynopsisPreviewModal";

interface SynopsisCardProps {
  id?: string;
  title: string;
  content: string;
  createdAt?: string;
  onUpdate?: () => void;
}

export function SynopsisCard({ id, title, content, createdAt, onUpdate }: SynopsisCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const truncatedContent = content.length > 150 ? content.substring(0, 150) + "..." : content;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePreview = () => {
    if (id) {
      setShowPreview(true);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-naija-green" />
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </div>
            {createdAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(createdAt)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {truncatedContent}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              Professional Treatment
            </Badge>
            {id && (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreview}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {id && (
        <SynopsisPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          synopsis={id ? {
            id,
            title,
            content,
            created_at: createdAt || ''
          } : null}
          onUpdate={onUpdate || (() => {})}
        />
      )}
    </>
  );
}
