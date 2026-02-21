
// Nigerian cultural validation service
export interface CulturalValidationResult {
  score: number; // 0-100
  suggestions: string[];
  warnings: string[];
  enhancements: string[];
}

// Common Nigerian names database
const NIGERIAN_NAMES = {
  yoruba: [
    'Adebayo', 'Adunni', 'Funmi', 'Tunde', 'Kemi', 'Seun', 'Yemi', 'Bola',
    'Dele', 'Folake', 'Gbenga', 'Iyabo', 'Jide', 'Kola', 'Lola', 'Nike',
    'Ola', 'Peju', 'Remi', 'Sola', 'Tayo', 'Wale', 'Yinka', 'Zainab'
  ],
  igbo: [
    'Adaora', 'Chidi', 'Emeka', 'Ifeoma', 'Kelechi', 'Ngozi', 'Obi', 'Chioma',
    'Uchenna', 'Amara', 'Ebuka', 'Oluchi', 'Ikenna', 'Adanna', 'Chinedu',
    'Chiamaka', 'Obinna', 'Chinelo', 'Ifeanyi', 'Adaeze', 'Chukwuma', 'Nneka'
  ],
  hausa: [
    'Aisha', 'Fatima', 'Hauwa', 'Maryam', 'Zainab', 'Ibrahim', 'Usman', 'Yusuf',
    'Ahmad', 'Abdullahi', 'Musa', 'Aliyu', 'Halima', 'Khadija', 'Safiya',
    'Amina', 'Bashir', 'Garba', 'Ismail', 'Jamila', 'Lawal', 'Nasir'
  ]
};

// Nigerian locations database
const NIGERIAN_LOCATIONS = [
  // Major cities
  'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna',
  'Jos', 'Ilorin', 'Aba', 'Onitsha', 'Warri', 'Sokoto', 'Calabar', 'Enugu',
  
  // States
  'Lagos State', 'Ogun State', 'Oyo State', 'Osun State', 'Ondo State',
  'Ekiti State', 'Kwara State', 'Kogi State', 'Benue State', 'Plateau State',
  'Nasarawa State', 'Niger State', 'Kaduna State', 'Katsina State',
  'Kano State', 'Jigawa State', 'Yobe State', 'Borno State', 'Adamawa State',
  'Taraba State', 'Gombe State', 'Bauchi State', 'Kebbi State', 'Sokoto State',
  'Zamfara State', 'Anambra State', 'Enugu State', 'Ebonyi State',
  'Cross River State', 'Akwa Ibom State', 'Rivers State', 'Bayelsa State',
  'Delta State', 'Edo State', 'Imo State', 'Abia State'
];

// Cultural elements to look for
const CULTURAL_ELEMENTS = {
  greetings: [
    'good morning', 'good afternoon', 'good evening', 'how are you',
    'bawo', 'sannu', 'ndewo', 'kedu', 'oga', 'madam', 'sir', 'aunty', 'uncle'
  ],
  respect_terms: [
    'sir', 'ma', 'madam', 'oga', 'aunty', 'uncle', 'mama', 'papa', 'elder',
    'senior', 'chief', 'alhaji', 'hajiya', 'reverend', 'pastor', 'imam'
  ],
  food_references: [
    'jollof rice', 'pounded yam', 'egusi', 'pepper soup', 'suya', 'akara',
    'moi moi', 'plantain', 'yam', 'garri', 'fufu', 'amala', 'tuwo', 'masa'
  ],
  cultural_practices: [
    'kola nut', 'traditional wedding', 'naming ceremony', 'burial ceremony',
    'village meeting', 'town hall', 'festival', 'masquerade', 'traditional ruler',
    'family compound', 'extended family', 'polygamy', 'dowry', 'bride price'
  ]
};

