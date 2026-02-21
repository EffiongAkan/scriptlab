import { FilmIndustry } from '@/types';

export interface IndustryContext {
    name: string;
    style: string;
    language: string;
    cultural: string;
    dialogue: string;
    formatting: string;
    storyStructure: string;
    characterNaming: string;
    emoji: string;
}

export const filmIndustryContexts: Record<FilmIndustry, IndustryContext> = {
    [FilmIndustry.HOLLYWOOD]: {
        name: 'Hollywood',
        style: 'Three-act structure, emphasis on character arcs and visual storytelling, high production values',
        language: 'American English, contemporary slang and idioms',
        cultural: 'Western cultural references, individualism, American dream themes, diverse settings',
        dialogue: 'Natural, contemporary American speech patterns, witty banter, subtext',
        formatting: 'Standard Hollywood screenplay format (Courier 12pt, specific margins)',
        storyStructure: 'Setup-Confrontation-Resolution, plot points at 25% and 75%, midpoint at 50%',
        characterNaming: 'Diverse American names reflecting multicultural society',
        emoji: '🇺🇸'
    },

    [FilmIndustry.BOLLYWOOD]: {
        name: 'Bollywood',
        style: 'Song-dance sequences integrated into narrative, dramatic emotional beats, family-centric themes, often longer runtime',
        language: 'Hindi-English mix (Hinglish), Urdu influences, poetic expressions',
        cultural: 'Indian traditions, family honor, arranged marriages, festivals, spirituality, karma and dharma concepts',
        dialogue: 'Emotional, poetic, includes shayari (poetry), musical lyrics, dramatic declarations',
        formatting: 'Similar to Hollywood but with song sequences marked, dialogue often bilingual',
        storyStructure: 'Extended narrative with multiple subplots, emphasis on family dynamics, romantic angles',
        characterNaming: 'Traditional Indian names (Hindi, Punjabi, etc.), sometimes modern Western names for urban characters',
        emoji: '🇮🇳'
    },

    [FilmIndustry.NOLLYWOOD]: {
        name: 'Nollywood',
        style: 'Fast-paced storytelling, moral lessons, melodrama, supernatural elements, family and community focus',
        language: 'Nigerian English, Pidgin English, local languages (Yoruba, Igbo, Hausa), code-switching',
        cultural: 'African proverbs and wisdom, communal values, respect for elders, spirituality (Christianity, traditional beliefs), village-city dynamics',
        dialogue: 'Expressive, proverb-laden, mix of formal English and Pidgin, cultural idioms',
        formatting: 'More flexible formatting, often includes stage directions for actors',
        storyStructure: 'Moral-driven narrative, clear good vs evil, redemption arcs, often in parts/episodes',
        characterNaming: 'Nigerian ethnic names (Yoruba, Igbo, Hausa), Christian names, combination names',
        emoji: '🇳🇬'
    },

    [FilmIndustry.GHALLYWOOD]: {
        name: 'Ghallywood',
        style: 'Cultural storytelling, moral themes, colorful aesthetics, blend of traditional and modern',
        language: 'Ghanaian English, Twi, Ga, other local languages, British English influence',
        cultural: 'Ghanaian traditions, chieftaincy, family values, African spirituality, highlife culture',
        dialogue: 'Warm, community-oriented, proverbs, respectful address forms',
        formatting: 'West African screenplay style, similar to Nollywood',
        storyStructure: 'Community-focused narratives, cultural conflicts and resolutions',
        characterNaming: 'Akan names, Ga names, Christian names, traditional Ghanaian naming patterns',
        emoji: '🇬🇭'
    },

    [FilmIndustry.LOLLYWOOD]: {
        name: 'Lollywood',
        style: 'Musical elements, romantic drama, social commentary, family sagas',
        language: 'Urdu, Punjabi, English mix, poetic Urdu expressions',
        cultural: 'Pakistani culture, Islamic values, Sufi traditions, family honor, social class dynamics',
        dialogue: 'Poetic, respectful address forms (ap, tum), Urdu poetry influences',
        formatting: 'Similar to Bollywood with Urdu script considerations',
        storyStructure: 'Emotional family dramas, romance with obstacles, social commentary',
        characterNaming: 'Urdu/Arabic names, Punjabi names, traditional Pakistani naming conventions',
        emoji: '🇵🇰'
    },

    [FilmIndustry.POLLYWOOD]: {
        name: 'Pollywood',
        style: 'Vibrant music and dance, rural-urban narratives, comedy-drama mix, bhangra culture',
        language: 'Punjabi, Hindi influences, energetic expressions',
        cultural: 'Punjabi culture, farming community, diaspora themes, festivals, colorful traditions',
        dialogue: '  Energetic Punjabi speech, humor, folk expressions, agricultural metaphors',
        formatting: 'Punjabi script considerations, song sequences',
        storyStructure: 'Light-hearted narratives, family conflicts, romance, comedy elements',
        characterNaming: 'Punjabi Sikh and Hindu names, often related to strength or beauty',
        emoji: '🪕'
    },

    [FilmIndustry.HALLYUWOOD]: {
        name: 'Hallyuwood (K-Drama/Film)',
        style: 'Aesthetic cinematography, emotional depth, romantic tension, social commentary, detailed character development',
        language: 'Korean with honorifics system, formal and informal speech levels',
        cultural: 'Korean culture, Confucian values, respect hierarchy, han (deep sorrow), beauty standards, competitive society',
        dialogue: 'Subtle emotional expression, honorific usage crucial, poetic internal monologues',
        formatting: 'Korean screenplay format, honorific indicators in dialogue',
        storyStructure: 'Slow-burn romance, character-driven, social class themes, often tragic elements',
        characterNaming: 'Korean family name + given name structure, meaningful hanja characters',
        emoji: '🇰🇷'
    },

    [FilmIndustry.COLLYWOOD]: {
        name: 'Collywood',
        style: 'Cultural preservation, historical narratives, social realism, Buddhist themes',
        language: 'Khmer, formal and colloquial registers',
        cultural: 'Cambodian traditions, Khmer Rouge history, Buddhist philosophy, rural life, family bonds',
        dialogue: 'Respectful Khmer speech, proverbs, Buddhist wisdom',
        formatting: 'Khmer script considerations, Southeast Asian screenplay style',
        storyStructure: 'Historical and cultural narratives, trauma and healing, community stories',
        characterNaming: 'Khmer names, often with Buddhist or royal influences',
        emoji: '🇰🇭'
    },

    [FilmIndustry.JOLLYWOOD]: {
        name: 'Jollywood',
        style: 'Contemplative pacing, visual poetry, subtle emotions, attention to detail, genre variety (anime, live-action)',
        language: 'Japanese, keigo (honorific language), regional dialects',
        cultural: 'Japanese aesthetics, honor culture, group harmony (wa), mono no aware (pathos), seasonal references',
        dialogue: 'Indirect communication, honorific levels, silence as meaning, formal/informal distinction',
        formatting: 'Japanese screenplay format, vertical text considerations for certain contexts',
        storyStructure: 'Character introspection, karma themes, detailed emotional arcs, often ambiguous endings',
        characterNaming: 'Japanese family name + given name, kanji meanings significant',
        emoji: '🇯🇵'
    },

    [FilmIndustry.HONG_KONG]: {
        name: 'Hong Kong Cinema',
        style: 'Fast-paced action, martial arts choreography, crime dramas, stylized visuals, energy and movement',
        language: 'Cantonese, English mix, street slang',
        cultural: 'Hong Kong identity, East-meets-West, urban life, triad culture, economic aspiration, nostalgia',
        dialogue: 'Quick Cantonese banter, colloquialisms, multilingual code-switching',
        formatting: 'Action-heavy formatting with detailed fight choreography notes',
        storyStructure: 'Action-driven, parallel storylines, moral ambiguity, brotherhood themes',
        characterNaming: 'Cantonese names, often with English nicknames',
        emoji: '🇭🇰'
    },

    [FilmIndustry.CHINESE]: {
        name: 'Chinese Cinema',
        style: 'Epic scope, historical grandeur, martial arts philosophy, visual symbolism, family sagas',
        language: 'Mandarin, classical Chinese references, regional dialects',
        cultural: 'Chinese philosophy (Confucianism, Taoism), historical epics, family loyalty, face (mianzi), five elements',
        dialogue: 'Poetic language, classical idioms (chengyu), respectful titles, generational speech patterns',
        formatting: 'Chinese screenplay format, traditional/simplified character considerations',
        storyStructure: 'Sweeping narratives, cyclical time, revenge and honor themes, philosophical undertones',
        characterNaming: 'Chinese surname + given name, meanings tied to fortune/virtues',
        emoji: '🇨🇳'
    },

    [FilmIndustry.FRENCH]: {
        name: 'French Cinema',
        style: 'Art house aesthetics, philosophical depth, romantic realism, nouvelle vague influences, character studies',
        language: 'French with regional variations, intellectual vocabulary, romantic expressions',
        cultural: 'French culture, existentialism, romance, café society, intellectualism, May \'68 legacy',
        dialogue: 'Witty repartee, philosophical discussions, romantic language, literary references',
        formatting: 'French screenplay format (continuité dialoguée), detailed scene descriptions',
        storyStructure: 'Character-driven, ambiguous morality, slice-of-life, open endings',
        characterNaming: 'French names, regional variations (Breton, Occitan, etc.)',
        emoji: '🇫🇷'
    },

    [FilmIndustry.ITALIAN]: {
        name: 'Italian Cinema',
        style: 'Neorealist influences, operatic emotions, family dynamics, comedic elements, regional diversity',
        language: 'Italian with dialects, expressive gestures described, passionate vocabulary',
        cultural: 'Italian culture, Catholic influence, family centrality, piazza culture, regional pride, bella figura',
        dialogue: 'Passionate, gesture-accompanied, family endearments, Italian idioms',
        formatting: 'Italian screenplay format, gestural and emotional cues detailed',
        storyStructure: 'Emotional arcs, family conflicts, social commentary, tragicomedy blend',
        characterNaming: 'Italian regional names, saint names, diminutives common',
        emoji: '🇮🇹'
    },

    [FilmIndustry.GERMAN]: {
        name: 'German Cinema',
        style: 'Expressionist influences, psychological depth, social realism, dark humor, precision in craft',
        language: 'German, formal/informal du/Sie distinction, compound words, regional dialects',
        cultural: 'German culture, historical consciousness, environmental awareness, efficiency, directness',
        dialogue: 'Direct communication, philosophical depth, compound nouns, formal register awareness',
        formatting: 'German screenplay format (Drehbuch), technical precision',
        storyStructure: 'Psychological complexity, historical reckoning, moral questions, ensemble pieces',
        characterNaming: 'German names, regional variations (Bavarian, Saxon, etc.)',
        emoji: '🇩🇪'
    },

    [FilmIndustry.MEXICAN]: {
        name: 'Mexican Cinema',
        style: 'Magical realism, vibrant colors, social commentary, family melodrama, death themes (Día de Muertos)',
        language: 'Mexican Spanish, regional slang, indigenous language influences',
        cultural: 'Mexican culture, family values, Catholic-indigenous syncretism, machismo/marianismo, migration themes',
        dialogue: 'Warm familial terms, colorful expressions, diminutives, emotional directness',
        formatting: 'Latin American screenplay format, cultural context notes',
        storyStructure: 'Emotional family narratives, social inequality themes, magical elements',
        characterNaming: 'Spanish names, indigenous names, saint names, double surnames',
        emoji: '🇲🇽'
    },

    [FilmIndustry.INTERNATIONAL]: {
        name: 'International Standard',
        style: 'Universal storytelling, culturally accessible, festival-friendly, subtle cultural markers',
        language: 'Clear English or subtitled multilingual approach, avoiding heavy slang',
        cultural: 'Universal human themes (love, loss, ambition), minimal culture-specific references',
        dialogue: 'Clear, translatable dialogue, subtext over cultural idioms',
        formatting: 'Standard international screenplay format',
        storyStructure: 'Universal narrative structures (hero\'s journey, etc.), clear emotional beats',
        characterNaming: 'Internationally recognizable names, culturally ambiguous when possible',
        emoji: '🌍'
    }
};

// Helper function to get AI prompt context for a specific industry
export function getIndustryAIPromptContext(industry: FilmIndustry): string {
    const context = filmIndustryContexts[industry];
    return `
**Film Industry:** ${context.name} ${context.emoji}

**Style & Approach:**
${context.style}

**Language & Dialogue:**
- Language: ${context.language}
- Dialogue Style: ${context.dialogue}

**Cultural Elements:**
${context.cultural}

**Story Structure:**
${context.storyStructure}

**Formatting:**
${context.formatting}

**Character Naming:**
${context.characterNaming}
`.trim();
}

// Get a user-friendly display label
export function getIndustryDisplayInfo(industry: FilmIndustry): { name: string; emoji: string; description: string } {
    const context = filmIndustryContexts[industry];
    return {
        name: context.name,
        emoji: context.emoji,
        description: `${context.style.split(',')[0]}...`
    };
}
