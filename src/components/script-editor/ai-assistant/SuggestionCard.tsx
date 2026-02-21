
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import type { Suggestion } from "./useRealTimeSuggestions";

interface SuggestionCardProps {
  suggestion: Suggestion;
  applied: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

function getTypeColor(type: Suggestion["type"]) {
  switch (type) {
    case "improvement":
      return "bg-blue-100 text-blue-800";
    case "addition":
      return "bg-green-100 text-green-800";
    case "alternative":
      return "bg-orange-100 text-orange-800";
    default:
      return "";
  }
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 90) return "text-green-600";
  if (confidence >= 70) return "text-yellow-600";
  return "text-red-600";
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  applied,
  onApply,
  onDismiss,
}) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className={`text-xs ${getTypeColor(suggestion.type)}`}>
            {suggestion.type.toUpperCase()}
          </Badge>
          <span
            className={`text-sm font-medium ${getConfidenceColor(
              suggestion.confidence
            )}`}
          >
            {suggestion.confidence}% confidence
          </span>
        </div>
      </div>
      <p className="text-sm mb-2">{suggestion.content}</p>
      <p className="text-xs text-muted-foreground mb-3">{suggestion.reason}</p>
      <div className="flex items-center gap-2">
        {applied ? (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Applied
          </Badge>
        ) : (
          <>
            <Button size="sm" onClick={onApply}>
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={onDismiss}>
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

