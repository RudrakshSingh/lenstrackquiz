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
    'Nope': { lifestyle: 'none' },
    'Once a week ritual': { lifestyle: 'moderate' },
    'More than once a week': { lifestyle: 'active' }
  }
};

// Lens catalog sourced from Lenstrack artwork
// Prices are "starts at" and used for ordering from least to most expensive
const lensDatabase = [
  // Single Vision
  { name: 'HardX',                    type: 'Single Vision',          price: '₹300',   numericPrice: 300,   dailyCost: '₹1',   features: ['Scratch Armor', 'Durable coating'],                                 suitable_for: ['single_vision', 'budget'],              capabilities: ['scratch_resistant','durable'],                                  notes: ['Best for minimal screen time'] },
  { name: 'Pureview',                 type: 'Single Vision',          price: '₹500',   numericPrice: 500,   dailyCost: '₹1.5', features: ['AR Multilayer', 'Clarity'],                                          suitable_for: ['single_vision'],                          capabilities: ['anti_reflection','clarity'],                                 notes: ['Great clarity for daily use'] },
  { name: 'BlueXpert',                type: 'Single Vision',          price: '₹800',   numericPrice: 800,   dailyCost: '₹2',   features: ['Blue Light Block', 'AR Multilayer'],                                  suitable_for: ['single_vision', 'digital'],              capabilities: ['blue_light','anti_reflection','digital'],                 notes: ['Good for 2–6 hrs/day screens'] },
  { name: 'DuraShield Nature',        type: 'Single Vision',          price: '₹2000',  numericPrice: 2000,  dailyCost: '₹5',   features: ['Dual Side AR + Fluoropolymer', 'Natural colour perception'],         suitable_for: ['single_vision', 'creative'],             capabilities: ['anti_reflection','clarity','natural_color'],               notes: ['Comfortable for creative work'] },
  { name: 'DriveXpert',               type: 'Single Vision',          price: '₹2500',  numericPrice: 2500,  dailyCost: '₹6',   features: ['Driving protection', 'Hydrophobic & Oleophobic'],                    suitable_for: ['single_vision', 'driving'],              capabilities: ['driving','anti_glare','hydrophobic'],                     notes: ['Sharper day/night driving'] },
  { name: 'DIGI360 Advanced',         type: 'Single Vision',          price: '₹3000',  numericPrice: 3000,  dailyCost: '₹8',   features: ['360° Digital Protection', 'Blue Light Block', 'UV + Sun protection'], suitable_for: ['single_vision', 'digital', 'extended'], capabilities: ['digital','blue_light','uv','anti_reflection'],             notes: ['For heavy screen usage'] },

  // Progressive
  { name: 'HardX (Progressive)',      type: 'Progressive',            price: '₹1,500', numericPrice: 1500, dailyCost: '₹4',  features: ['Everyday Scratch Armor'],                                            suitable_for: ['progressive', 'budget'],              capabilities: ['scratch_resistant','durable'],                              notes: ['Entry progressive option'] },
  { name: 'Pureview (Progressive)',   type: 'Progressive',            price: '₹2,000', numericPrice: 2000, dailyCost: '₹5',  features: ['AR Multilayer'],                                                   suitable_for: ['progressive'],                          capabilities: ['anti_reflection','clarity'],                                 notes: ['Balanced performance'] },
  { name: 'BlueXpert (Progressive)',  type: 'Progressive',            price: '₹3,500', numericPrice: 3500, dailyCost: '₹10', features: ['Absorbers + AR Multilayer', 'Blue Light Block'],                    suitable_for: ['progressive', 'digital'],              capabilities: ['blue_light','digital','anti_reflection'],                  notes: ['Good for screens'] },
  { name: 'VisionX Neo',              type: 'Progressive',            price: '₹6,000', numericPrice: 6000, dailyCost: '₹16', features: ['Dual side AR + Fluoropolymer'],                                   suitable_for: ['progressive'],                          capabilities: ['wide_field','smooth_transition','anti_reflection'],        notes: ['Wide field of vision'] },
  { name: 'VisionX Elite',            type: 'Progressive',            price: '₹8,000', numericPrice: 8000, dailyCost: '₹21', features: ['Pupillary Light Reflex compatibility'],                             suitable_for: ['progressive'],                          capabilities: ['smooth_transition','wide_field'],                           notes: ['Smooth power transition'] },
  { name: 'VisionX Ultra',            type: 'Progressive',            price: '₹12,000', numericPrice: 12000, dailyCost: '₹32', features: ['ION Bombardment technology'],                                     suitable_for: ['progressive', 'high_end'],             capabilities: ['wide_field','premium','smooth_transition'],                notes: ['Premium, wide field of vision'] },

  // Bifocal (basic set included for completeness; currently not directly selected by quiz)
  { name: 'Pureview (Bifocal)',       type: 'Bifocal',                price: '₹1,800', numericPrice: 1800, dailyCost: '₹5',  features: ['AR Multilayer'],                                                   suitable_for: ['bifocal'],                          capabilities: ['anti_reflection'],                                        notes: ['Basic bifocal option'] },
  { name: 'BlueXpert (Bifocal)',      type: 'Bifocal',                price: '₹2,000', numericPrice: 2000, dailyCost: '₹6',  features: ['Blue Light Filter', 'AR Multilayer'],                                suitable_for: ['bifocal', 'digital'],              capabilities: ['blue_light','digital','anti_reflection'],                  notes: ['For some screen time'] },
  { name: 'DriveXpert (Bifocal)',     type: 'Bifocal',                price: '₹3,500', numericPrice: 3500, dailyCost: '₹10', features: ['Driving Protection'],                                              suitable_for: ['bifocal', 'driving'],              capabilities: ['driving','anti_glare'],                                     notes: ['Safer driving'] },
  { name: 'DIGI360 Advanced (Bifocal)',type: 'Bifocal',               price: '₹4,000', numericPrice: 4000, dailyCost: '₹12', features: ['Advanced digital filter'],                                         suitable_for: ['bifocal','digital'],               capabilities: ['digital','blue_light'],                                     notes: ['Better for long screen time'] },

  // Myo Control (kids) - price per 2 pairs
  { name: 'MYO Control Intro (2 pairs)', type: 'Single Vision',      price: '₹7,500',  numericPrice: 7500,  dailyCost: '—',    features: ['BlueXpert coating', 'Blue light protection'],                        suitable_for: ['single_vision', 'kids'],                capabilities: ['kids','blue_light'],                                        notes: ['Age 6–16; Sph -6 to Plano / Cyl -2'] },
  { name: 'MYO Control Advance (2 pairs)', type: 'Single Vision',    price: '₹18,000', numericPrice: 18000, dailyCost: '—',    features: ['DIGI360 Advanced filter tech'],                                      suitable_for: ['single_vision', 'kids', 'sensitive_eye'], capabilities: ['kids','sensitive_eye','digital','blue_light'],      notes: ['Age 6–16; Sph -8 to Plano / Cyl -4'] },
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
  const needs = deriveNeeds(profile);
  
  // Base: type matching
  if (profile.lens_type === 'progressive' && lens.type === 'Progressive') score += 25;
  if (profile.lens_type === 'single_vision' && lens.type === 'Single Vision') score += 25;

  // Feature overlap scoring
  const overlap = needs.filter(n => lens.capabilities?.includes(n));
  score += overlap.length * 10;

  // Extra points for heavy screen users on digital-capable lenses
  if (profile.screen_time === 'extended' && lens.capabilities?.includes('digital')) score += 10;

  // Budget sensitivity slight bonus
  if (profile.price_sensitivity === 'budget' && (lens.numericPrice || 0) <= 2000) score += 5;
  if (profile.price_sensitivity === 'high_end' && lens.capabilities?.includes('premium')) score += 5;

  return score;
}

