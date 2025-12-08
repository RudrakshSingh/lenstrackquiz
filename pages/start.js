// pages/start.js
// Screen LA-01: Language Selection + Store Context (V1.0 UI/UX Master Flow)

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import styles from '../styles/quiz.module.css';
import dynamic from 'next/dynamic';

const CustomerBackground = dynamic(() => import('../components/three/CustomerBackground'), {
  ssr: false,
});

const translations = {
  en: {
    title: "Choose your language",
    poweredBy: "Lenstrack",
    continue: "Continue",
  },
  hi: {
    title: "अपनी भाषा चुनें",
    poweredBy: "Lenstrack",
    continue: "जारी रखें",
  },
  hinglish: {
    title: "Apni language choose karein",
    poweredBy: "Lenstrack",
    continue: "Continue",
  },
};

export default function StartPage() {
  const router = useRouter();
  const { language, updateLanguage, updateStoreContext } = useLensAdvisor();
  const [selectedLang, setSelectedLang] = useState(language);
  const [storeId, setStoreId] = useState(null);

  // Extract storeId from QR code or URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeIdParam = params.get('storeId');
    const mode = params.get('mode') || params.get('salesMode');
    
    if (storeIdParam) {
      setStoreId(storeIdParam);
      updateStoreContext({
        storeId: storeIdParam,
        salesMode: (mode === 'STAFF_ASSISTED' || mode === 'POS') ? 'STAFF_ASSISTED' : 'SELF_SERVICE',
      });
    }
  }, [updateStoreContext]);

  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    updateLanguage(lang);
  };

  const handleContinue = () => {
    // Navigate to prescription entry
    router.push('/rx');
  };

  const t = translations[selectedLang] || translations.en;

  return (
    <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
      <CustomerBackground />
      <div className={styles.stepCard} style={{ maxWidth: '500px', margin: '2rem auto', position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '2rem', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Lenstrack wordmark at top center */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#1e40af',
            marginBottom: '0.5rem'
          }}>
            {t.poweredBy}
          </h1>
        </div>

        {/* Title */}
        <div className={styles.stepHeader} style={{ marginBottom: '2rem' }}>
          <h2 className={styles.stepTitle} style={{ fontSize: '1.5rem', textAlign: 'center' }}>
            {t.title}
          </h2>
        </div>

        {/* Language buttons - 3 large buttons, full width, rounded, high contrast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => handleLanguageSelect('en')}
            className={styles.optionButton}
            style={{
              width: '100%',
              padding: '1.5rem',
              fontSize: '1.2rem',
              borderRadius: '12px',
              border: selectedLang === 'en' ? '3px solid #1e40af' : '2px solid #e5e7eb',
              backgroundColor: selectedLang === 'en' ? '#eff6ff' : '#ffffff',
              color: selectedLang === 'en' ? '#1e40af' : '#374151',
              fontWeight: selectedLang === 'en' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            English
          </button>
          
          <button
            onClick={() => handleLanguageSelect('hi')}
            className={styles.optionButton}
            style={{
              width: '100%',
              padding: '1.5rem',
              fontSize: '1.2rem',
              borderRadius: '12px',
              border: selectedLang === 'hi' ? '3px solid #1e40af' : '2px solid #e5e7eb',
              backgroundColor: selectedLang === 'hi' ? '#eff6ff' : '#ffffff',
              color: selectedLang === 'hi' ? '#1e40af' : '#374151',
              fontWeight: selectedLang === 'hi' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            हिंदी (Hindi)
          </button>
          
          <button
            onClick={() => handleLanguageSelect('hinglish')}
            className={styles.optionButton}
            style={{
              width: '100%',
              padding: '1.5rem',
              fontSize: '1.2rem',
              borderRadius: '12px',
              border: selectedLang === 'hinglish' ? '3px solid #1e40af' : '2px solid #e5e7eb',
              backgroundColor: selectedLang === 'hinglish' ? '#eff6ff' : '#ffffff',
              color: selectedLang === 'hinglish' ? '#1e40af' : '#374151',
              fontWeight: selectedLang === 'hinglish' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Hinglish
          </button>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className={styles.nextButton}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            marginTop: '1rem',
          }}
        >
          {t.continue} <span className={styles.buttonArrow}>→</span>
        </button>
      </div>
    </div>
  );
}

