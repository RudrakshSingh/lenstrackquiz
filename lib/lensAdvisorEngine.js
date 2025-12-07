/**
 * LENSTRACK LENS ADVISOR ENGINE
 * Complete implementation of the Lens Advisor Tool specification
 * Enhanced with Vision Engine, Offer Engine, and Upsell Engine
 */

// Import new vision engine functions
import {
  calculateSphericalEquivalent,
  getMaxSphericalEquivalent,
  determineVisionType as determineVisionTypeNew,
  getFinalRequiredIndex as getFinalRequiredIndexNew,
  checkFrameSafety
} from './visionEngine.js';

// ==================== SEVERITY CALCULATIONS ====================

/**
 * Calculate Device Severity (0-5) based on hours of device usage
 */
export function calculateDeviceSeverity(hours) {
  if (hours === 0 || hours < 2) return 0;
  if (hours < 4) return 1;
  if (hours < 6) return 2;
  if (hours < 8) return 3;
  if (hours < 12) return 4;
  return 5; // 12-24 hrs
}

/**
 * Calculate Outdoor Severity (0-5) based on outdoor exposure
 */
export function calculateOutdoorSeverity(exposure) {
  const exposureMap = {
    'minimal': 0,
    '1-3 hrs': 2,
    '3-6 hrs': 3,
    '6+ hrs': 4,
    'extensive': 5
  };
  return exposureMap[exposure] ?? 0;
}

/**
 * Calculate Driving Severity (0-5) based on driving frequency
 */
export function calculateDrivingSeverity(driving) {
  const drivingMap = {
    'none': 0,
    'day only': 1,
    'some night': 2,
    'daily night': 4,
    'professional': 5
  };
  return drivingMap[driving] ?? 0;
}

/**
 * Calculate Power Severity (0-5) based on SPH/CYL
 */
export function calculatePowerSeverity(sph, cyl) {
  const maxPower = Math.max(Math.abs(sph || 0), Math.abs(cyl || 0));
  if (maxPower < 2) return 1;
  if (maxPower < 4) return 2;
  if (maxPower < 6) return 3;
  if (maxPower < 8) return 4;
  return 5; // 8D+
}

// ==================== RX BAND PRICING ENGINE ====================

/**
 * Calculate Rx Band Pricing add-on
 * Each lens SKU supports multiple Rx pricing bands
 * Example: -6 to +4, 0 to -4 → Base Price, -6 to +6, 0 to -6 → + ₹1000
 */
export function calculateRxBandPricing(lens, rightSph, rightCyl, leftSph, leftCyl) {
  if (!lens.rxBands || !Array.isArray(lens.rxBands) || lens.rxBands.length === 0) {
    return 0; // No Rx bands defined, use base price
  }

  // Get maximum absolute values for both eyes
  const maxSph = Math.max(Math.abs(rightSph || 0), Math.abs(leftSph || 0));
  const maxCyl = Math.max(Math.abs(rightCyl || 0), Math.abs(leftCyl || 0));

  // Check each Rx band
  for (const band of lens.rxBands) {
    const { sphMin, sphMax, cylMin, cylMax, addOnPrice } = band;
    
    // Check if Rx falls within this band
    const sphInRange = (sphMin === null || maxSph >= sphMin) && (sphMax === null || maxSph <= sphMax);
    const cylInRange = (cylMin === null || maxCyl >= cylMin) && (cylMax === null || maxCyl <= cylMax);
    
    if (sphInRange && cylInRange) {
      return addOnPrice || 0;
    }
  }

  return 0; // No matching band, use base price
}

/**
 * Get final lens price with Rx Band Pricing
 */
export function getLensPriceWithRxBand(lens, rightSph, rightCyl, leftSph, leftCyl) {
  const basePrice = lens.offerPrice || lens.mrp || lens.price_mrp || lens.numericPrice || 0;
  const rxAddOn = calculateRxBandPricing(lens, rightSph, rightCyl, leftSph, leftCyl);
  return basePrice + rxAddOn;
}

