// lib/offerEngine.js
// Dynamic Offer Engine - Supports 7+ offer types

/**
 * Calculate offer savings and final price
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
  
  // Buy 1 Get 1 (B1G1)
  if (offerType === 'bogo' || offerType === 'b1g1') {
    finalPrice = mrp; // Pay for one, get second free
    savings = mrp;
    savingsPercentage = 50;
  }
  
  // Buy 1 Get 50% Off (B1G50)
  if (offerType === 'bogo_50' || offerType === 'b1g50') {
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
  
  // Buy X Get Y
  if (offerType === 'buy_x_get_y' && offerConfig.x && offerConfig.y) {
    const pairs = offerConfig.x + offerConfig.y;
    const paidPairs = offerConfig.x;
    finalPrice = (mrp * paidPairs);
    savings = (mrp * pairs) - finalPrice;
    savingsPercentage = (savings / (mrp * pairs)) * 100;
  }
  
  // Buy Lens Get Frame Free
  if (offerType === 'lens_frame_free' && offerConfig.frameValue) {
    finalPrice = mrp;
    savings = offerConfig.frameValue;
    savingsPercentage = (savings / (mrp + offerConfig.frameValue)) * 100;
  }
  
  // Buy Frame Get Lens Free
  if (offerType === 'frame_lens_free' && offerConfig.lensValue) {
    finalPrice = offerConfig.frameValue || mrp;
    savings = offerConfig.lensValue;
    savingsPercentage = (savings / (finalPrice + offerConfig.lensValue)) * 100;
  }
  
  // Flat % Discount
  if (offerType === 'fixed_discount' && offerConfig.percentage) {
    const discount = (mrp * offerConfig.percentage) / 100;
    finalPrice = mrp - discount;
    savings = discount;
    savingsPercentage = offerConfig.percentage;
  }
  
  // Conditional Mix Offers (e.g., 25% off on single, 50% off on 2 pairs)
  if (offerType === 'conditional_mix' && offerConfig.rules) {
    // This would be calculated based on cart items
    // For single lens, use first rule
    const rule = offerConfig.rules[0] || {};
    if (rule.percentage) {
      const discount = (mrp * rule.percentage) / 100;
      finalPrice = mrp - discount;
      savings = discount;
      savingsPercentage = rule.percentage;
    }
  }
  
  return {
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    savingsPercentage: parseFloat(savingsPercentage.toFixed(2)),
    offerApplied: true
  };
}

/**
 * Calculate offer for cart (multiple items)
 */
