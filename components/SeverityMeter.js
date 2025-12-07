import styles from './SeverityMeter.module.css';

export default function SeverityMeter({ label, value, max = 5 }) {
  const percentage = (value / max) * 100;
  
  // Determine color based on value
  let colorClass = styles.meterLow;
  if (value >= 4) {
    colorClass = styles.meterHigh;
  } else if (value >= 2) {
    colorClass = styles.meterMedium;
  }

  return (
    <div className={styles.severityMeter}>
      <div className={styles.meterHeader}>
        <span className={styles.meterLabel}>{label}</span>
        <span className={styles.meterValue}>{value}/{max}</span>
      </div>
      <div className={styles.meterBar}>
        <div 
          className={`${styles.meterFill} ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

