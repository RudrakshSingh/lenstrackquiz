// lib/translation.js
// Simple translation utility for Hindi and Hinglish
// Note: For production, use a proper translation API like Google Translate

/**
 * Simple transliteration-based translation for Hindi
 * This is a basic implementation - for production, use a proper translation service
 */
export function translateToHindi(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Basic transliteration rules (very simplified)
  // In production, use Google Translate API or similar
  const transliterationMap = {
    'how': 'कैसे',
    'what': 'क्या',
    'when': 'कब',
    'where': 'कहाँ',
    'why': 'क्यों',
    'who': 'कौन',
    'which': 'कौन सा',
    'many': 'कई',
    'hours': 'घंटे',
    'do you': 'आप',
    'spend': 'बिताते',
    'on': 'पर',
    'digital': 'डिजिटल',
    'devices': 'उपकरण',
    'daily': 'रोज़ाना',
    'time': 'समय',
    'outdoors': 'बाहर',
    'drive': 'गाड़ी चलाते',
    'often': 'अक्सर',
    'symptoms': 'लक्षण',
    'experience': 'अनुभव',
    'preferences': 'प्राथमिकताएं',
    'specific': 'विशिष्ट',
    'lenses': 'लेंस',
  };
  
  // For now, return a placeholder that indicates translation needed
  // In production, integrate with Google Translate API
  return `[Hindi: ${text}]`; // Placeholder
}

/**
 * Convert English to Hinglish (Hindi-English mix)
 */
export function translateToHinglish(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Hinglish is a mix - keep key English words, add Hindi context
  // This is a simplified version
  return text; // For now, return as-is. Can be enhanced with proper Hinglish conversion
}

/**
 * Auto-translate text to Hindi and Hinglish
 * Returns an object with translations
 */
export async function autoTranslate(text) {
  if (!text || typeof text !== 'string') {
    return { hindi: '', hinglish: '' };
  }
  
  try {
    // For now, return placeholders
    // In production, call Google Translate API or similar
    const hindi = translateToHindi(text);
    const hinglish = translateToHinglish(text);
    
    return {
      hindi,
      hinglish
    };
  } catch (error) {
    console.error('Translation error:', error);
    return { hindi: '', hinglish: '' };
  }
}

