// lib/offerEngine/handlers/PercentHandler.js
// Handler for PERCENT_OFF offer type (V2 Final)

export class PercentHandler {
  constructor() {
    this.priority = 4;
  }

  canHandle(rule) {
    return rule.offerType === 'PERCENT_OFF' || 
           (rule.discountType === 'PERCENTAGE' && rule.discountValue > 0);
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
    const discountPercent = rule.discountValue || config.discountPercent || 0;

    if (discountPercent <= 0) {
      return null;
    }

    // Check minFrameMRP from config
    if (config.minFrameMRP && frameMRP < config.minFrameMRP) {
      return null;
    }

    // Determine what to apply discount to
    let discountableAmount = baseTotal;
    if (config.appliesTo === 'FRAME_ONLY') {
      discountableAmount = frameMRP;
    } else if (config.appliesTo === 'LENS_ONLY') {
      discountableAmount = lensPrice;
    }

    const savings = (discountableAmount * discountPercent) / 100;
    const newTotal = baseTotal - savings;

    return {
      newTotal,
      savings,
      label: `${discountPercent}% Off${config.appliesTo ? ` (${config.appliesTo.replace('_', ' ')})` : ''}`,
      ruleCode: rule.code,
      offerType: 'PERCENT_OFF'
    };
  }

  /**
   * Legacy apply method for backward compatibility
   */
  apply(rule, frameMRP, lensPrice, lens = null, secondPair = null) {
    const cart = {
      frame: { mrp: frameMRP },
      lens: { price: lensPrice }
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

