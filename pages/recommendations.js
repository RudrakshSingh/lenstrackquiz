// pages/recommendations.js
// Screen LA-05: Lens Recommendations - 4-Card Layout (V1.0 UI/UX Master Flow)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import Loader from '../components/Loader';
import SkeletonLoader from '../components/SkeletonLoader';
import { api } from '../lib/api-client';
import styles from '../styles/quiz.module.css';
import dynamic from 'next/dynamic';

const CustomerBackground = dynamic(() => import('../components/three/CustomerBackground'), {
  ssr: false,
});

const translations = {
  en: {
    header: "Best Lenses for You",
    summary: "We analyzed your power, frame and lifestyle to recommend 4 options.",
    bestMatch: "Best Match",
    recommendedIndex: "Recommended Index",
    premiumUpgrade: "Premium Upgrade",
    budgetOption: "Budget Option",
    lensPriceFrom: "Lens Price from: ₹{price}",
    offerNote: "Offer, before frame & discounts",
    knowMore: "Know more",
    selectThisLens: "Select This Lens",
    viewAll: "View All Lens Options",
    matchPercent: "{percent}% Match",
    index: "Index",
    benefits: "Benefits",
    yopo: "YOPO Eligible",
    combo: "Combo Eligible",
    freeLens: "Free Lens Possible",
    loading: "Analyzing your responses...",
  },
  hi: {
    header: "आपके लिए सर्वोत्तम लेंस",
    summary: "हमने आपकी पावर, फ्रेम और जीवनशैली का विश्लेषण करके 4 विकल्प सुझाए हैं।",
    bestMatch: "सर्वोत्तम मैच",
    recommendedIndex: "अनुशंसित इंडेक्स",
    premiumUpgrade: "प्रीमियम अपग्रेड",
    budgetOption: "बजट विकल्प",
    lensPriceFrom: "लेंस कीमत: ₹{price} से",
    offerNote: "ऑफ़र, फ्रेम और छूट से पहले",
    knowMore: "और जानें",
    selectThisLens: "इस लेंस को चुनें",
    viewAll: "सभी लेंस विकल्प देखें",
    matchPercent: "{percent}% मैच",
    index: "इंडेक्स",
    benefits: "लाभ",
    yopo: "YOPO योग्य",
    combo: "कॉम्बो योग्य",
    freeLens: "मुफ्त लेंस संभव",
    loading: "आपकी प्रतिक्रियाओं का विश्लेषण...",
  },
  hinglish: {
    header: "Aapke liye Best Lenses",
    summary: "Humne aapki power, frame aur lifestyle analyze karke 4 options recommend kiye hain.",
    bestMatch: "Best Match",
    recommendedIndex: "Recommended Index",
    premiumUpgrade: "Premium Upgrade",
    budgetOption: "Budget Option",
    lensPriceFrom: "Lens Price: ₹{price} se",
    offerNote: "Offer, frame aur discounts se pehle",
    knowMore: "Aur jaanen",
    selectThisLens: "Is lens ko choose karein",
    viewAll: "Sabhi lens options dekhein",
    matchPercent: "{percent}% Match",
    index: "Index",
    benefits: "Benefits",
    yopo: "YOPO Eligible",
    combo: "Combo Eligible",
    freeLens: "Free Lens Possible",
    loading: "Aapke responses analyze ho rahe hain...",
  },
};

