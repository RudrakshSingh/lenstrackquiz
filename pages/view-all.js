// pages/view-all.js
// Screen LA-06: View All Lenses (Popup/Full Screen) (V1.0 UI/UX Master Flow)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import styles from '../styles/quiz.module.css';

const translations = {
  en: {
    header: "All lenses matching your power",
    subtitle: "Sorted by: {sortBy}",
    sortPriceHigh: "Price: High to Low",
    sortPriceLow: "Price: Low to High",
    sortMatch: "Best Match First",
    sortIndex: "Thinnest First (Index)",
    select: "Select",
    close: "Close",
    index: "Index",
    matchPercent: "{percent}% Match",
    price: "Price",
    benefits: "Benefits",
    yopo: "YOPO",
    combo: "Combo",
    freeLens: "Free Lens",
    thicknessWarning: "~{percent}% thicker than ideal for your power. Recommended index: {index}",
  },
  hi: {
    header: "आपकी पावर से मेल खाने वाले सभी लेंस",
    subtitle: "क्रमबद्ध: {sortBy}",
    sortPriceHigh: "कीमत: उच्च से निम्न",
    sortPriceLow: "कीमत: निम्न से उच्च",
    sortMatch: "सर्वोत्तम मैच पहले",
    sortIndex: "सबसे पतला पहले (इंडेक्स)",
    select: "चुनें",
    close: "बंद करें",
    index: "इंडेक्स",
    matchPercent: "{percent}% मैच",
    price: "कीमत",
    benefits: "लाभ",
    yopo: "YOPO",
    combo: "कॉम्बो",
    freeLens: "मुफ्त लेंस",
    thicknessWarning: "आपकी पावर के लिए आदर्श से ~{percent}% मोटा। अनुशंसित इंडेक्स: {index}",
  },
  hinglish: {
    header: "Aapki power se match karne wale sabhi lenses",
    subtitle: "Sorted by: {sortBy}",
    sortPriceHigh: "Price: High to Low",
    sortPriceLow: "Price: Low to High",
    sortMatch: "Best Match First",
    sortIndex: "Thinnest First (Index)",
    select: "Select",
    close: "Close",
    index: "Index",
    matchPercent: "{percent}% Match",
    price: "Price",
    benefits: "Benefits",
    yopo: "YOPO",
    combo: "Combo",
    freeLens: "Free Lens",
    thicknessWarning: "Aapki power ke liye ideal se ~{percent}% thicker. Recommended index: {index}",
  },
};

export default function ViewAllPage() {
  const router = useRouter();
  const { language, recommendations, selectLens, rxData } = useLensAdvisor();
  const [sortBy, setSortBy] = useState('price_high');
  const [allLenses, setAllLenses] = useState([]);

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (recommendations?.allLenses) {
      setAllLenses(recommendations.allLenses);
    }
  }, [recommendations]);

  // Sort lenses
  useEffect(() => {
    if (!allLenses.length) return;

    const sorted = [...allLenses].sort((a, b) => {
      const priceA = a.offerPrice || a.price_mrp || a.numericPrice || 0;
      const priceB = b.offerPrice || b.price_mrp || b.numericPrice || 0;
      const matchA = a.matchPercent || a.matchScore || 0;
      const matchB = b.matchPercent || b.matchScore || 0;
      const indexA = parseFloat(a.index?.replace('INDEX_', '') || '1.56');
      const indexB = parseFloat(b.index?.replace('INDEX_', '') || '1.56');

      switch (sortBy) {
        case 'price_high':
          return priceB - priceA;
        case 'price_low':
          return priceA - priceB;
        case 'match':
          return matchB - matchA;
        case 'index':
          return indexA - indexB;
        default:
          return 0;
      }
    });

    setAllLenses(sorted);
  }, [sortBy]);

  const handleSelect = (lens) => {
    selectLens(lens);
    router.push('/recommendations');
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'price_high': return t.sortPriceHigh;
      case 'price_low': return t.sortPriceLow;
      case 'match': return t.sortMatch;
      case 'index': return t.sortIndex;
      default: return t.sortPriceHigh;
    }
  };

  const getThicknessWarning = (lens) => {
    if (!recommendations?.requiredIndex) return null;
    const lensIndex = parseFloat(lens.index?.replace('INDEX_', '') || '1.56');
    const requiredIndex = parseFloat(recommendations.requiredIndex);
    if (lensIndex < requiredIndex) {
      const percentThicker = Math.round(((requiredIndex - lensIndex) / lensIndex) * 100);
      return t.thicknessWarning
        .replace('{percent}', percentThicker)
        .replace('{index}', requiredIndex);
    }
    return null;
  };

  return (
    <div className={styles.container} style={{ padding: '1rem' }}>
      <div className={styles.stepCard}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 className={styles.stepTitle}>{t.header}</h2>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {t.subtitle.replace('{sortBy}', getSortLabel())}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
            }}
          >
            {t.close}
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          >
            <option value="price_high">{t.sortPriceHigh}</option>
            <option value="price_low">{t.sortPriceLow}</option>
            <option value="match">{t.sortMatch}</option>
            <option value="index">{t.sortIndex}</option>
          </select>
        </div>

        {/* Lens List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {allLenses.map((lens, idx) => {
            const price = lens.offerPrice || lens.price_mrp || lens.numericPrice || 0;
            const matchPercent = lens.matchPercent || lens.matchScore || 0;
            const benefits = lens.benefits || lens.features || [];
            const thicknessWarning = getThicknessWarning(lens);

            return (
              <div
                key={idx}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Lens Name + Brand Line */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                    {lens.name}
                  </h3>
                  {lens.brandLine && (
                    <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>{lens.brandLine}</p>
                  )}
                </div>

                {/* Index & Match % */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t.index}: </span>
                    <span style={{ fontWeight: '600' }}>{lens.index || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{
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
                </div>

                {/* Price with Rx band adjustments */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t.price}: </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
                    ₹{price.toLocaleString()}
                  </span>
                </div>

                {/* Benefits */}
                {benefits.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {t.benefits}:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {benefits.slice(0, 3).map((benefit, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px',
                            color: '#374151',
                          }}
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Icons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
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

                {/* Thickness Warning */}
                {thicknessWarning && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    border: '1px solid #fcd34d',
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                      {thicknessWarning}
                    </p>
                  </div>
                )}

                {/* Select Button */}
                <button
                  onClick={() => handleSelect(lens)}
                  className={styles.nextButton}
                  style={{ width: '100%' }}
                >
                  {t.select}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

