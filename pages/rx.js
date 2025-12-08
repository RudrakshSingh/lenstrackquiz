// pages/rx.js
// Screen LA-02: Prescription Entry (V1.0 UI/UX Master Flow)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import PrescriptionUpload from '../components/PrescriptionUpload';
import { parsePrescription } from '../lib/prescriptionParser';
import { getFinalRequiredIndex } from '../lib/lensAdvisorEngine';
import styles from '../styles/quiz.module.css';
import dynamic from 'next/dynamic';

const CustomerBackground = dynamic(() => import('../components/three/CustomerBackground'), {
  ssr: false,
});

const translations = {
  en: {
    header: "Step 1 of 5 – Your Eye Power",
    prescription: "Your Prescription",
    prescriptionDesc: "Enter your power (SPH, CYL, AXIS) or upload prescription",
    rightEye: "Right Eye",
    leftEye: "Left Eye",
    sph: "SPH",
    cyl: "CYL",
    axis: "AXIS",
    add: "ADD (if any)",
    pd: "PD (Pupillary Distance)",
    dontKnow: "I don't know my power",
    helpText: "Our staff will help you measure your power. You can still view lens options.",
    indexSuggestion: "Recommended Index",
    indexSuggestionDesc: "Based on your power, we recommend",
    warning: "This power may need custom lenses. Our staff will help you.",
    next: "Next: Frame Details",
    skip: "Skip (if just checking price)",
    continue: "Continue",
  },
  hi: {
    header: "चरण 1 of 5 – आपकी आंख की पावर",
    prescription: "आपका नुस्खा",
    prescriptionDesc: "अपनी पावर (SPH, CYL, AXIS) दर्ज करें या नुस्खा अपलोड करें",
    rightEye: "दाहिनी आंख",
    leftEye: "बाईं आंख",
    sph: "SPH",
    cyl: "CYL",
    axis: "AXIS",
    add: "ADD (यदि कोई हो)",
    pd: "PD (पुतली दूरी)",
    dontKnow: "मुझे अपनी पावर नहीं पता",
    helpText: "हमारा स्टाफ आपकी पावर मापने में मदद करेगा। आप अभी भी लेंस विकल्प देख सकते हैं।",
    indexSuggestion: "अनुशंसित इंडेक्स",
    indexSuggestionDesc: "आपकी पावर के आधार पर, हम अनुशंसा करते हैं",
    warning: "इस पावर के लिए कस्टम लेंस की आवश्यकता हो सकती है। हमारा स्टाफ आपकी मदद करेगा।",
    next: "अगला: फ्रेम विवरण",
    skip: "छोड़ें (यदि केवल कीमत जांच रहे हैं)",
    continue: "जारी रखें",
  },
  hinglish: {
    header: "Step 1 of 5 – Aapki Eye Power",
    prescription: "Aapka Prescription",
    prescriptionDesc: "Apni power (SPH, CYL, AXIS) enter karein ya prescription upload karein",
    rightEye: "Right Eye",
    leftEye: "Left Eye",
    sph: "SPH",
    cyl: "CYL",
    axis: "AXIS",
    add: "ADD (agar hai)",
    pd: "PD (Pupillary Distance)",
    dontKnow: "Mujhe apni power nahi pata",
    helpText: "Hamara staff aapki power measure karne mein help karega. Aap abhi bhi lens options dekh sakte hain.",
    indexSuggestion: "Recommended Index",
    indexSuggestionDesc: "Aapki power ke basis pe, hum recommend karte hain",
    warning: "Is power ke liye custom lenses ki zarurat ho sakti hai. Hamara staff aapki help karega.",
    next: "Next: Frame Details",
    skip: "Skip (agar sirf price check kar rahe hain)",
    continue: "Continue",
  },
};

