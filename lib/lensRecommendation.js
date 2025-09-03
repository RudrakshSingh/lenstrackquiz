// lib/lensRecommendation.js

// Quiz response mappings to lens attributes
const mappings = {
  'vibe': {
    'Blends in': { style_preference: 'subtle', price_sensitivity: 'budget' },
    'Total signature look': { style_preference: 'premium', price_sensitivity: 'high_end' },
    'Honestly, whatever': { style_preference: 'practical', price_sensitivity: 'mid_range' }
  },
  'glassesAttachment': {
    'Occasionally fling them on': { usage_frequency: 'low', durability_need: 'medium' },
    'Mostly glued': { usage_frequency: 'high', durability_need: 'high' },
    'Forget them all the time': { usage_frequency: 'low', durability_need: 'low' },
    "It's literally my lifeline": { usage_frequency: 'critical', durability_need: 'maximum' }
  },
  'blur': {
    'Near': { lens_type: 'single_vision', power_type: 'minus' },
    'Distance': { lens_type: 'single_vision', power_type: 'plus' },
    'Both': { lens_type: 'progressive', power_type: 'both' },
    "I can't tell anymore": { lens_type: 'progressive', power_type: 'complex' }
  },
  'blurScale': {
    'Crystal clear': { power_strength: 'low', lens_complexity: 'basic' },
    'Just a little fuzzy': { power_strength: 'low', lens_complexity: 'standard' },
    'Pretty bad': { power_strength: 'medium', lens_complexity: 'advanced' },
    'Close to blind-mode': { power_strength: 'high', lens_complexity: 'premium' }
  },
  'tint': {
    'Change with the sun': { transition_needed: true, lifestyle: 'outdoor' },
    'Stay stylishly tinted': { tinted_needed: true, lifestyle: 'fashion' },
    'Keep it simple clear': { transition_needed: false, lifestyle: 'indoor' }
  },
  'screenTime': {
    '<4': { screen_time: 'minimal', blue_light_need: 'basic' },
    '4–8': { screen_time: 'moderate', blue_light_need: 'standard' },
    '8–12': { screen_time: 'extended', blue_light_need: 'advanced' },
    'Zero (I live in 1980s)': { screen_time: 'none', blue_light_need: 'none' }
  },
  'lifestyle': {
    'Screens': { work_type: 'digital', digital_protection_need: 'high' },
    'Paperwork': { work_type: 'reading', digital_protection_need: 'low' },
    'People-facing': { work_type: 'social', digital_protection_need: 'medium' },
    'Lone wolf': { work_type: 'independent', digital_protection_need: 'variable' }
  },
  'workWith': {
    'Colors': { color_accuracy_need: true, work_type: 'creative' },
    'Text': { reading_comfort_need: true, work_type: 'text_heavy' }
  },
  'environment': {
    'Dusty chaos': { durability_need: 'high', coating_need: 'premium' },
    'Spotless clean': { durability_need: 'medium', coating_need: 'standard' },
    'Full sun': { uv_protection_need: 'high', transition_recommended: true },
    'Mix of all': { durability_need: 'high', coating_need: 'advanced' }
  },
  'movement': {
    'Indoors': { uv_need: 'low', transition_need: 'low' },
    'Outdoors': { uv_need: 'high', transition_need: 'high' },
    'Balanced': { uv_need: 'medium', transition_need: 'medium' },
    'Everywhere at once': { uv_need: 'high', transition_need: 'high' }
  },
  'driving': {
    'Day drives': { driving_protection: 'day', glare_protection: 'medium' },
    'Night owl': { driving_protection: 'night', glare_protection: 'high' },
    'Both': { driving_protection: 'all_time', glare_protection: 'premium' },
    'Never': { driving_protection: 'none', glare_protection: 'low' }
  },
  'breakFreq': {
    'Never': { durability_need: 'standard', careful_user: true },
    'Sometimes': { durability_need: 'high', careful_user: false },
    'Always': { durability_need: 'maximum', careful_user: false }
  },
  'smoke': {
    'Nope': { lens_degradation_risk: 'low' },
    'Around 2 a day': { lens_degradation_risk: 'medium' },
    '10-ish': { lens_degradation_risk: 'high' },
    'Chain-smoker vibes': { lens_degradation_risk: 'maximum' }
  },
  'drink': {
    'Once a week ritual': { lifestyle: 'moderate' },
    'More than once a week': { lifestyle: 'active' }
  }
};

