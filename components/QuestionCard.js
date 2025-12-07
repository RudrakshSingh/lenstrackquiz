// components/QuestionCard.js
import styles from './QuestionCard.module.css';

const icons = {
  vision_need: '👁️',
  screen_hours: '📱',
  outdoor_hours: '☀️',
  driving_pattern: '🚗',
  symptoms: '😣',
  preference: '⭐',
  second_pair_interest: '👓'
};

export default function QuestionCard({ 
  questionKey, 
  question, 
  options, 
  selected, 
  onSelect,
  isMultiSelect = false 
}) {
  const icon = icons[questionKey] || '❓';

  const handleSelect = (option) => {
    if (isMultiSelect) {
      const current = Array.isArray(selected) ? selected : [];
      if (current.includes(option)) {
        onSelect(current.filter(o => o !== option));
      } else {
        onSelect([...current, option]);
      }
    } else {
      onSelect(option);
    }
  };

  const isSelected = (option) => {
    if (isMultiSelect) {
      return Array.isArray(selected) && selected.includes(option);
    }
    return selected === option;
  };

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionHeader}>
        <div className={styles.questionIcon}>{icon}</div>
        <h2 className={styles.questionText}>{question}</h2>
      </div>
      <div className={styles.optionsContainer}>
        {options.map((option, index) => (
          <button
            key={index}
            className={`${styles.optionButton} ${isSelected(option) ? styles.selected : ''}`}
            onClick={() => handleSelect(option)}
          >
            <span className={styles.optionText}>{option}</span>
            {isSelected(option) && (
              <span className={styles.checkmark}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