// ==================== INDEX REQUIREMENTS ====================

/**
 * Get minimum index required by power (V1.0 Spec - Exact Power Range Mapping)
 * Power Range → Suggested Index:
 * 0 to ±3 → 1.56
 * ±3 to ±5 → 1.60
 * ±5 to ±8 → 1.67
 * ±8+ → 1.74
 */
export function getIndexByPower(sph, cyl) {
  // Use Spherical Equivalent for more accurate calculation
  const se = Math.abs((sph || 0) + ((cyl || 0) / 2));
  const maxPower = Math.max(Math.abs(sph || 0), Math.abs(cyl || 0), se);
  
  // Exact power range mapping per V1.0 spec
  if (maxPower >= 0 && maxPower <= 3) return 1.56;  // 0 to ±3 → 1.56
  if (maxPower > 3 && maxPower <= 5) return 1.60;   // ±3 to ±5 → 1.60
  if (maxPower > 5 && maxPower <= 8) return 1.67;   // ±5 to ±8 → 1.67
  return 1.74; // ±8+ → 1.74
}

/**
 * Get minimum index required by frame type (V1.0 Spec)
 * Special cases:
 * - Rimless → minimum 1.59 polycarbonate
 * - Half-rim + high power → prefer 1.67
 */
export function getIndexByFrame(frameType, sph, cyl) {
  const baseIndex = getIndexByPower(sph, cyl);
  const maxPower = Math.max(Math.abs(sph || 0), Math.abs(cyl || 0));
  const se = Math.abs((sph || 0) + ((cyl || 0) / 2));
  const maxPowerValue = Math.max(maxPower, se);
  
  if (frameType === 'full_rim_plastic' || frameType === 'full_rim_metal') {
    // Full-rim: follows power requirement exactly
    return baseIndex;
  }
  
  if (frameType === 'half_rim' || frameType === 'semi_rimless') {
    // Half-rim + high power → prefer 1.67
    if (maxPowerValue > 4 && baseIndex < 1.67) {
      return 1.67;
    }
    return Math.max(baseIndex, 1.60); // Minimum 1.60 for half-rim
  }
  
  if (frameType === 'rimless' || frameType === 'drilled') {
    // Rimless → minimum 1.59 polycarbonate (use 1.60 as closest standard)
    return Math.max(baseIndex, 1.60);
  }
  
  if (frameType === 'half_rim' || frameType === 'semi_rimless') {
    // Half-rim: No 1.50 allowed, minimum 1.60
    if (maxPower < 4) return 1.60;
    if (maxPower < 6) return 1.67;
    if (maxPower < 8) return 1.67;
    if (maxPower >= 8) return null; // Not recommended
    return 1.60;
  }
  
  if (frameType === 'rimless' || frameType === 'drilled') {
    // Rimless: No 1.50, 1.56 allowed
    if (maxPower < 4) return 1.60;
    if (maxPower < 6) return 1.67;
    if (maxPower < 7) return 1.74;
    return null; // 7D+: Frame not allowed
  }
  
  return 1.50; // Default fallback
}

/**
 * Calculate final required index (max of power and frame requirements)
 */
export function getFinalRequiredIndex(frameType, sph, cyl) {
  const powerIndex = getIndexByPower(sph, cyl);
  const frameIndex = getIndexByFrame(frameType, sph, cyl);
  
  if (frameIndex === null) return null; // Frame not suitable
  
  return Math.max(powerIndex, frameIndex);
}

// ==================== VISION TYPE DETERMINATION ====================

/**
 * Determine vision type based on prescription and symptoms
 */
export function determineVisionType(sph, cyl, add, symptoms) {
  // If ADD is present, it's progressive or bifocal
  if (add && Math.abs(add) > 0) {
    // Could be progressive or bifocal - default to progressive for modern lenses
    return 'progressive';
  }
  
  // Check if both near and far blur
  if (symptoms?.blur === 'both' || symptoms?.blur === 'Both') {
    return 'progressive';
  }
  
  // Zero power
  if ((!sph || Math.abs(sph) < 0.25) && (!cyl || Math.abs(cyl) < 0.25)) {
    return 'zero_power';
  }
  
  // Default to single vision
  return 'SV';
}

