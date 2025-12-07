// lib/upsellEngine.js
// Upsell Engine for second pair and feature suggestions

/**
 * Determine second pair type based on requirement profile
 */
export function determineSecondPairType(requirementProfile) {
  const {
    vision_type,
    screen_load_level = 0,
    driving_level = 0,
    outdoor_hours = 0,
    age = null,
    lifestyle_tags = []
  } = requirementProfile;
  
  const suggestions = [];
  
  // Computer Pair
  if (screen_load_level >= 4 || lifestyle_tags.includes('SCREEN_HIGH')) {
    suggestions.push({
      type: 'COMPUTER_PAIR',
      priority: 5,
      reason: 'High screen usage detected',
      description: {
        en: 'Computer-specific pair with extra blue protection and wider screen zone',
        hi: 'कंप्यूटर-विशिष्ट चश्मा अतिरिक्त ब्लू सुरक्षा के साथ',
        hinglish: 'Computer-specific pair extra blue protection ke saath'
      }
    });
  }
  
  // Driving Pair
  if (driving_level >= 3 || lifestyle_tags.includes('DRIVER_NIGHT')) {
    suggestions.push({
      type: 'DRIVING_PAIR',
      priority: 4,
      reason: 'Night driving detected',
      description: {
        en: 'Night driving pair with premium AR and driving support',
        hi: 'रात की ड्राइविंग के लिए प्रीमियम AR वाला चश्मा',
        hinglish: 'Night driving ke liye premium AR wala chashma'
      }
    });
  }
  
  // Outdoor/Sun Pair
  if (outdoor_hours >= 3 || lifestyle_tags.includes('OUTDOOR_HIGH')) {
    suggestions.push({
      type: 'SUN_PAIR',
      priority: 3,
      reason: 'High outdoor exposure',
      description: {
        en: 'Prescription sunglasses or photochromic lenses',
        hi: 'प्रिस्क्रिप्शन धूप का चश्मा या फोटोक्रोमिक लेंस',
        hinglish: 'Prescription sunglasses ya photochromic lenses'
      }
    });
  }
  
  // Reading Pair (for presbyopia)
  if (age && age >= 40 && vision_type !== 'PROGRESSIVE') {
    suggestions.push({
      type: 'READING_PAIR',
      priority: 2,
      reason: 'Age-related near vision needs',
      description: {
        en: 'Dedicated reading pair for comfortable near work',
        hi: 'आरामदायक निकट कार्य के लिए समर्पित पढ़ने का चश्मा',
        hinglish: 'Comfortable near work ke liye dedicated reading pair'
      }
    });
  }
  
  // Zero Power Fashion Pair
  if (vision_type === 'ZERO_POWER' || lifestyle_tags.includes('FASHION_FOCUSED')) {
    suggestions.push({
      type: 'FASHION_PAIR',
      priority: 1,
      reason: 'Fashion and style focus',
      description: {
        en: 'Zero power fashion or office pair',
        hi: 'शून्य पावर फैशन या ऑफिस चश्मा',
        hinglish: 'Zero power fashion ya office pair'
      }
    });
  }
  
  // Sort by priority and return top suggestions
  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate upsell message for second pair
 */
export function generateSecondPairMessage(secondPairType, requirementProfile, offer, language = 'en') {
  const messages = {
    COMPUTER_PAIR: {
      en: `You use screens for ${requirementProfile.screen_load_level || 0} hours daily. Most professionals like you add a computer-specific pair with extra blue protection and wider screen zone. ${offer ? 'With current offer, your second pair is effectively FREE (YOPO).' : ''}`,
      hi: `आप रोज़ाना ${requirementProfile.screen_load_level || 0} घंटे स्क्रीन का उपयोग करते हैं। आप जैसे अधिकांश पेशेवर अतिरिक्त ब्लू सुरक्षा के साथ कंप्यूटर-विशिष्ट जोड़ी जोड़ते हैं। ${offer ? 'वर्तमान ऑफ़र के साथ, आपका दूसरा चश्मा प्रभावी रूप से मुफ़्त है (YOPO)।' : ''}`,
      hinglish: `Aap roz ${requirementProfile.screen_load_level || 0} ghante screen use karte ho. Aap jaise professionals computer-specific pair add karte hain extra blue protection ke saath. ${offer ? 'Current offer ke saath, aapka 2nd pair effectively FREE hai (YOPO).' : ''}`
    },
    DRIVING_PAIR: {
      en: `You drive regularly, especially at night. A dedicated driving pair with premium anti-glare coating will significantly improve your night vision and safety. ${offer ? 'Add it now with special offer.' : ''}`,
      hi: `आप नियमित रूप से गाड़ी चलाते हैं, खासकर रात में। प्रीमियम एंटी-ग्लेयर कोटिंग वाला एक समर्पित ड्राइविंग चश्मा आपकी रात की दृष्टि और सुरक्षा में काफी सुधार करेगा। ${offer ? 'अभी विशेष ऑफ़र के साथ जोड़ें।' : ''}`,
      hinglish: `Aap regularly drive karte ho, especially night mein. Dedicated driving pair premium anti-glare coating ke saath aapki night vision aur safety improve karega. ${offer ? 'Abhi special offer ke saath add karo.' : ''}`
    },
    SUN_PAIR: {
      en: `You spend significant time outdoors. Protect your eyes with prescription sunglasses or photochromic lenses that adapt to sunlight. ${offer ? 'Perfect for your second pair with current offer.' : ''}`,
      hi: `आप बाहर काफी समय बिताते हैं। प्रिस्क्रिप्शन धूप का चश्मा या फोटोक्रोमिक लेंस से अपनी आंखों की सुरक्षा करें जो सूरज की रोशनी के अनुकूल होते हैं। ${offer ? 'वर्तमान ऑफ़र के साथ आपके दूसरे चश्मे के लिए परफेक्ट।' : ''}`,
      hinglish: `Aap bahar kaafi time spend karte ho. Prescription sunglasses ya photochromic lenses se apni aankhon ki protection karo jo sunlight ke saath adapt hote hain. ${offer ? 'Current offer ke saath 2nd pair ke liye perfect.' : ''}`
    }
  };
  
  const typeMessages = messages[secondPairType] || messages.COMPUTER_PAIR;
  return typeMessages[language] || typeMessages.en;
}

/**
 * Get upsell suggestions based on requirement profile
 */
export function getUpsellSuggestions(requirementProfile, selectedLens, availableOffers = [], language = 'en') {
  const secondPairTypes = determineSecondPairType(requirementProfile);
  const suggestions = [];
  
  // Find best offer for second pair
  const bestOffer = availableOffers.length > 0 
    ? availableOffers[0] // Simplified - would use getBestOffer in real implementation
    : null;
  
  secondPairTypes.forEach(pairType => {
    const message = generateSecondPairMessage(
      pairType.type,
      requirementProfile,
      bestOffer,
      language
    );
    
    suggestions.push({
      type: pairType.type,
      priority: pairType.priority,
      reason: pairType.reason,
      description: pairType.description[language] || pairType.description.en,
      message,
      offer: bestOffer,
      estimatedSavings: bestOffer ? calculateUpsellSavings(selectedLens, bestOffer) : null
    });
  });
  
  return suggestions;
}

/**
 * Calculate estimated savings for upsell
 */
function calculateUpsellSavings(lens, offer) {
  if (!offer || !lens) return 0;
  
  const mrp = lens.price_mrp || lens.numericPrice || 0;
  
  if (offer.type === 'yopo' || offer.type === 'bogo') {
    return mrp; // Second pair free
  }
  
  if (offer.type === 'bogo_50') {
    return mrp * 0.5; // 50% off on second
  }
  
  if (offer.type === 'fixed_discount' && offer.config?.percentage) {
    return (mrp * offer.config.percentage) / 100;
  }
  
  return 0;
}

/**
 * Generate upsell suggestions (alias for getUpsellSuggestions for compatibility)
 */
export function generateUpsellSuggestions(requirementProfile, recommendation, availableOffers = [], language = 'en') {
  // Extract language from recommendation if available
  const lang = recommendation?.language || language;
  
  // Get the selected lens (use perfectMatch if available, otherwise recommended)
  const selectedLens = recommendation?.perfectMatch || recommendation?.recommended || null;
  
  return getUpsellSuggestions(requirementProfile, selectedLens, availableOffers, lang);
}

