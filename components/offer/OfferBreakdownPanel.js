// components/offer/OfferBreakdownPanel.js
// Component to display offer breakdown and price components

import { CheckCircle, Tag, Percent, DollarSign } from 'lucide-react';
import styles from './OfferBreakdownPanel.module.css';

export default function OfferBreakdownPanel({ result, className = '' }) {
  if (!result) {
    return null;
  }

  // Support both old and new response formats
  const priceComponents = result.breakdown || result.priceComponents || [];
  const offersApplied = result.appliedOffers || result.offersApplied || [];
  const finalPayable = result.finalPrice || result.finalPayable || 0;
  const baseTotal = result.baseTotal || 0;
  const totalSavings = baseTotal - finalPayable;

  return (
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.header}>
        <Tag className={styles.icon} />
        <h3 className={styles.title}>Price Breakdown</h3>
      </div>

      <div className={styles.components}>
        {priceComponents.map((component, index) => (
          <div
            key={index}
            className={`${styles.component} ${
              component.amount < 0 ? styles.discount : styles.charge
            }`}
          >
            <span className={styles.label}>{component.label}</span>
            <span className={styles.amount}>
              {component.amount < 0 ? '-' : '+'}₹{Math.abs(component.amount).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.total}>
        <span className={styles.totalLabel}>Final Payable</span>
        <span className={styles.totalAmount}>₹{finalPayable.toLocaleString('en-IN')}</span>
      </div>

      {totalSavings > 0 && (
        <div className={styles.savings}>
          <CheckCircle className={styles.savingsIcon} />
          <span className={styles.savingsText}>
            You save ₹{totalSavings.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {offersApplied && offersApplied.length > 0 && (
        <div className={styles.offers}>
          <h4 className={styles.offersTitle}>Offers Applied</h4>
          <div className={styles.offersList}>
            {offersApplied.map((offer, index) => (
              <div key={index} className={styles.offerBadge}>
                <Tag className={styles.offerIcon} />
                <span>{offer.description}</span>
                <span className={styles.offerSavings}>
                  -₹{offer.savings.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