// ==================== SAFETY VALIDATION ====================

/**
 * Check if lens is safe for given prescription and frame
 */
export function isLensSafe(lens, frameType, sph, cyl) {
  const requiredIndex = getFinalRequiredIndex(frameType, sph, cyl);
  
  // Frame not suitable for power
  if (requiredIndex === null) return false;
  
  // Check index requirement
  if (lens.index < requiredIndex) return false;
  
  // Check power range
  const maxPower = Math.max(Math.abs(sph || 0), Math.abs(cyl || 0));
  if (lens.min_power_supported !== undefined && maxPower < lens.min_power_supported) return false;
  if (lens.max_power_supported !== undefined && maxPower > lens.max_power_supported) return false;
  
  // Check frame compatibility
  if (lens.frame_compatibility && !lens.frame_compatibility.includes(frameType)) {
    return false;
  }
  
  return true;
}

/**
 * Get safety warnings
 */
export function getSafetyWarnings(frameType, sph, cyl) {
  const warnings = [];
  const maxPower = Math.max(Math.abs(sph || 0), Math.abs(cyl || 0));
  
  // High power in rimless
  if ((frameType === 'rimless' || frameType === 'drilled') && maxPower >= 7) {
    warnings.push({
      type: 'error',
      message: 'Your power requires a stronger frame. Rimless is not safe for your prescription.'
    });
  }
  
  // High power in half-rim
  if ((frameType === 'half_rim' || frameType === 'semi_rimless') && maxPower >= 8) {
    warnings.push({
      type: 'warning',
      message: 'Half-rim frames are not recommended for your power level.'
    });
  }
  
  return warnings;
}

// ==================== LENS SCORING ====================

/**
 * Calculate match score for a lens based on user needs
 */
export function calculateLensScore(lens, severity, frameType, sph, cyl) {
  let score = 0;
  
  const { deviceSeverity, outdoorSeverity, drivingSeverity, powerSeverity } = severity;
  
  // Blue protection match (0-5)
  const blueMatch = Math.min(lens.blue_protection_level || 0, deviceSeverity);
  score += blueMatch * 10;
  
  // UV protection match (0-5)
  const uvMatch = Math.min(lens.uv_protection_level || 0, outdoorSeverity);
  score += uvMatch * 8;
  
  // AR match (0-5) - always beneficial
  score += (lens.ar_level || 0) * 5;
  
  // Driving support match (0-5)
  const drivingMatch = Math.min(lens.driving_support_level || 0, drivingSeverity);
  score += drivingMatch * 10;
  
  // Photochromic bonus for outdoor users
  if (lens.photochromic && outdoorSeverity >= 3) {
    score += 15;
  }
  
  // Price segment match (prefer mid-range, but adjust based on needs)
  if (lens.price_segment === 'mid') score += 5;
  if (lens.price_segment === 'premium' && (deviceSeverity >= 4 || drivingSeverity >= 4)) score += 5;
  if (lens.price_segment === 'budget' && deviceSeverity <= 2 && outdoorSeverity <= 2) score += 3;
  
  return score;
}

// ==================== OFFER ENGINE ====================

/**
 * Calculate offer pricing and savings
 */
