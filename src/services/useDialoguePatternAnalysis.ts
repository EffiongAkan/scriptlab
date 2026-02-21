
import { useMemo } from "react";

/**
 * A hook to analyze a dialogue and suggest its probable Nigerian regional pattern.
 * Returns the most probable region, confidence %, and explanation.
 */
type Region = "lagos" | "abuja" | "kano" | "port-harcourt";

export interface DialoguePatternAnalysisResult {
  region: Region | "unknown";
  confidence: number;
  explanation: string;
  detectedPatterns: string[];
}

const REGION_PATTERNS: Record<Region, { patterns: RegExp[]; keywords: string[]; explanation: string }> = {
  lagos: {
    patterns: [
      /\b(las las|oma|omo|sabi|e choke|how far|wetin|dey|no wahala)\b/gi,
      /\b(Yoruba|Pidgin)\b/i
    ],
    keywords: ["pidgin", "lagos", "area boy", "e be things", "no wahala"],
    explanation: "Frequent Pidgin English, Yoruba words, urban slang. Lagos is multilingual and cosmopolitan, with 'Omo', 'sabi', 'e choke', 'how far?' common in speech.",
  },
  abuja: {
    patterns: [
      /\b(wallahi|how are you doing|hope you're fine|diplomatic|federal)\b/gi,
    ],
    keywords: ["abuja", "federal", "wallahi", "diplomatic"],
    explanation: "Dialogue features more formal English, Hausa borrowings ('wallahi'), and polite register found in the capital's multicultural/diplomatic circles.",
  },
  kano: {
    patterns: [
      /\b(kai|yaya|sannu|barka da|allah|hausa|in sha allah)\b/gi,
    ],
    keywords: ["kano", "sannu", "barka", "wallahi", "kai", "almajiri"],
    explanation: "Northern-influenced dialogue, with Hausa greetings ('Sannu', 'Kai', 'In sha Allah') and respectful, measured tone.",
  },
  "port-harcourt": {
    patterns: [
      /\b(you see am|ijaw|pikin|oil|na so|abeg)\b/gi,
    ],
    keywords: ["port harcourt", "river", "oil", "pikin", "abeg"],
    explanation: "Influenced by Ijaw/Delta cultures, with Niger Delta Pidgin, oil-industry lingo (e.g., 'you see am?'), and Ijaw inflections.",
  },
};

export function useDialoguePatternAnalysis(dialogue: string): DialoguePatternAnalysisResult {
  return useMemo(() => {
    if (!dialogue || typeof dialogue !== "string") {
      return {
        region: "unknown",
        confidence: 0,
        explanation: "No dialogue provided.",
        detectedPatterns: [],
      };
    }

    let bestRegion: Region | "unknown" = "unknown";
    let topScore = 0;
    let detected: string[] = [];

    //
    // Check each region's regex patterns and keywords
    //
    Object.entries(REGION_PATTERNS).forEach(([region, { patterns, keywords }]) => {
      let score = 0;
      let regionDetected: string[] = [];
      // Direct keyword (case-insensitive) matching
      keywords.forEach(key => {
        if (dialogue.toLowerCase().includes(key)) {
          score += 2;
          regionDetected.push(key);
        }
      });
      // Pattern detection (regex)
      patterns.forEach(pattern => {
        const matches = dialogue.match(pattern);
        if (matches) {
          score += matches.length * 5;
          regionDetected.push(...matches);
        }
      });

      if (score > topScore) {
        topScore = score;
        bestRegion = region as Region;
        detected = regionDetected;
      }
    });

    return {
      region: bestRegion,
      confidence: Math.min(100, bestRegion === "unknown" ? 0 : 60 + Math.round(topScore / 2)),
      explanation: bestRegion === "unknown"
        ? "Could not confidently detect regional patterns."
        : REGION_PATTERNS[bestRegion as Region].explanation,
      detectedPatterns: detected,
    };
  }, [dialogue]);
}
