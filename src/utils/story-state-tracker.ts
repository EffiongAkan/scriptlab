/**
 * Story State Tracker
 * Maintains coherence across AI-generated script scenes by tracking characters,
 * plot threads, and story progression.
 */

export interface Character {
    name: string;
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
    age?: string;
    occupation?: string;
    personality: string[];
    goals: string[];
    lastAppearance?: number; // Scene number
    dialogueStyle?: string;
    relationships: Record<string, string>; // characterName -> relationship description
}

export interface PlotThread {
    id: string;
    description: string;
    startedInScene: number;
    status: 'ongoing' | 'resolved' | 'abandoned';
    resolution?: string;
}

export interface StoryBeat {
    name: string;
    sceneRange: [number, number]; // [start, end] scene numbers
    description: string;
    completed: boolean;
}

export interface SceneSummary {
    sceneNumber: number;
    location: string;
    characters: string[];
    summary: string;
    plotThreadsAdvanced: string[];
}

export interface StoryState {
    characters: Map<string, Character>;
    plotThreads: PlotThread[];
    sceneSummaries: SceneSummary[];
    storyBeats: StoryBeat[];
    currentSceneNumber: number;
    primarySetting: string;
    genre: string;
    tone: string;
    fullSynopsis: string; // Keep full synopsis for reference
    storyPremise: string; // Core story in one sentence
}

/**
 * Initialize story state from synopsis
 */
export function createInitialStoryState(
    synopsis: string,
    genre: string,
    tone: string,
    totalScenes: number
): StoryState {
    const characters = extractCharactersFromSynopsis(synopsis);
    const plotThreads = extractPlotThreadsFromSynopsis(synopsis);
    const storyBeats = generateStoryBeats(totalScenes);

    return {
        characters,
        plotThreads,
        sceneSummaries: [],
        storyBeats,
        currentSceneNumber: 0,
        primarySetting: extractPrimarySetting(synopsis),
        genre,
        tone,
        fullSynopsis: synopsis,
        storyPremise: extractStoryPremise(synopsis),
    };
}

/**
 * Extract character information from synopsis
 */
