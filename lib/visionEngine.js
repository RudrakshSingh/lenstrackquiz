// lib/visionEngine.js
// Vision Type Determination & Spherical Equivalent Engine

/**
 * Calculate Spherical Equivalent (SE)
 * Formula: SE = SPH + (CYL / 2)
 */
export function calculateSphericalEquivalent(sph, cyl) {
  const sphNum = parseFloat(sph) || 0;
  const cylNum = parseFloat(cyl) || 0;
  return sphNum + (cylNum / 2);
}

/**
 * Calculate SE for both eyes and return maximum absolute value
 */
export function getMaxSphericalEquivalent(rightSph, rightCyl, leftSph, leftCyl) {
  const seRight = calculateSphericalEquivalent(rightSph, rightCyl);
  const seLeft = calculateSphericalEquivalent(leftSph, leftCyl);
  return Math.max(Math.abs(seRight), Math.abs(seLeft));
}

/**
 * Determine vision type based on prescription, age, and vision need
 */
export function determineVisionType({
  rightSph = 0,
  rightCyl = 0,
  leftSph = 0,
  leftCyl = 0,
  add = 0,
  age = null,
  visionNeed = 'distance', // 'distance', 'near', 'both', 'zero_power'
  hasAdd = false
}) {
  const seRight = calculateSphericalEquivalent(rightSph, rightCyl);
  const seLeft = calculateSphericalEquivalent(leftSph, leftCyl);
  const maxSE = Math.max(Math.abs(seRight), Math.abs(seLeft));
  
  // Zero Power
  if (maxSE === 0 && visionNeed === 'zero_power') {
    return {
      primary: 'ZERO_POWER',
      secondary: null,
      note: null
    };
  }
  
  // Age-based logic
  const isPresbyopic = age !== null && age >= 40;
  const addPresent = hasAdd || (add && parseFloat(add) > 0);
  
  // Single Vision Distance
  if (!isPresbyopic && visionNeed === 'distance') {
    return {
      primary: 'SV_DISTANCE',
      secondary: null,
      note: null
    };
  }
  
  // Single Vision Near
  if (!isPresbyopic && visionNeed === 'near') {
    return {
      primary: 'SV_NEAR',
      secondary: null,
      note: null
    };
  }
  
  // Bifocal Pair (two single-vision pairs)
  if (!isPresbyopic && visionNeed === 'both') {
    return {
      primary: 'SV_BIFOCAL_PAIR',
      secondary: null,
      note: 'Two separate pairs recommended: one for distance, one for near'
    };
  }
  
  // Progressive (age 40+ with near/both need or ADD present)
  if (isPresbyopic && (visionNeed === 'near' || visionNeed === 'both' || addPresent)) {
    return {
      primary: 'PROGRESSIVE',
      secondary: 'BIFOCAL',
      note: 'Progressive recommended for seamless vision. Bifocal is an alternative option.'
    };
  }
  
  // Age 40+ with distance only
  if (isPresbyopic && visionNeed === 'distance') {
    return {
      primary: 'SV_DISTANCE',
      secondary: null,
      note: 'Customer likely to need near aid soon. Consider progressive for future-proofing.'
    };
  }
  
  // Default fallback
  return {
    primary: 'SV_DISTANCE',
    secondary: null,
    note: null
  };
}

/**
 * Get required index based on SE and frame type (V1.0 Spec - Exact Power Range Mapping)
 * Power Range → Suggested Index:
 * 0 to ±3 → 1.56
 * ±3 to ±5 → 1.60
 * ±5 to ±8 → 1.67
 * ±8+ → 1.74
 */
export function getRequiredIndexByPower(se) {
  const absSE = Math.abs(se);
  
  // Exact power range mapping per V1.0 spec
  if (absSE >= 0 && absSE <= 3) return 1.56;  // 0 to ±3 → 1.56
  if (absSE > 3 && absSE <= 5) return 1.60;   // ±3 to ±5 → 1.60
  if (absSE > 5 && absSE <= 8) return 1.67;   // ±5 to ±8 → 1.67
  return 1.74; // ±8+ → 1.74
}

/**
 * Get required index based on frame type and SE (V1.0 Spec)
 * Special cases:
 * - Rimless → minimum 1.59 polycarbonate (use 1.60)
 * - Half-rim + high power → prefer 1.67
 */
export function getRequiredIndexByFrame(frameType, se) {
  const absSE = Math.abs(se);
  const baseIndex = getRequiredIndexByPower(se);
  
  switch (frameType) {
    case 'full_rim_plastic':
    case 'full_rim_metal':
      // Full-rim: follows power requirement exactly
      return baseIndex;
      
    case 'half_rim':
    case 'semi_rimless':
      // Half-rim + high power → prefer 1.67
      if (absSE > 4 && baseIndex < 1.67) {
        return 1.67;
      }
      return Math.max(baseIndex, 1.60); // Minimum 1.60 for half-rim
      
    case 'rimless':
    case 'drilled':
      // Rimless → minimum 1.59 polycarbonate (use 1.60 as closest standard)
      const rimlessIndex = Math.max(baseIndex, 1.60);
      if (absSE > 7) return null; // BLOCKED > 7D
      return rimlessIndex;
      
    default:
      return baseIndex;
  }
}

/**
 * Get final required index (max of power-based and frame-based)
 */
export function getFinalRequiredIndex(frameType, se) {
  const indexByPower = getRequiredIndexByPower(se);
  const indexByFrame = getRequiredIndexByFrame(frameType, se);
  
  if (indexByFrame === null) return null; // Blocked
  
  return Math.max(indexByPower, indexByFrame);
}

/**
 * Check frame safety based on SE
 */
export function checkFrameSafety(frameType, se) {
  const absSE = Math.abs(se);
  
  switch (frameType) {
    case 'full_rim_plastic':
    case 'full_rim_metal':
      return {
        safe: true,
        level: 'safe',
        message: null
      };
      
    case 'half_rim':
    case 'semi_rimless':
      if (absSE > 8) {
        return {
          safe: false,
          level: 'warning',
          message: 'Not recommended above 8D. We suggest Full-Rim for safety.'
        };
      }
      return {
        safe: true,
        level: absSE > 6 ? 'caution' : 'safe',
        message: absSE > 6 ? 'Consider Full-Rim for better safety above 6D' : null
      };
      
    case 'rimless':
    case 'drilled':
      if (absSE > 7) {
        return {
          safe: false,
          level: 'blocked',
          message: 'Rimless frames cannot be used above 7D due to lens fragility risk.'
        };
      }
      return {
        safe: absSE <= 7,
        level: absSE > 6 ? 'warning' : 'safe',
        message: absSE > 6 ? 'Rimless frames are not recommended above 6D' : null
      };
      
    default:
      return {
        safe: true,
        level: 'safe',
        message: null
      };
  }
}

