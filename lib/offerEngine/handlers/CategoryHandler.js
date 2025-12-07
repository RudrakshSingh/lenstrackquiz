// lib/offerEngine/handlers/CategoryHandler.js
// Handler for customer category discounts

export class CategoryHandler {
  constructor() {
    this.priority = 7;
  }

  canHandle(rule) {
    // Category discounts are handled separately, not as primary rules
    return false;
  }

  apply(categoryDiscount, effectiveBase) {
    const percent = categoryDiscount.discountPercent;
    let savings = (effectiveBase * percent) / 100;
    
    if (categoryDiscount.maxDiscount != null) {
      savings = Math.min(savings, categoryDiscount.maxDiscount);
    }

    return {
      savings,
      label: `Category Discount (${categoryDiscount.customerCategory}): ${percent}%`,
      ruleCode: `CATEGORY_${categoryDiscount.customerCategory}`,
      offerType: 'CATEGORY_DISCOUNT'
    };
  }
}

