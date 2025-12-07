// lib/recommendationService.js
// Recommendation Engine Service

import { 
  getAllLensProducts, 
  getActiveLensProducts,
  LensIndex,
  VisionType 
} from '../models/LensProduct';
import { getAnswerBenefitsByAnswers } from '../models/AnswerBenefit';
import { getAllBenefits } from '../models/Benefit';
import { getProductBenefitsByProduct } from '../models/ProductBenefit';
import { getProductAnswerScoresByProduct } from '../models/ProductAnswerScore';

export class RecommendationService {
  constructor() {
    this.rxService = new RxValidationService();
    this.indexService = new IndexRecommendationService();
  }

  async recommend(input) {
    const { prescription, answers, frame, visionTypeOverride, budgetFilter } = input;

    // Infer vision type
    const visionType = this.rxService.inferVisionType(prescription, visionTypeOverride);

    // Recommend index
    const recommendedIndex = this.indexService.recommendIndex(prescription, frame);

    // Compute benefit scores from answers
    const benefitScores = await this.computeBenefitScores(answers);

    // Fetch candidate products
    const products = await this.fetchCandidateProducts(visionType, prescription, budgetFilter);

    // Score products
    const scored = await this.scoreProducts(products, benefitScores, answers);

    // Sort by score
    const sorted = scored.sort((a, b) => b.finalScore - a.finalScore);

    // Calculate match percentages
    const maxScore = sorted[0]?.finalScore || 1;
    const productsWithMatch = sorted.map(p => ({
      ...p,
      matchPercent: Math.round((p.finalScore / maxScore) * 100)
    }));

    return {
      recommendedIndex,
      benefitScores,
      products: productsWithMatch
    };
  }

  async computeBenefitScores(answersInput) {
    // Flatten all answer IDs
    const answerIds = answersInput.flatMap(a => a.answerIds || []);
    
    if (answerIds.length === 0) return {};

    // Get answer-benefit mappings
    const answerBenefits = await getAnswerBenefitsByAnswers(answerIds);

    // Get all benefits for point weights
    const allBenefits = await getAllBenefits({});
    const benefitMap = {};
    allBenefits.forEach(b => {
      benefitMap[b._id.toString()] = b;
    });

    // Calculate weighted benefit scores
    const benefitScores = {};
    for (const ab of answerBenefits) {
      const benefit = benefitMap[ab.benefitId.toString()];
      if (benefit) {
        const code = benefit.code;
        const weightedPoints = ab.points * benefit.pointWeight;
        benefitScores[code] = (benefitScores[code] || 0) + weightedPoints;
      }
    }

    return benefitScores;
  }

  async fetchCandidateProducts(visionType, prescription, budgetFilter) {
    // Get all active products matching vision type
    const products = await getActiveLensProducts({ visionType });

    // Filter by prescription range and budget
    return products.filter(p => 
      this.rxService.isProductInRxRange(p, prescription) &&
      this.filterByBudget(p, budgetFilter)
    );
  }

  async scoreProducts(products, benefitScores, answersInput) {
    const selectedAnswerIds = new Set(answersInput.flatMap(a => a.answerIds || []));

    const scoredProducts = [];
    
    for (const product of products) {
      // Get product benefits
      const productBenefits = await getProductBenefitsByProduct(product._id);
      
      // Get all benefits for lookup
      const allBenefits = await getAllBenefits({});
      const benefitMap = {};
      allBenefits.forEach(b => {
        benefitMap[b._id.toString()] = b;
      });

      // Calculate benefit component
      let benefitComponent = 0;
      for (const pb of productBenefits) {
        const benefit = benefitMap[pb.benefitId.toString()];
        if (benefit) {
          const code = benefit.code;
          const userBenefitScore = benefitScores[code] || 0;
          benefitComponent += userBenefitScore * pb.score;
        }
      }

      // Get direct answer boosts
      const productAnswerScores = await getProductAnswerScoresByProduct(product._id);
      let directBoost = 0;
      for (const pas of productAnswerScores) {
        if (selectedAnswerIds.has(pas.answerId.toString())) {
          directBoost += pas.score;
        }
      }

      const finalScore = benefitComponent + directBoost;

      scoredProducts.push({
        id: product._id.toString(),
        itCode: product.itCode,
        name: product.name,
        brandLine: product.brandLine,
        visionType: product.visionType,
        lensIndex: product.lensIndex,
        tintOption: product.tintOption,
        mrp: product.mrp,
        offerPrice: product.offerPrice,
        yopoEligible: product.yopoEligible,
        benefitComponent,
        directBoostComponent: directBoost,
        finalScore
      });
    }

    return scoredProducts;
  }

  filterByBudget(product, budgetFilter) {
    if (!budgetFilter) return true;
    if (budgetFilter === 'ECONOMY') return product.offerPrice <= 2000;
    if (budgetFilter === 'STANDARD') return product.offerPrice > 2000 && product.offerPrice <= 5000;
    if (budgetFilter === 'PREMIUM') return product.offerPrice > 5000 && product.offerPrice <= 10000;
    if (budgetFilter === 'BEST') return true;
    return true;
  }
}

export class RxValidationService {
  isProductInRxRange(product, rx) {
    const powers = [
      Math.abs(rx.rSph || 0),
      Math.abs(rx.lSph || 0),
      Math.abs((rx.rSph || 0) + (rx.rCyl || 0)),
      Math.abs((rx.lSph || 0) + (rx.lCyl || 0))
    ];
    const maxPower = Math.max(...powers);

    if (maxPower < product.sphMin || maxPower > product.sphMax) return false;
    return true;
  }

  inferVisionType(rx, override) {
    if (override) return override;
    if (rx.add && rx.add > 0.75) {
      return VisionType.PROGRESSIVE;
    }
    return VisionType.SINGLE_VISION;
  }
}

export class IndexRecommendationService {
  recommendIndex(rx, frame) {
    const powers = [
      Math.abs(rx.rSph || 0),
      Math.abs(rx.lSph || 0),
      Math.abs((rx.rSph || 0) + (rx.rCyl || 0)),
      Math.abs((rx.lSph || 0) + (rx.lCyl || 0))
    ];
    const maxPower = Math.max(...powers);

    let baseIndex = LensIndex.INDEX_156;
    if (maxPower <= 3) {
      baseIndex = LensIndex.INDEX_156;
    } else if (maxPower <= 5) {
      baseIndex = LensIndex.INDEX_160;
    } else if (maxPower <= 8) {
      baseIndex = LensIndex.INDEX_167;
    } else {
      baseIndex = LensIndex.INDEX_174;
    }

    // Adjust for frame type
    if (frame) {
      if (frame.frameType === 'RIMLESS' && maxPower > 2 && baseIndex === LensIndex.INDEX_156) {
        baseIndex = LensIndex.INDEX_160;
      }
      if (frame.frameType === 'HALF_RIM' && maxPower > 4 && baseIndex === LensIndex.INDEX_156) {
        baseIndex = LensIndex.INDEX_167;
      }
    }

    return baseIndex;
  }
}

