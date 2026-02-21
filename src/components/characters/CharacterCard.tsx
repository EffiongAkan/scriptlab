
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Character } from "@/types";

interface CharacterCardProps {
  character: Partial<Character>;
  onClick?: () => void;
  onEdit?: () => void;
}

export function CharacterCard({ character, onClick, onEdit }: CharacterCardProps) {
  // Create initials from character name
  const initials = character.name
    ? character.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "CH";

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2 flex flex-row items-center space-x-4">
        <Avatar className="h-16 w-16 border-2 border-naija-green">
          <AvatarImage src={character.imageUrl} alt={character.name} />
          <AvatarFallback className="bg-naija-gold text-naija-earth-dark text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">{character.name || "Unnamed Character"}</h3>
          <p className="text-sm text-gray-500">{character.age ? `${character.age} years old` : "Age unknown"}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Personality:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {character.personality && character.personality.length > 0 ? (
                character.personality.slice(0, 3).map((trait, index) => (
                  <Badge key={index} variant="secondary" className="bg-naija-green/10 text-naija-green-dark">
                    {trait}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400 italic">No traits defined</span>
              )}
              {character.personality && character.personality.length > 3 && (
                <Badge variant="outline" className="bg-transparent">
                  +{character.personality.length - 3}
                </Badge>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">Cultural Background:</p>
            <p className="text-sm text-gray-600">
              {character.culturalBackground?.ethnicity || "Not specified"}
              {character.culturalBackground?.region && `, ${character.culturalBackground.region}`}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-naija-green hover:text-naija-green-dark hover:bg-naija-green/10"
          onClick={handleEdit}
        >
          Edit Character
        </Button>
      </CardFooter>
    </Card>
  );
}