// LensTrack Lens Database (price descending order)
const lensDatabase = [
  {
    name: "LensTrack Premium Progressive Pro",
    price: "₹16,500",
    dailyCost: "₹37",
    type: "Progressive",
    score: 0,
    features: ["360° Digital Protection", "Blue Light Shield", "UV Protection", "Anti-Reflection", "Scratch Guard Pro"],
    suitable_for: ['progressive', 'high_end', 'premium', 'extended', 'digital'],
    notes: ["Premium multi-focal technology", "Perfect for executives & professionals", "Seamless near-to-distance vision"]
  },
  {
    name: "LensTrack SmartFocus Advanced",
    price: "₹12,800",
    dailyCost: "₹29",
    type: "Progressive", 
    score: 0,
    features: ["Smart Blue Filter", "UV Shield", "Anti-Glare Pro", "Wide Vision Field"],
    suitable_for: ['progressive', 'high_end', 'both', 'advanced'],
    notes: ["Advanced Indian engineering", "Excellent for both reading & distance", "Reduces digital eye strain by 75%"]
  },
  {
    name: "LensTrack DigitalGuard Plus",
    price: "₹9,200",
    dailyCost: "₹21",
    type: "Single Vision Enhanced",
    score: 0,
    features: ["Digital Eye Protection", "Blue Light Filter", "UV Guard", "Myopia Control Technology"],
    suitable_for: ['single_vision', 'digital', 'extended', 'high', 'myopia_control'],
    notes: ["Specially designed for IT professionals", "Controls myopia progression", "8+ hours screen comfort"]
  },
  {
    name: "LensTrack BlueShield Standard",
    price: "₹6,500",
    dailyCost: "₹15",
    type: "Single Vision",
    score: 0,
    features: ["Blue Light Protection", "Anti-Reflection", "Scratch Resistant", "UV Filter"],
    suitable_for: ['single_vision', 'mid_range', 'digital', 'moderate'],
    notes: ["Most popular choice at LensTrack", "Great value for daily use", "Perfect for students & office workers"]
  },
  {
    name: "LensTrack Essential Clear",
    price: "₹3,800",
    dailyCost: "₹9",
    type: "Single Vision",
    score: 0,
    features: ["Basic Blue Light Filter", "Anti-Glare Coating"],
    suitable_for: ['single_vision', 'budget', 'basic', 'minimal'],
    notes: ["Budget-friendly option", "Good for minimal screen usage", "Essential eye protection"]
  }
];

function mapResponsesToProfile(answers) {
  let profile = {};
  
  for (const [question, response] of Object.entries(answers)) {
    if (mappings[question] && mappings[question][response]) {
      profile = { ...profile, ...mappings[question][response] };
    }
  }
  
  return profile;
}

function calculateLensScore(lens, profile) {
  let score = 0;
  
  // Screen time compatibility (25 points)
  if (profile.screen_time === 'extended' && lens.suitable_for.includes('extended')) score += 25;
  else if (profile.screen_time === 'moderate' && lens.suitable_for.includes('moderate')) score += 20;
  else if (profile.screen_time === 'minimal' && lens.suitable_for.includes('minimal')) score += 15;
  
  // Lens type compatibility (20 points)  
  if (profile.lens_type === 'progressive' && lens.suitable_for.includes('progressive')) score += 20;
  else if (profile.lens_type === 'single_vision' && lens.suitable_for.includes('single_vision')) score += 20;
  
  // Digital protection need (15 points)
  if (profile.digital_protection_need === 'high' && lens.suitable_for.includes('digital')) score += 15;
  else if (profile.digital_protection_need === 'medium' && lens.suitable_for.includes('digital')) score += 10;
  
  // Price sensitivity (15 points)
  if (profile.price_sensitivity === 'high_end' && lens.suitable_for.includes('high_end')) score += 15;
  else if (profile.price_sensitivity === 'mid_range' && lens.suitable_for.includes('mid_range')) score += 15;
  else if (profile.price_sensitivity === 'budget' && lens.suitable_for.includes('budget')) score += 15;
  
  // Durability needs (10 points)
  if (profile.durability_need === 'high' && lens.suitable_for.includes('high')) score += 10;
  else if (profile.durability_need === 'maximum' && lens.suitable_for.includes('premium')) score += 10;
  
  // Power complexity (10 points)
  if (profile.lens_complexity === 'premium' && lens.suitable_for.includes('premium')) score += 10;
  else if (profile.lens_complexity === 'advanced' && lens.suitable_for.includes('advanced')) score += 8;
  else if (profile.lens_complexity === 'standard' && lens.suitable_for.includes('standard')) score += 6;
  
  // Lifestyle factors (5 points)
  if (profile.transition_needed && lens.suitable_for.includes('outdoor')) score += 5;
  if (profile.work_type === 'digital' && lens.suitable_for.includes('digital')) score += 5;
  
  return score;
}

export function getLensRecommendation(answers) {
  // Map answers to user profile
  const profile = mapResponsesToProfile(answers);
  
  // Calculate scores for each lens
  const scoredLenses = lensDatabase.map(lens => ({
    ...lens,
    score: calculateLensScore(lens, profile)
  }));
  
  // Sort by score (desc), then by price (desc) - already in price desc order
  scoredLenses.sort((a, b) => b.score - a.score);
  
  // Get top 3 lenses
  const topLenses = scoredLenses.slice(0, 3);
  
  // Generate primary recommendation
  const primary = topLenses[0];
  
  // Generate add-ons based on profile
  const addons = [];
  if (profile.transition_needed) addons.push("Transition Lenses (+₹3,500)");
  if (profile.digital_protection_need === 'high') addons.push("Advanced Blue Light Filter (+₹1,200)");
  if (profile.driving_protection) addons.push("Anti-Glare Coating (+₹800)");
  if (profile.durability_need === 'maximum') addons.push("Premium Scratch Guard (+₹1,500)");
  
  // Generate personalized notes
  const notes = [];
  if (profile.screen_time === 'extended') notes.push("Perfect for your heavy screen usage - reduces eye strain significantly");
  if (profile.lens_type === 'progressive') notes.push("Smooth transition between near and distance vision");
  if (profile.durability_need === 'high') notes.push("Built tough for your active lifestyle");
  if (profile.price_sensitivity === 'high_end') notes.push("Premium quality with advanced features");
  
  return {
    primary: `${primary.name} - ${primary.price}`,
    lenses: topLenses.map(lens => ({
      name: lens.name,
      price: lens.price,
      dailyCost: lens.dailyCost,
      type: lens.type,
      score: lens.score,
      features: lens.features,
      notes: lens.notes
    })),
    addons: addons.length > 0 ? addons : null,
    notes: notes.length > 0 ? notes : ["Perfectly balanced features for your lifestyle needs"],
    userProfile: profile
  };
}