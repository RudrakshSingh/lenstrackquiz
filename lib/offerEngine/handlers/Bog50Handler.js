// lib/offerEngine/handlers/Bog50Handler.js
// Handler for BOG50 (Buy 1 Get 50% Off) offer type (V2 Final)

export class Bog50Handler {
  constructor() {
    this.priority = 6;
  }

  canHandle(rule) {
    return rule.offerType === 'BOG50' || 
           rule.offerType === 'BOGO_50' ||
           (rule.discountType === 'PERCENTAGE' && rule.discountValue === 50 && rule.isSecondPairRule);
  }

  /**
   * Execute handler with cart and state (V2 Final pattern)
   */
  execute(cart, rule, state) {
    // Parse config
    const config = this.parseConfig(rule.config);

    // Validation: BOG50 requires brand or category
    if (!config.eligibleBrands?.length && !config.eligibleCategories?.length && 
        !rule.frameBrand && !rule.frameBrands?.length) {
      return null; // Invalid rule
    }

    // Check eligible brands from config
    if (config.eligibleBrands && config.eligibleBrands.length > 0) {
      if (!config.eligibleBrands.includes(cart.frame.brand)) {
        return null;
      }
    }

    // Check eligible categories from config
    if (config.eligibleCategories && config.eligibleCategories.length > 0) {
      if (!config.eligibleCategories.includes(cart.frame.subCategory)) {
        return null;
      }
    }

    // Check minItemMRP from config
    if (config.minItemMRP) {
      const frameMRP = cart.frame.mrp;
      if (frameMRP < config.minItemMRP) {
        return null;
      }
    }

    // Use legacy apply logic for now
    return this.apply(rule, cart.frame.mrp, cart.lens.price, cart.lens, cart.secondPair);
  }

  /**
   * Legacy apply method for backward compatibility
   */
  apply(rule, frameMRP, lensPrice, lens = null, secondPair = null) {
    // BOGO_50 typically applies to second pair scenarios
    if (secondPair && secondPair.enabled) {
      const first = secondPair.firstPairTotal;
      const second = (secondPair.secondPairFrameMRP || 0) + (secondPair.secondPairLensPrice || 0);
      const lower = Math.min(first, second);
      const savings = (lower * 50) / 100;
      
      return {
        newTotal: first + second - savings,
        savings,
        label: `Buy 1 Get 50% Off (on lower value pair)`,
        ruleCode: rule.code,
        offerType: 'BOGO_50'
      };
    }

    // For single pair, apply 50% off on lens
    const baseTotal = frameMRP + lensPrice;
    const savings = (lensPrice * 50) / 100;
    const newTotal = baseTotal - savings;

    return {
      newTotal,
      savings,
      label: `Buy 1 Get 50% Off`,
      ruleCode: rule.code,
      offerType: 'BOGO_50'
    };
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

