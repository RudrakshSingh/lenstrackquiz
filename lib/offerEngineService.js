// lib/offerEngineService.js
// Offer Engine Service - Calculates offers, discounts, and final pricing

import { getAllOfferRules, getActiveOfferRules } from '../models/OfferRule';
import { getCategoryDiscountByCategoryAndBrand, getAllCategoryDiscounts } from '../models/CategoryDiscount';
import { getCouponByCode, getActiveCoupons } from '../models/Coupon';
import { createOfferApplicationLog } from '../models/OfferApplicationLog';

export class OfferEngineService {
  constructor() {}

  /**
   * Check if an offer rule is applicable for given frame and lens
   */
  isRuleApplicable(rule, frame, lens, now = new Date()) {
    if (!rule.isActive) return false;
    if (rule.startDate && now < rule.startDate) return false;
    if (rule.endDate && now > rule.endDate) return false;
    if (rule.frameBrand && rule.frameBrand !== frame.brand) return false;
    if (rule.frameSubCategory && rule.frameSubCategory !== frame.subCategory) return false;
    if (rule.minFrameMRP != null && frame.mrp < rule.minFrameMRP) return false;
    if (rule.maxFrameMRP != null && frame.mrp > rule.maxFrameMRP) return false;
    if (rule.lensBrandLines && rule.lensBrandLines.length > 0) {
      if (!rule.lensBrandLines.includes(lens.brandLine)) return false;
    }
    if (rule.lensItCodes && rule.lensItCodes.length > 0) {
      if (!rule.lensItCodes.includes(lens.itCode)) return false;
    }
    // YOPO eligibility check
    if (rule.discountType === 'YOPO_LOGIC' && !lens.yopoEligible) return false;
    return true;
  }

  /**
   * Apply primary offer rule
   */
  applyPrimaryRule(rule, frameMRP, lensPrice) {
    const baseTotal = frameMRP + lensPrice;

    if (rule.discountType === 'YOPO_LOGIC') {
      const yopoPrice = Math.max(frameMRP, lensPrice);
      const savings = baseTotal - yopoPrice;
      return { 
        newTotal: yopoPrice, 
        savings, 
        label: 'YOPO - Pay higher of frame or lens' 
      };
    }

    if (rule.discountType === 'COMBO_PRICE') {
      const combo = rule.comboPrice ?? baseTotal;
      const savings = Math.max(0, baseTotal - combo);
      return { 
        newTotal: baseTotal - savings, 
        savings, 
        label: `Combo price applied` 
      };
    }

    if (rule.discountType === 'FREE_ITEM' || rule.offerType === 'FREE_LENS') {
      const savings = lensPrice; // lens free
      return { 
        newTotal: baseTotal - savings, 
        savings, 
        label: 'Free lens with frame' 
      };
    }

    if (rule.discountType === 'PERCENTAGE') {
      const savings = (baseTotal * rule.discountValue) / 100;
      return { 
        newTotal: baseTotal - savings, 
        savings, 
        label: `${rule.discountValue}% off` 
      };
    }

    if (rule.discountType === 'FLAT_AMOUNT') {
      const savings = Math.min(rule.discountValue, baseTotal);
      return { 
        newTotal: baseTotal - savings, 
        savings, 
        label: `Flat Rs. ${rule.discountValue} off` 
      };
    }

    // BOGO_50 (Buy 1 Get 50% off)
    if (rule.offerType === 'BOGO_50') {
      const savings = (baseTotal * 50) / 100;
      return { 
        newTotal: baseTotal - savings, 
        savings, 
        label: 'Buy 1 Get 50% off' 
      };
    }

    // default, no change
    return { newTotal: baseTotal, savings: 0, label: 'No primary offer' };
  }

  /**
   * Apply second pair rule
   */
  applySecondPairRule(rule, secondPair) {
    const first = secondPair.firstPairTotal;
    const second = (secondPair.secondPairFrameMRP || 0) + (secondPair.secondPairLensPrice || 0);
    const lower = Math.min(first, second);

    if (rule.secondPairPercent) {
      const savings = (lower * rule.secondPairPercent) / 100;
      return { 
        savings, 
        label: `Second pair ${rule.secondPairPercent}% off (lower value)` 
      };
    }

    return { savings: 0, label: 'No second pair benefit' };
  }

  /**
   * Apply category discount
   */
  applyCategoryDiscount(effectiveBase, categoryDiscount) {
    const percent = categoryDiscount.discountPercent;
    let savings = (effectiveBase * percent) / 100;
    if (categoryDiscount.maxDiscount != null) {
      savings = Math.min(savings, categoryDiscount.maxDiscount);
    }
    return { savings };
  }

  /**
   * Apply coupon discount
   */
  applyCouponDiscount(effectiveBase, coupon) {
    if (coupon.minCartValue != null && effectiveBase < coupon.minCartValue) {
      return { savings: 0 };
    }

    let savings = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      savings = (effectiveBase * coupon.discountValue) / 100;
      if (coupon.maxDiscount != null) {
        savings = Math.min(savings, coupon.maxDiscount);
      }
    } else if (coupon.discountType === 'FLAT_AMOUNT') {
      savings = Math.min(coupon.discountValue, effectiveBase);
    }

