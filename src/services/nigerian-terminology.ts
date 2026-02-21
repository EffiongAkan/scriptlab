
// Nigerian film industry terminology and cultural context service

export interface TerminologyEntry {
  term: string;
  definition: string;
  category: 'industry' | 'cultural' | 'linguistic' | 'technical';
  region?: 'general' | 'yoruba' | 'igbo' | 'hausa';
  examples: string[];
  alternatives?: string[];
}

export interface DialogueEnhancement {
  original: string;
  enhanced: string;
  culturalContext: string;
  confidence: number;
}

// Comprehensive Nigerian film industry terminology
const NOLLYWOOD_TERMINOLOGY: TerminologyEntry[] = [
  // Industry Terms
  {
    term: "Nollywood",
    definition: "The Nigerian film industry, primarily based in Lagos",
    category: "industry",
    region: "general",
    examples: ["Nollywood has become the second largest film industry globally", "She's a rising Nollywood star"],
    alternatives: ["Nigerian Cinema", "Naija Movies"]
  },
  {
    term: "Home Video",
    definition: "Direct-to-video films that defined early Nollywood",
    category: "industry",
    region: "general",
    examples: ["The home video era revolutionized Nigerian cinema", "This is a classic home video production"],
    alternatives: ["Straight-to-video", "Direct video"]
  },
  {
    term: "Marketer",
    definition: "Film distributor in the Nollywood industry",
    category: "industry",
    region: "general",
    examples: ["The marketer decided to fund the sequel", "She's negotiating with several marketers"],
    alternatives: ["Distributor", "Film investor"]
  },

  // Cultural Terms
  {
    term: "Oga",
    definition: "Boss, leader, or person in authority",
    category: "cultural",
    region: "general",
    examples: ["Yes oga, I will handle it immediately", "The oga wants to see you in his office"],
    alternatives: ["Boss", "Chief", "Sir"]
  },
  {
    term: "Madam",
    definition: "Respectful term for a woman, especially older or in authority",
    category: "cultural",
    region: "general",
    examples: ["Good morning madam", "Madam, your order is ready"],
    alternatives: ["Ma", "Aunty"]
  },
  {
    term: "Compound",
    definition: "Family residential area with multiple buildings",
    category: "cultural",
    region: "general",
    examples: ["The whole compound gathered for the meeting", "She lives in the family compound"],
    alternatives: ["Family house", "Yard"]
  },

  // Yoruba-specific
  {
    term: "Baba",
    definition: "Father, elder, or respected older man",
    category: "cultural",
    region: "yoruba",
    examples: ["Baba, please bless this union", "The village baba will decide"],
    alternatives: ["Father", "Elder", "Daddy"]
  },
  {
    term: "Mama",
    definition: "Mother, elder, or respected older woman",
    category: "cultural",
    region: "yoruba",
    examples: ["Mama, thank you for your wisdom", "Mama is cooking for the ceremony"],
    alternatives: ["Mother", "Mummy", "Elder"]
  },

  // Igbo-specific
  {
    term: "Nna",
    definition: "Father or respectful term for older man",
    category: "cultural",
    region: "igbo",
    examples: ["Nna, what do you think about this?", "Ask nna for his blessing"],
    alternatives: ["Father", "Papa", "Sir"]
  },
  {
    term: "Nne",
    definition: "Mother or respectful term for older woman",
    category: "cultural",
    region: "igbo",
    examples: ["Nne, please help me with this", "Nne knows what's best"],
    alternatives: ["Mother", "Mama", "Ma"]
  },

  // Hausa-specific
  {
    term: "Mallam",
    definition: "Learned man, teacher, or Islamic scholar",
    category: "cultural",
    region: "hausa",
    examples: ["Mallam taught us about honesty", "The mallam will lead the prayers"],
    alternatives: ["Teacher", "Scholar", "Sir"]
  },
  {
    term: "Hajiya",
    definition: "Respectful title for a woman who has performed Hajj",
    category: "cultural",
    region: "hausa",
    examples: ["Hajiya, welcome back from your travels", "Hajiya will advise us"],
    alternatives: ["Madam", "Ma", "Aunty"]
  },

  // Linguistic/Pidgin
  {
    term: "Wahala",
    definition: "Problem, trouble, or difficulty",
    category: "linguistic",
    region: "general",
    examples: ["This matter go cause wahala", "No wahala, we go handle am"],
    alternatives: ["Problem", "Trouble", "Issue"]
  },
  {
    term: "Sabi",
    definition: "To know, understand, or be skilled at",
    category: "linguistic",
    region: "general",
    examples: ["You sabi this thing?", "She sabi sing well well"],
    alternatives: ["Know", "Understand", "Can do"]
  }
];

