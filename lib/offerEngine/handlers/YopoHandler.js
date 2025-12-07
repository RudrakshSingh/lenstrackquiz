// lib/offerEngine/handlers/YopoHandler.js
// Handler for YOPO offer type (V2 Final)

export class YopoHandler {
  constructor() {
    this.priority = 2;
  }

  canHandle(rule) {
    return rule.offerType === 'YOPO' || rule.discountType === 'YOPO_LOGIC';
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

    // Validation: Check minFrameMRP from config
    if (config.minFrameMRP && frameMRP < config.minFrameMRP) {
      return null;
    }

    // Check eligible lens brands from config
    if (config.eligibleLensBrands && config.eligibleLensBrands.length > 0) {
      const lensBrand = lens.brandLine?.split('_')[0] || lens.brandLine;
      if (!config.eligibleLensBrands.some(brand => lensBrand.includes(brand))) {
        return null;
      }
    }

    // YOPO requires lens to be eligible (unless config overrides)
    if (config.requireYopoEligible !== false && !lens.yopoEligible) {
      return null;
    }

    // Calculate YOPO
    const yopoPrice = Math.max(frameMRP, lensPrice);
    const savings = baseTotal - yopoPrice;

    return {
      newTotal: yopoPrice,
      savings,
      label: `YOPO - Pay ₹${yopoPrice} (higher of frame or lens)`,
      ruleCode: rule.code,
      offerType: 'YOPO',
      locksFurtherEvaluation: true // YOPO locks further evaluation
    };
  }

  /**
   * Legacy apply method for backward compatibility
   */
  apply(rule, frameMRP, lensPrice, lens = null, secondPair = null) {
    const cart = {
      frame: { mrp: frameMRP },
      lens: { price: lensPrice, yopoEligible: lens?.yopoEligible || false, brandLine: lens?.brandLine || '' }
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