    return { savings };
  }

  /**
   * Main calculation method
   */
  async calculate(input) {
    const now = new Date();
    const frame = input.frame;
    const lens = input.lens;
    const frameMRP = frame.mrp;
    const lensPrice = lens.price;
    const baseTotal = frameMRP + lensPrice;

    const priceComponents = [
      { label: 'Frame MRP', amount: frameMRP },
      { label: 'Lens Offer Price', amount: lensPrice }
    ];

    const offersApplied = [];

    // 1. Find all applicable primary offer rules
    const allRules = await getAllOfferRules({ isActive: true });
    const primaryRules = allRules.filter(r => !r.isSecondPairRule);
    const applicable = primaryRules
      .filter(r => this.isRuleApplicable(r, frame, lens, now))
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));

    let effectiveBase = baseTotal;

    // Apply primary offer (highest priority)
    if (applicable.length > 0) {
      const primaryRule = applicable[0];
      const { newTotal, savings, label } = this.applyPrimaryRule(primaryRule, frameMRP, lensPrice);
      
      if (savings > 0) {
        offersApplied.push({
          ruleCode: primaryRule.code,
          description: label,
          savings
        });
        priceComponents.push({ 
          label, 
          amount: -savings, 
          meta: { ruleCode: primaryRule.code } 
        });
        effectiveBase = newTotal;
      }
    }

    let secondPairDiscount = null;

    // 2. Second pair logic (optional)
    if (input.secondPair?.enabled) {
      const secondRules = allRules.filter(r => r.isSecondPairRule);
      const applicableSecond = secondRules
        .filter(r => this.isRuleApplicable(r, frame, lens, now))
        .sort((a, b) => (a.priority || 100) - (b.priority || 100));

      if (applicableSecond.length > 0) {
        const secondRule = applicableSecond[0];
        const { savings, label } = this.applySecondPairRule(secondRule, input.secondPair);
        
        if (savings > 0) {
          secondPairDiscount = {
            ruleCode: secondRule.code,
            description: label,
            savings
          };
          priceComponents.push({ 
            label, 
            amount: -savings, 
            meta: { ruleCode: secondRule.code } 
          });
          effectiveBase -= savings;
        }
      }
    }

    // 3. Customer category discount
    let categoryDiscount = null;
    if (input.customerCategory) {
      // Try exact brand match first
      let catDisc = await getCategoryDiscountByCategoryAndBrand(
        input.customerCategory, 
        frame.brand
      );
      
      // If not found, try wildcard '*'
      if (!catDisc || !catDisc.isActive) {
        catDisc = await getCategoryDiscountByCategoryAndBrand(
          input.customerCategory, 
          '*'
        );
      }

      if (catDisc && catDisc.isActive) {
        // Check date validity
        const now = new Date();
        if ((!catDisc.startDate || now >= catDisc.startDate) && 
            (!catDisc.endDate || now <= catDisc.endDate)) {
          const { savings } = this.applyCategoryDiscount(effectiveBase, catDisc);
          
          if (savings > 0) {
            categoryDiscount = {
              ruleCode: `CATEGORY_${catDisc.customerCategory}`,
              description: `Category discount (${catDisc.customerCategory})`,
              savings
            };
            priceComponents.push({ 
              label: categoryDiscount.description, 
              amount: -savings 
            });
            effectiveBase -= savings;
          }
        }
      }
    }

    // 4. Coupon discount
    let couponDiscount = null;
    if (input.couponCode) {
      const coupon = await getCouponByCode(input.couponCode);
      
      if (coupon && coupon.isActive) {
        // Check date validity
        const now = new Date();
        if ((!coupon.startDate || now >= coupon.startDate) && 
            (!coupon.endDate || now <= coupon.endDate)) {
          const { savings } = this.applyCouponDiscount(effectiveBase, coupon);
          
          if (savings > 0) {
            couponDiscount = {
              ruleCode: coupon.code,
              description: `Coupon applied (${coupon.code})`,
              savings
            };
            priceComponents.push({ 
              label: couponDiscount.description, 
              amount: -savings 
            });
            effectiveBase -= savings;
          }
        }
      }
    }

    const finalPayable = Math.max(0, Math.round(effectiveBase));

    // Optional: Log the calculation
    try {
      await createOfferApplicationLog({
        frameBrand: frame.brand,
        frameMRP,
        lensItCode: lens.itCode,
        lensPrice,
        offersApplied: {
          offersApplied,
          categoryDiscount,
          couponDiscount,
          secondPairDiscount
        },
        finalPrice: finalPayable
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log offer application:', logError);
    }

    return {
      frameMRP,
      lensPrice,
      baseTotal,
      effectiveBase,
      offersApplied,
      priceComponents,
      categoryDiscount,
      couponDiscount,
      secondPairDiscount,
      finalPayable
    };
  }
}

