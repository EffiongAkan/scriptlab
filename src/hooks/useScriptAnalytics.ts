
import { useMemo } from 'react';
import { ScriptElementType } from '@/hooks/useScriptContent';

export interface ScriptAnalytics {
  totalElements: number;
  sceneCount: number;
  characterCount: number;
  dialogueCount: number;
  actionCount: number;
  pageEstimate: number;
  readingTime: number;
  characterFrequency: Record<string, number>;
  sceneBreakdown: Array<{
    sceneNumber: number;
    title: string;
    elementCount: number;
    characterCount: number;
    dialogueLines: number;
  }>;
  writingPace: {
    averageElementsPerScene: number;
    dialogueToActionRatio: number;
    averageDialogueLength: number;
  };
  qualityMetrics: {
    characterConsistency: number;
    sceneBalance: number;
    dialogueVariety: number;
  };
}

export const useScriptAnalytics = (elements: ScriptElementType[]): ScriptAnalytics => {
  return useMemo(() => {
    if (!elements || elements.length === 0) {
      return {
        totalElements: 0,
        sceneCount: 0,
        characterCount: 0,
        dialogueCount: 0,
        actionCount: 0,
        pageEstimate: 0,
        readingTime: 0,
        characterFrequency: {},
        sceneBreakdown: [],
        writingPace: {
          averageElementsPerScene: 0,
          dialogueToActionRatio: 0,
          averageDialogueLength: 0,
        },
        qualityMetrics: {
          characterConsistency: 0,
          sceneBalance: 0,
          dialogueVariety: 0,
        },
      };
    }

    // Basic counts
    const sceneCount = elements.filter(el => el.type === 'heading').length;
    const characterCount = new Set(
      elements
        .filter(el => el.type === 'character')
        .map(el => el.content.trim().toUpperCase())
    ).size;
    const dialogueCount = elements.filter(el => el.type === 'dialogue').length;
    const actionCount = elements.filter(el => el.type === 'action').length;

    // Character frequency analysis
    const characterFrequency: Record<string, number> = {};
    elements
      .filter(el => el.type === 'character')
      .forEach(el => {
        const char = el.content.trim().toUpperCase();
        characterFrequency[char] = (characterFrequency[char] || 0) + 1;
      });

    // Scene breakdown analysis
    const sceneBreakdown: Array<{
      sceneNumber: number;
      title: string;
      elementCount: number;
      characterCount: number;
      dialogueLines: number;
    }> = [];

    let currentScene = 0;
    let currentSceneElements = 0;
    let currentSceneCharacters = new Set<string>();
    let currentSceneDialogue = 0;
    let currentSceneTitle = '';

    elements.forEach((element, index) => {
      if (element.type === 'heading') {
        // Save previous scene if it exists
        if (currentScene > 0) {
          sceneBreakdown.push({
            sceneNumber: currentScene,
            title: currentSceneTitle,
            elementCount: currentSceneElements,
            characterCount: currentSceneCharacters.size,
            dialogueLines: currentSceneDialogue,
          });
        }

        // Start new scene
        currentScene++;
        currentSceneTitle = element.content.trim();
        currentSceneElements = 1;
        currentSceneCharacters.clear();
        currentSceneDialogue = 0;
      } else {
        currentSceneElements++;
        
        if (element.type === 'character') {
          currentSceneCharacters.add(element.content.trim().toUpperCase());
        } else if (element.type === 'dialogue') {
          currentSceneDialogue++;
        }
      }

      // Handle last scene
      if (index === elements.length - 1 && currentScene > 0) {
        sceneBreakdown.push({
          sceneNumber: currentScene,
          title: currentSceneTitle,
          elementCount: currentSceneElements,
          characterCount: currentSceneCharacters.size,
          dialogueLines: currentSceneDialogue,
        });
      }
    });

    // Writing pace calculations
    const averageElementsPerScene = sceneCount > 0 ? elements.length / sceneCount : 0;
    const dialogueToActionRatio = actionCount > 0 ? dialogueCount / actionCount : 0;
    
    const dialogueElements = elements.filter(el => el.type === 'dialogue');
    const averageDialogueLength = dialogueElements.length > 0 
      ? dialogueElements.reduce((sum, el) => sum + el.content.length, 0) / dialogueElements.length 
      : 0;

    // Quality metrics (0-100 scale)
    const characterConsistency = calculateCharacterConsistency(elements);
    const sceneBalance = calculateSceneBalance(sceneBreakdown);
    const dialogueVariety = calculateDialogueVariety(elements);

    // Page and time estimates
    const pageEstimate = Math.ceil(elements.length / 3); // Rough estimate: 3 elements per page
    const readingTime = Math.ceil(elements.length * 0.1); // Rough estimate: 0.1 minutes per element

    return {
      totalElements: elements.length,
      sceneCount,
      characterCount,
      dialogueCount,
      actionCount,
      pageEstimate,
      readingTime,
      characterFrequency,
      sceneBreakdown,
      writingPace: {
        averageElementsPerScene,
        dialogueToActionRatio,
        averageDialogueLength,
      },
      qualityMetrics: {
        characterConsistency,
        sceneBalance,
        dialogueVariety,
      },
    };
  }, [elements]);
};

// Helper functions for quality metrics
function calculateCharacterConsistency(elements: ScriptElementType[]): number {
  const characterElements = elements.filter(el => el.type === 'character');
  if (characterElements.length === 0) return 100;

  const characterNames = characterElements.map(el => el.content.trim());
  const uniqueVariations = new Set(characterNames).size;
  const normalizedNames = new Set(
    characterNames.map(name => name.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  ).size;

  // Higher consistency when there are fewer variations of the same character names
  return Math.max(0, 100 - ((uniqueVariations - normalizedNames) * 10));
}

function calculateSceneBalance(sceneBreakdown: any[]): number {
  if (sceneBreakdown.length === 0) return 100;

  const elementCounts = sceneBreakdown.map(scene => scene.elementCount);
  const average = elementCounts.reduce((sum, count) => sum + count, 0) / elementCounts.length;
  const variance = elementCounts.reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / elementCounts.length;
  const standardDeviation = Math.sqrt(variance);

  // Lower standard deviation = better balance
  const balanceScore = Math.max(0, 100 - (standardDeviation * 2));
  return Math.min(100, balanceScore);
}

function calculateDialogueVariety(elements: ScriptElementType[]): number {
  const dialogueElements = elements.filter(el => el.type === 'dialogue');
  if (dialogueElements.length === 0) return 100;

  const lengths = dialogueElements.map(el => el.content.length);
  const uniqueLengthRanges = new Set(
    lengths.map(length => Math.floor(length / 20)) // Group by 20-character ranges
  ).size;

  // More variety in dialogue lengths = higher score
  return Math.min(100, uniqueLengthRanges * 10);
}
