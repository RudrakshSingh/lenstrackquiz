// lib/offerEngine/UpsellEngine.js
// Dynamic Upsell Engine - Suggests additional purchases based on thresholds

import { getAllOfferRules } from '../../models/OfferRule';

export class UpsellEngine {
  constructor() {
    this.ruleCache = null;
  }

  /**
   * Get upsell opportunities based on current cart state
   * @param {Object} state - Current calculation state
   * @param {Object} cart - Cart DTO with frame, lens, etc.
   * @param {Array} rules - Active offer rules
   * @returns {Object|null} UpsellSuggestion or null
   */
  async getOpportunities(state, cart, rules = null) {
    if (!rules) {
      const allRules = await getAllOfferRules({ isActive: true });
      rules = allRules.filter(r => r.upsellEnabled === true);
    }

    const currentTotal = state.finalPayable || state.effectiveBase || 0;
    const candidates = [];

    // Filter rules with upsell thresholds
    for (const rule of rules) {
      if (!rule.upsellEnabled) continue;

      let threshold = null;
      let rewardValue = 0;
      let remaining = 0;

      // Determine threshold based on rule type
      if (rule.offerType === 'BONUS_FREE_PRODUCT') {
        threshold = rule.upsellThreshold || rule.minFrameMRP || 0;
        rewardValue = rule.freeProductValue || rule.discountValue || 0;
      } else if (rule.discountType === 'FLAT_AMOUNT') {
        threshold = rule.minFrameMRP || rule.upsellThreshold || 0;
        rewardValue = rule.discountValue || 0;
      } else if (rule.discountType === 'PERCENTAGE') {
        threshold = rule.minFrameMRP || rule.upsellThreshold || 0;
        // Estimate reward value based on typical cart
        const estimatedCart = currentTotal + (threshold - currentTotal);
        rewardValue = (estimatedCart * rule.discountValue) / 100;
      } else if (rule.offerType === 'COMBO_PRICE') {
        threshold = rule.minFrameMRP || rule.upsellThreshold || 0;
        rewardValue = (currentTotal + threshold) - (rule.comboPrice || 0);
      }

      if (!threshold || threshold <= 0) continue;

      remaining = threshold - currentTotal;

      // Skip if already met threshold or too far away
      if (remaining <= 0) continue;
      if (remaining > threshold * 0.5) continue; // Skip if more than 50% away

      // Calculate score: rewardValue / remaining (higher is better)
      const score = rewardValue / remaining;

      candidates.push({
        rule,
        threshold,
        remaining,
        rewardValue,
        score,
        type: this.getUpsellType(rule)
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    // Pick highest scoring candidate
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    // Build upsell suggestion
    return {
      type: best.type,
      ruleCode: best.rule.code,
      remaining: Math.round(best.remaining),
      rewardValue: Math.round(best.rewardValue),
      rewardText: best.rule.upsellRewardText || this.generateDefaultRewardText(best.rule, best.remaining),
      message: this.generateUpsellMessage(best.rule, best.remaining, best.rewardValue),
      threshold: best.threshold
    };
  }

  /**
   * Determine upsell type from rule
   */
  getUpsellType(rule) {
    if (rule.offerType === 'BONUS_FREE_PRODUCT') return 'BONUS_FREE';
    if (rule.discountType === 'FLAT_AMOUNT') return 'FLAT_DISCOUNT';
    if (rule.discountType === 'PERCENTAGE') return 'PERCENT_DISCOUNT';
    if (rule.offerType === 'COMBO_PRICE') return 'COMBO_DEAL';
    return 'GENERIC';
  }

  /**
   * Generate default reward text
   */
  generateDefaultRewardText(rule, remaining) {
    if (rule.offerType === 'BONUS_FREE_PRODUCT') {
      return `Get a free ${rule.freeProductName || 'product'} worth ₹${rule.freeProductValue || 0}`;
    }
    if (rule.discountType === 'FLAT_AMOUNT') {
      return `Get ₹${rule.discountValue} off`;
    }
    if (rule.discountType === 'PERCENTAGE') {
      return `Get ${rule.discountValue}% off`;
    }
    return 'Get additional savings';
  }

  /**
   * Generate upsell message
   */
  generateUpsellMessage(rule, remaining, rewardValue) {
    const messages = {
      en: `Add ₹${remaining} more to your cart and ${this.generateDefaultRewardText(rule, remaining).toLowerCase()}`,
      hi: `अपनी कार्ट में ₹${remaining} और जोड़ें और ${this.generateDefaultRewardText(rule, remaining).toLowerCase()} पाएं`,
      hinglish: `Apni cart mein ₹${remaining} aur add karo aur ${this.generateDefaultRewardText(rule, remaining).toLowerCase()} pao`
    };
    return messages.en; // Default to English, can be extended with language param
  }
}

