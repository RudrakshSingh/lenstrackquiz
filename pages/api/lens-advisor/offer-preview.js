// pages/api/lens-advisor/offer-preview.js
// POST /lens-advisor/offer-preview - Calculate offer pricing and savings

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      items = [],
      selected_offer_id
    } = req.body;

    // Validate input
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "items array is required and cannot be empty"
      });
    }

    if (!selected_offer_id) {
      return res.status(400).json({
        success: false,
        error: "selected_offer_id is required"
      });
    }

    // Calculate price without offer
    const priceWithoutOffer = items.reduce((total, item) => {
      const framePrice = item.frame_price || 0;
      const lensPrice = item.lens_price || 0;
      return total + framePrice + lensPrice;
    }, 0);

    // Apply offer
    const offerResult = applyOffer(items, selected_offer_id, req.body.offer_config || {});
    
    const priceWithOffer = offerResult.finalPrice;
    const youSaveValue = priceWithoutOffer - priceWithOffer;
    const youSavePercent = priceWithoutOffer > 0 
      ? (youSaveValue / priceWithoutOffer) * 100 
      : 0;

    return res.status(200).json({
      success: true,
      price_without_offer: Math.round(priceWithoutOffer),
      price_with_offer: Math.round(priceWithOffer),
      you_save_value: Math.round(youSaveValue),
      you_save_percent: Math.round(youSavePercent * 100) / 100,
      applied_offer_id: selected_offer_id,
      line_level_discounts: offerResult.lineLevelDiscounts || []
    });

  } catch (error) {
    console.error("Offer preview API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}

/**
 * Apply offer to cart items
 */
function applyOffer(items, offerType, offerConfig = {}) {
  let finalPrice = 0;
  const lineLevelDiscounts = [];

  // Calculate total for each item
  const itemTotals = items.map(item => ({
    ...item,
    total: (item.frame_price || 0) + (item.lens_price || 0)
  }));

  switch (offerType.toUpperCase()) {
    case "B1G1":
    case "BOGO":
      // Buy 1 Get 1 Free - cheapest item becomes free
      const sortedB1G1 = [...itemTotals].sort((a, b) => b.total - a.total);
      finalPrice = sortedB1G1[0].total; // Pay for most expensive
      if (sortedB1G1.length > 1) {
        lineLevelDiscounts.push({
          item_index: itemTotals.indexOf(sortedB1G1[1]),
          discount: sortedB1G1[1].total,
          description: "Free (B1G1)"
        });
      }
      break;

    case "B1G50":
    case "BOGO_50":
      // Buy 1 Get 50% Off - 50% discount on cheaper item
      const sortedB1G50 = [...itemTotals].sort((a, b) => b.total - a.total);
      finalPrice = sortedB1G50[0].total; // Full price for first
      if (sortedB1G50.length > 1) {
        const discount = sortedB1G50[1].total * 0.5;
        finalPrice += discount;
        lineLevelDiscounts.push({
          item_index: itemTotals.indexOf(sortedB1G50[1]),
          discount: sortedB1G50[1].total - discount,
          description: "50% off (B1G50)"
        });
      } else {
        finalPrice = sortedB1G50[0].total;
      }
      break;

    case "YOPO":
      // You Only Pay for One - pay only for highest priced item
      const sortedYOPO = [...itemTotals].sort((a, b) => b.total - a.total);
      finalPrice = sortedYOPO[0].total;
      // All other items are free
      for (let i = 1; i < sortedYOPO.length; i++) {
        lineLevelDiscounts.push({
          item_index: itemTotals.indexOf(sortedYOPO[i]),
          discount: sortedYOPO[i].total,
          description: "Free (YOPO)"
        });
      }
      break;

    case "X_Y":
      // Buy at X price, get second at Y price
      const xPrice = offerConfig.x || 0;
      const yPrice = offerConfig.y || 0;
      
      if (itemTotals.length >= 2) {
        const sortedXY = [...itemTotals].sort((a, b) => b.total - a.total);
        
        // First item at X price (or full price if X not specified)
        const firstPrice = xPrice > 0 ? Math.min(xPrice, sortedXY[0].total) : sortedXY[0].total;
        finalPrice = firstPrice;
        
        // Second item at Y price
        if (sortedXY.length > 1) {
          const secondPrice = yPrice;
          finalPrice += secondPrice;
          
          if (secondPrice < sortedXY[1].total) {
            lineLevelDiscounts.push({
              item_index: itemTotals.indexOf(sortedXY[1]),
              discount: sortedXY[1].total - secondPrice,
              description: `Special price ₹${yPrice} (X-Y Offer)`
            });
          }
        }
        
        // Remaining items at full price
        for (let i = 2; i < sortedXY.length; i++) {
          finalPrice += sortedXY[i].total;
        }
      } else {
        // Single item - apply X price if specified
        finalPrice = xPrice > 0 ? Math.min(xPrice, itemTotals[0].total) : itemTotals[0].total;
      }
      break;

    case "PERCENT":
    case "PERCENT_OFF":
      // Percentage discount
      const percentage = offerConfig.percentage || 0;
      if (percentage <= 0 || percentage > 100) {
        throw new Error("Invalid percentage. Must be between 1 and 100");
      }
      
      const discountMultiplier = (100 - percentage) / 100;
      itemTotals.forEach((item, index) => {
        const discountedPrice = item.total * discountMultiplier;
        finalPrice += discountedPrice;
        
        if (discountedPrice < item.total) {
          lineLevelDiscounts.push({
            item_index: index,
            discount: item.total - discountedPrice,
            description: `${percentage}% off`
          });
        }
      });
      break;

    default:
      // No offer or unknown offer type - return full price
      finalPrice = itemTotals.reduce((sum, item) => sum + item.total, 0);
      break;
  }

  return {
    finalPrice: Math.max(0, finalPrice), // Ensure non-negative
    lineLevelDiscounts
  };
}