export default function RecommendationsPage() {
  const router = useRouter();
  const { 
    language, 
    rxData, 
    frameData, 
    answers, 
    recommendations, 
    setRecommendationsData, 
    selectLens 
  } = useLensAdvisor();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewAll, setShowViewAll] = useState(false);

  const t = translations[language] || translations.en;

  // Fetch recommendations
  useEffect(() => {
    if (!recommendations) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare user data for API
      const userData = {
        power: {
          right: {
            sph: parseFloat(rxData.rightSph) || 0,
            cyl: parseFloat(rxData.rightCyl) || 0,
            axis: parseFloat(rxData.rightAxis) || 0,
          },
          left: {
            sph: parseFloat(rxData.leftSph) || 0,
            cyl: parseFloat(rxData.leftCyl) || 0,
            axis: parseFloat(rxData.leftAxis) || 0,
          },
          add: parseFloat(rxData.add) || 0,
          pd: parseFloat(rxData.pd) || 0,
        },
        frame: {
          brand: frameData.brand,
          subCategory: frameData.subCategory,
          mrp: parseFloat(frameData.mrp) || 0,
          type: frameData.type,
          material: frameData.material,
        },
        answers,
        language,
      };

      const response = await api.post('/lens-advisor/recommend', userData);
      const data = response?.data || response;
      
      if (data.recommendations) {
        setRecommendationsData(data.recommendations);
      } else {
        setRecommendationsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLens = (lens) => {
    selectLens(lens);
    router.push('/offer-summary');
  };

  const handleViewAll = () => {
    setShowViewAll(true);
    router.push('/view-all');
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
        <CustomerBackground />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Loader message={t.loading} />
          <SkeletonLoader variant="card" count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
        <CustomerBackground />
        <div className={styles.stepCard} style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
            <button onClick={fetchRecommendations} className={styles.nextButton}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  // Get the 4 recommendations
  const bestMatch = recommendations.bestMatch || recommendations.perfectMatch;
  const indexRecommendation = recommendations.indexRecommendation || recommendations.recommended;
  const premiumOption = recommendations.premiumOption;
  const budgetOption = recommendations.budgetOption || recommendations.safeValue;

  const renderLensCard = (lens, type, label) => {
    if (!lens) return null;

    const matchPercent = lens.matchPercent || lens.matchScore || 0;
    const price = lens.offerPrice || lens.price_mrp || lens.numericPrice || 0;
    const benefits = lens.benefits || lens.features || [];

    return (
      <div className={styles.lensCard} style={{
        border: type === 'bestMatch' ? '2px solid #1e40af' : '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        backgroundColor: '#ffffff',
        boxShadow: type === 'bestMatch' ? '0 4px 12px rgba(30, 64, 175, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Tag */}
        <div style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600',
          marginBottom: '1rem',
          backgroundColor: type === 'bestMatch' ? '#eff6ff' : type === 'premium' ? '#fef3c7' : type === 'budget' ? '#f0fdf4' : '#f3f4f6',
          color: type === 'bestMatch' ? '#1e40af' : type === 'premium' ? '#92400e' : type === 'budget' ? '#166534' : '#374151',
        }}>
          {label}
        </div>

        {/* Lens Name + Brand Line */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#111827' }}>
          {lens.name}
        </h3>
        {lens.brandLine && (
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            {lens.brandLine}
          </p>
        )}

        {/* Index */}
        <div style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{t.index}: </span>
          <span style={{ fontWeight: '600', color: '#374151' }}>{lens.index || 'N/A'}</span>
        </div>

        {/* Match % */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            fontSize: '0.875rem',
            fontWeight: '600',
          }}>
            {t.matchPercent.replace('{percent}', Math.round(matchPercent))}
          </span>
        </div>

        {/* Benefits */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
            {t.benefits}:
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {benefits.slice(0, 4).map((benefit, idx) => (
              <li key={idx} style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                marginBottom: '0.25rem',
                paddingLeft: '1.25rem',
                position: 'relative',
              }}>
                <span style={{ position: 'absolute', left: 0 }}>•</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Price */}
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {t.lensPriceFrom.replace('{price}', price.toLocaleString())}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {t.offerNote}
          </div>
        </div>

        {/* Icons/Tags */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {lens.yopoEligible && (
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
            }}>
              {t.yopo}
            </span>
          )}
          {lens.comboEligible && (
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
            }}>
              {t.combo}
            </span>
          )}
          {lens.freeLensPossible && (
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: '#dcfce7',
              color: '#166534',
            }}>
              {t.freeLens}
            </span>
          )}
        </div>

        {/* Know More Link */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => {
              // Show modal with full feature grid
              // TODO: Implement modal
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#1e40af',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {t.knowMore}
          </button>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => handleSelectLens(lens)}
          className={styles.nextButton}
          style={{ width: '100%' }}
        >
          {t.selectThisLens}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
      <CustomerBackground />
      <div className={styles.stepCard} style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div className={styles.stepHeader}>
          <h2 className={styles.stepTitle}>{t.header}</h2>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
            {t.summary}
          </p>
        </div>

        {/* 4 Lens Cards */}
        <div style={{ marginTop: '2rem' }}>
          {renderLensCard(bestMatch, 'bestMatch', t.bestMatch)}
          {renderLensCard(indexRecommendation, 'index', t.recommendedIndex)}
          {renderLensCard(premiumOption, 'premium', t.premiumUpgrade)}
          {renderLensCard(budgetOption, 'budget', t.budgetOption)}
        </div>

        {/* View All Button */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={handleViewAll}
            className={styles.nextButton}
            style={{
              backgroundColor: '#ffffff',
              color: '#1e40af',
              border: '2px solid #1e40af',
            }}
          >
            {t.viewAll}
          </button>
        </div>
      </div>
    </div>
  );
}

