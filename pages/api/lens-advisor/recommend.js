// pages/api/lens-advisor/recommend.js
// POST /lens-advisor/recommend - Main recommendation endpoint

import { v4 as uuidv4 } from "uuid";
import { createCustomer } from "../../../models/Customer";
import { 
  calculateDeviceSeverity,
  calculateOutdoorSeverity,
  calculateDrivingSeverity,
  calculatePowerSeverity,
  getIndexByPower,
  getIndexByFrame,
  getFinalRequiredIndex,
  determineVisionType,
  isLensSafe,
  calculateLensScore,
  getSafetyWarnings
} from "@/lib/lensAdvisorEngine";
import { lensDatabase } from "@/lib/lensDatabase";
import { calculateOffer } from "@/lib/lensAdvisorEngine";

// Function to fetch lenses from MongoDB
async function getLensesFromMongoDB() {
  try {
    const { getActiveLenses } = await import('@/models/Lens');
    const lenses = await getActiveLenses();
    
    // Convert MongoDB format to expected format (remove _id, add id)
    return lenses.map(lens => {
      const { _id, ...lensData } = lens;
      return {
        id: _id.toString(),
        ...lensData
      };
    });
  } catch (error) {
    console.error('Error fetching lenses from MongoDB:', error);
    return null; // Fallback to static database
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      language = "en",
      power = {},
      frame_type,
      answers = {}
    } = req.body;

    // Try to fetch lenses from MongoDB, fallback to static database
    let lensesToUse = await getLensesFromMongoDB();
    if (!lensesToUse || lensesToUse.length === 0) {
      // Fallback to static database if MongoDB is empty or fails
      lensesToUse = lensDatabase;
    }

    // Validate required fields
    if (!frame_type) {
      return res.status(400).json({
        success: false,
        error: "frame_type is required"
      });
    }

    // Extract power values - handle both formats
    // Format 1: { right: { sph, cyl }, left: { sph, cyl } }
    // Format 2: { sph, cyl } (single value, use for both eyes)
    let rightSph = 0, rightCyl = 0, leftSph = 0, leftCyl = 0;
    
    if (power?.right || power?.left) {
      // Format 1: separate right/left
      rightSph = power?.right?.sph || 0;
      rightCyl = power?.right?.cyl || 0;
      leftSph = power?.left?.sph || 0;
      leftCyl = power?.left?.cyl || 0;
    } else if (power?.sph !== undefined || power?.cyl !== undefined) {
      // Format 2: single value for both eyes
      rightSph = leftSph = parseFloat(power.sph) || 0;
      rightCyl = leftCyl = parseFloat(power.cyl) || 0;
    }
    
    // Use maximum power from both eyes
    const maxSph = Math.max(Math.abs(rightSph), Math.abs(leftSph));
    const maxCyl = Math.max(Math.abs(rightCyl), Math.abs(leftCyl));
    const maxPower = Math.max(maxSph, maxCyl);

    // Extract answers - handle both old and new format
    const screenHours = answers.screen_hours || answers.deviceHours || 0;
    const outdoorHours = answers.outdoor_hours || answers.outdoorExposure || "minimal";
    const drivingPattern = answers.driving_pattern || answers.driving || "none";
    const visionNeed = answers.vision_need || "distance";
    const symptoms = answers.symptoms || [];
    const preference = answers.preference || "balanced";

    // Calculate severities
    const deviceSeverity = calculateDeviceSeverity(screenHours);
    const outdoorSeverity = calculateOutdoorSeverity(outdoorHours);
    const drivingSeverity = calculateDrivingSeverity(drivingPattern);
    const powerSeverity = calculatePowerSeverity(maxSph, maxCyl);

    // Determine vision type
    const visionType = determineVisionType(
      maxSph,
      maxCyl,
      0, // ADD - can be extracted from answers if needed
      { blur: visionNeed }
    );

    // Calculate index requirements
    const indexByPower = getIndexByPower(maxSph, maxCyl);
    const indexByFrame = getIndexByFrame(frame_type, maxSph, maxCyl);
    const finalRequiredIndex = getFinalRequiredIndex(frame_type, maxSph, maxCyl);

    // Get safety warnings
    const warnings = getSafetyWarnings(frame_type, maxSph, maxCyl);
    const safetyNotes = warnings.map(w => w.message);

    // Add index-related safety notes
    if (finalRequiredIndex === null) {
      safetyNotes.push(`${frame_type} frame not recommended for power above ${maxPower}D`);
    }

    // Build required feature thresholds
    const requiredFeatures = {
      blue_protection_level: Math.min(deviceSeverity, 5),
      ar_level: Math.min(Math.max(deviceSeverity, drivingSeverity), 5),
      uv_protection_level: Math.min(outdoorSeverity, 5),
      driving_support_level: Math.min(drivingSeverity, 5),
      photochromic_preferred: outdoorSeverity >= 3
    };

    // Filter lenses
    const safeLenses = lensesToUse.filter(lens => {
      // Match vision type
      if (lens.vision_type !== visionType && visionType !== 'zero_power') {
        return false;
      }

      // Safety check
      return isLensSafe(lens, frame_type, maxSph, maxCyl);
    });

    if (safeLenses.length === 0) {
      return res.status(200).json({
        success: true,
        usage_summary: {
          device_severity: deviceSeverity,
          outdoor_severity: outdoorSeverity,
          driving_severity: drivingSeverity,
          power_severity: powerSeverity,
          final_required_index: finalRequiredIndex,
          safety_notes: safetyNotes
        },
        recommendations: {
          perfect_match: null,
          recommended: null,
          safe_value: null
        },
        full_price_list: [],
        session_id: uuidv4(),
        error: "No suitable lenses found for your prescription and frame combination"
      });
    }

    // Score lenses
    const severity = {
      deviceSeverity,
      outdoorSeverity,
      drivingSeverity,
      powerSeverity
    };

    const scoredLenses = safeLenses.map(lens => {
      const score = calculateLensScore(lens, severity, frame_type, maxSph, maxCyl);
      
      // Additional scoring based on required features
      let featureScore = 0;
      if (lens.blue_protection_level >= requiredFeatures.blue_protection_level) featureScore += 2;
      if (lens.ar_level >= requiredFeatures.ar_level) featureScore += 2;
      if (lens.uv_protection_level >= requiredFeatures.uv_protection_level) featureScore += 1;
      if (lens.driving_support_level >= requiredFeatures.driving_support_level) featureScore += 1;
      if (lens.photochromic === requiredFeatures.photochromic_preferred && requiredFeatures.photochromic_preferred) featureScore += 1;
      
      // Price segment alignment
      if (preference === "budget" && lens.price_segment === "budget") featureScore += 1;
      if (preference === "best_clarity" && lens.price_segment === "premium") featureScore += 1;
      if (preference === "balanced" && lens.price_segment === "mid") featureScore += 1;

      return {
        ...lens,
        matchScore: score + featureScore
      };
    });

    // Sort by score (desc) then price (asc)
    scoredLenses.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (a.price_mrp || a.numericPrice || 0) - (b.price_mrp || b.numericPrice || 0);
    });

    // 4 Lens Recommendations (V1.0 Spec)
    // 1. Best Match - Highest benefit match score
    const bestMatch = scoredLenses[0] || null;
    
    // 2. Recommended Index Lens - Thinnest & safest for Rx
    const requiredIndex = finalRequiredIndex || 1.56;
    const indexRecommended = [...safeLenses]
      .filter(lens => {
        const lensIndex = parseFloat(lens.index?.replace('INDEX_', '') || '1.56');
        return lensIndex >= requiredIndex;
      })
      .sort((a, b) => {
        const indexA = parseFloat(a.index?.replace('INDEX_', '') || '1.56');
        const indexB = parseFloat(b.index?.replace('INDEX_', '') || '1.56');
        if (indexA !== indexB) return indexA - indexB; // Thinnest first
        const scoreA = scoredLenses.find(l => l.name === a.name)?.matchScore || 0;
        const scoreB = scoredLenses.find(l => l.name === b.name)?.matchScore || 0;
        return scoreB - scoreA;
      })[0] || bestMatch;
    
    // 3. Premium Upgrade Lens - Match % exceeds 100%
    const premiumUpgrade = scoredLenses.find(lens => {
      const normalizedScore = (lens.matchScore / 85) * 100;
      return normalizedScore > 100 && lens !== bestMatch && lens !== indexRecommended;
    }) || scoredLenses.find(lens => lens.matchScore > 85 && lens !== bestMatch && lens !== indexRecommended) || bestMatch;
    
    // 4. Budget Walkout Prevention Lens - Lowest-price lens safe for customer's power
    const budgetOption = [...safeLenses]
      .filter(lens => lens !== bestMatch && lens !== indexRecommended && lens !== premiumUpgrade)
      .sort((a, b) => {
        const priceA = a.price_mrp || a.numericPrice || 0;
        const priceB = b.price_mrp || b.numericPrice || 0;
        return priceA - priceB;
      })[0] || safeLenses.sort((a, b) => {
        const priceA = a.price_mrp || a.numericPrice || 0;
        const priceB = b.price_mrp || b.numericPrice || 0;
        return priceA - priceB;
      })[0] || null;
    
    // Legacy support
    const perfectMatch = bestMatch;
    const recommended = indexRecommended;
    const safeValue = budgetOption;

    // Format recommendations
    const formatLens = (lens) => {
      if (!lens) return null;
      
      return {
        lens_id: lens.name.toLowerCase().replace(/\s+/g, '-'),
        name: lens.name,
        mrp: lens.price_mrp || lens.numericPrice || 0,
        index: lens.index,
        features: lens.features || [],
        vision_type: lens.vision_type,
        blue_protection_level: lens.blue_protection_level,
        uv_protection_level: lens.uv_protection_level,
        ar_level: lens.ar_level,
        driving_support_level: lens.driving_support_level,
        photochromic: lens.photochromic,
        price_segment: lens.price_segment,
        reason: getRecommendationReason(lens, severity, requiredFeatures)
      };
    };

    // Build full price list with suitability
    const fullPriceList = lensesToUse.map(lens => {
      const isSafe = isLensSafe(lens, frame_type, maxSph, maxCyl);
      const matchesVisionType = lens.vision_type === visionType || visionType === 'zero_power';
      
      let suitability = "not_suitable";
      let badge = "Not suitable for your power/frame";
      
      if (isSafe && matchesVisionType) {
        if (lens.name === bestMatch?.name) {
          suitability = "perfect";
          badge = "Best Match - Highest benefit score";
        } else if (lens.name === indexRecommended?.name) {
          suitability = "suitable";
          badge = "Recommended Index - Thinnest & safest";
        } else if (lens.name === premiumUpgrade?.name) {
          suitability = "suitable";
          badge = "Premium Upgrade - Match > 100%";
        } else if (lens.name === budgetOption?.name) {
          suitability = "suitable";
          badge = "Budget Option - Lowest safe price";
        } else if (lens.name === perfectMatch?.name) {
          suitability = "perfect";
          badge = "Best for your usage";
        } else if (lens.name === recommended?.name) {
          suitability = "suitable";
          badge = "Good alternative";
        } else if (lens.name === safeValue?.name) {
          suitability = "suitable";
          badge = "Safe value option";
        } else {
          suitability = "suitable";
          badge = "Suitable";
        }
      } else if (matchesVisionType && !isSafe) {
        suitability = "not_suitable";
        badge = "Not safe for your power/frame";
      }

      return {
        lens_id: lens.name.toLowerCase().replace(/\s+/g, '-'),
        name: lens.name,
        index: lens.index,
        features: lens.features || [],
        mrp: lens.price_mrp || lens.numericPrice || 0,
        suitability,
        badge
      };
    });

    // Generate session ID
    const sessionId = uuidv4();

    // Log session to MongoDB (optional - can be async)
    try {
      const { getCustomerCollection } = await import('@/models/Customer');
      const collection = await getCustomerCollection();
      await collection.insertOne({
        session_id: sessionId,
        created_at: new Date(),
        language,
        request_json: req.body,
        usage_summary: {
          device_severity: deviceSeverity,
          outdoor_severity: outdoorSeverity,
          driving_severity: drivingSeverity,
          power_severity: powerSeverity,
          final_required_index: finalRequiredIndex
        },
        selected_lens_id: perfectMatch?.name || null
      });
    } catch (logError) {
      console.error("Failed to log session:", logError);
      // Don't fail the request if logging fails
    }

    // Return response
      return res.status(200).json({
        success: true,
        usage_summary: {
          device_severity: deviceSeverity,
          outdoor_severity: outdoorSeverity,
          driving_severity: drivingSeverity,
          power_severity: powerSeverity,
          final_required_index: finalRequiredIndex,
          safety_notes: safetyNotes
        },
        recommendations: {
          // V1.0 Spec - 4 Lens Recommendations
          best_match: formatLens(bestMatch),
          index_recommendation: formatLens(indexRecommended),
          premium_option: formatLens(premiumUpgrade),
          budget_option: formatLens(budgetOption),
          // Legacy support
          perfect_match: formatLens(perfectMatch),
          recommended: formatLens(recommended),
          safe_value: formatLens(safeValue)
        },
        full_price_list: fullPriceList,
        session_id: sessionId
      });

  } catch (error) {
    console.error("Recommend API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}

// Helper function to generate recommendation reason
function getRecommendationReason(lens, severity, requiredFeatures) {
  const reasons = [];
  
  if (lens.blue_protection_level >= requiredFeatures.blue_protection_level && severity.deviceSeverity >= 3) {
    reasons.push("excellent blue light protection for screen use");
  }
  
  if (lens.driving_support_level >= requiredFeatures.driving_support_level && severity.drivingSeverity >= 2) {
    reasons.push("enhanced driving safety");
  }
  
  if (lens.uv_protection_level >= requiredFeatures.uv_protection_level && severity.outdoorSeverity >= 3) {
    reasons.push("strong UV protection for outdoor activities");
  }
  
  if (lens.ar_level >= 4) {
    reasons.push("premium anti-reflective coating");
  }
  
  if (reasons.length === 0) {
    return "Meets your basic requirements with good value";
  }
  
  return `Perfect match: ${reasons.join(", ")}.`;
}

