import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Layout, Users, MapPin, Zap } from 'lucide-react';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { exportToCSV, exportToPDF, BreakdownData } from '@/utils/exportBreakdownUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ScriptBreakdownPanelProps {
  elements: ScriptElementType[];
  title: string;
}

export const ScriptBreakdownPanel: React.FC<ScriptBreakdownPanelProps> = ({ elements, title }) => {
  // Helper to strip character extensions like (V.O.), (O.S.), (CONT'D)
  const normalizeCharacterName = (name: string) => {
    return name.replace(/\(.*\)/g, '').trim().toUpperCase();
  };

  const breakdownData = useMemo(() => {
    const scenes: BreakdownData['scenes'] = [];
    const locationMap = new Map<string, { count: number; type: 'INT' | 'EXT' | 'OTHER' }>();
    const characterMap = new Map<string, number>();
    const propSet = new Set<string>();
    
    // Technical blacklist to avoid treating screenplay terms as props
    const technicalBlacklist = new Set([
      'FADE', 'CUT', 'LATER', 'MOMENTS', 'CONTINUOUS', 'DAY', 'NIGHT', 
      'EXT', 'INT', 'TITLE', 'CREDITS', 'BLACK', 'BURSTS', 'SMASH', 'ZOOM',
      'PAN', 'REVEAL', 'CLOSE', 'WIDE', 'TIGHT', 'ANGLE', 'TIME', 'SPEED',
      'COLORFUL', 'WEEK', 'CANOPIES', 'SCENE', 'NUMBER', 'UNKNOWN', 'COLLECTION',
      'FEEDBACK', 'SCREEN', 'CLICK', 'CALLING', 'BUZZES', 'LAUNCH', 'JOINT',
      'VENTURE', 'ATELIER', 'DIKE', 'BROTHERS', 'HALF', 'HEART', 'SCREECH'
    ]);

    // PASS 1: Identify all unique normalized characters and their constituent words
    const masterCastList = new Set<string>();
    elements.forEach(el => {
      if (el.type === 'character') {
        const normalized = normalizeCharacterName(el.content);
        masterCastList.add(normalized);
        // Also add individual words for aggressive filtering (e.g. "PAPA EMEKA" -> "PAPA", "EMEKA")
        normalized.split(/\s+/).forEach(word => {
          if (word.length > 2) masterCastList.add(word);
        });
      }
    });

    // PASS 2: Detailed Breakdown
    let currentScene: { number: number; heading: string; characters: Set<string> } | null = null;
    let sceneCounter = 0;
    const charSceneMap = new Map<string, Set<number>>();

    elements.forEach((el) => {
      if (el.type === 'heading') {
        sceneCounter++;
        if (currentScene) {
          scenes.push({ ...currentScene, characters: Array.from(currentScene.characters) });
        }
        
        const heading = el.content.trim().toUpperCase();
        currentScene = {
          number: sceneCounter,
          heading: heading,
          characters: new Set()
        };

        // Extract Location
        let locName = heading;
        let type: 'INT' | 'EXT' | 'OTHER' = 'OTHER';
        if (heading.startsWith('INT.')) {
          type = 'INT';
          locName = heading.split('-')[0].replace('INT.', '').trim();
        } else if (heading.startsWith('EXT.')) {
          type = 'EXT';
          locName = heading.split('-')[0].replace('EXT.', '').trim();
        }
        
        const existing = locationMap.get(locName) || { count: 0, type };
        locationMap.set(locName, { count: existing.count + 1, type });
      }

      if (el.type === 'character') {
        const rawName = el.content.trim().toUpperCase();
        const normalizedName = normalizeCharacterName(rawName);
        
        if (normalizedName) {
          characterMap.set(normalizedName, (characterMap.get(normalizedName) || 0) + 1);
          
          // Track scene appearances
          if (!charSceneMap.has(normalizedName)) {
            charSceneMap.set(normalizedName, new Set());
          }
          if (sceneCounter > 0) {
            charSceneMap.get(normalizedName)?.add(sceneCounter);
          }

          if (currentScene) {
            currentScene.characters.add(normalizedName);
          }
        }
      }

      if (el.type === 'action') {
        // Advanced heuristic for props: Capitalized words in action lines
        // Excluding technical terms AND all words associated with character names
        const words = el.content.split(/\s+/);
        words.forEach(word => {
          const cleanWord = word.replace(/[^A-Z0-9]/g, '');
          if (cleanWord.length > 3 && cleanWord === cleanWord.toUpperCase()) {
            // Aggressive check: Is this word part of any character name?
            if (!masterCastList.has(cleanWord) && !technicalBlacklist.has(cleanWord)) {
              propSet.add(cleanWord);
            }
          }
        });
      }
    });

    // Push the last scene
    if (currentScene) {
      scenes.push({ ...currentScene, characters: Array.from(currentScene.characters) });
    }

    return {
      title,
      scenes,
      locations: Array.from(locationMap.entries()).map(([name, data]) => ({ name, ...data })),
      characters: Array.from(characterMap.entries())
        .map(([name, dialogues]) => ({ 
          name, 
          dialogues, 
          sceneCount: charSceneMap.get(name)?.size || 0 
        }))
        .sort((a, b) => b.dialogues - a.dialogues),
      props: Array.from(propSet).slice(0, 40) // Limit to top 40 for UI
    };
  }, [elements, title]);

  const handleDownloadCSV = () => exportToCSV(breakdownData);
  const handleDownloadPDF = () => exportToPDF(breakdownData);

  return (
    <div className="p-6 space-y-6 bg-[#121212] min-h-full text-slate-200 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-white">
          Production Breakdown
          <Badge variant="outline" className="text-naija-green border-naija-green">Beta</Badge>
        </h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-naija-green hover:bg-naija-green/90 text-white">
              <Download className="h-4 w-4 mr-2" />
              Download Breakdown
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadCSV} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
              <Zap className="h-4 w-4 mr-2" />
              Export as PDF Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E1E1E] border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Layout className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Scenes</p>
              <p className="text-2xl font-bold text-white">{breakdownData.scenes.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1E1E1E] border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <MapPin className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Locations</p>
              <p className="text-2xl font-bold text-white">{breakdownData.locations.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cast</p>
              <p className="text-2xl font-bold text-white">{breakdownData.characters.length}</p>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Locations List */}
        <Card className="bg-[#1E1E1E] border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-green-500" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400 text-right">Scenes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdownData.locations.slice(0, 10).map((loc, i) => (
                  <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell className="font-medium text-slate-200">{loc.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={loc.type === 'INT' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}>
                        {loc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-400">{loc.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Characters List */}
        <Card className="bg-[#1E1E1E] border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-purple-500" />
              Character Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Character</TableHead>
                  <TableHead className="text-slate-400 text-right">Scenes</TableHead>
                  <TableHead className="text-slate-400 text-right">Dialogues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdownData.characters.slice(0, 15).map((char, i) => (
                  <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell className="font-medium text-slate-200">{char.name}</TableCell>
                    <TableCell className="text-right text-slate-400 font-bold text-blue-400">{char.sceneCount}</TableCell>
                    <TableCell className="text-right text-slate-400">{char.dialogues}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Full Scene Breakdown */}
      <Card className="bg-[#1E1E1E] border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Layout className="h-5 w-5 text-blue-500" />
            Full Scene Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="w-16 text-slate-400 text-center">SC#</TableHead>
                <TableHead className="text-slate-400">Scene Heading</TableHead>
                <TableHead className="text-slate-400">Characters Present</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdownData.scenes.map((scene, i) => (
                <TableRow key={i} className="border-slate-800 hover:bg-slate-800/30">
                  <TableCell className="text-center font-bold text-blue-400">{scene.number}</TableCell>
                  <TableCell className="font-medium text-slate-200">{scene.heading}</TableCell>
                  <TableCell className="text-slate-400">
                    <div className="flex flex-wrap gap-1">
                      {scene.characters.map((c, ci) => (
                        <span key={ci} className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap">
                          {c}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
