// components/LanguageToggle.js
import styles from './LanguageToggle.module.css';

export default function LanguageToggle({ language, onChange }) {
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी (Hindi)' },
    { value: 'hinglish', label: 'Hinglish' }
  ];

  return (
    <div className={styles.languageToggle}>
      {languages.map((lang) => (
        <button
          key={lang.value}
          className={`${styles.languageButton} ${language === lang.value ? styles.active : ''}`}
          onClick={() => onChange(lang.value)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

