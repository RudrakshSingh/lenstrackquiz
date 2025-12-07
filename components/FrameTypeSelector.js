// components/FrameTypeSelector.js
import styles from './FrameTypeSelector.module.css';

const translations = {
  en: {
    full_rim_plastic: 'Full Rim (Plastic)',
    full_rim_metal: 'Full Rim (Metal)',
    half_rim: 'Half Rim / Semi-Rimless',
    rimless: 'Rimless (Drilled)',
    tooltip_rimless: 'Rimless requires high-index lenses for safety'
  },
  hi: {
    full_rim_plastic: 'फुल रिम (प्लास्टिक)',
    full_rim_metal: 'फुल रिम (मेटल)',
    half_rim: 'हाफ रिम / सेमी-रिमलेस',
    rimless: 'रिमलेस (ड्रिल्ड)',
    tooltip_rimless: 'रिमलेस के लिए सुरक्षा के लिए उच्च-इंडेक्स लेंस की आवश्यकता होती है'
  },
  hinglish: {
    full_rim_plastic: 'Full Rim (Plastic)',
    full_rim_metal: 'Full Rim (Metal)',
    half_rim: 'Half Rim / Semi-Rimless',
    rimless: 'Rimless (Drilled)',
    tooltip_rimless: 'Rimless ke liye safety ke liye high-index lens chahiye'
  }
};

export default function FrameTypeSelector({ value, onChange, language = 'en' }) {
  const t = translations[language] || translations.en;
  
  const frameTypes = [
    { value: 'full_rim_plastic', label: t.full_rim_plastic, icon: '🖼️' },
    { value: 'full_rim_metal', label: t.full_rim_metal, icon: '⚙️' },
    { value: 'half_rim', label: t.half_rim, icon: '🔲' },
    { value: 'rimless', label: t.rimless, icon: '💎', tooltip: t.tooltip_rimless }
  ];

  return (
    <div className={styles.frameTypeSelector}>
      {frameTypes.map((frame) => (
        <div key={frame.value} className={styles.frameOption}>
          <label
            className={`${styles.frameLabel} ${value === frame.value ? styles.selected : ''}`}
            title={frame.tooltip}
          >
            <input
              type="radio"
              name="frameType"
              value={frame.value}
              checked={value === frame.value}
              onChange={(e) => onChange(e.target.value)}
              className={styles.radioInput}
            />
            <div className={styles.frameIcon}>{frame.icon}</div>
            <div className={styles.frameLabelText}>{frame.label}</div>
            {frame.tooltip && value === frame.value && (
              <div className={styles.tooltip}>{frame.tooltip}</div>
            )}
          </label>
        </div>
      ))}
    </div>
  );
}

