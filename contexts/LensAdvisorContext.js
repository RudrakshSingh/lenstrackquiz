// contexts/LensAdvisorContext.js
// Global state management for Lens Advisor flow (V1.0 UI/UX Master Flow)

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LensAdvisorContext = createContext(null);

export function LensAdvisorProvider({ children }) {
  // Language state
  const [language, setLanguage] = useState('en'); // en, hi, hinglish
  
  // Store context (from QR scan or POS)
  const [storeContext, setStoreContext] = useState({
    storeId: null,
    storeName: null,
    salesMode: 'SELF_SERVICE', // SELF_SERVICE or STAFF_ASSISTED
  });
  
  // Prescription data (LA-02)
  const [rxData, setRxData] = useState({
    rightSph: '',
    rightCyl: '',
    rightAxis: '',
    leftSph: '',
    leftCyl: '',
    leftAxis: '',
    add: '',
    pd: '',
  });
  
  // Frame data (LA-03)
  const [frameData, setFrameData] = useState({
    brand: '',
    subCategory: '', // For Lenstrack: ESSENTIAL, ALFA, ADVANCED, PREMIUM
    mrp: '',
    type: '', // Full Rim, Half Rim, Rimless
    material: '', // Metal, TR90, Acetate, etc.
  });
  
  // Questionnaire answers (LA-04)
  const [answers, setAnswers] = useState({});
  
  // Recommendations (LA-05)
  const [recommendations, setRecommendations] = useState(null);
  const [selectedLens, setSelectedLens] = useState(null);
  
  // Offer summary (OF-01)
  const [offerSummary, setOfferSummary] = useState(null);
  
  // Customer details for checkout
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    staffId: null,
    staffName: '', // For self-service text input
  });
  
  // Order data
  const [orderData, setOrderData] = useState(null);

  // Actions
  const updateLanguage = useCallback((lang) => {
    setLanguage(lang);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lensadvisor-language', lang);
    }
  }, []);

  const updateStoreContext = useCallback((context) => {
    setStoreContext(prev => ({ ...prev, ...context }));
  }, []);

  const updateRxData = useCallback((data) => {
    setRxData(prev => ({ ...prev, ...data }));
  }, []);

  const updateFrameData = useCallback((data) => {
    setFrameData(prev => ({ ...prev, ...data }));
  }, []);

  const updateAnswers = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const setRecommendationsData = useCallback((data) => {
    setRecommendations(data);
  }, []);

  const selectLens = useCallback((lens) => {
    setSelectedLens(lens);
  }, []);

  const setOfferSummaryData = useCallback((data) => {
    setOfferSummary(data);
  }, []);

  const updateCustomerDetails = useCallback((data) => {
    setCustomerDetails(prev => ({ ...prev, ...data }));
  }, []);

  const setOrderDataData = useCallback((data) => {
    setOrderData(data);
  }, []);

  // Reset all data
  const reset = useCallback(() => {
    setLanguage('en');
    setStoreContext({ storeId: null, storeName: null, salesMode: 'SELF_SERVICE' });
    setRxData({
      rightSph: '', rightCyl: '', rightAxis: '',
      leftSph: '', leftCyl: '', leftAxis: '',
      add: '', pd: '',
    });
    setFrameData({ brand: '', subCategory: '', mrp: '', type: '', material: '' });
    setAnswers({});
    setRecommendations(null);
    setSelectedLens(null);
    setOfferSummary(null);
    setCustomerDetails({ name: '', phone: '', email: '', staffId: null, staffName: '' });
    setOrderData(null);
  }, []);

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('lensadvisor-language');
      if (savedLang && ['en', 'hi', 'hinglish'].includes(savedLang)) {
        setLanguage(savedLang);
      }
    }
  }, []);

  const value = {
    // State
    language,
    storeContext,
    rxData,
    frameData,
    answers,
    recommendations,
    selectedLens,
    offerSummary,
    customerDetails,
    orderData,
    
    // Actions
    updateLanguage,
    updateStoreContext,
    updateRxData,
    updateFrameData,
    updateAnswers,
    setRecommendationsData,
    selectLens,
    setOfferSummaryData,
    updateCustomerDetails,
    setOrderDataData,
    reset,
  };

  return (
    <LensAdvisorContext.Provider value={value}>
      {children}
    </LensAdvisorContext.Provider>
  );
}

export function useLensAdvisor() {
  const context = useContext(LensAdvisorContext);
  if (!context) {
    throw new Error('useLensAdvisor must be used within LensAdvisorProvider');
  }
  return context;
}