export default function RxPage() {
  const router = useRouter();
  const { language, rxData, updateRxData, frameData } = useLensAdvisor();
  
  // Initialize formData with proper defaults
  const [formData, setFormData] = useState(() => ({
    rightSph: rxData?.rightSph || '',
    rightCyl: rxData?.rightCyl || '',
    rightAxis: rxData?.rightAxis || '',
    leftSph: rxData?.leftSph || '',
    leftCyl: rxData?.leftCyl || '',
    leftAxis: rxData?.leftAxis || '',
    add: rxData?.add || '',
    pd: rxData?.pd || '',
  }));
  
  const [dontKnowPower, setDontKnowPower] = useState(false);
  const [recommendedIndex, setRecommendedIndex] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [autoFilled, setAutoFilled] = useState(false);

  const t = translations[language] || translations.en;

  // Debug: Log formData changes
  useEffect(() => {
    console.log('FormData changed:', formData);
  }, [formData]);

  // Calculate recommended index when power changes
  useEffect(() => {
    const rightSph = parseFloat(formData.rightSph) || 0;
    const leftSph = parseFloat(formData.leftSph) || 0;
    const maxPower = Math.max(Math.abs(rightSph), Math.abs(leftSph));

    if (maxPower > 0) {
      const index = getFinalRequiredIndex(maxPower, frameData.type || 'Full Rim');
      setRecommendedIndex(index);
      
      // Check for warnings
      const newWarnings = [];
      if (maxPower > 8) {
        newWarnings.push(t.warning);
      }
      setWarnings(newWarnings);
    } else {
      setRecommendedIndex(null);
      setWarnings([]);
    }
  }, [formData.rightSph, formData.leftSph, frameData.type, t.warning]);

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateRxData(newData);
  };

  const handlePrescriptionParsed = (data) => {
    console.log('=== OCR Response ===', data); // Debug log
    
    // Handle the response from OCR API
    const parsed = data.prescription || data;
    
    console.log('=== Parsed prescription ===', parsed); // Debug log
    
    // Start with current form data to preserve any existing values
    let newData = { ...formData };
    
    // Helper function to safely set value - always set if value exists (even if empty string)
    const setValue = (field, value) => {
      if (value !== undefined && value !== null) {
        const strValue = String(value).trim();
        // Set even if empty string, but prefer non-empty values
        if (strValue !== '' || !newData[field]) {
          newData[field] = strValue;
        }
      }
    };
    
    // Handle nested structure: { rightEye: { sph, cyl, axis }, leftEye: { sph, cyl, axis }, add, pd }
    if (parsed.rightEye) {
      if (typeof parsed.rightEye === 'object') {
        setValue('rightSph', parsed.rightEye.sph);
        setValue('rightCyl', parsed.rightEye.cyl);
        setValue('rightAxis', parsed.rightEye.axis);
      } else {
        // Legacy format: rightEye is just a string value
        setValue('rightSph', parsed.rightEye);
      }
    }
    
    if (parsed.leftEye) {
      if (typeof parsed.leftEye === 'object') {
        setValue('leftSph', parsed.leftEye.sph);
        setValue('leftCyl', parsed.leftEye.cyl);
        setValue('leftAxis', parsed.leftEye.axis);
      } else {
        // Legacy format: leftEye is just a string value
        setValue('leftSph', parsed.leftEye);
      }
    }
    
    // Handle flat structure: { rightSph, rightCyl, rightAxis, leftSph, leftCyl, leftAxis, add, pd }
    setValue('rightSph', parsed.rightSph);
    setValue('rightCyl', parsed.rightCyl);
    setValue('rightAxis', parsed.rightAxis);
    setValue('leftSph', parsed.leftSph);
    setValue('leftCyl', parsed.leftCyl);
    setValue('leftAxis', parsed.leftAxis);
    setValue('add', parsed.add);
    setValue('pd', parsed.pd);
    
    console.log('=== Final form data ===', newData); // Debug log
    console.log('=== Values to set ===', {
      rightSph: newData.rightSph,
      rightCyl: newData.rightCyl,
      rightAxis: newData.rightAxis,
      leftSph: newData.leftSph,
      leftCyl: newData.leftCyl,
      leftAxis: newData.leftAxis,
      add: newData.add,
      pd: newData.pd,
    });
    
    // Create a completely new object to force React to detect the change
    // Use the values from newData, ensuring all fields exist
    const updatedData = {
      rightSph: newData.rightSph !== undefined ? String(newData.rightSph) : '',
      rightCyl: newData.rightCyl !== undefined ? String(newData.rightCyl) : '',
      rightAxis: newData.rightAxis !== undefined ? String(newData.rightAxis) : '',
      leftSph: newData.leftSph !== undefined ? String(newData.leftSph) : '',
      leftCyl: newData.leftCyl !== undefined ? String(newData.leftCyl) : '',
      leftAxis: newData.leftAxis !== undefined ? String(newData.leftAxis) : '',
      add: newData.add !== undefined ? String(newData.add) : '',
      pd: newData.pd !== undefined ? String(newData.pd) : '',
    };
    
    console.log('=== Setting form data ===', updatedData);
    console.log('=== Checking if values exist ===', {
      hasRightSph: !!updatedData.rightSph,
      hasRightCyl: !!updatedData.rightCyl,
      hasLeftSph: !!updatedData.leftSph,
      hasLeftCyl: !!updatedData.leftCyl,
    });
    
    // Update both local state and context - use functional update to ensure latest state
    setFormData(() => updatedData);
    updateRxData(updatedData);
    
    // Verify the update worked
    setTimeout(() => {
      console.log('=== Verifying form data was set ===');
    }, 100);
    
    // Show success message
    if (newData.rightSph || newData.leftSph) {
      setAutoFilled(true);
      // Hide the success message after 5 seconds
      setTimeout(() => setAutoFilled(false), 5000);
      console.log('✓ Prescription data filled successfully');
    } else {
      console.warn('⚠ No prescription data found in parsed result');
    }
  };

  const handleNext = () => {
    router.push('/frame');
  };

  return (
    <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
      <CustomerBackground />
      <div className={styles.stepCard} style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div className={styles.stepHeader}>
          <h2 className={styles.stepTitle}>{t.header}</h2>
        </div>

        {/* Prescription Form */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
            {t.prescription}
          </h3>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
            {t.prescriptionDesc}
          </p>

          {/* Upload Option */}
          <div style={{ marginBottom: '2rem' }}>
            <PrescriptionUpload onParsed={handlePrescriptionParsed} />
            
            {/* Auto-fill success message */}
            {autoFilled && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '500' }}>
                  Prescription data extracted and filled automatically!
                </span>
              </div>
            )}
          </div>

          {/* Don't Know Toggle */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dontKnowPower}
                onChange={(e) => setDontKnowPower(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>{t.dontKnow}</span>
            </label>
            {dontKnowPower && (
              <p style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '8px', fontSize: '0.9rem', color: '#92400e' }}>
                {t.helpText}
              </p>
            )}
          </div>

          {/* Rx Form Table */}
          {!dontKnowPower && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}></th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>{t.rightEye}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>{t.leftEye}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{t.sph}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={formData.rightSph || ''}
                        onChange={(e) => handleInputChange('rightSph', e.target.value)}
                        placeholder="0.00"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        key={`rightSph-${formData.rightSph}`}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={formData.leftSph || ''}
                        onChange={(e) => handleInputChange('leftSph', e.target.value)}
                        placeholder="0.00"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        key={`leftSph-${formData.leftSph}`}
                      />
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{t.cyl}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={formData.rightCyl || ''}
                        onChange={(e) => handleInputChange('rightCyl', e.target.value)}
                        placeholder="0.00"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        key={`rightCyl-${formData.rightCyl}`}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={formData.leftCyl || ''}
                        onChange={(e) => handleInputChange('leftCyl', e.target.value)}
                        placeholder="0.00"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        key={`leftCyl-${formData.leftCyl}`}
                      />
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{t.axis}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={formData.rightAxis || ''}
                        onChange={(e) => handleInputChange('rightAxis', e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        key={`rightAxis-${formData.rightAxis}`}
                      />
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        value={formData.leftAxis || ''}
                        onChange={(e) => handleInputChange('leftAxis', e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        key={`leftAxis-${formData.leftAxis}`}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ADD and PD fields */}
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t.add}</label>
                  <input
                    type="text"
                    value={formData.add || ''}
                    onChange={(e) => handleInputChange('add', e.target.value)}
                    placeholder="+1.00"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    key={`add-${formData.add}`}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t.pd}</label>
                  <input
                    type="text"
                    value={formData.pd || ''}
                    onChange={(e) => handleInputChange('pd', e.target.value)}
                    placeholder="62"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    key={`pd-${formData.pd}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Index Suggestion Panel */}
        {recommendedIndex && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #bfdbfe'
          }}>
            <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>
              {t.indexSuggestion}
            </h4>
            <p style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>
              {t.indexSuggestionDesc} <strong>Index {recommendedIndex}</strong>
            </p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #fcd34d'
          }}>
            {warnings.map((warning, idx) => (
              <p key={idx} style={{ color: '#92400e', fontSize: '0.9rem', margin: 0 }}>
                {warning}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => router.back()}
            className={styles.backButton}
            style={{ flex: 1 }}
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            className={styles.nextButton}
            style={{ flex: 2 }}
          >
            {t.next} <span className={styles.buttonArrow}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

