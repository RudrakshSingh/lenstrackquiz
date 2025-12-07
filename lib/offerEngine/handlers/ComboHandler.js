// lib/offerEngine/handlers/ComboHandler.js
// Handler for COMBO_PRICE offer type (V2 Final)

export class ComboHandler {
  constructor() {
    this.priority = 1; // Highest priority
  }

  canHandle(rule) {
    return rule.offerType === 'COMBO_PRICE' || 
           (rule.discountType === 'COMBO_PRICE' && (rule.comboPrice != null || this.getComboPriceFromConfig(rule.config) != null));
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

    // Parse config
    const config = this.parseConfig(rule.config);
    const comboPrice = rule.comboPrice || config.comboPrice;

    if (!comboPrice) {
      return null;
    }

    // Check frame categories from config
    if (config.frameCategories && config.frameCategories.length > 0) {
      if (!config.frameCategories.includes(frame.subCategory)) {
        return null;
      }
    }

    // Check lens brand line from config
    if (config.lensBrandLine && lens.brandLine !== config.lensBrandLine) {
      return null;
    }

    const savings = Math.max(0, baseTotal - comboPrice);

    return {
      newTotal: comboPrice,
      savings,
      label: `Combo Price: ₹${comboPrice}`,
      ruleCode: rule.code,
      offerType: 'COMBO_PRICE',
      locksFurtherEvaluation: config.lockOtherOffers !== false // Default: locks further evaluation
    };
  }

  /**
   * Legacy apply method for backward compatibility
   */
  apply(rule, frameMRP, lensPrice, lens = null, secondPair = null) {
    const cart = {
      frame: { mrp: frameMRP, subCategory: null },
      lens: { price: lensPrice, brandLine: lens?.brandLine || '' }
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

  getComboPriceFromConfig(config) {
    const parsed = this.parseConfig(config);
    return parsed.comboPrice;
  }
}

