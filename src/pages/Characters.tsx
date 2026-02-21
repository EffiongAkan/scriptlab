import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterCard } from "@/components/characters/CharacterCard";
import { Character, Language } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSelector } from "@/components/plot/LanguageSelector";

// Sample character data
const sampleCharacters: Partial<Character>[] = [{
  id: "1",
  name: "Amaka Okonkwo",
  age: 28,
  gender: "Female",
  background: "Ambitious journalist from Enugu, educated in Lagos",
  personality: ["Determined", "Intelligent", "Courageous"],
  goals: ["Uncover government corruption", "Protect her family"],
  conflicts: ["Threatened by powerful people", "Torn between career and safety"],
  culturalBackground: {
    ethnicity: "Igbo",
    religion: "Christian",
    region: "Southeastern Nigeria",
    languages: [Language.ENGLISH, Language.IGBO],
    traditions: ["Traditional Igbo values"]
  }
}, {
  id: "2",
  name: "Chidi Okafor",
  age: 32,
  gender: "Male",
  background: "Tech entrepreneur who returned to Nigeria after studying abroad",
  personality: ["Ambitious", "Charismatic", "Conflicted"],
  goals: ["Build successful tech company", "Reconnect with roots"],
  conflicts: ["Western vs. traditional values", "Business ethics dilemmas"],
  culturalBackground: {
    ethnicity: "Igbo",
    religion: "Christian",
    region: "Lagos (originally Eastern Nigeria)",
    languages: [Language.ENGLISH, Language.IGBO, Language.PIDGIN],
    traditions: ["Modern urban lifestyle"]
  }
}, {
  id: "3",
  name: "Halima Ibrahim",
  age: 25,
  gender: "Female",
  background: "Medical doctor from a conservative northern family",
  personality: ["Compassionate", "Principled", "Reserved"],
  goals: ["Improve healthcare in rural areas", "Balance tradition and modernity"],
  conflicts: ["Family expectations vs. career", "Traditional vs. modern medicine"],
  culturalBackground: {
    ethnicity: "Hausa",
    religion: "Muslim",
    region: "Northern Nigeria",
    languages: [Language.ENGLISH, Language.HAUSA],
    traditions: ["Traditional Hausa customs", "Islamic traditions"]
  }
}, {
  id: "4",
  name: "Tunde Adeyemi",
  age: 45,
  gender: "Male",
  background: "Wealthy businessman with political connections",
  personality: ["Confident", "Calculating", "Protective"],
  goals: ["Expand business empire", "Protect family legacy"],
  conflicts: ["Ethical compromises", "Family rivalries"],
  culturalBackground: {
    ethnicity: "Yoruba",
    religion: "Christian",
    region: "Southwestern Nigeria",
    languages: [Language.ENGLISH, Language.YORUBA],
    traditions: ["Yoruba traditions", "Elite social customs"]
  }
}];
export default function Characters() {
  const [characters, setCharacters] = useState<Partial<Character>[]>(sampleCharacters);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    name: "",
    age: undefined,
    gender: "",
    background: "",
    personality: [],
    culturalBackground: {
      ethnicity: "",
      region: "",
      languages: [],
      traditions: []
    }
  });

  // Filter characters based on search query
  const filteredCharacters = characters.filter(character => character.name?.toLowerCase().includes(searchQuery.toLowerCase()) || character.culturalBackground?.ethnicity?.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleAddCharacter = () => {
    const withId = {
      ...newCharacter,
      id: Date.now().toString()
    };
    setCharacters([...characters, withId]);
    setNewCharacter({
      name: "",
      age: undefined,
      gender: "",
      background: "",
      personality: [],
      culturalBackground: {
        ethnicity: "",
        region: "",
        languages: [],
        traditions: []
      }
    });
    setIsAddDialogOpen(false);
  };
  const handlePersonalityChange = (value: string) => {
    const traits = value.split(',').map(trait => trait.trim()).filter(Boolean);
    setNewCharacter({
      ...newCharacter,
      personality: traits
    });
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-300">Characters</h1>
          <p className="text-muted-foreground">Create and manage your script characters</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-naija-green hover:bg-naija-green-dark text-white">
              Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Character</DialogTitle>
              <DialogDescription>
                Create a new character for your script. Fill in the details to make your character rich and well-developed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" value={newCharacter.name} onChange={e => setNewCharacter({
                ...newCharacter,
                name: e.target.value
              })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="age" className="text-right">
                  Age
                </Label>
                <Input id="age" type="number" value={newCharacter.age || ""} onChange={e => setNewCharacter({
                ...newCharacter,
                age: parseInt(e.target.value) || undefined
              })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Input id="gender" value={newCharacter.gender || ""} onChange={e => setNewCharacter({
                ...newCharacter,
                gender: e.target.value
              })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ethnicity" className="text-right">
                  Ethnicity
                </Label>
                <Input id="ethnicity" value={newCharacter.culturalBackground?.ethnicity || ""} onChange={e => setNewCharacter({
                ...newCharacter,
                culturalBackground: {
                  ...newCharacter.culturalBackground,
                  ethnicity: e.target.value
                }
              })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="region" className="text-right">
                  Region
                </Label>
                <Input id="region" value={newCharacter.culturalBackground?.region || ""} onChange={e => setNewCharacter({
                ...newCharacter,
                culturalBackground: {
                  ...newCharacter.culturalBackground,
                  region: e.target.value
                }
              })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="personality" className="text-right">
                  Personality
                </Label>
                <Input id="personality" placeholder="Determined, Intelligent, etc. (comma-separated)" value={newCharacter.personality?.join(", ") || ""} onChange={e => handlePersonalityChange(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="background" className="text-right">
                  Background
                </Label>
                <Textarea id="background" value={newCharacter.background || ""} onChange={e => setNewCharacter({
                ...newCharacter,
                background: e.target.value
              })} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCharacter}>Add Character</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Input placeholder="Search characters..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-sm" />
        <Button variant="outline">Filter</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Characters</TabsTrigger>
          <TabsTrigger value="main">Main Characters</TabsTrigger>
          <TabsTrigger value="supporting">Supporting Characters</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.map(character => <CharacterCard key={character.id} character={character} onClick={() => console.log("View character", character.id)} onEdit={() => console.log("Edit character", character.id)} />)}
          </div>
        </TabsContent>
        <TabsContent value="main" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.slice(0, 2).map(character => <CharacterCard key={character.id} character={character} onClick={() => console.log("View character", character.id)} onEdit={() => console.log("Edit character", character.id)} />)}
          </div>
        </TabsContent>
        <TabsContent value="supporting" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.slice(2).map(character => <CharacterCard key={character.id} character={character} onClick={() => console.log("View character", character.id)} onEdit={() => console.log("Edit character", character.id)} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>;
}