export function calculateCartOffer(cartItems, offer) {
  if (!offer || !cartItems || cartItems.length === 0) {
    return {
      finalPrice: 0,
      savings: 0,
      savingsPercentage: 0,
      offerApplied: false
    };
  }
  
  const totalMRP = cartItems.reduce((sum, item) => sum + (item.mrp || 0), 0);
  
  // Sort items by price for YOPO and similar offers
  const sortedItems = [...cartItems].sort((a, b) => (b.mrp || 0) - (a.mrp || 0));
  
  let finalPrice = totalMRP;
  let savings = 0;
  
  switch (offer.type) {
    case 'bogo':
    case 'b1g1':
      // Pay for first, get second free
      if (cartItems.length >= 2) {
        const paidItems = Math.ceil(cartItems.length / 2);
        finalPrice = sortedItems.slice(0, paidItems).reduce((sum, item) => sum + (item.mrp || 0), 0);
        savings = totalMRP - finalPrice;
      }
      break;
      
    case 'yopo':
      // Pay for highest priced, rest free
      if (cartItems.length >= 2) {
        finalPrice = sortedItems[0].mrp || 0;
        savings = totalMRP - finalPrice;
      }
      break;
      
    case 'bogo_50':
    case 'b1g50':
      // First at full, second at 50%
      if (cartItems.length >= 2) {
        finalPrice = sortedItems[0].mrp || 0;
        for (let i = 1; i < sortedItems.length; i++) {
          finalPrice += (sortedItems[i].mrp || 0) * 0.5;
        }
        savings = totalMRP - finalPrice;
      }
      break;
      
    case 'fixed_discount':
      if (offer.config?.percentage) {
        const discount = (totalMRP * offer.config.percentage) / 100;
        finalPrice = totalMRP - discount;
        savings = discount;
      }
      break;
      
    default:
      // Default: no offer
      finalPrice = totalMRP;
      savings = 0;
  }
  
  return {
    finalPrice: parseFloat(finalPrice.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    savingsPercentage: parseFloat(((savings / totalMRP) * 100).toFixed(2)),
    offerApplied: savings > 0
  };
}

/**
 * Check if offer is eligible for cart
 */
export function isOfferEligible(offer, cartItems, customerProfile = {}) {
  if (!offer || !offer.target_filters) return false;
  
  const filters = offer.target_filters;
  
  // Check brands
  if (filters.brands && filters.brands.length > 0) {
    const hasBrand = cartItems.some(item => 
      filters.brands.includes(item.brand)
    );
    if (!hasBrand) return false;
  }
  
  // Check vision types
  if (filters.vision_types && filters.vision_types.length > 0) {
    const hasVisionType = cartItems.some(item => 
      filters.vision_types.includes(item.vision_type)
    );
    if (!hasVisionType) return false;
  }
  
  // Check min cart value
  const cartValue = cartItems.reduce((sum, item) => sum + (item.mrp || 0), 0);
  if (filters.min_cart_value && cartValue < filters.min_cart_value) {
    return false;
  }
  
  // Check required pairs
  if (filters.required_pairs && cartItems.length < filters.required_pairs) {
    return false;
  }
  
  // Check validity dates
  if (offer.validity) {
    const now = new Date();
    if (offer.validity.start_date && new Date(offer.validity.start_date) > now) {
      return false;
    }
    if (offer.validity.end_date && new Date(offer.validity.end_date) < now) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get best offer for cart
 */
export function getBestOffer(offers, cartItems, customerProfile = {}) {
  if (!offers || offers.length === 0) return null;
  
  const eligibleOffers = offers
    .filter(offer => isOfferEligible(offer, cartItems, customerProfile))
    .map(offer => {
      const calculation = calculateCartOffer(cartItems, offer);
      return {
        ...offer,
        calculation,
        score: (calculation.savings * 0.6) + (offer.priority || 0 * 0.4) // 60% savings, 40% priority
      };
    })
    .sort((a, b) => b.score - a.score);
  
  return eligibleOffers.length > 0 ? eligibleOffers[0] : null;
}

/**
 * Generate upsell text for product based on offer
 */
export function generateUpsellText(offer, lens, language = 'en') {
  if (!offer || !offer.creative_upsell_templates) return null;
  
  const templates = offer.creative_upsell_templates;
  const mrp = lens.price_mrp || lens.numericPrice || 0;
  
  // Product footer text
  if (templates.product_footer && templates.product_footer[language]) {
    return templates.product_footer[language].replace('{{mrp}}', mrp);
  }
  
  // Default text based on offer type
  const defaultTexts = {
    en: {
      bogo: `Add 2nd pair at just 50% – Buy 1 Get 1 at half price`,
      yopo: `Pay for only one – get 2nd pair worth ₹${mrp} absolutely free (YOPO)`,
      bogo_50: `Add 2nd pair at 50% off – Save ₹${(mrp * 0.5).toFixed(0)}`,
      fixed_discount: `Get ${offer.config?.percentage || 0}% OFF on this lens today – limited period`
    },
    hi: {
      bogo: `दूसरा चश्मा 50% पर जोड़ें – 1 खरीदें 1 मुफ्त`,
      yopo: `सिर्फ एक का भुगतान करें – दूसरा चश्मा ₹${mrp} मुफ्त (YOPO)`,
      bogo_50: `दूसरा चश्मा 50% छूट पर – ₹${(mrp * 0.5).toFixed(0)} बचाएं`,
      fixed_discount: `आज इस लेंस पर ${offer.config?.percentage || 0}% छूट पाएं – सीमित अवधि`
    },
    hinglish: {
      bogo: `2nd pair 50% pe add karo – 1 kharido 1 free`,
      yopo: `Sirf ek ka payment karo – 2nd pair ₹${mrp} free (YOPO)`,
      bogo_50: `2nd pair 50% off pe – ₹${(mrp * 0.5).toFixed(0)} bachao`,
      fixed_discount: `Aaj is lens pe ${offer.config?.percentage || 0}% off – limited time`
    }
  };
  
  const langTexts = defaultTexts[language] || defaultTexts.en;
  return langTexts[offer.type] || null;
}