// Regional dialogue patterns
const REGIONAL_PATTERNS = {
  lagos: {
    greetings: ["How far?", "Wetin dey happen?", "How you dey?"],
    expressions: ["Las las", "No be small thing", "E choke", "Sabi"],
    respectTerms: ["Oga", "Madam", "Uncle", "Aunty"]
  },
  abuja: {
    greetings: ["Good morning sir", "How are you doing?", "Hope you're fine?"],
    expressions: ["Wallahi", "Honestly", "You understand", "True talk"],
    respectTerms: ["Sir", "Ma", "Oga", "Madam"]
  },
  kano: {
    greetings: ["Sannu", "Barka da safe", "Yaya lafiya?"],
    expressions: ["Wallahi", "Kai", "To Allah", "In sha Allah"],
    respectTerms: ["Mallam", "Hajiya", "Oga", "Madam"]
  }
};

export class NigerianTerminologyService {
  
  static getTerminology(category?: TerminologyEntry['category'], region?: TerminologyEntry['region']): TerminologyEntry[] {
    let filtered = NOLLYWOOD_TERMINOLOGY;
    
    if (category) {
      filtered = filtered.filter(term => term.category === category);
    }
    
    if (region && region !== 'general') {
      filtered = filtered.filter(term => term.region === region || term.region === 'general');
    }
    
    return filtered;
  }
  
  static searchTerms(query: string): TerminologyEntry[] {
    const searchTerm = query.toLowerCase();
    return NOLLYWOOD_TERMINOLOGY.filter(term =>
      term.term.toLowerCase().includes(searchTerm) ||
      term.definition.toLowerCase().includes(searchTerm) ||
      term.examples.some(example => example.toLowerCase().includes(searchTerm))
    );
  }
  
  static enhanceDialogue(text: string, region: keyof typeof REGIONAL_PATTERNS = 'lagos'): DialogueEnhancement[] {
    const enhancements: DialogueEnhancement[] = [];
    const patterns = REGIONAL_PATTERNS[region];
    
    // Check for overly formal language that could be made more authentic
    if (text.includes('I am going to') && !text.includes('I dey go')) {
      enhancements.push({
        original: text,
        enhanced: text.replace('I am going to', 'I dey go'),
        culturalContext: 'Nigerian Pidgin is commonly used in informal settings',
        confidence: 85
      });
    }
    
    // Check for missing respect terms
    if (text.includes('Hey you') || text.includes('You there')) {
      enhancements.push({
        original: text,
        enhanced: text.replace(/Hey you|You there/g, 'Oga'),
        culturalContext: 'Nigerians typically use respectful terms when addressing others',
        confidence: 90
      });
    }
    
    // Suggest regional greetings
    if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
      const regionalGreeting = patterns.greetings[Math.floor(Math.random() * patterns.greetings.length)];
      enhancements.push({
        original: text,
        enhanced: text.replace(/hello|hi/gi, regionalGreeting),
        culturalContext: `${region} region commonly uses this greeting style`,
        confidence: 80
      });
    }
    
    return enhancements;
  }
  
  static validateCulturalContext(text: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 80; // Base score
    
    // Check for cultural appropriateness
    const problematicTerms = ['primitive', 'backward', 'uncivilized'];
    const hasProblematic = problematicTerms.some(term => 
      text.toLowerCase().includes(term)
    );
    
    if (hasProblematic) {
      score -= 30;
      issues.push('Contains potentially insensitive language');
      suggestions.push('Use more respectful terminology when describing cultural practices');
    }
    
    // Check for Nigerian context markers
    const contextMarkers = ['nigeria', 'lagos', 'abuja', 'nollywood', 'pidgin'];
    const hasContext = contextMarkers.some(marker => 
      text.toLowerCase().includes(marker)
    );
    
    if (!hasContext) {
      score -= 10;
      suggestions.push('Consider adding specific Nigerian location or cultural references');
    }
    
    // Check for authentic dialogue patterns
    const authenticPatterns = ['wetin', 'how far', 'oga', 'madam', 'wahala'];
    const hasAuthentic = authenticPatterns.some(pattern => 
      text.toLowerCase().includes(pattern)
    );
    
    if (hasAuthentic) {
      score += 10;
    } else {
      suggestions.push('Include Nigerian Pidgin or local expressions for authenticity');
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      suggestions
    };
  }
  
  static getRegionalDialoguePatterns(region: keyof typeof REGIONAL_PATTERNS): {
    greetings: string[];
    expressions: string[];
    respectTerms: string[];
  } {
    return REGIONAL_PATTERNS[region] || REGIONAL_PATTERNS.lagos;
  }
  
  static generateContextualSuggestions(elementType: string, content: string): string[] {
    const suggestions: string[] = [];
    
    if (elementType === 'dialogue') {
      suggestions.push(
        'Consider using Nigerian Pidgin for informal conversations',
        'Add respect terms like "Oga", "Madam", "Uncle", or "Aunty"',
        'Include regional greetings for authenticity'
      );
    }
    
    if (elementType === 'character') {
      suggestions.push(
        'Use authentic Nigerian names from different ethnic groups',
        'Consider the character\'s regional background for speech patterns',
        'Think about the character\'s social status and how it affects their language'
      );
    }
    
    if (elementType === 'heading') {
      suggestions.push(
        'Use specific Nigerian locations (Lagos, Abuja, Kano, etc.)',
        'Consider the cultural significance of the location',
        'Think about how location affects character behavior and dialogue'
      );
    }
    
    return suggestions;
  }
}
