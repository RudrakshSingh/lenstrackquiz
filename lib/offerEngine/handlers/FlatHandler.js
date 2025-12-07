// lib/offerEngine/handlers/FlatHandler.js
// Handler for FLAT_OFF offer type (V2 Final)

export class FlatHandler {
  constructor() {
    this.priority = 5;
  }

  canHandle(rule) {
    return rule.offerType === 'FLAT_OFF' || 
           (rule.discountType === 'FLAT_AMOUNT' && rule.discountValue > 0);
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
    const flatAmount = rule.discountValue || config.flatAmount || 0;

    if (flatAmount <= 0) {
      return null;
    }

    // Check minBillValue from config
    const billValue = config.scope === 'FRAME_ONLY' ? frameMRP : baseTotal;
    if (config.minBillValue && billValue < config.minBillValue) {
      return null;
    }

    const savings = Math.min(flatAmount, baseTotal);
    const newTotal = baseTotal - savings;

    return {
      newTotal,
      savings,
      label: `Flat ₹${flatAmount} Off`,
      ruleCode: rule.code,
      offerType: 'FLAT_OFF'
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