export function calculateOffer(lens, offerType, offerConfig = {}) {
  const mrp = lens.price_mrp || lens.numericPrice || 0;
  
  if (!offerType || offerType === 'none') {
    return {
      finalPrice: mrp,
      savings: 0,
      savingsPercentage: 0,
      offerApplied: false
    };
  }
  
  let finalPrice = mrp;
  let savings = 0;
  let savingsPercentage = 0;
  
  // Buy 1 Get 1
  if (offerType === 'bogo') {
    finalPrice = mrp; // Pay for one, get second free
    savings = mrp;
    savingsPercentage = 50;
  }
  
  // Buy 1 Get 50% Off
  if (offerType === 'bogo_50') {
    finalPrice = mrp + (mrp * 0.5); // First at full, second at 50%
    savings = mrp * 0.5;
    savingsPercentage = 25;
  }
  
  // YOPO - You Only Pay for One
  if (offerType === 'yopo') {
    finalPrice = mrp; // Pay for one, second is free
    savings = mrp;
    savingsPercentage = 50;
  }
  
  // X-Y Offers (Buy at X, get second at Y)
  if (offerType === 'x_y' && offerConfig.x && offerConfig.y) {
    finalPrice = offerConfig.x + offerConfig.y;
    savings = (mrp * 2) - finalPrice;
    savingsPercentage = (savings / (mrp * 2)) * 100;
  }
  
  // Fixed % discount
  if (offerType === 'fixed_discount' && offerConfig.percentage) {
    const discount = (mrp * offerConfig.percentage) / 100;
    finalPrice = mrp - discount;
    savings = discount;
    savingsPercentage = offerConfig.percentage;
  }
  
  return {
    finalPrice: Math.round(finalPrice),
    savings: Math.round(savings),
    savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    offerApplied: true,
    offerType
  };
}

// ==================== UPSELL ENGINE ====================

/**
 * Generate second pair upsell suggestion
 */
export function generateUpsellSuggestion(severity, primaryLens) {
  const { deviceSeverity, outdoorSeverity, drivingSeverity } = severity;
  
  const suggestions = [];
  
  if (deviceSeverity >= 3) {
    suggestions.push({
      reason: 'office/computer',
      message: 'Add a second pair optimized for office/computer work!',
      benefit: 'Reduced eye strain during long screen sessions'
    });
  }
  
  if (drivingSeverity >= 2) {
    suggestions.push({
      reason: 'driving',
      message: 'Add a second pair for safer driving!',
      benefit: 'Enhanced night vision and glare reduction'
    });
  }
  
  if (outdoorSeverity >= 3 && !primaryLens?.photochromic) {
    suggestions.push({
      reason: 'outdoor',
      message: 'Add a second pair with photochromic for outdoor use!',
      benefit: 'Automatic tint adjustment in sunlight'
    });
  }
  
  return suggestions.length > 0 ? suggestions[0] : null; // Return primary suggestion
}

// ==================== MAIN RECOMMENDATION ENGINE ====================

/**
 * Main function to get lens recommendations
 */