// Function to analyze script for cultural authenticity
export const validateCulturalAuthenticity = (scriptContent: string): CulturalValidationResult => {
  const content = scriptContent.toLowerCase();
  const words = content.split(/\s+/);
  
  let score = 0;
  const suggestions: string[] = [];
  const warnings: string[] = [];
  const enhancements: string[] = [];
  
  // Check for Nigerian names
  const nameCount = Object.values(NIGERIAN_NAMES).flat()
    .filter(name => content.includes(name.toLowerCase())).length;
  
  if (nameCount > 0) {
    score += 20;
  } else {
    suggestions.push("Consider using authentic Nigerian names for characters to increase cultural authenticity.");
  }
  
  // Check for Nigerian locations
  const locationCount = NIGERIAN_LOCATIONS
    .filter(location => content.includes(location.toLowerCase())).length;
  
  if (locationCount > 0) {
    score += 15;
  } else {
    suggestions.push("Include specific Nigerian locations to ground the story in a recognizable setting.");
  }
  
  // Check for cultural greetings
  const greetingCount = CULTURAL_ELEMENTS.greetings
    .filter(greeting => content.includes(greeting)).length;
  
  if (greetingCount > 0) {
    score += 15;
  } else {
    suggestions.push("Add Nigerian greetings and local expressions to make dialogue more authentic.");
  }
  
  // Check for respect terms
  const respectCount = CULTURAL_ELEMENTS.respect_terms
    .filter(term => content.includes(term)).length;
  
  if (respectCount > 0) {
    score += 20;
  } else {
    suggestions.push("Include respect terms like 'Uncle', 'Aunty', 'Sir', 'Ma' which are common in Nigerian culture.");
  }
  
  // Check for food references
  const foodCount = CULTURAL_ELEMENTS.food_references
    .filter(food => content.includes(food)).length;
  
  if (foodCount > 0) {
    score += 10;
    enhancements.push(`Great! You included ${foodCount} Nigerian food reference(s). This adds cultural depth.`);
  } else {
    enhancements.push("Consider adding references to Nigerian cuisine to create a more immersive cultural experience.");
  }
  
  // Check for cultural practices
  const practiceCount = CULTURAL_ELEMENTS.cultural_practices
    .filter(practice => content.includes(practice)).length;
  
  if (practiceCount > 0) {
    score += 20;
    enhancements.push(`Excellent! You included ${practiceCount} cultural practice reference(s).`);
  } else {
    enhancements.push("Include traditional Nigerian practices or ceremonies to strengthen cultural authenticity.");
  }
  
  // Check for potential cultural insensitivities (basic check)
  const problematicTerms = ['primitive', 'backward', 'uncivilized', 'savage'];
  const problematicCount = problematicTerms.filter(term => content.includes(term)).length;
  
  if (problematicCount > 0) {
    score -= 30;
    warnings.push("Detected potentially insensitive language. Consider more respectful terminology.");
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Add overall suggestions based on score
  if (score < 30) {
    suggestions.unshift("Consider significantly enhancing the Nigerian cultural elements in your script.");
  } else if (score < 60) {
    suggestions.unshift("Your script has some cultural elements, but could benefit from more authentic Nigerian touches.");
  } else if (score < 80) {
    enhancements.unshift("Good cultural authenticity! A few more enhancements could make it even better.");
  } else {
    enhancements.unshift("Excellent cultural authenticity! Your script feels genuinely Nigerian.");
  }
  
  return {
    score,
    suggestions,
    warnings,
    enhancements
  };
};

// Function to suggest Nigerian character names
export const suggestNigerianNames = (ethnicity?: 'yoruba' | 'igbo' | 'hausa'): string[] => {
  if (ethnicity) {
    return NIGERIAN_NAMES[ethnicity].slice(0, 10);
  }
  
  // Return mix from all ethnicities
  return [
    ...NIGERIAN_NAMES.yoruba.slice(0, 3),
    ...NIGERIAN_NAMES.igbo.slice(0, 3),
    ...NIGERIAN_NAMES.hausa.slice(0, 3)
  ];
};

// Function to suggest Nigerian locations
export const suggestNigerianLocations = (type?: 'urban' | 'rural'): string[] => {
  const urban = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City'];
  const rural = ['Village square', 'Family compound', 'Traditional ruler\'s palace', 'Local market', 'Farmland', 'River side'];
  
  if (type === 'urban') return urban;
  if (type === 'rural') return rural;
  
  return [...urban.slice(0, 3), ...rural.slice(0, 3)];
};
