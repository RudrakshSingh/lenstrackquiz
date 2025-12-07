// pages/api/submit.js
import { v4 as uuidv4 } from "uuid";
import { ObjectId } from "mongodb";
import { getLensRecommendations } from "@/lib/lensAdvisorEngine";
import { lensDatabase } from "@/lib/lensDatabase";
import { buildRequirementProfile } from "@/lib/quizEngine";
import { calculateOffer, getBestOffer } from "@/lib/offerEngine";
import { generateUpsellSuggestions } from "@/lib/upsellEngine";
import { calculateSphericalEquivalent, getMaxSphericalEquivalent, determineVisionType } from "@/lib/visionEngine";
import { createCustomer } from "../../models/Customer";

// Function to fetch lenses from MongoDB
async function getLensesFromMongoDB() {
  try {
    const { getActiveLenses } = await import('@/models/Lens');
    const lenses = await getActiveLenses();
    
    // Convert MongoDB format to expected format
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }
  
  try {
    const { user, answers, language = "en" } = req.body;

    // 🔎 Validate input
    if (!user || !user.name || !user.number || !answers) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid body" });
    }

    // Generate a unique submission ID
    const submissionId = uuidv4();

    // Calculate Spherical Equivalents
    const rightSph = parseFloat(user.rightSph || user.sph || 0);
    const rightCyl = parseFloat(user.rightCyl || user.cyl || 0);
    const leftSph = parseFloat(user.leftSph || user.sph || 0);
    const leftCyl = parseFloat(user.leftCyl || user.cyl || 0);
    const add = parseFloat(user.add || 0);
    
    const seRight = calculateSphericalEquivalent(rightSph, rightCyl);
    const seLeft = calculateSphericalEquivalent(leftSph, leftCyl);
    const maxSE = getMaxSphericalEquivalent(seRight, seLeft);
    
    // Determine vision type
    const age = user.age || 30; // Default age if not provided
    const visionNeed = answers.vision_need || 'distance';
    const visionType = determineVisionType(seRight, seLeft, add, age, visionNeed);
    
    // Parse answers to extract device hours, outdoor exposure, driving
    const parseDeviceHours = (answer) => {
      if (!answer) return 0;
      if (typeof answer === 'number') return answer;
      // Parse from string like "0-2 hrs", "2-4 hrs", etc.
      const match = answer.match(/(\d+)-(\d+)\s*hrs?/);
      if (match) return parseInt(match[2]); // Take upper bound
      const singleMatch = answer.match(/(\d+)\s*hrs?/);
      if (singleMatch) return parseInt(singleMatch[1]);
      return 0;
    };

    const deviceHours = parseDeviceHours(answers.deviceHours || user.deviceHours);
    const outdoorExposure = answers.outdoorExposure || user.outdoorExposure || 'minimal';
    const driving = answers.driving || user.driving || 'none';

    // Build requirement profile from quiz answers
    let requirementProfile;
    try {
      requirementProfile = buildRequirementProfile(
        { ...answers, deviceHours, outdoorExposure, driving },
        visionType,
        {} // severity will be calculated in buildRequirementProfile
      );
    } catch (profileError) {
      console.error('Error building requirement profile:', profileError);
      console.error('Profile error details:', profileError.stack);
      // Create a minimal requirement profile as fallback
      requirementProfile = {
        vision_type: visionType,
        screen_load_level: 0,
        blue_protection_level: 0,
        ar_level: 0,
        uv_level: 0,
        driving_level: 0,
        lifestyle_tags: []
      };
    }
    
    // Update userData with parsed values (deviceHours, outdoorExposure, driving already parsed above)
    const userData = {
      sph: rightSph || leftSph || 0,
      cyl: rightCyl || leftCyl || 0,
      rightSph,
      rightCyl,
      rightAxis: user.rightAxis ? parseFloat(user.rightAxis) : null,
      leftSph,
      leftCyl,
      leftAxis: user.leftAxis ? parseFloat(user.leftAxis) : null,
      add,
      pd: user.pd ? parseFloat(user.pd) : null,
      frameType: user.frameType || 'full_rim_plastic',
      frameBrand: user.frameBrand || null,
      frameSubCategory: user.frameSubCategory || null,
      frameMRP: user.frameMRP ? parseFloat(user.frameMRP) : null,
      frameMaterial: user.frameMaterial || null,
      salesMode: user.salesMode || 'SELF_SERVICE',
      salespersonName: user.salespersonName || null,
      deviceHours,
      outdoorExposure,
      driving,
      symptoms: answers.symptoms || user.symptoms || {},
      preferences: answers.preferences || user.preferences || 'none',
      language,
      age,
      visionNeed
    };

    // Update userData with parsed values
    userData.deviceHours = deviceHours;
    userData.outdoorExposure = outdoorExposure;
    userData.driving = driving;

    // Try to fetch lenses from MongoDB, fallback to static database
    let lensesToUse = await getLensesFromMongoDB();
    if (!lensesToUse || lensesToUse.length === 0) {
      console.warn('No lenses found in MongoDB, using fallback database');
      // Fallback to static database if MongoDB is empty or fails
      lensesToUse = lensDatabase;
    }

    console.log(`Using ${lensesToUse.length} lenses for recommendations`);
    console.log('User data for recommendations:', JSON.stringify(userData, null, 2));
    console.log('Requirement profile:', JSON.stringify(requirementProfile, null, 2));

    // Compute lens recommendations using new engine
    let recommendations;
    try {
      recommendations = getLensRecommendations(userData, lensesToUse);
      console.log('Recommendations generated:', {
        perfectMatch: recommendations.perfectMatch?.name || 'None',
        recommended: recommendations.recommended?.name || 'None',
        safeValue: recommendations.safeValue?.name || 'None'
      });
    } catch (recError) {
      console.error('Error getting lens recommendations:', recError);
      console.error('Recommendation error stack:', recError.stack);
      // Return minimal recommendations as fallback
      recommendations = {
        perfectMatch: null,
        recommended: null,
        safeValue: null,
        warnings: []
      };
    }

    // Get active offers from database
    let activeOffers = [];
    try {
      const { getActiveOffers } = await import('../../models/Offer');
      activeOffers = await getActiveOffers();
    } catch (error) {
      console.error('Error fetching offers:', error);
      // Continue with empty offers array
    }

    // Apply best offers to recommendations
    const applyOfferToLens = (lens) => {
      if (!lens) return null;
      
      // Find eligible offers for this lens
      const eligibleOffers = activeOffers.filter(offer => {
        if (!offer.target_filters) return false;
        const filters = offer.target_filters;
        
        // Check brand
        if (filters.brands && filters.brands.length > 0) {
          if (!filters.brands.includes(lens.brand)) return false;
        }
        
        // Check vision type
        if (filters.vision_types && filters.vision_types.length > 0) {
          const lensVisionTypes = lens.vision_types_supported || [lens.vision_type];
          const hasMatch = filters.vision_types.some(vt => lensVisionTypes.includes(vt));
          if (!hasMatch) return false;
        }
        
        // Check min cart value (for single lens, use lens MRP)
        if (filters.min_cart_value) {
          const lensMRP = lens.price_mrp || lens.numericPrice || 0;
          if (lensMRP < filters.min_cart_value) return false;
        }
        
        // Check validity dates
        if (offer.validity) {
          const now = new Date();
          if (offer.validity.start_date && new Date(offer.validity.start_date) > now) return false;
          if (offer.validity.end_date && new Date(offer.validity.end_date) < now) return false;
        }
        
        return true;
      });
      
      if (eligibleOffers.length === 0) return lens;
      
      // Calculate offer for single lens (treat as cart with one item)
      const cartItems = [lens];
      const bestOffer = getBestOffer(eligibleOffers, cartItems, requirementProfile);
      
      if (bestOffer && bestOffer.calculation) {
        return {
          ...lens,
          offer: {
            type: bestOffer.type,
            name: bestOffer.name,
            description: bestOffer.description,
            finalPrice: bestOffer.calculation.finalPrice,
            savings: bestOffer.calculation.savings,
            savingsPercentage: bestOffer.calculation.savingsPercentage,
            offerApplied: true
          }
        };
      }
      
      return lens;
    };

    const recommendation = {
      ...recommendations,
      // V1.0 Spec - 4 Lens Recommendations with offers
      bestMatch: applyOfferToLens(recommendations.bestMatch),
      indexRecommendation: applyOfferToLens(recommendations.indexRecommendation),
      premiumOption: applyOfferToLens(recommendations.premiumOption),
      budgetOption: applyOfferToLens(recommendations.budgetOption),
      // Legacy support
      perfectMatch: applyOfferToLens(recommendations.perfectMatch),
      recommended: applyOfferToLens(recommendations.recommended),
      safeValue: applyOfferToLens(recommendations.safeValue),
      requirementProfile,
      visionType,
      language
    };

    // Generate upsell suggestions
    try {
      const upsellSuggestions = generateUpsellSuggestions(requirementProfile, recommendation, activeOffers, language);
      recommendation.upsellSuggestions = upsellSuggestions;
    } catch (upsellError) {
      console.error('Error generating upsell suggestions:', upsellError);
      // Don't fail the request if upsell generation fails
      recommendation.upsellSuggestions = [];
    }

    // V1.0 Spec: Create Order if frame and lens are selected
    let orderId = null;
    if (user.storeId && user.frameBrand && user.frameMRP && recommendation?.perfectMatch) {
      try {
        const { createOrder } = await import('../../models/Order');
        const order = await createOrder({
          storeId: user.storeId,
          salesMode: user.salesMode || 'SELF_SERVICE',
          assistedByStaffId: user.salespersonId || null,
          assistedByName: user.salespersonName || null,
          customerName: user.name || null,
          customerPhone: user.number || null,
          frameData: {
            brand: user.frameBrand,
            subCategory: user.frameSubCategory || null,
            mrp: parseFloat(user.frameMRP) || 0,
            type: user.frameType || null,
            material: user.frameMaterial || null
          },
          lensData: {
            itCode: recommendation.perfectMatch?.lens_id || recommendation.perfectMatch?.name || null,
            name: recommendation.perfectMatch?.name || null,
            price: recommendation.perfectMatch?.mrp || recommendation.perfectMatch?.price || 0,
            brandLine: recommendation.perfectMatch?.brandLine || null
          },
          offerData: {
            appliedOffers: recommendation.perfectMatch?.offer || null,
            finalPrice: recommendation.perfectMatch?.offer?.finalPrice || recommendation.perfectMatch?.mrp || 0
          },
          finalPrice: recommendation.perfectMatch?.offer?.finalPrice || recommendation.perfectMatch?.mrp || 0
        });
        orderId = order._id.toString();
      } catch (orderError) {
        console.error('Order creation error:', orderError);
        // Continue even if order creation fails
      }
    }

    // 🔥Save submission to MongoDB
    try {
      const { getCustomerCollection } = await import('../../models/Customer');
      const collection = await getCustomerCollection();
      await collection.insertOne({
        name: user.name,
        number: user.number,
        email: user.email || '',
      power: {
        right: {
          sph: user.rightSph ? parseFloat(user.rightSph) : (user.sph ? parseFloat(user.sph) : null),
          cyl: user.rightCyl ? parseFloat(user.rightCyl) : (user.cyl ? parseFloat(user.cyl) : null),
          axis: user.rightAxis ? parseFloat(user.rightAxis) : null
        },
        left: {
          sph: user.leftSph ? parseFloat(user.leftSph) : null,
          cyl: user.leftCyl ? parseFloat(user.leftCyl) : null,
          axis: user.leftAxis ? parseFloat(user.leftAxis) : null
        }
      },
      add: user.add ? parseFloat(user.add) : null,
      pd: user.pd ? parseFloat(user.pd) : null,
      frame: {
        type: user.frameType || null,
        brand: user.frameBrand || null,
        subCategory: user.frameSubCategory || null,
        mrp: user.frameMRP ? parseFloat(user.frameMRP) : null,
        material: user.frameMaterial || null
      },
      salesMode: user.salesMode || 'SELF_SERVICE',
      salespersonName: user.salespersonName || null,
      frameType: user.frameType || null,
      storeId: user.storeId ? (typeof user.storeId === 'string' ? new ObjectId(user.storeId) : user.storeId) : null,
      salespersonId: user.salespersonId ? (typeof user.salespersonId === 'string' ? new ObjectId(user.salespersonId) : user.salespersonId) : null,
      answers,
      recommendation,
      language,
      submissionId, // Keep for backward compatibility
      orderId: orderId || null, // V1.0 Spec: Link to order
      createdAt: new Date(),
      updatedAt: new Date()
      });
    } catch (dbError) {
      console.error("MongoDB save error:", dbError);
      console.error("MongoDB save error stack:", dbError.stack);
      // Continue even if save fails - return submission ID anyway
      // This allows the quiz to complete even if database is down
    }

    // ✅ Return consistent key `submissionId`
    return res.status(200).json({
      success: true,
      submissionId, // 👈 index.js uses this
    });
  } catch (err) {
    console.error("Submit API error:", err);
    console.error("Error details:", err.message);
    console.error("Stack:", err.stack);
    return res
      .status(500)
      .json({ 
        success: false, 
        error: "Internal server error: " + (err.message || 'Unknown error'),
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
  }
}
