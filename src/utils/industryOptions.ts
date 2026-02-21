import { FilmIndustry, Language } from '@/types';

export interface IndustryOptionSet {
    tones: string[];
    periods: { label: string; value: string }[];
    settings: string[];
    paces: string[];
    languages: { label: string; value: Language }[];
}

export const industryOptions: Partial<Record<FilmIndustry, IndustryOptionSet>> = {
    [FilmIndustry.NOLLYWOOD]: {
        tones: ['Dramatic', 'Comedic', 'Melodramatic', 'Supernatural', 'Satirical', 'Moral Lesson'],
        periods: [
            { label: 'Modern Day (2020s)', value: 'Modern Day' },
            { label: 'Recent Past (2000s-2010s)', value: 'Recent Past' },
            { label: 'Golden Age (1990s)', value: '1990s' },
            { label: 'Early Video Era (1980s)', value: '1980s' },
            { label: 'Colonial Era', value: 'Colonial Era' },
            { label: 'Pre-Colonial Times', value: 'Pre-Colonial' }
        ],
        settings: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan', 'Enugu', 'Rural Village', 'Small Town', 'International (Diaspora)'],
        paces: ['Moderate', 'Fast-paced', 'Snappy', 'Slow-burn'],
        languages: [
            { label: 'English', value: Language.ENGLISH },
            { label: 'Yoruba', value: Language.YORUBA },
            { label: 'Igbo', value: Language.IGBO },
            { label: 'Hausa', value: Language.HAUSA },
            { label: 'Pidgin English', value: Language.PIDGIN },
            { label: 'Mixed (Code-switching)', value: Language.MIXED }
        ]
    },
    [FilmIndustry.HOLLYWOOD]: {
        tones: ['Blockbuster', 'Indie / Sundance', 'Gritty Realism', 'Emotional / Heartfelt', 'Stylized / High-Concept', 'Dark Comedy'],
        periods: [
            { label: 'Modern Day', value: 'Modern Day' },
            { label: 'Classic Hollywood (1940s-50s)', value: 'Classic Hollywood' },
            { label: 'Nostalgic (1980s-90s)', value: '80s-90s' },
            { label: 'Historical Period', value: 'Historical' },
            { label: 'Near Future', value: 'Near Future' },
            { label: 'Sci-Fi Future', value: 'Distant Future' }
        ],
        settings: ['New York City', 'Los Angeles', 'London', 'Small Town America', 'Space / Futuristic', 'Wild West', 'Generic Urban'],
        paces: ['Fast-paced', 'Moderate', 'Slow-burn', 'Thriller-paced'],
        languages: [
            { label: 'English', value: Language.ENGLISH },
            { label: 'Mixed / Multilingual', value: Language.MIXED }
        ]
    },
    [FilmIndustry.BOLLYWOOD]: {
        tones: ['Masala (Action-Comedy-Drama-Musical)', 'Romantic / Musical', 'Family Saga', 'Social Message', 'Historical / Epic', 'Suspense Thriller'],
        periods: [
            { label: 'Modern India', value: 'Modern Day' },
            { label: '1970s Retro', value: '1970s' },
            { label: 'Pre-Partition / Independence', value: 'Pre-Partition' },
            { label: 'Mughal Empire', value: 'Mughal Era' },
            { label: 'Ancient Mythology', value: 'Mythological' }
        ],
        settings: ['Mumbai', 'Delhi', 'Punjab / Rural India', 'London / Foreign Setting', 'Small Town India', 'Hill Station'],
        paces: ['Moderate', 'Fast-paced', 'Extended Epic Style', 'Song-heavy'],
        languages: [
            { label: 'Hindi', value: Language.HINDI },
            { label: 'English (Hinglish)', value: Language.ENGLISH },
            { label: 'Mixed', value: Language.MIXED }
        ]
    },
    [FilmIndustry.HALLYUWOOD]: {
        tones: ['Romantic (Slow-burn)', 'Melodramatic', 'High-stakes Thriller', 'Period Drama (Joseon)', 'Contemporary Slice-of-Life', 'Revenge / Noir'],
        periods: [
            { label: 'Modern Korea (2020s)', value: 'Modern Day' },
            { label: 'Joseon Era', value: 'Joseon' },
            { label: 'Goryeo Era', value: 'Goryeo' },
            { label: '1980s Democratization Era', value: '1980s' },
            { label: 'Japanese Occupation', value: 'Japanese Occupation' }
        ],
        settings: ['Seoul (Gangnam / Hongdae)', 'Busan', 'Jeju Island', 'Rural Village', 'Chaebol Corporate Office', 'Traditional Hanok Village'],
        paces: ['Slow-burn', 'Moderate', 'Fast-paced', 'Suspenseful'],
        languages: [
            { label: 'Korean', value: Language.KOREAN },
            { label: 'Mixed', value: Language.MIXED }
        ]
    },
    [FilmIndustry.FRENCH]: {
        tones: ['Art House / Avant-Garde', 'Philosophical Drama', 'Romantic Realism', 'New Wave Stylized', 'Dark Humour'],
        periods: [
            { label: 'Contemporary France', value: 'Modern Day' },
            { label: 'Nouvelle Vague (1960s)', value: '60s' },
            { label: 'Historical Revolution Period', value: 'Historical' },
            { label: 'WWI / WWII Era', value: 'War Era' }
        ],
        settings: ['Parisian Café', 'French Riviera', 'Brittany Coast', 'Versailles / Palace', 'Rural Vineyard'],
        paces: ['Pensive (Slow)', 'Character-driven (Moderate)', 'Snappy Dialogue'],
        languages: [
            { label: 'French', value: Language.FRENCH },
            { label: 'English', value: Language.ENGLISH },
            { label: 'Mixed', value: Language.MIXED }
        ]
    },
    [FilmIndustry.GHALLYWOOD]: {
        tones: ['Dramatic', 'Comedic', 'Moral Theme', 'Cultural / Traditional', 'Romantic'],
        periods: [
            { label: 'Modern Day', value: 'Modern Day' },
            { label: 'Post-Independence', value: 'Post-Independence' },
            { label: 'Colonial Era', value: 'Colonial Era' },
            { label: 'Pre-Colonial', value: 'Pre-Colonial' }
        ],
        settings: ['Accra', 'Kumasi', 'Cape Coast', 'Rural Village', 'Coastal Town'],
        paces: ['Moderate', 'Fast-paced', 'Slow-burn'],
        languages: [
            { label: 'English', value: Language.ENGLISH },
            { label: 'Mixed', value: Language.MIXED }
        ]
    }
};

// Fallback / International defaults
export const defaultIndustryOptions: IndustryOptionSet = {
    tones: ['Dramatic', 'Light-hearted', 'Suspenseful', 'Romantic', 'Dark', 'Satirical'],
    periods: [
        { label: 'Modern Day (2020s)', value: 'Modern Day' },
        { label: 'Recent Past (2000s-2010s)', value: 'Recent Past' },
        { label: 'Late 20th Century', value: 'Late 20th Century' },
        { label: 'Mid 20th Century', value: 'Mid 20th Century' },
        { label: 'Historical Period', value: 'Historical' },
        { label: 'Future / Sci-Fi', value: 'Future' }
    ],
    settings: ['Urban City', 'Rural / Countryside', 'Small Town', 'International Location', 'Space / Off-world', 'Wilderness'],
    paces: ['Slow-burn', 'Moderate', 'Fast-paced', 'Thriller-paced'],
    languages: [
        { label: 'English', value: Language.ENGLISH },
        { label: 'Mixed', value: Language.MIXED }
    ]
};

export const getOptionsForIndustry = (industry?: FilmIndustry): IndustryOptionSet => {
    if (!industry || !industryOptions[industry]) {
        return defaultIndustryOptions;
    }
    return industryOptions[industry];
};
