
import React from "react";

interface CharacterCardLiteProps {
  name: string;
  description?: string;
  background?: string;
  traits?: string[];
}

export const CharacterCardLite: React.FC<CharacterCardLiteProps> = ({
  name, description, background, traits
}) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm space-y-2">
    <div className="font-medium text-lg text-naija-gold-dark">{name}</div>
    {description && <div className="text-gray-700 text-sm italic">{description}</div>}
    {background && <div className="text-xs text-gray-400">{background}</div>}
    {traits && traits.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {traits.map((trait, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{trait}</span>
        ))}
      </div>
    )}
    {/* Future: Add Edit/Export actions */}
  </div>
);
