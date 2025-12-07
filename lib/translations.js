// lib/translations.js
// Centralized translation dictionary

export const translations = {
  en: {
    // Common
    continue: "Continue",
    back: "Back",
    next: "Next",
    skip: "Skip",
    select: "Select",
    cancel: "Cancel",
    confirm: "Confirm",
    retry: "Retry",
    
    // Language Screen
    selectLanguage: "Select Language",
    poweredBy: "Powered by Lenstrack",
    
    // Customer Basics
    customerBasics: "Customer Information",
    rightEye: "Right Eye",
    leftEye: "Left Eye",
    sph: "SPH",
    cyl: "CYL",
    frameType: "Frame Type",
    frameTypeDesc: "What type of frame are you planning to use?",
    skipPower: "Skip Power Entry",
    powerOptional: "Power entry is optional. You can skip and enter later.",
    
    // Questionnaire
    questionnaire: "Lifestyle Questionnaire",
    step: "Step",
    of: "of",
    
    // Questions
    visionNeed: "What is your primary vision need?",
    screenHours: "How many hours do you use mobile/computer daily?",
    outdoorHours: "How much time do you spend outdoors?",
    drivingPattern: "How often do you drive?",
    symptoms: "What symptoms do you experience? (Select all that apply)",
    preference: "What is your preference?",
    secondPairInterest: "Are you interested in a second pair?",
    
    // Question Options
    visionNeedOptions: ["Distance", "Reading", "Both", "No Power"],
    screenHoursOptions: ["0-2 hrs", "2-4 hrs", "4-6 hrs", "6-8 hrs", "8-12 hrs", "12-24 hrs"],
    outdoorHoursOptions: ["Minimal", "1-3 hrs", "3-6 hrs", "6+ hrs"],
    drivingPatternOptions: ["None", "Day only", "Some night", "Daily night", "Professional"],
    symptomsOptions: ["Eye strain", "Headaches", "Blurred vision", "Dry eyes", "None"],
    preferenceOptions: ["Budget", "Balanced", "Best Clarity", "Thinnest"],
    secondPairOptions: ["Computer/Office", "Driving", "Sunglasses", "Not Sure"],
    
    // Usage Summary
    usageSummary: "Usage Summary",
    usageSummaryDesc: "Based on your responses, here's your usage profile",
    deviceSeverity: "Device Usage",
    outdoorSeverity: "Outdoor Exposure",
    drivingSeverity: "Driving Frequency",
    powerSeverity: "Power Level",
    requiredIndex: "Minimum Safe Index",
    requiredIndexDesc: "For your power and frame combination",
    viewRecommendations: "View Lens Recommendations",
    
    // Recommendations
    recommendations: "Lens Recommendations",
    perfectMatch: "Perfect Match",
    recommended: "Recommended",
    safeValue: "Safe Value",
    selectThisLens: "Select This Lens",
    compareLenses: "Compare Lens Details",
    whyPerfect: "Why it's perfect",
    
    // Offers
    offers: "Special Offers",
    addSecondPair: "Add Second Pair",
    continueWithoutSecondPair: "Continue without second pair",
    increaseSavings: "Add second pair and increase your savings",
    
    // Second Pair
    selectSecondPair: "Select Your Second Pair",
    secondPairDesc: "Choose a lens optimized for your second pair needs",
    addToCart: "Add to Cart",
    applyOffer: "Apply Offer & Continue",
    
    // Price List
    fullPriceList: "Complete Price List",
    sortBy: "Sort By",
    filter: "Filter",
    showAll: "Show All",
    showSuitable: "Show Suitable Only",
    suitability: "Suitability",
    
    // Final Summary
    orderSummary: "Order Summary",
    primaryLens: "Primary Lens",
    secondPair: "Second Pair",
    offerApplied: "Offer Applied",
    originalTotal: "Original Total",
    discount: "Discount",
    finalPayable: "Final Payable",
    sendToBilling: "Send to Billing",
    startNewCustomer: "Start New Customer",
    
    // Errors
    errorGeneric: "Something went wrong, please retry.",
    errorNetwork: "Network error, please check connection and retry.",
    errorNoLenses: "No lens found that meets all conditions. Showing safest possible options.",
    frameUnsafe: "Your power requires a stronger frame. Please go back and change frame type.",
    
    // Warnings
    warning: "Warning",
    rimlessRequiresHighIndex: "Rimless requires high-index lenses for safety"
  },
  
  hi: {
    // Hindi translations
    continue: "जारी रखें",
    back: "वापस",
    next: "अगला",
    selectLanguage: "भाषा चुनें",
    poweredBy: "Lenstrack द्वारा संचालित",
    // Add more Hindi translations as needed
  },
  
  hinglish: {
    // Hinglish translations
    continue: "Continue",
    back: "Back",
    next: "Next",
    selectLanguage: "Language select karein",
    poweredBy: "Lenstrack se powered",
    // Add more Hinglish translations as needed
  }
};

export function getTranslation(language, key) {
  return translations[language]?.[key] || translations.en[key] || key;
}

