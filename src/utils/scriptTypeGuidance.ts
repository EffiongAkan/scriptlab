import { ScriptType } from "@/types";

/**
 * Episodic structure definitions for TV series
 */
export interface EpisodicStructure {
    name: string;
    description: string;
    plotStyle: string;
    sceneStructure: string;
    characterHandling: string;
    continuityLevel: string;
    bestFor: string;
    examples: string;
    pros: string[];
    cons: string[];
}

/**
 * TV Series episodic structures with detailed storytelling guidance
 */
export const tvSeriesStructures: Record<string, EpisodicStructure> = {
    EPISODIC: {
        name: "Episodic (Procedural / Stand-Alone)",
        description: "Each episode tells a complete story with little to no dependency on previous episodes. Characters stay mostly the same.",
        plotStyle: "Problem introduced → solved within the episode. Each episode is self-contained.",
        sceneStructure: "Clear act structure with setup, conflict, and resolution all within one episode. Minimal cliffhangers. Each scene should advance the episode's standalone plot.",
        characterHandling: "Characters maintain consistent personalities but minimal character development across episodes. Focus on situational conflicts rather than character arcs.",
        continuityLevel: "Low - Episodes can be watched in any order",
        bestFor: "Long-running TV, Casual viewing, Syndication",
        examples: "Crime procedurals (Law & Order, CSI), Medical shows (House, ER), Legal dramas",
        pros: ["Easy for new viewers to jump in", "Flexible episode order", "Good for syndication"],
        cons: ["Less emotional depth over time", "Can feel formulaic"]
    },

    SERIALIZED: {
        name: "Serialized (Continuous Story)",
        description: "One long story across episodes with major cliffhangers. Episodes depend heavily on each other.",
        plotStyle: "Episode = chapter of a novel. Story continues across multiple episodes with no standalone resolution.",
        sceneStructure: "Focus on advancing the overarching narrative. Each scene builds tension toward season/series climax. Strong cliffhangers at episode ends. Scenes should reference previous events and set up future developments.",
        characterHandling: "Deep character development and transformation across episodes. Complex relationships evolve. Multiple character arcs interweave.",
        continuityLevel: "High - Must watch episodes in order",
        bestFor: "Streaming platforms, Drama, Romance, Thriller",
        examples: "Breaking Bad, Game of Thrones, Most Netflix originals, Nollywood limited series",
        pros: ["Strong emotional investment", "Binge-friendly", "Complex storytelling"],
        cons: ["Harder for late viewers to jump in", "Requires sustained attention"]
    },

    HYBRID: {
        name: "Hybrid (Semi-Serialized)",
        description: "Each episode has a mini-plot that resolves, but a larger story arc runs through the season.",
        plotStyle: "Episode problem + season-long conflict. Balance between standalone and continuing elements.",
        sceneStructure: "Dual-layer structure: immediate episode conflict (resolved by end) and ongoing season arc (advanced but not resolved). Scenes serve both purposes - resolving immediate issues while planting seeds for larger story.",
        characterHandling: "Character development across season while maintaining episodic accessibility. Relationships evolve gradually. Mix of episodic and serialized character moments.",
        continuityLevel: "Medium - Best watched in order but can skip episodes",
        bestFor: "Broad audiences, Network & streaming balance",
        examples: "The Good Place, Scandal, How to Get Away with Murder, Character-driven dramas, Family series",
        pros: ["Accessible to new viewers", "Still emotionally deep", "Best of both worlds"],
        cons: ["Requires careful plotting", "Can feel unfocused if not balanced well"]
    },

    ANTHOLOGY: {
        name: "Anthology Series",
        description: "New story each season or episode with new characters, setting, and conflict.",
        plotStyle: "Season anthology = new story every season. Episode anthology = new story every episode. Each iteration is completely independent.",
        sceneStructure: "Standard act structure within each episode/season. No continuity requirements. Scenes can be bold and experimental since there's no long-term setup needed.",
        characterHandling: "Fresh characters each iteration. No character development across episodes/seasons. Deep dive into characters within single story arc then complete reset.",
        continuityLevel: "None - Each story is independent",
        bestFor: "Experimental storytelling, High-concept ideas",
        examples: "Black Mirror, American Horror Story, True Detective (seasons), Horror anthologies, Social-issue dramas",
        pros: ["Creative freedom", "No long-term story constraints", "Can attract different audiences each season"],
        cons: ["Hard to build loyal fan attachment", "Each iteration starts from scratch"]
    },

    LIMITED_SERIES: {
        name: "Limited Series / Miniseries",
        description: "One complete story with a fixed number of episodes. Clear beginning, middle, and end.",
        plotStyle: "Structured like a long movie divided into episodes. Complete story arc with definitive ending.",
        sceneStructure: "Tight, cinematic structure across all episodes. Each episode is an act in the larger story. No filler - every scene must serve the complete narrative. Strong forward momentum.",
        characterHandling: "Complete character arcs from start to finish. Deep transformation. No need to reset or maintain status quo.",
        continuityLevel: "High - Sequential viewing required",
        bestFor: "Prestige drama, True stories, Awards",
        examples: "Chernobyl, The Queen's Gambit, Mare of Easttown, When They See Us",
        pros: ["Tight storytelling", "No filler episodes", "Complete satisfying story"],
        cons: ["No long-term continuation", "Higher production pressure"]
    },

    SOAP: {
        name: "Telenovela / Soap Structure",
        description: "Multiple overlapping storylines, continuous and often open-ended with heavy emotional and relationship focus.",
        plotStyle: "Constant twists, revelations, betrayals. Multiple concurrent storylines. High melodrama.",
        sceneStructure: "Short scenes cutting between multiple storylines. Frequent cliffhangers. Emphasis on character reactions and emotional moments. Scenes should end with hooks or revelations.",
        characterHandling: "Large ensemble cast. Deep focus on relationships and family dynamics. Characters undergo frequent dramatic transformations.",
        continuityLevel: "Continuous - Daily/weekly ongoing story",
        bestFor: "Daily or weekly broadcast, Romance and family drama",
        examples: "Tinseltown, Days of Our Lives, Latin American telenovelas",
        pros: ["High viewer loyalty", "Strong emotional engagement", "Multiple storylines keep things fresh"],
        cons: ["Can lose narrative discipline", "Risk of becoming repetitive"]
    },

    PROCEDURAL_WITH_ARC: {
        name: "Procedural-with-Arc (Modern Trend)",
        description: "Weekly case/problem that resets, but personal character arcs evolve slowly across the season.",
        plotStyle: "External plot (case/mission) resets each episode. Internal plot (character development) continues across season.",
        sceneStructure: "A-plot (case of the week) dominates but includes B-plot (character arc) beats. Each episode resolves external conflict but advances internal conflicts. Balance between standalone satisfaction and serialized engagement.",
        characterHandling: "Professional status quo maintained (still doing the job) but personal lives and relationships evolve. Character growth happens in margins of procedural stories.",
        continuityLevel: "Low-Medium - Can enjoy standalone but richer when watching in order",
        bestFor: "Crime, Action, Workplace drama, Long-running series",
        examples: "Castle, The Mentalist, Lucifer, NCIS (later seasons)",
        pros: ["Familiar structure", "Long lifespan potential", "Character depth without alienating casual viewers"],
        cons: ["Risk of formula fatigue", "Character arcs can feel slow"]
    }
};

