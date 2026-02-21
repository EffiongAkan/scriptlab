
import React from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  preferences: string[];
  onChange: (prefs: string[]) => void;
}

const SUGGESTION_TYPES = ["improvement", "addition", "alternative"];

export const SuggestionPreferences = ({ preferences, onChange }: Props) => {
  const handleToggle = (type: string) => {
    let newPrefs: string[];
    if (preferences.includes(type)) {
      newPrefs = preferences.filter(t => t !== type);
      // always at least one
      if (newPrefs.length === 0) newPrefs = [type];
    } else {
      newPrefs = [...preferences, type];
    }
    onChange(newPrefs);
  };

  return (
    <div className="flex gap-2">
      {SUGGESTION_TYPES.map(type => (
        <Badge
          key={type}
          variant={preferences.includes(type) ? "default" : "secondary"}
          className={`cursor-pointer select-none ${preferences.includes(type) ? "" : "opacity-60"}`}
          onClick={() => handleToggle(type)}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      ))}
    </div>
  );
};
