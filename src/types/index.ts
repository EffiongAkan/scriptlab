// Script Types
export interface Script {
  id: string;
  title: string;
  genre: Genre;
  subGenres: SubGenre[];
  createdAt: Date;
  updatedAt: Date;
  description: string;
  scenes: Scene[];
  characters: Character[];
  plotElements: PlotElement[];
  culturalSettings: CulturalSetting;
  language: Language;
  collaborators: string[]; // User IDs
  version: number;
  tags: string[];
}

export interface Scene {
  id: string;
  title: string;
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  characters: string[]; // Character IDs
  dialogue: DialogueLine[];
  actions: string[];
  notes: string;
  tension: number; // 1-10
}

export interface DialogueLine {
  id: string;
  characterId: string;
  text: string;
  language: Language;
  emotion: string;
  parenthetical?: string;
}

export interface Character {
  id: string;
  name: string;
  age: number;
  gender: string;
  background: string;
  personality: string[];
  goals: string[];
  conflicts: string[];
  relationships: Relationship[];
  culturalBackground: CulturalBackground;
  imageUrl?: string;
}

export interface Relationship {
  characterId: string;
  relationshipType: string;
  description: string;
}

export interface PlotElement {
  id: string;
  type: PlotElementType;
  description: string;
  relatedScenes: string[]; // Scene IDs
  relatedCharacters: string[]; // Character IDs
}

export interface CulturalSetting {
  region: string;
  era: string;
  culturalElements: string[];
  languages: Language[];
  traditions: string[];
  locations: string[];
}

export interface CulturalBackground {
  ethnicity: string;
  religion?: string;
  region: string;
  languages: Language[];
  traditions: string[];
}

// Enums - converting from types to const enums with string values
export enum Genre {
  DRAMA = 'Drama',
  COMEDY = 'Comedy',
  ACTION = 'Action',
  THRILLER = 'Thriller',
  ROMANCE = 'Romance',
  HORROR = 'Horror',
  SCIFI = 'SciFi',
  FANTASY = 'Fantasy',
  DOCUMENTARY = 'Documentary',
  MUSICAL = 'Musical'
}

export enum SubGenre {
  COMING_OF_AGE = 'Coming of Age',
  CRIME = 'Crime',
  HISTORICAL = 'Historical',
  POLITICAL = 'Political',
  SATIRE = 'Satire',
  FAMILY = 'Family',
  ADVENTURE = 'Adventure',
  MYSTERY = 'Mystery',
  SUPERNATURAL = 'Supernatural',
  FOLK_TALE = 'Folk Tale',
  BIOGRAPHICAL = 'Biographical'
}

export enum Language {
  ENGLISH = 'English',
  YORUBA = 'Yoruba',
  IGBO = 'Igbo',
  HAUSA = 'Hausa',
  PIDGIN = 'Pidgin',
  SWAHILI = 'Swahili',
  AMHARIC = 'Amharic',
  ZULU = 'Zulu',
  HINDI = 'Hindi',
  KOREAN = 'Korean',
  FRENCH = 'French',
  SPANISH = 'Spanish',
  CHINESE = 'Chinese',
  JAPANESE = 'Japanese',
  ARABIC = 'Arabic',
  MIXED = 'Mixed'
}

export type PlotElementType =
  | 'Conflict'
  | 'Resolution'
  | 'Revelation'
  | 'Twist'
  | 'Subplot';

// Script Type Classifications
export enum ScriptType {
  SHORT_FILM = 'Short Film',
  FEATURE_FILM = 'Feature Film',
  SKIT = 'Skit',
  DOCUMENTARY = 'Documentary',
  TV_PILOT = 'TV Pilot',
  TV_SERIES = 'TV Series Episode',
  WEB_SERIES = 'Web Series',
  MUSIC_VIDEO = 'Music Video',
  COMMERCIAL = 'Commercial/Ad',
  STAGE_PLAY = 'Stage Play'
}

// Film Industry Classifications
export enum FilmIndustry {
  HOLLYWOOD = 'Hollywood',
  BOLLYWOOD = 'Bollywood',
  NOLLYWOOD = 'Nollywood',
  GHALLYWOOD = 'Ghallywood',
  LOLLYWOOD = 'Lollywood',
  POLLYWOOD = 'Pollywood',
  HALLYUWOOD = 'Hallyuwood',
  COLLYWOOD = 'Collywood',
  JOLLYWOOD = 'Jollywood',
  HONG_KONG = 'Hong Kong Cinema',
  CHINESE = 'Chinese Cinema',
  FRENCH = 'French Cinema',
  ITALIAN = 'Italian Cinema',
  GERMAN = 'German Cinema',
  MEXICAN = 'Mexican Cinema',
  INTERNATIONAL = 'International Standard'
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  scripts: string[]; // Script IDs
  collaborations: string[]; // Script IDs
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultLanguage: Language;
  favoriteGenres: Genre[];
  theme: "light" | "dark";
  autosaveInterval: number; // Minutes
}

// Analytics Types
export interface ScriptAnalytics {
  scriptId: string;
  characterFrequency: Record<string, number>; // Character ID to scene count
  emotionalArcs: EmotionalArc[];
  pacing: PacingMetric[];
  culturalAuthenticityScore: number; // 0-100
  languageDistribution: Record<Language, number>; // Percentage of each language
}

export interface EmotionalArc {
  sceneId: string;
  emotionalIntensity: number; // 1-10
  primaryEmotion: string;
}

export interface PacingMetric {
  sceneId: string;
  paceRating: number; // 1-10, slow to fast
  sceneLength: number; // Words or lines
}

// AI Generation Types
export interface GenerationPrompt {
  genre: Genre;
  subGenres?: SubGenre[];
  setting?: Partial<CulturalSetting>;
  characterCount?: number;
  seedPlot?: string;
  tonePreference?: string;
  language: Language;
  includeElements?: string[];
}

export interface GenerationResult {
  scriptOutline: Partial<Script>;
  characters: Partial<Character>[];
  suggestedScenes: Partial<Scene>[];
  culturalNotes: string[];
}

// Video Analysis Types
export interface VideoAnalysis {
  sourceUrl: string;
  videoTitle?: string;
  videoDuration?: number;
  extractedGenre: Genre;
  detectedTone: string;
  storyStructure: string;
  themes: string[];
  characterTypes: string[];
  dialogueStyle: string;
  visualElements: string[];
  culturalContext: string;
  pacing: string;
  keyInsights: string;
  suggestedScriptType?: ScriptType;
  suggestedIndustry?: FilmIndustry;
  thumbnailUrl?: string;
  isCached?: boolean;
  timestamp: Date;
  metadataStatus?: 'real' | 'fallback';
  logline?: string;
  synopsis?: string;
  keyCharacters?: Array<{
    name: string;
    role: string;
    description: string;
  }>;
}

export interface VideoAnalysisRequest {
  videoUrl: string;
  userId?: string;
}

export interface VideoAnalysisResponse {
  success: boolean;
  analysis?: VideoAnalysis;
  error?: string;
}
