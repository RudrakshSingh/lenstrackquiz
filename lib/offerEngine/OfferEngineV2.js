// lib/offerEngine/OfferEngineV2.js
// Enhanced Offer Engine with handler-based architecture

import { getAllOfferRules } from '../../models/OfferRule';
import { getCategoryDiscountByCategoryAndBrand } from '../../models/CategoryDiscount';
import { getCouponByCode } from '../../models/Coupon';
import { ComboHandler } from './handlers/ComboHandler';
import { YopoHandler } from './handlers/YopoHandler';
import { FreeLensHandler } from './handlers/FreeLensHandler';
import { PercentHandler } from './handlers/PercentHandler';
import { FlatHandler } from './handlers/FlatHandler';
import { Bog50Handler } from './handlers/Bog50Handler';
import { CategoryHandler } from './handlers/CategoryHandler';
import { BonusHandler } from './handlers/BonusHandler';
import { UpsellEngine } from './UpsellEngine';
import { createOfferApplicationLog } from '../../models/OfferApplicationLog';

export class OfferEngineV2 {
  constructor() {
    this.handlers = [
      new ComboHandler(),
      new YopoHandler(),
      new FreeLensHandler(),
      new PercentHandler(),
      new FlatHandler(),
      new Bog50Handler(),
    ];
    this.categoryHandler = new CategoryHandler();
    this.upsellEngine = new UpsellEngine();
  }

  /**
   * Check if rule is applicable (V2 Final - supports frameBrands array and product types)
   */
  isRuleApplicable(rule, frame, lens, now = new Date()) {
    if (!rule.isActive) return false;
    if (rule.startDate && now < rule.startDate) return false;
    if (rule.endDate && now > rule.endDate) return false;
    
    // Product Type Check: YOPO only applies to FRAME + LENS combos
    // Free Sunglass promotions only apply to SUNGLASS
    // Contact Lens discounts only apply to CONTACT_LENS
    if (rule.productTypes && rule.productTypes.length > 0) {
      const frameType = frame.type || 'FRAME'; // Default to FRAME for backward compatibility
      if (!rule.productTypes.includes(frameType)) {
        return false;
      }
    } else {
      // Backward compatibility: If no productTypes specified, apply default logic
      // YOPO_LOGIC should only apply to FRAME type
      if (rule.discountType === 'YOPO_LOGIC' || rule.offerType === 'YOPO') {
        const frameType = frame.type || 'FRAME';
        if (frameType !== 'FRAME') {
          return false; // YOPO only applies to frames
        }
      }
    }
    
    // V2: Check frameBrands array (preferred) or legacy frameBrand
    if (rule.frameBrands && rule.frameBrands.length > 0) {
      if (!rule.frameBrands.includes(frame.brand)) return false;
    } else if (rule.frameBrand && rule.frameBrand !== frame.brand) {
      return false;
    }
    
    // V2: Check frameSubCategories array (preferred) or legacy frameSubCategory
    if (rule.frameSubCategories && rule.frameSubCategories.length > 0) {
      if (!rule.frameSubCategories.includes(frame.subCategory)) return false;
    } else if (rule.frameSubCategory && rule.frameSubCategory !== frame.subCategory) {
      return false;
    }
    
    if (rule.minFrameMRP != null && frame.mrp < rule.minFrameMRP) return false;
    if (rule.maxFrameMRP != null && frame.mrp > rule.maxFrameMRP) return false;
    
    if (rule.lensBrandLines && rule.lensBrandLines.length > 0) {
      if (!rule.lensBrandLines.includes(lens.brandLine)) return false;
    }
    if (rule.lensItCodes && rule.lensItCodes.length > 0) {
      if (!rule.lensItCodes.includes(lens.itCode)) return false;
    }
    return true;
  }