export function getLensRecommendations(userData, lensDatabase) {
  const {
    rightSph = 0,
    rightCyl = 0,
    leftSph = 0,
    leftCyl = 0,
    sph = 0,
    cyl = 0,
    add = 0,
    frameType = 'full_rim_plastic',
    deviceHours = 0,
    outdoorExposure = 'minimal',
    driving = 'none',
    symptoms = {},
    age = null,
    visionNeed = 'distance'
  } = userData;
  
  // Use separate eye values if available, otherwise use combined
  const finalRightSph = rightSph || sph;
  const finalRightCyl = rightCyl || cyl;
  const finalLeftSph = leftSph || sph;
  const finalLeftCyl = leftCyl || cyl;
  
  // Calculate Spherical Equivalent for both eyes
  const seRight = calculateSphericalEquivalent(finalRightSph, finalRightCyl);
  const seLeft = calculateSphericalEquivalent(finalLeftSph, finalLeftCyl);
  const maxSE = getMaxSphericalEquivalent(finalRightSph, finalRightCyl, finalLeftSph, finalLeftCyl);
  
  // Calculate severities
  const deviceSeverity = calculateDeviceSeverity(deviceHours);
  const outdoorSeverity = calculateOutdoorSeverity(outdoorExposure);
  const drivingSeverity = calculateDrivingSeverity(driving);
  const powerSeverity = calculatePowerSeverity(finalRightSph || sph, finalRightCyl || cyl);
  
  const severity = {
    deviceSeverity,
    outdoorSeverity,
    drivingSeverity,
    powerSeverity
  };
  
  // Determine vision type using new vision engine
  const visionResult = determineVisionTypeNew({
    rightSph: finalRightSph,
    rightCyl: finalRightCyl,
    leftSph: finalLeftSph,
    leftCyl: finalLeftCyl,
    add,
    age,
    visionNeed,
    hasAdd: add > 0
  });
  const visionType = visionResult.primary;
  
  // Get required index using new vision engine
  const requiredIndex = getFinalRequiredIndexNew(frameType, maxSE);
  const frameSafety = checkFrameSafety(frameType, maxSE);
  
  // Safety warnings
  const warnings = getSafetyWarnings(frameType, finalRightSph || sph, finalRightCyl || cyl);
  
  // Add frame safety warnings from new vision engine
  if (frameSafety.level === 'blocked') {
    warnings.push({
      type: 'frame_safety',
      level: 'error',
      message: frameSafety.message || 'This frame type is not safe for your power.'
    });
  } else if (frameSafety.level === 'warning') {
    warnings.push({
      type: 'frame_safety',
      level: 'warning',
      message: frameSafety.message || 'This frame type may not be ideal for your power.'
    });
  }
  
  // Filter safe lenses
  const safeLenses = lensDatabase.filter(lens => {
    // Match vision type (support both old and new formats)
    const lensVisionType = lens.vision_type;
    const supportedTypes = lens.vision_types_supported || [lensVisionType];
    
    // Map old vision types to new ones
    const visionTypeMap = {
      'SV': ['SV_DISTANCE', 'SV_NEAR'],
      'progressive': ['PROGRESSIVE'],
      'bifocal': ['BIFOCAL'],
      'zero_power': ['ZERO_POWER']
    };
    
    const compatibleTypes = visionTypeMap[lensVisionType] || [lensVisionType];
    const isCompatible = compatibleTypes.includes(visionType) || 
                        supportedTypes.includes(visionType) ||
                        visionType === 'ZERO_POWER';
    
    if (!isCompatible) {
      return false;
    }
    
    // Check power range using SE
    const minSE = lens.min_power_se !== undefined ? lens.min_power_se : (lens.min_power_supported || -8);
    const maxSE = lens.max_power_se !== undefined ? lens.max_power_se : (lens.max_power_supported || 8);
    
    if (maxSE < Math.abs(seRight) || maxSE < Math.abs(seLeft)) {
      return false;
    }
    if (minSE > Math.abs(seRight) && minSE > Math.abs(seLeft)) {
      return false;
    }
    
    // Check index requirement
    if (requiredIndex && lens.index < requiredIndex) {
      return false;
    }
    
    // Safety check (legacy function for backward compatibility)
    return isLensSafe(lens, frameType, rightSph || sph, rightCyl || cyl);
  });
  
  if (safeLenses.length === 0) {
    return {
      error: 'No suitable lenses found for your prescription and frame combination.',
      warnings,
      requiredIndex
    };
  }
  
  // Score all safe lenses
  const scoredLenses = safeLenses.map(lens => {
    const score = calculateLensScore(lens, severity, frameType, rightSph || sph, rightCyl || cyl);
    
    // Classify into tiers (LIS specification)
    let tier = 'UNSUITABLE';
    if (score >= 85) tier = 'PERFECT';
    else if (score >= 70) tier = 'RECOMMENDED';
    else if (score >= 55) tier = 'SAFE';
    
    return {
      ...lens,
      matchScore: score,
      tier
    };
  });
  
  // Sort by score (descending)
  scoredLenses.sort((a, b) => b.matchScore - a.matchScore);
  
  // 1. Best Match Lens - Highest benefit match score
  const bestMatch = scoredLenses.find(l => l.tier === 'PERFECT') || scoredLenses[0];
  
  // 2. Recommended Index Lens - Thinnest & safest for Rx
  // Sort by index (thinnest first), then by safety
  const indexRecommended = [...safeLenses]
    .filter(l => {
      const lensIndex = parseFloat(l.index?.replace('INDEX_', '') || '1.56');
      return lensIndex >= requiredIndex;
    })
    .sort((a, b) => {
      const indexA = parseFloat(a.index?.replace('INDEX_', '') || '1.56');
      const indexB = parseFloat(b.index?.replace('INDEX_', '') || '1.56');
      if (indexA !== indexB) return indexA - indexB; // Thinnest first
      // If same index, prefer higher match score
      const scoreA = scoredLenses.find(l => l.name === a.name)?.matchScore || 0;
      const scoreB = scoredLenses.find(l => l.name === b.name)?.matchScore || 0;
      return scoreB - scoreA;
    })[0] || bestMatch;
  
  // 3. Premium Upgrade Lens - Match % exceeds 100%, shows extra features
  // Find lenses with match score > 100 (normalized to 100% = 85 score)
  const premiumUpgrade = scoredLenses.find(l => {
    const normalizedScore = (l.matchScore / 85) * 100; // Normalize to percentage
    return normalizedScore > 100 && l !== bestMatch && l !== indexRecommended;
  }) || scoredLenses.find(l => l.matchScore > 85 && l !== bestMatch && l !== indexRecommended) || bestMatch;
  
  // 4. Budget Walkout Prevention Lens - Lowest-price lens safe for customer's power
  const budgetOption = [...safeLenses]
    .filter(l => l !== bestMatch && l !== indexRecommended && l !== premiumUpgrade)
    .sort((a, b) => {
      const priceA = a.price_mrp || a.numericPrice || 0;
      const priceB = b.price_mrp || b.numericPrice || 0;
      return priceA - priceB;
    })[0] || safeLenses.sort((a, b) => {
      const priceA = a.price_mrp || a.numericPrice || 0;
      const priceB = b.price_mrp || b.numericPrice || 0;
      return priceA - priceB;
    })[0] || null;
  
  // Legacy support - map to old names
  const perfectMatch = bestMatch;
  const recommended = indexRecommended;
  const safeValue = budgetOption;
  
  // Generate upsell suggestion
  const upsell = generateUpsellSuggestion(severity, bestMatch);
  
  // Prepare all lenses with suitability badges for price list
  const allLensesWithBadges = lensDatabase.map(lens => {
    const isSafe = isLensSafe(lens, frameType, sph, cyl);
    const matchesVisionType = lens.vision_type === visionType || visionType === 'zero_power';
    
    let badge = 'not_suitable';
    if (isSafe && matchesVisionType) {
      // Check if it's in top recommendations
      if (lens.name === perfectMatch?.name) badge = 'perfect_match';
      else if (lens.name === recommended?.name) badge = 'recommended';
      else if (lens.name === safeValue?.name) badge = 'safe_value';
      else badge = 'suitable';
    } else if (matchesVisionType && !isSafe) {
      badge = 'not_safe';
    }
    
    return {
      ...lens,
      badge,
      isSafe: isSafe && matchesVisionType
    };
  });
  
  return {
    // 4 Lens Recommendations (V1.0 Spec)
    bestMatch,           // 1. Best Match Lens - Highest benefit match score
    indexRecommendation: indexRecommended, // 2. Recommended Index Lens - Thinnest & safest
    premiumOption: premiumUpgrade,         // 3. Premium Upgrade Lens - Match % > 100%
    budgetOption,        // 4. Budget Walkout Prevention Lens - Lowest price safe option
    // Legacy support
    perfectMatch,
    recommended,
    safeValue,
    upsell,
    warnings,
    requiredIndex,
    severity,
    visionType,
    visionResult, // New: includes primary, secondary, note
    frameSafety,  // New: frame safety check result
    maxSE,        // New: maximum Spherical Equivalent
    seRight,      // New: right eye SE
    seLeft,       // New: left eye SE
    allLenses: allLensesWithBadges
  };
}

