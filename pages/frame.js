// pages/frame.js
// Screen LA-03: Frame Entry (V1.0 UI/UX Master Flow)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import styles from '../styles/quiz.module.css';
import dynamic from 'next/dynamic';

const CustomerBackground = dynamic(() => import('../components/three/CustomerBackground'), {
  ssr: false,
});

const translations = {
  en: {
    header: "Step 2 of 5 – Your Frame",
    storeName: "Store: {storeName}",
    frameBrand: "Frame Brand",
    frameBrandPlaceholder: "Select brand...",
    subCategory: "Sub-category (only for Lenstrack)",
    subCategoryPlaceholder: "Select sub-category...",
    mrp: "Frame MRP (₹)",
    mrpPlaceholder: "Enter MRP",
    frameType: "Frame Type",
    material: "Frame Material",
    infoText: "This information helps us apply the best offers (YOPO, Free Lens, Combos).",
    next: "Next: Your Lifestyle",
    continue: "Continue",
    back: "Back",
  },
  hi: {
    header: "चरण 2 of 5 – आपका फ्रेम",
    storeName: "स्टोर: {storeName}",
    frameBrand: "फ्रेम ब्रांड",
    frameBrandPlaceholder: "ब्रांड चुनें...",
    subCategory: "उप-श्रेणी (केवल लेंसट्रैक के लिए)",
    subCategoryPlaceholder: "उप-श्रेणी चुनें...",
    mrp: "फ्रेम MRP (₹)",
    mrpPlaceholder: "MRP दर्ज करें",
    frameType: "फ्रेम प्रकार",
    material: "फ्रेम सामग्री",
    infoText: "यह जानकारी हमें सर्वोत्तम ऑफ़र (YOPO, Free Lens, Combos) लागू करने में मदद करती है।",
    next: "अगला: आपकी जीवनशैली",
    continue: "जारी रखें",
    back: "वापस",
  },
  hinglish: {
    header: "Step 2 of 5 – Aapka Frame",
    storeName: "Store: {storeName}",
    frameBrand: "Frame Brand",
    frameBrandPlaceholder: "Brand select karein...",
    subCategory: "Sub-category (sirf Lenstrack ke liye)",
    subCategoryPlaceholder: "Sub-category select karein...",
    mrp: "Frame MRP (₹)",
    mrpPlaceholder: "MRP enter karein",
    frameType: "Frame Type",
    material: "Frame Material",
    infoText: "Yeh information humein best offers (YOPO, Free Lens, Combos) apply karne mein help karti hai.",
    next: "Next: Aapki Lifestyle",
    continue: "Continue",
    back: "Back",
  },
};

const frameBrands = ['LENSTRACK', 'RAYBAN', 'TITAN', 'FASTTRACK', 'VINCENT CHASE', 'OTHER'];
const lenstrackSubCategories = ['ESSENTIAL', 'ALFA', 'ADVANCED', 'PREMIUM'];
const frameTypes = ['Full Rim', 'Half Rim', 'Rimless'];
const frameMaterials = ['PLASTIC', 'METAL', 'ACETATE', 'TR90', 'TITANIUM', 'MIXED'];

export default function FramePage() {
  const router = useRouter();
  const { language, frameData, updateFrameData, storeContext } = useLensAdvisor();
  const [formData, setFormData] = useState(frameData);

  const t = translations[language] || translations.en;

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    // Reset subCategory if brand is not Lenstrack
    if (field === 'brand' && value !== 'LENSTRACK') {
      newData.subCategory = '';
    }
    setFormData(newData);
    updateFrameData(newData);
  };

  const handleNext = () => {
    router.push('/questions');
  };

  return (
    <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
      <CustomerBackground />
      <div className={styles.stepCard} style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div className={styles.stepHeader}>
          <h2 className={styles.stepTitle}>{t.header}</h2>
          {storeContext.storeName && (
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {t.storeName.replace('{storeName}', storeContext.storeName)}
            </p>
          )}
        </div>

        {/* Info Text */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #bae6fd'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#0369a1', margin: 0 }}>
            {t.infoText}
          </p>
        </div>

        {/* Frame Brand */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            {t.frameBrand} *
          </label>
          <select
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            required
          >
            <option value="">{t.frameBrandPlaceholder}</option>
            {frameBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Sub-category (only for Lenstrack) */}
        {formData.brand === 'LENSTRACK' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              {t.subCategory} *
            </label>
            <select
              value={formData.subCategory}
              onChange={(e) => handleChange('subCategory', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              required
            >
              <option value="">{t.subCategoryPlaceholder}</option>
              {lenstrackSubCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Frame MRP */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            {t.mrp} *
          </label>
          <input
            type="number"
            value={formData.mrp}
            onChange={(e) => handleChange('mrp', e.target.value)}
            placeholder={t.mrpPlaceholder}
            min="0"
            step="0.01"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
            required
          />
        </div>

        {/* Frame Type - Pill buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
            {t.frameType} *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {frameTypes.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('type', type)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '24px',
                  border: formData.type === type ? '2px solid #1e40af' : '2px solid #e5e7eb',
                  backgroundColor: formData.type === type ? '#eff6ff' : '#ffffff',
                  color: formData.type === type ? '#1e40af' : '#374151',
                  fontWeight: formData.type === type ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Frame Material - Pill buttons */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
            {t.material} *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {frameMaterials.map(material => (
              <button
                key={material}
                type="button"
                onClick={() => handleChange('material', material)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '24px',
                  border: formData.material === material ? '2px solid #1e40af' : '2px solid #e5e7eb',
                  backgroundColor: formData.material === material ? '#eff6ff' : '#ffffff',
                  color: formData.material === material ? '#1e40af' : '#374151',
                  fontWeight: formData.material === material ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}
              >
                {material}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => router.back()}
            className={styles.backButton}
            style={{ flex: 1 }}
          >
            ← {t.back}
          </button>
          <button
            onClick={handleNext}
            className={styles.nextButton}
            style={{ flex: 2 }}
            disabled={!formData.brand || !formData.mrp || !formData.type || !formData.material || (formData.brand === 'LENSTRACK' && !formData.subCategory)}
          >
            {t.next} <span className={styles.buttonArrow}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

