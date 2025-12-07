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
   * Execute handler with cart and state (V1.0 Spec)
   * Supports two modes:
   * Mode 1 - SKU-Based Bonus Product: Customer receives a specific SKU free
   * Mode 2 - Value-Based Bonus Product: Free up to value limit
   */
  execute(cart, rule, state) {
    const frame = cart.frame;
    const lens = cart.lens;
    const frameMRP = frame.mrp;
    const lensPrice = lens.price;
    const currentTotal = state.effectiveBase || (frameMRP + lensPrice);
    const selectedBonusProduct = cart.selectedBonusProduct || null;

    // Parse config - V1.0 Spec structure
    const config = this.parseConfig(rule.config);

    // Validation: BonusProduct requires bonusLimit or skuList
    if (!config.bonusLimit && !config.skuList && !rule.freeProductValue) {
      return null; // Invalid rule
    }

    const bonusLimit = config.bonusLimit || rule.freeProductValue || 0;
    const triggerMinBill = config.triggerMinBill || rule.upsellThreshold || 0;

    // Check trigger type
    if (config.triggerType === 'BILL_VALUE' && currentTotal < triggerMinBill) {
      return null; // Threshold not met
    }

    // Check bonus category/product type (V1.0 Spec)
    const productType = config.productType || config.bonusCategory || null;
    if (productType && !this.matchesProductType(selectedBonusProduct, productType)) {
      return null;
    }

    // Check bonus brands (V1.0 Spec: applicableBrands)
    const applicableBrands = config.applicableBrands || config.bonusBrands || [];
    if (applicableBrands.length > 0 && selectedBonusProduct) {
      if (!applicableBrands.includes(selectedBonusProduct.brand)) {
        return null;
      }
    }

    // Mode 1: SKU-Based Bonus Product (V1.0 Spec)
    const skuList = config.skuList || [];
    if (skuList.length > 0 && selectedBonusProduct) {
      if (skuList.includes(selectedBonusProduct.itCode || selectedBonusProduct.sku)) {
        // Specific SKU is free
        const productValue = selectedBonusProduct.mrp || selectedBonusProduct.price || 0;
        return {
          newTotal: currentTotal, // No change, bonus product is free
          savings: productValue,
          label: `Bonus Free Product: ${selectedBonusProduct.name || 'Product'} (SKU: ${selectedBonusProduct.itCode || selectedBonusProduct.sku}) worth ₹${productValue} FREE`,
          ruleCode: rule.code,
          offerType: 'BONUS_FREE_PRODUCT',
          bonusProduct: {
            type: 'SKU_BASED',
            sku: selectedBonusProduct.itCode || selectedBonusProduct.sku,
            name: selectedBonusProduct.name,
            value: productValue,
            free: true
          }
        };
      }
    }

    // Mode 2: Value-Based Bonus Product (V1.0 Spec)
    if (bonusLimit > 0 && selectedBonusProduct) {
      const selectedItemValue = selectedBonusProduct.mrp || selectedBonusProduct.price || 0;
      
      if (selectedItemValue <= bonusLimit) {
        // Item is fully free
        return {
          newTotal: currentTotal, // No change, item is free
          savings: selectedItemValue,
          label: `Bonus Free Product: ${selectedBonusProduct.name || productType || 'Product'} worth ₹${selectedItemValue} FREE`,
          ruleCode: rule.code,
          offerType: 'BONUS_FREE_PRODUCT',
          bonusProduct: {
            type: 'VALUE_BASED',
            name: selectedBonusProduct.name,
            value: selectedItemValue,
            limit: bonusLimit,
            free: true
          }
        };
      } else {
        // Exceeding limit - pay difference (V1.0 Spec)
        const difference = selectedItemValue - bonusLimit;
        return {
          newTotal: currentTotal - bonusLimit,
          savings: bonusLimit,
          label: `Bonus Applied: Pay only ₹${difference} difference (Free up to ₹${bonusLimit})`,
          ruleCode: rule.code,
          offerType: 'BONUS_FREE_PRODUCT',
          bonusProduct: {
            type: 'VALUE_BASED',
            name: selectedBonusProduct.name,
            value: selectedItemValue,
            limit: bonusLimit,
            free: false,
            difference: difference
          }
        };
      }
    }

    return null; // No bonus product selected or rule doesn't apply
  }

  matchesProductType(product, productType) {
    if (!product) return false;
    // Match product type: Frame / Sunglass / Contact Lens / Accessory
    const productTypeMap = {
      'FRAME': ['FRAME', 'EYEGLASS'],
      'SUNGLASS': ['SUNGLASS', 'SUNGLASSES'],
      'CONTACT_LENS': ['CONTACT_LENS', 'CONTACT_LENSES', 'CL'],
      'ACCESSORY': ['ACCESSORY', 'ACCESSORIES']
    };
    const types = productTypeMap[productType] || [productType];
    return types.some(type => 
      (product.type && product.type.toUpperCase().includes(type)) ||
      (product.category && product.category.toUpperCase().includes(type))
    );
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