/**
 * Script type-specific storytelling guidance
 */
interface ScriptTypeGuidance {
    structureNotes: string;
    pacing: string;
    characterDevelopment: string;
    sceneGuidance: string;
    formatSpecifics?: string;
}

const scriptTypeGuidelines: Record<ScriptType, ScriptTypeGuidance> = {
    [ScriptType.SHORT_FILM]: {
        structureNotes: "Compressed three-act structure or single-emotion arc. Must establish, develop, and resolve within limited runtime (typically under 40 minutes, often 10-20 minutes).",
        pacing: "Tight and economical. Every scene must serve multiple purposes. No room for exposition dumps. Get to the point quickly.",
        characterDevelopment: "Focus on one or two characters. Show transformation through action rather than dialogue. Limited backstory - focus on present moment.",
        sceneGuidance: "5-12 scenes typically. Each scene should be essential. Avoid location changes unless absolutely necessary. Strong opening hook and memorable final image.",
        formatSpecifics: "Emphasize visual storytelling. Minimal dialogue. Strong imagery and subtext."
    },

    [ScriptType.FEATURE_FILM]: {
        structureNotes: "Classic three-act structure or alternative structure (five-act, nonlinear, etc.). Setup (Act 1), Confrontation (Act 2), Resolution (Act 3). Include inciting incident, midpoint, crisis, and climax.",
        pacing: "Varied pacing - mix of fast action and slower emotional beats. Build tension progressively. Typically 90-120 pages (90-120 minutes).",
        characterDevelopment: "Complete protagonist journey with clear arc. Supporting characters with their own motivations. Protagonist faces internal and external conflicts that intersect at climax.",
        sceneGuidance: "40-60 scenes typically. Each scene should advance plot or character. Include setpieces appropriate to genre. Balance dialogue scenes with visual sequences.",
        formatSpecifics: "Industry-standard screenplay format. Proper scene headings, action lines, dialogue format."
    },

    [ScriptType.SKIT]: {
        structureNotes: "SKIT DRAMA FORMAT (30 seconds to 5 minutes maximum). Use SETUP → TWIST → PAYOFF structure. Setup: Introduce situation IMMEDIATELY (first 5-10 seconds). Conflict/Twist: Something unexpected happens that subverts expectations. Resolution/Punchline: End STRONG with a memorable punchline, ironic twist, or thought-provoking message. NO complex subplots - everything serves ONE central joke or message. Start in the middle of the action - no slow buildup.",
        pacing: "EXTREMELY FAST AND TIGHT. Every second must count. Hook the audience in the FIRST 3-5 SECONDS or they scroll away. Rapid-fire dialogue or quick visual gags. NO exposition dumps. NO slow character introductions. Jump straight into the conflict. Build tension quickly and release with punchline. End ABRUPTLY after the payoff - no long closure or explanations needed.",
        characterDevelopment: "SMALL CAST: 1-4 characters maximum (preferably 2-3). Use EXAGGERATED, ARCHETYPAL characters that audiences recognize instantly: the strict mother, the greedy boss, the stubborn lover, the naive friend, the street-smart hustler, the religious hypocrite. NO deep character development or backstory. Characters are TYPES, not complex individuals. Show personality through ACTION and SHARP DIALOGUE, not exposition. Make characters RELATABLE to everyday Nigerian/African life.",
        sceneGuidance: "SINGLE LOCATION preferred (one room, one street corner, one office, one village square). Keeps production simple and focus tight. Usually 1-3 scenes total. If multiple locations, transitions must be INSTANT and CLEAR. Each scene must advance toward the punchline. NO unnecessary scene changes. Strong VISUAL STORYTELLING - show don't tell. Use PHYSICAL COMEDY and visual gags that need little explanation. Every scene element (props, costumes, setting) should support the comedy or message.",
        formatSpecifics: `CRITICAL SKIT REQUIREMENTS:

**DURATION:** 30 seconds to 5 minutes (MAXIMUM 10 minutes for complex skits). Aim for 2-3 minutes as sweet spot for social media.

**OPENING HOOK:** First 3-5 seconds MUST grab attention. Start with:
- A shocking statement or action
- Mid-argument or conflict
- Unexpected visual
- Relatable everyday situation gone wrong
- Trending topic or cultural reference

**TONE:** Crystal clear from the start. Usually COMEDY, SATIRE, or LIGHT DRAMA. If serious, deliver clear MORAL or MESSAGE quickly. Common tones:
- Satirical commentary on social issues
- Relationship comedy (marriage, dating, family)
- Workplace humor
- Cultural observations
- Moral lessons with humor

**DIALOGUE:** Sharp, snappy, and MEMORABLE. Use:
- Catchphrases that can become viral
- Nigerian Pidgin English or local slang when appropriate
- Exaggerated reactions
- Rapid back-and-forth exchanges
- Minimal monologues (keep under 15 seconds)

**CONTENT THEMES (Draw from):**
- Everyday life situations (market haggling, traffic, power outages)
- Social issues (corruption, relationships, family pressure)
- Internet trends and viral challenges
- Cultural habits and traditions
- Generational conflicts
- Economic struggles (hustle culture, unemployment)
- Religious hypocrisy or zealotry
- Gender roles and expectations

**ENDING:** End QUICKLY after punchline or lesson. NO long explanations. Leave audience:
- Laughing at the absurdity
- Shocked by the twist
- Thinking about the message
- Wanting to share it

**PRODUCTION NOTES:**
- Keep it SIMPLE for fast production
- Minimal props and costumes
- Natural lighting when possible
- Mobile-friendly framing (vertical or square for Instagram/TikTok)
- Clear audio - dialogue must be heard
- Shareable moments - create clips people want to repost

**AVOID:**
- Slow introductions
- Complex backstories
- Multiple subplots
- Lengthy explanations
- Ambiguous endings
- Too many characters
- Location changes without purpose
- Dragging out the joke`
    },

    [ScriptType.DOCUMENTARY]: {
        structureNotes: "Non-fiction narrative structure: introduction of subject, exploration of themes, revelation/climax, conclusion. Can use chronological, thematic, or hybrid approaches.",
        pacing: "Moderate pacing with room for exploration and reflection. Build toward revelatory moments or arguments.",
        characterDevelopment: "Real people as subjects. Show their authentic complexity. Let their stories unfold naturally through interviews and vérité footage.",
        sceneGuidance: "Mix of interview segments, B-roll sequences, archival footage, vérité scenes. Each segment should advance the narrative or argument. Scene descriptions should specify visual elements and potential interview questions.",
        formatSpecifics: "Include interview questions, B-roll descriptions, narration if applicable. Document real events and authentic voices."
    },

    [ScriptType.TV_PILOT]: {
        structureNotes: "Must establish the world, characters, tone, and premise while telling a complete first episode. Set up series potential and long-term conflicts. Balance between standalone satisfaction and series setup.",
        pacing: "Moderate to fast. Hook viewers immediately. Establish series world within first 10 minutes. Leave room for character introduction without sacrificing story.",
        characterDevelopment: "Introduce main characters clearly with distinct personalities and goals. Establish key relationships and conflicts. Show character potential for growth without completing arcs.",
        sceneGuidance: "22-30 scenes for hour-long (45-60 pages), 12-18 scenes for half-hour (25-35 pages). Balance world-building with compelling immediate story. Include series hook/twist by end.",
        formatSpecifics: "Establish series format and structure. Show the type of stories this series will tell. Demonstrate series longevity."
    },

    [ScriptType.TV_SERIES]: {
        structureNotes: "Episode of ongoing series. Structure depends on series format (see episodic structures above). Must balance episode story with series continuity.",
        pacing: "Established by series. Maintain consistency with show's rhythm while keeping this episode engaging.",
        characterDevelopment: "Continue established character arcs. Deepen relationships. Show growth appropriate to series structure (minimal for procedural, significant for serialized).",
        sceneGuidance: "Scene count depends on series format and runtime. Maintain series' established tone and style. Include character moments that long-time viewers will appreciate while staying accessible to new viewers.",
        formatSpecifics: "Match established series format. Include act breaks appropriate to broadcast/streaming format. Maintain series voice and style."
    },

    [ScriptType.WEB_SERIES]: {
        structureNotes: "Compressed structure for web consumption. Episodes typically 3-15 minutes. Can be serialized or episodic. Must hook quickly - viewers scroll easily.",
        pacing: "Fast-paced. Immediate engagement crucial. Get to the point within first 30 seconds. Cliffhangers to drive to next episode.",
        characterDevelopment: "Can be deeper than traditional shorts due to series format. Incremental development across episodes. Relatable, authentic characters for online audiences.",
        sceneGuidance: "3-8 scenes per episode typically. Minimal locations to manage budget. Strong visual storytelling. Shareable moments.",
        formatSpecifics: "Mobile-friendly pacing. Social media shareability. Strong thumbnails and hooks. Platform-specific considerations (YouTube, Instagram, TikTok)."
    },

    [ScriptType.MUSIC_VIDEO]: {
        structureNotes: "Visual narrative synchronized with music. Can be literal interpretation, abstract/artistic, or narrative story. Structure follows song structure (verse, chorus, bridge).",
        pacing: "Dictated by music tempo and rhythm. Visual beats match musical beats. Pacing intensifies with music.",
        characterDevelopment: "Minimal character depth usually. Characters as visual/emotional vessels. Performance vs. narrative balance.",
        sceneGuidance: "Sequences rather than traditional scenes. Locations and looks chosen for visual impact. Each sequence/shot should enhance the song's emotion or message.",
        formatSpecifics: "Emphasize visual concepts, color palettes, camera movements. Note timing with musical beats. Performance shots vs. narrative shots."
    },

    [ScriptType.COMMERCIAL]: {
        structureNotes: "Problem-solution or aspirational lifestyle structure. Extremely compressed - typically 15-60 seconds. Must communicate brand message clearly and memorably.",
        pacing: "Extremely fast. Every second counts. Strong opening hook (first 3 seconds critical). Clear call-to-action.",
        characterDevelopment: "Archetypal characters representing target audience. Relatable situations quickly established.",
        sceneGuidance: "1-4 scenes maximum. Each shot must earn its place. Product integration natural, not forced. Memorable tagline or visual.",
        formatSpecifics: "Brand guidelines integration. Product placement. Legal considerations. Shooting board format often used."
    },

    [ScriptType.STAGE_PLAY]: {
        structureNotes: "Traditional theatrical structure. Can be one-act or multiple acts. More dialogue-driven than screen. Scenes defined by entrances/exits rather than location changes.",
        pacing: "Slower, more contemplative than screen. Room for extended dialogue and monologues. Build toward dramatic moments suitable for live performance.",
        characterDevelopment: "Deep character development through dialogue and interaction. Characters often face moral or philosophical dilemmas. Transformation shown through speech and action on single stage.",
        sceneGuidance: "Limited locations (often single set or simple changes). Entrances and exits create scene structure. Focus on language, subtext, and live performance dynamics.",
        formatSpecifics: "Stage directions instead of camera directions. (Enter/Exit) notations. Practical staging considerations. Intermission placement if applicable."
    }
};

