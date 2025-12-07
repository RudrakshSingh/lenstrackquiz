// lib/offerEngine/handlers/BonusHandler.js
// Handler for BONUS_FREE_PRODUCT offer type (V2 Final)

export class BonusHandler {
  constructor() {
    this.priority = 8;
  }

  canHandle(rule) {
    return rule.offerType === 'BONUS_FREE_PRODUCT' || 
           (rule.freeProductId != null && rule.upsellEnabled);
  }

  /**
   * Execute handler with cart and state (V2 Final pattern)
   */
  execute(cart, rule, state) {
    const frame = cart.frame;
    const lens = cart.lens;
    const frameMRP = frame.mrp;
    const lensPrice = lens.price;
    const currentTotal = state.effectiveBase || (frameMRP + lensPrice);

    // Parse config - V2 Final structure
    const config = this.parseConfig(rule.config);

    // Validation: BonusProduct requires bonusLimit and category
    if (!config.bonusLimit && !rule.freeProductValue) {
      return null; // Invalid rule
    }

    const bonusLimit = config.bonusLimit || rule.freeProductValue || 0;
    const triggerMinBill = config.triggerMinBill || rule.upsellThreshold || 0;

    // Check trigger type
    if (config.triggerType === 'BILL_VALUE' && currentTotal < triggerMinBill) {
      return null; // Threshold not met
    }

    // Check bonus category
    if (config.bonusCategory && !this.matchesCategory(cart, config.bonusCategory)) {
      return null;
    }

    // Check bonus brands
    if (config.bonusBrands && config.bonusBrands.length > 0) {
      if (!config.bonusBrands.includes(frame.brand)) {
        return null;
      }
    }

    // If selected item within limit
    const selectedItemValue = config.bonusCategory === 'FRAME' ? frameMRP : 
                             config.bonusCategory === 'LENS' ? lensPrice : 
                             Math.min(frameMRP, lensPrice);

    if (selectedItemValue <= bonusLimit) {
      return {
        newTotal: currentTotal, // No change, item is free
        savings: selectedItemValue,
        label: `Bonus Free Product: ${rule.freeProductName || config.bonusCategory} worth ₹${selectedItemValue} FREE`,
        ruleCode: rule.code,
        offerType: 'BONUS_FREE_PRODUCT'
      };
    } else {
      // Exceeding limit - pay difference
      const difference = selectedItemValue - bonusLimit;
      return {
        newTotal: currentTotal - bonusLimit,
        savings: bonusLimit,
        label: `Bonus Applied: Pay only ₹${difference} difference (Free up to ₹${bonusLimit})`,
        ruleCode: rule.code,
        offerType: 'BONUS_FREE_PRODUCT'
      };
    }
  }

  /**
   * Legacy apply method for backward compatibility
   */
  apply(rule, currentTotal, threshold) {
    const cart = { frame: { mrp: 0, brand: '' }, lens: { price: 0 } };
    const state = { effectiveBase: currentTotal };
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

  matchesCategory(cart, category) {
    // Simple category matching logic
    // Can be extended based on product types
    return true; // Placeholder
  }
}

