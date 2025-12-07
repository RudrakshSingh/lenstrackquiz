// context/LensAdvisorContext.js
// Global state management for Lens Advisor Tool

import { createContext, useContext, useState, useCallback } from 'react';

const LensAdvisorContext = createContext(null);

export function LensAdvisorProvider({ children }) {
  const [state, setState] = useState({
    language: 'en',
    power: {
      right: { sph: null, cyl: null },
      left: { sph: null, cyl: null }
    },
    frameType: null,
    answers: {
      vision_need: null,
      screen_hours: null,
      outdoor_hours: null,
      driving_pattern: null,
      symptoms: [],
      preference: null,
      second_pair_interest: null
    },
    backendResult: null,
    selectedLensId: null,
    selectedSecondPairLensId: null,
    selectedOfferId: null,
    offerPreview: null,
    isLoading: false,
    error: null
  });

  const setLanguage = useCallback((language) => {
    setState(prev => ({ ...prev, language }));
  }, []);

  const setPower = useCallback((eye, field, value) => {
    setState(prev => ({
      ...prev,
      power: {
        ...prev.power,
        [eye]: {
          ...prev.power[eye],
          [field]: value === '' ? null : parseFloat(value) || null
        }
      }
    }));
  }, []);

  const setFrameType = useCallback((frameType) => {
    setState(prev => ({ ...prev, frameType }));
  }, []);

  const setAnswer = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [key]: value
      }
    }));
  }, []);

  const setBackendResult = useCallback((result) => {
    setState(prev => ({ ...prev, backendResult: result }));
  }, []);

  const setSelectedLens = useCallback((lensId) => {
    setState(prev => ({ ...prev, selectedLensId: lensId }));
  }, []);

  const setSelectedSecondPair = useCallback((lensId) => {
    setState(prev => ({ ...prev, selectedSecondPairLensId: lensId }));
  }, []);

  const setSelectedOffer = useCallback((offerId) => {
    setState(prev => ({ ...prev, selectedOfferId: offerId }));
  }, []);

  const setOfferPreview = useCallback((preview) => {
    setState(prev => ({ ...prev, offerPreview: preview }));
  }, []);

  const setLoading = useCallback((isLoading) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const reset = useCallback(() => {
    setState({
      language: 'en',
      power: {
        right: { sph: null, cyl: null },
        left: { sph: null, cyl: null }
      },
      frameType: null,
      answers: {
        vision_need: null,
        screen_hours: null,
        outdoor_hours: null,
        driving_pattern: null,
        symptoms: [],
        preference: null,
        second_pair_interest: null
      },
      backendResult: null,
      selectedLensId: null,
      selectedSecondPairLensId: null,
      selectedOfferId: null,
      offerPreview: null,
      isLoading: false,
      error: null
    });
  }, []);

  const value = {
    ...state,
    setLanguage,
    setPower,
    setFrameType,
    setAnswer,
    setBackendResult,
    setSelectedLens,
    setSelectedSecondPair,
    setSelectedOffer,
    setOfferPreview,
    setLoading,
    setError,
    reset
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