// Convert profile into capability needs
function deriveNeeds(profile) {
  const needs = [];
  if (profile.digital_protection_need === 'high' || profile.screen_time === 'extended') needs.push('digital', 'blue_light');
  if (profile.blue_light_need && profile.blue_light_need !== 'none') needs.push('blue_light');
  if (profile.driving_protection && profile.driving_protection !== 'none') needs.push('driving', 'anti_glare');
  if (profile.durability_need === 'high' || profile.durability_need === 'maximum') needs.push('scratch_resistant','durable');
  if (profile.work_type === 'creative' || profile.color_accuracy_need) needs.push('natural_color','clarity');
  if (profile.transition_needed || profile.transition_need === 'high') needs.push('uv');
  if (profile.lens_type === 'progressive') needs.push('smooth_transition','wide_field');
  if (profile.lens_type === 'single_vision') needs.push('anti_reflection');
  return needs;
}

export function getLensRecommendation(answers) {
  // Map answers to user profile
  const profile = mapResponsesToProfile(answers);
  
  // Calculate scores then filter/sort
  let scoredLenses = lensDatabase.map(lens => ({
    ...lens,
    score: calculateLensScore(lens, profile)
  }));

  // Prefer matching lens type
  if (profile.lens_type) {
    const preferredType = profile.lens_type === 'single_vision' ? 'Single Vision' : 'Progressive';
    const preferred = scoredLenses.filter(l => l.type === preferredType);
    const others = scoredLenses.filter(l => l.type !== preferredType);
    // Keep preferred first but still include others as fallbacks
    scoredLenses = [...preferred, ...others];
  }

  // Order from least price to highest; use numericPrice when available, else parse from price string
  const parsePrice = (p) => typeof p === 'number' ? p : Number(String(p).replace(/[^0-9]/g, '')) || 0;
  scoredLenses.sort((a, b) => {
    const pa = a.numericPrice ?? parsePrice(a.price);
    const pb = b.numericPrice ?? parsePrice(b.price);
    if (pa !== pb) return pa - pb; // ascending by price
    return b.score - a.score;      // tie-breaker by score
  });

  // Prefer lenses that meet at least one capability need
  const needs = deriveNeeds(profile);
  const filtered = needs.length
    ? scoredLenses.filter(l => (l.capabilities || []).some(c => needs.includes(c)))
    : scoredLenses;

  // Get top 3 least expensive suitable lenses
  const topLenses = filtered.slice(0, 3);
  
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