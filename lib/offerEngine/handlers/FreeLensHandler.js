// lib/offerEngine/handlers/FreeLensHandler.js
// Handler for FREE_LENS offer type (V2 Final)

export class FreeLensHandler {
  constructor() {
    this.priority = 3;
  }

  canHandle(rule) {
    return rule.offerType === 'FREE_LENS' || 
           rule.discountType === 'FREE_ITEM' ||
           (rule.freeProductId != null);
  }

  /**
   * Execute handler with cart and state (V2 Final pattern)
   */
  execute(cart, rule, state) {
    const frame = cart.frame;
    const lens = cart.lens;
    const frameMRP = frame.mrp;
    const lensPrice = lens.price;
    const baseTotal = frameMRP + lensPrice;

    // Parse config - V2 Final structure
    const config = this.parseConfig(rule.config);

    // Validation: Free Lens must define ruleType
    if (!config.ruleType && !rule.freeProductId) {
      return null; // Invalid rule
    }

    // Check allowed lens brands from config
    if (config.allowedLensBrands && config.allowedLensBrands.length > 0) {
      const lensBrand = lens.brandLine?.split('_')[0] || lens.brandLine;
      if (!config.allowedLensBrands.some(brand => lensBrand.includes(brand))) {
        return null;
      }
    }

    // Check SKU-only requirement
    if (config.skuOnly && lens.itCode !== config.skuOnly) {
      return null;
    }

    // Check legacy freeProductId
    if (rule.freeProductId && rule.freeProductId !== lens.itCode) {
      return null;
    }

    // V1.0 Spec: Free Lens with Value Limit Logic
    // Frame brand can define: free lens value limit, free lens type/category, free lens brand lines
    // Offer Engine ensures lens is free up to allowed limit
    
    let savings = lensPrice;
    let actualSavings = lensPrice;
    let label = 'Free Lens with Frame';
    let allowedValue = lensPrice; // Default: full lens price is free

    // Get free lens value limit from config (V1.0 Spec)
    if (config.freeLensValueLimit) {
      allowedValue = config.freeLensValueLimit;
    } else if (config.ruleType === 'PERCENT_OF_FRAME') {
      const percentLimit = config.percentLimit || 0.4; // Default 40%
      allowedValue = frameMRP * percentLimit;
    } else if (config.ruleType === 'VALUE_CAP') {
      allowedValue = config.valueCapAmount || lensPrice;
    }

    // Apply value limit (V1.0 Spec)
    if (lensPrice <= allowedValue) {
      // Lens is fully free
      savings = lensPrice;
      actualSavings = lensPrice;
      label = `Free Lens (up to ₹${allowedValue}) - ₹${lensPrice} FREE`;
    } else {
      // Lens exceeds limit, customer pays the difference
      savings = allowedValue;
      actualSavings = allowedValue;
      const difference = lensPrice - allowedValue;
      label = `Free Lens (up to ₹${allowedValue}) - Pay difference ₹${difference}`;
    }

    const newTotal = baseTotal - savings;

    return {
      newTotal,
      savings: actualSavings,
      label,
      ruleCode: rule.code,
      offerType: 'FREE_LENS'
    };
  }

  /**
   * Legacy apply method for backward compatibility
   */
  apply(rule, frameMRP, lensPrice, lens = null, secondPair = null) {
    const cart = {
      frame: { mrp: frameMRP },
      lens: { price: lensPrice, itCode: lens?.itCode || '', brandLine: lens?.brandLine || '' }
    };
    const state = { effectiveBase: frameMRP + lensPrice };
    return this.execute(cart, rule, state);
  }

  parseConfig(config) {
    if (!config) return {};
    if (typeof config === 'string') {
      try {
        return JSON.parse(config);
      } catch {
        return {};
      }
    }
    return config;
  }
}

