// components/WarningBox.js
import styles from './WarningBox.module.css';

export default function WarningBox({ type = 'warning', message, onAction, actionLabel }) {
  const typeStyles = {
    error: styles.error,
    warning: styles.warning,
    info: styles.info
  };

  const icons = {
    error: '⚠️',
    warning: 'ℹ️',
    info: '💡'
  };

  return (
    <div className={`${styles.warningBox} ${typeStyles[type] || styles.warning}`}>
      <div className={styles.warningIcon}>{icons[type]}</div>
      <div className={styles.warningContent}>
        <p className={styles.warningMessage}>{message}</p>
        {onAction && actionLabel && (
          <button className={styles.actionButton} onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