function extractCharactersFromSynopsis(synopsis: string): Map<string, Character> {
    const characters = new Map<string, Character>();

    // Look for character profile sections
    const characterProfileRegex = /(?:PROTAGONIST|ANTAGONIST|SUPPORTING CHARACTERS?):\s*([^\n]+)/gi;
    let match;

    while ((match = characterProfileRegex.exec(synopsis)) !== null) {
        const profileText = match[1];
        const nameMatch = profileText.match(/^([A-Z][A-Za-z\s]+?)(?:\s*[-:,]|\s*\()/);

        if (nameMatch) {
            const name = nameMatch[1].trim();
            const role = match[0].toLowerCase().includes('protagonist')
                ? 'protagonist'
                : match[0].toLowerCase().includes('antagonist')
                    ? 'antagonist'
                    : 'supporting';

            characters.set(name, {
                name,
                role,
                personality: [],
                goals: [],
                relationships: {},
            });
        }
    }

    // If no structured profiles found, try to extract names from the text
    if (characters.size === 0) {
        const capitalizedNamesRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
        const potentialNames = new Set<string>();

        while ((match = capitalizedNamesRegex.exec(synopsis)) !== null) {
            const name = match[1];
            // Filter out common non-name words
            if (!['The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'Of', 'With'].includes(name)) {
                potentialNames.add(name);
            }
        }

        // Add first few as characters (typically main characters mentioned early)
        let count = 0;
        for (const name of potentialNames) {
            if (count >= 5) break; // Limit to avoid extracting too many
            characters.set(name, {
                name,
                role: count === 0 ? 'protagonist' : 'supporting',
                personality: [],
                goals: [],
                relationships: {},
            });
            count++;
        }
    }

    return characters;
}

/**
 * Extract plot threads from synopsis
 */
function extractPlotThreadsFromSynopsis(synopsis: string): PlotThread[] {
    const threads: PlotThread[] = [];

    // Look for key plot elements mentioned
    const sections = synopsis.split(/\n\n+/);

    sections.forEach((section, index) => {
        if (section.toLowerCase().includes('conflict') ||
            section.toLowerCase().includes('obstacle') ||
            section.toLowerCase().includes('challenge')) {
            threads.push({
                id: `thread-${index}`,
                description: section.substring(0, 200).trim(),
                startedInScene: 1,
                status: 'ongoing',
            });
        }
    });

    // Always have at least one main plot thread
    if (threads.length === 0) {
        threads.push({
            id: 'main-plot',
            description: 'Main story progression',
            startedInScene: 1,
            status: 'ongoing',
        });
    }

    return threads;
}

/**
 * Generate story beats based on total scenes
 */
function generateStoryBeats(totalScenes: number): StoryBeat[] {
    const act1End = Math.floor(totalScenes * 0.25);
    const act2Mid = Math.floor(totalScenes * 0.5);
    const act2End = Math.floor(totalScenes * 0.75);

    return [
        {
            name: 'Setup & Introduction',
            sceneRange: [1, act1End],
            description: 'Establish characters, world, and inciting incident',
            completed: false,
        },
        {
            name: 'Rising Action',
            sceneRange: [act1End + 1, act2Mid],
            description: 'Protagonist pursues goal, faces obstacles',
            completed: false,
        },
        {
            name: 'Midpoint Crisis',
            sceneRange: [act2Mid, act2Mid + 1],
            description: 'Major turning point that changes everything',
            completed: false,
        },
        {
            name: 'Complications & Stakes',
            sceneRange: [act2Mid + 2, act2End],
            description: 'Situation worsens, stakes increase',
            completed: false,
        },
        {
            name: 'Climax & Resolution',
            sceneRange: [act2End + 1, totalScenes],
            description: 'Final confrontation and resolution',
            completed: false,
        },
    ];
}

/**
 * Extract primary setting from synopsis
 */
function extractPrimarySetting(synopsis: string): string {
    const settingMatch = synopsis.match(/(?:set in|takes place in|location[s]?:)\s*([^.\n]+)/i);
    return settingMatch ? settingMatch[1].trim() : 'Various locations';
}

/**
 * Extract story premise (central conflict) from synopsis
 */
function extractStoryPremise(synopsis: string): string {
    // Look for logline or first substantial paragraph
    const loglineMatch = synopsis.match(/(?:LOGLINE|LOG LINE|PREMISE):\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/i);
    if (loglineMatch) {
        return loglineMatch[1].trim().substring(0, 300);
    }

    // Otherwise take first meaningful paragraph (skip headers)
    const paragraphs = synopsis.split(/\n\n+/);
    for (const para of paragraphs) {
        const cleaned = para.trim();
        if (cleaned.length > 100 && !cleaned.match(/^[A-Z\s*]+:$/)) {
            return cleaned.substring(0, 300);
        }
    }

    return synopsis.substring(0, 300);
}

/**
 * Update story state based on a newly generated scene
 */
export function updateStoryStateFromScene(
    state: StoryState,
    sceneContent: string,
    sceneNumber: number
): StoryState {
    const updatedState = { ...state };
    updatedState.currentSceneNumber = sceneNumber;

    // Extract characters that appear in this scene
    const sceneCharacters = extractCharactersFromScene(sceneContent);

    // Update character last appearance
    sceneCharacters.forEach(charName => {
        if (updatedState.characters.has(charName)) {
            const char = updatedState.characters.get(charName)!;
            char.lastAppearance = sceneNumber;
        } else {
            // New character discovered
            updatedState.characters.set(charName, {
                name: charName,
                role: 'minor',
                personality: [],
                goals: [],
                relationships: {},
                lastAppearance: sceneNumber,
            });
        }
    });

    // Extract scene summary
    const summary = extractSceneSummary(sceneContent, sceneNumber);
    updatedState.sceneSummaries.push(summary);

    // Keep only last 5 scene summaries to manage memory
    if (updatedState.sceneSummaries.length > 5) {
        updatedState.sceneSummaries = updatedState.sceneSummaries.slice(-5);
    }

    // Update story beats
    updatedState.storyBeats.forEach(beat => {
        if (sceneNumber >= beat.sceneRange[0] && sceneNumber <= beat.sceneRange[1]) {
            if (sceneNumber === beat.sceneRange[1]) {
                beat.completed = true;
            }
        }
    });

    return updatedState;
}

/**
 * Extract character names from scene content
 */
function extractCharactersFromScene(sceneContent: string): string[] {
    const characters = new Set<string>();

    // Match character names (all caps followed by newline or parenthetical)
    const characterRegex = /^([A-Z][A-Z\s'-]+?)(?:\s*\(|$)/gm;
    let match;

    while ((match = characterRegex.exec(sceneContent)) !== null) {
        const name = match[1].trim();
        // Filter out scene headings
        if (!name.startsWith('INT.') && !name.startsWith('EXT.') &&
            !name.startsWith('FADE') && !name.startsWith('CUT') &&
            name.length > 1 && name.length < 30) {
            characters.add(name);
        }
    }

    return Array.from(characters);
}

/**
 * Extract scene summary
 */
function extractSceneSummary(sceneContent: string, sceneNumber: number): SceneSummary {
    // Extract location from scene heading
    const headingMatch = sceneContent.match(/(INT\.|EXT\.)\s*([^-\n]+)/);
    const location = headingMatch ? headingMatch[2].trim() : 'Unknown';

    const characters = extractCharactersFromScene(sceneContent);

    // Create brief summary from action lines
    const lines = sceneContent.split('\n');
    const actionLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 &&
            !trimmed.match(/^(INT\.|EXT\.|FADE|CUT|SCENE)/i) &&
            trimmed !== trimmed.toUpperCase();
    });

    const summary = actionLines.slice(0, 2).join(' ').substring(0, 150);

    return {
        sceneNumber,
        location,
        characters,
        summary,
        plotThreadsAdvanced: [],
    };
}

/**
 * Generate coherence context for next scene prompt
 */
export function generateCoherenceContext(state: StoryState, nextSceneNumber: number): string {
    let context = '\n\n[MANDATORY STORY CONTINUITY - DO NOT DEVIATE]\n\n';

    // CRITICAL: Core story premise to prevent drift
    context += '**THIS SCRIPT IS ABOUT (NEVER CHANGE THIS):**\n';
    context += state.storyPremise + '\n\n';
    context += `**PRIMARY SETTING:** ${state.primarySetting}\n`;
    context += `**GENRE:** ${state.genre} | **TONE:** ${state.tone}\n\n`;

    context += '⚠️ WARNING: You MUST continue THIS EXACT STORY. Do not start a new story or switch the central conflict.\n\n';

    // Active characters
    context += '**ACTIVE CHARACTERS:**\n';
    const activeChars = Array.from(state.characters.values())
        .filter(char => !char.lastAppearance || char.lastAppearance >= nextSceneNumber - 5)
        .sort((a, b) => {
            const roleOrder = { protagonist: 0, antagonist: 1, supporting: 2, minor: 3 };
            return roleOrder[a.role] - roleOrder[b.role];
        });

    activeChars.forEach(char => {
        const lastSeen = char.lastAppearance ? ` (last in Scene ${char.lastAppearance})` : '';
        const traits = char.personality.length > 0 ? `, Traits: ${char.personality.join(', ')}` : '';
        context += `- ${char.name} (${char.role}${char.age ? `, ${char.age}` : ''}${char.occupation ? `, ${char.occupation}` : ''}${traits})${lastSeen}\n`;
    });

    // Character relationships
    if (activeChars.length > 1) {
        context += '\n**CHARACTER RELATIONSHIPS:**\n';
        activeChars.forEach(char => {
            Object.entries(char.relationships).forEach(([other, relationship]) => {
                context += `- ${char.name} ↔ ${other}: ${relationship}\n`;
            });
        });
    }

    // Active plot threads
    const ongoingThreads = state.plotThreads.filter(t => t.status === 'ongoing');
    if (ongoingThreads.length > 0) {
        context += '\n**ACTIVE PLOT THREADS:**\n';
        ongoingThreads.forEach(thread => {
            context += `- ${thread.description.substring(0, 100)} (Scene ${thread.startedInScene}, ongoing)\n`;
        });
    }

    // Recent scene summaries
    if (state.sceneSummaries.length > 0) {
        context += '\n**PREVIOUS SCENES (for continuity):**\n';
        state.sceneSummaries.slice(-3).forEach(summary => {
            context += `Scene ${summary.sceneNumber} (${summary.location}): ${summary.summary}\n`;
        });
    }

    // Current story beat
    const currentBeat = state.storyBeats.find(
        beat => nextSceneNumber >= beat.sceneRange[0] && nextSceneNumber <= beat.sceneRange[1]
    );

    if (currentBeat) {
        context += `\n**CURRENT STORY BEAT:** ${currentBeat.name}\n`;
        context += `Purpose: ${currentBeat.description}\n`;
        context += `Scene ${nextSceneNumber} of ${currentBeat.sceneRange[1]} in this beat.\n`;
    }

    // Critical instructions - much more forceful
    context += '\n**MANDATORY CONTINUITY RULES (FOLLOW EXACTLY):**\n';
    context += '1. ⛔ DO NOT START A NEW STORY - Continue the EXACT story premise stated above\n';
    context += '2. ⛔ DO NOT INTRODUCE NEW PROTAGONISTS - Use ONLY the characters listed above\n';
    context += '3. ⛔ DO NOT CHANGE THE SETTING - Stay in the established locations unless plot requires movement\n';
    context += '4. ✅ MUST reference previous scene events - Show clear cause and effect\n';
    context += '5. ✅ MUST advance the plot threads listed above - Do not create new unrelated conflicts\n';
    context += `6. ✅ MUST serve the current beat: ${currentBeat?.name || 'story progression'}\n`;
    context += `7. ✅ MUST continue the tone: ${state.tone}\n\n`;

    if (state.sceneSummaries.length > 0) {
        const lastScene = state.sceneSummaries[state.sceneSummaries.length - 1];
        context += `📍 THIS SCENE CONTINUES DIRECTLY FROM: ${lastScene.summary}\n\n`;
    }

    return context;
}

/**
 * Validate generated content for coherence issues
 */
export function validateSceneCoherence(
    state: StoryState,
    sceneContent: string,
    sceneNumber: number
): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check for character consistency
    const sceneCharacters = extractCharactersFromScene(sceneContent);
    const knownCharacters = Array.from(state.characters.keys());

    sceneCharacters.forEach(char => {
        if (!knownCharacters.includes(char) && state.currentSceneNumber > 3) {
            warnings.push(`New character "${char}" introduced late (Scene ${sceneNumber}) - may break continuity`);
        }
    });

    // Check if scene is too short (likely incomplete)
    if (sceneContent.length < 200) {
        warnings.push(`Scene ${sceneNumber} is very short (${sceneContent.length} chars) - may be incomplete`);
    }

    // Check for proper scene heading
    if (!sceneContent.match(/^(INT\.|EXT\.)/i)) {
        warnings.push(`Scene ${sceneNumber} missing proper scene heading (INT./EXT.)`);
    }

    return {
        isValid: warnings.length === 0,
        warnings,
    };
}
