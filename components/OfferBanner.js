// components/OfferBanner.js
import styles from './OfferBanner.module.css';

export default function OfferBanner({ offerName, description, youSaveValue, youSavePercent }) {
  return (
    <div className={styles.offerBanner}>
      <div className={styles.offerHeader}>
        <div className={styles.offerIcon}>🎉</div>
        <h2 className={styles.offerTitle}>{offerName}</h2>
      </div>
      {description && (
        <p className={styles.offerDescription}>{description}</p>
      )}
      {(youSaveValue > 0 || youSavePercent > 0) && (
        <div className={styles.savingsHighlight}>
          <div className={styles.savingsLabel}>You Save</div>
          <div className={styles.savingsValue}>
            ₹{youSaveValue} ({youSavePercent}%)
          </div>
        </div>
      )}
    </div>
  );
}