  /**
   * Main calculation method - follows the sequence diagram
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

    // Step 1: Load active offer rules
    const allRules = await getAllOfferRules({ isActive: true });
    const primaryRules = allRules.filter(r => !r.isSecondPairRule);

    // Step 2: Filter applicable rules
    const applicable = primaryRules
      .filter(r => this.isRuleApplicable(r, frame, lens, now))
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));

    let effectiveBase = baseTotal;

    // Step 3: Execute handlers in priority order (V1.0 Spec flow)
    const cart = { 
      frame, 
      lens, 
      customerCategory: input.customerCategory,
      selectedBonusProduct: input.selectedBonusProduct || null
    };
    let state = { effectiveBase, baseTotal };
    let locked = false; // Track if an offer locks further evaluation
    let freeItem = null; // V1.0 Spec: Tag free item from YOPO
    let bonusProduct = null; // V1.0 Spec: Bonus product details

    if (applicable.length > 0) {
      for (const rule of applicable) {
        // Skip if already locked by previous offer
        if (locked) break;

        // Find handler that can process this rule
        for (const handler of this.handlers) {
          if (handler.canHandle(rule)) {
            // Use execute() method if available (V2 Final), otherwise fallback to apply()
            let result;
            if (handler.execute) {
              result = handler.execute(cart, rule, state);
            } else {
              result = handler.apply(rule, frameMRP, lensPrice, lens, input.secondPair);
            }
            
            if (result && result.savings > 0) {
              offersApplied.push({
                ruleCode: result.ruleCode || rule.code,
                description: result.label,
                savings: result.savings,
                offerType: result.offerType
              });
              
              priceComponents.push({
                label: result.label,
                amount: -result.savings,
                meta: { ruleCode: result.ruleCode || rule.code }
              });
              
              effectiveBase = result.newTotal;
              state.effectiveBase = effectiveBase;
              
              // V1.0 Spec: Store freeItem from YOPO
              if (result.freeItem) {
                freeItem = result.freeItem;
              }
              
              // Check if this offer locks further evaluation (Combo, YOPO)
              if (result.locksFurtherEvaluation) {
                locked = true;
              }
              
              break; // Only apply first matching rule
            }
          }
        }
        if (locked) break; // Stop if locked
      }
    }

    let secondPairDiscount = null;

    // Step 4: Second pair logic
    if (input.secondPair?.enabled) {
      const secondRules = allRules.filter(r => r.isSecondPairRule);
      const applicableSecond = secondRules
        .filter(r => this.isRuleApplicable(r, frame, lens, now))
        .sort((a, b) => (a.priority || 100) - (b.priority || 100));

      if (applicableSecond.length > 0) {
        const secondRule = applicableSecond[0];
        const bog50Handler = new Bog50Handler();
        const result = bog50Handler.apply(secondRule, frameMRP, lensPrice, input.secondPair);
        
        if (result && result.savings > 0) {
          secondPairDiscount = {
            ruleCode: result.ruleCode,
            description: result.label,
            savings: result.savings
          };
          priceComponents.push({
            label: result.label,
            amount: -result.savings,
            meta: { ruleCode: result.ruleCode }
          });
          effectiveBase -= result.savings;
        }
      }
    }

    // Step 5: Customer category discount (Priority 7)
    // Note: Category discount is applied even if primary offer locked (per spec)
    let categoryDiscount = null;
    if (input.customerCategory) {
      let catDisc = await getCategoryDiscountByCategoryAndBrand(
        input.customerCategory,
        frame.brand
      );
      
      if (!catDisc || !catDisc.isActive) {
        catDisc = await getCategoryDiscountByCategoryAndBrand(
          input.customerCategory,
          '*'
        );
      }

      if (catDisc && catDisc.isActive) {
        const now = new Date();
        if ((!catDisc.startDate || now >= catDisc.startDate) &&
            (!catDisc.endDate || now <= catDisc.endDate)) {
          const result = this.categoryHandler.apply(catDisc, effectiveBase);
          
          if (result.savings > 0) {
            categoryDiscount = {
              ruleCode: result.ruleCode,
              description: result.label,
              savings: result.savings
            };
            priceComponents.push({
              label: result.label,
              amount: -result.savings
            });
            effectiveBase -= result.savings;
            state.effectiveBase = effectiveBase;
          }
        }
      }
    }

    // Step 6: Bonus Free Product (Priority 8) - if not locked
    // Note: Bonus products are typically handled by UpsellEngine, but can apply if threshold met
    if (!locked) {
      const bonusRules = allRules.filter(r => 
        r.offerType === 'BONUS_FREE_PRODUCT' && 
        !r.isSecondPairRule &&
        this.isRuleApplicable(r, frame, lens, now)
      );
      
      if (bonusRules.length > 0) {
        const bonusRule = bonusRules[0];
        const bonusHandler = new BonusHandler();
        if (bonusHandler.canHandle(bonusRule)) {
          let bonusResult;
          if (bonusHandler.execute) {
            bonusResult = bonusHandler.execute(cart, bonusRule, state);
          } else {
            bonusResult = bonusHandler.apply(bonusRule, effectiveBase, bonusRule.upsellThreshold || 0);
          }
          
          if (bonusResult && bonusResult.savings > 0) {
            offersApplied.push({
              ruleCode: bonusResult.ruleCode,
              description: bonusResult.label,
              savings: bonusResult.savings,
              offerType: 'BONUS_FREE_PRODUCT'
            });
            priceComponents.push({
              label: bonusResult.label,
              amount: -bonusResult.savings,
              meta: { ruleCode: bonusResult.ruleCode }
            });
            effectiveBase = bonusResult.newTotal;
            state.effectiveBase = effectiveBase;
            
            // V1.0 Spec: Store bonusProduct details
            if (bonusResult.bonusProduct) {
              bonusProduct = bonusResult.bonusProduct;
            }
          }
        }
      }
    }

    // Step 6: Coupon discount
    let couponDiscount = null;
    if (input.couponCode) {
      const coupon = await getCouponByCode(input.couponCode);
      
      if (coupon && coupon.isActive) {
        const now = new Date();
        if ((!coupon.startDate || now >= coupon.startDate) &&
            (!coupon.endDate || now <= coupon.endDate)) {
          
          let savings = 0;
          if (coupon.discountType === 'PERCENTAGE') {
            savings = (effectiveBase * coupon.discountValue) / 100;
            if (coupon.maxDiscount != null) {
              savings = Math.min(savings, coupon.maxDiscount);
            }
          } else if (coupon.discountType === 'FLAT_AMOUNT') {
            savings = Math.min(coupon.discountValue, effectiveBase);
          }

          if (savings > 0 && (!coupon.minCartValue || effectiveBase >= coupon.minCartValue)) {
            couponDiscount = {
              ruleCode: coupon.code,
              description: `Coupon: ${coupon.code}`,
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

    // Step 8: Dynamic Upsell Engine (Priority 9 - informational, not modifying prices)
    // Update state for upsell engine
    state.finalPayable = finalPayable;
    state.offersApplied = offersApplied;

    const upsell = await this.upsellEngine.getOpportunities(state, cart, allRules);

    // Step 9: Log calculation (optional)
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
          secondPairDiscount,
          upsell
        },
        finalPrice: finalPayable
      });
    } catch (logError) {
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
      upsell,
      finalPayable,
      freeItem, // V1.0 Spec: Tagged free item from YOPO
      bonusProduct // V1.0 Spec: Bonus product details
    };
  }
}