/**
 * Get comprehensive storytelling guidance for a specific script type
 */
export function getScriptTypeGuidance(scriptType: ScriptType, episodicStructure?: string): string {
    const guidance = scriptTypeGuidelines[scriptType];

    if (!guidance) {
        return ""; // No specific guidance for this type
    }

    let guidanceText = `\n## SCRIPT TYPE: ${scriptType}\n\n`;
    guidanceText += `**STRUCTURE:** ${guidance.structureNotes}\n\n`;
    guidanceText += `**PACING:** ${guidance.pacing}\n\n`;
    guidanceText += `**CHARACTER DEVELOPMENT:** ${guidance.characterDevelopment}\n\n`;
    guidanceText += `**SCENE GUIDANCE:** ${guidance.sceneGuidance}\n`;

    if (guidance.formatSpecifics) {
        guidanceText += `\n**FORMAT SPECIFICS:** ${guidance.formatSpecifics}\n`;
    }

    // Add episodic structure guidance for TV series and Web series
    if ((scriptType === ScriptType.TV_SERIES || scriptType === ScriptType.TV_PILOT || scriptType === ScriptType.WEB_SERIES) && episodicStructure && tvSeriesStructures[episodicStructure]) {
        const structure = tvSeriesStructures[episodicStructure];
        guidanceText += `\n### EPISODIC STRUCTURE: ${structure.name}\n\n`;
        guidanceText += `**DESCRIPTION:** ${structure.description}\n\n`;
        guidanceText += `**PLOT STYLE:** ${structure.plotStyle}\n\n`;
        guidanceText += `**SCENE STRUCTURE:** ${structure.sceneStructure}\n\n`;
        guidanceText += `**CHARACTER HANDLING:** ${structure.characterHandling}\n\n`;
        guidanceText += `**CONTINUITY LEVEL:** ${structure.continuityLevel}\n\n`;
        guidanceText += `**BEST FOR:** ${structure.bestFor}\n`;
    }

    return guidanceText;
}

/**
 * Get brief script type context for simple prompts
 */
export function getScriptTypeContext(scriptType: ScriptType): string {
    const guidance = scriptTypeGuidelines[scriptType];
    if (!guidance) return "";

    return `This is a ${scriptType}. ${guidance.structureNotes}`;
}

/**
 * Check if a script type supports episodic structure selection
 */
export function supportsEpisodicStructure(scriptType: ScriptType): boolean {
    return scriptType === ScriptType.TV_SERIES || scriptType === ScriptType.TV_PILOT || scriptType === ScriptType.WEB_SERIES;
}
