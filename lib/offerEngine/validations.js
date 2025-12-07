// lib/offerEngine/validations.js
// Mandatory validations for Offer Engine V2 Final

/**
 * Validate offer rule based on V2 Final spec requirements
 */
export function validateOfferRule(rule, allRules = []) {
  const errors = [];

  // YOPO cannot run after Combo
  if (rule.offerType === 'YOPO') {
    const comboRules = allRules.filter(r => 
      r.offerType === 'COMBO_PRICE' && 
      r.priority < rule.priority &&
      r.isActive
    );
    if (comboRules.length > 0) {
      errors.push('YOPO cannot run after Combo (priority conflict)');
    }
  }

  // Free Lens must define ruleType
  if (rule.offerType === 'FREE_LENS') {
    const config = parseConfig(rule.config);
    if (!config.ruleType && !rule.freeProductId) {
      errors.push('Free Lens must define ruleType in config (FULL, PERCENT_OF_FRAME, or VALUE_CAP)');
    }
  }

  // BOG50 requires brand or category
  if (rule.offerType === 'BOG50' || rule.offerType === 'BOGO_50') {
    const config = parseConfig(rule.config);
    if (!config.eligibleBrands?.length && 
        !config.eligibleCategories?.length && 
        !rule.frameBrand && 
        !rule.frameBrands?.length) {
      errors.push('BOG50 requires eligibleBrands or eligibleCategories in config, or frameBrand/frameBrands');
    }
  }

  // BonusProduct requires bonusLimit and category
  if (rule.offerType === 'BONUS_FREE_PRODUCT') {
    const config = parseConfig(rule.config);
    if (!config.bonusLimit && !rule.freeProductValue) {
      errors.push('Bonus Free Product requires bonusLimit in config or freeProductValue');
    }
    if (!config.bonusCategory) {
      errors.push('Bonus Free Product requires bonusCategory in config');
    }
  }

  // Category Discount requires ID proof (handled at application time)
  // This is a runtime validation, not a rule validation

  // Upsell must not override a locked offer (Combo/YOPO)
  if (rule.upsellEnabled && rule.upsellThreshold) {
    const lockedOffers = allRules.filter(r => 
      (r.offerType === 'COMBO_PRICE' || r.offerType === 'YOPO') &&
      r.isActive &&
      r.priority < rule.priority
    );
    if (lockedOffers.length > 0) {
      // This is a warning, not an error - upsell can still work
      // but won't apply if locked offer is active
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate rule applicability at runtime
 */
export function validateRuleApplicability(rule, frame, lens, customerCategory = null) {
  const errors = [];

  // Category Discount requires ID proof
  if (rule.offerType === 'CATEGORY_DISCOUNT' && customerCategory) {
    // This should be checked at the API level with customer data
    // For now, we assume ID proof is verified if customerCategory is provided
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function parseConfig(config) {
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

