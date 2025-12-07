// components/offer/OfferBreakdownPanel.js
// Component to display offer breakdown and price components

import { CheckCircle, Tag, Percent, DollarSign } from 'lucide-react';
import styles from './OfferBreakdownPanel.module.css';

export default function OfferBreakdownPanel({ result, className = '' }) {
  if (!result) {
    return null;
  }

  // Support both old and new response formats (V1.0 Spec)
  const priceComponents = result.breakdown || result.priceComponents || [];
  const offersApplied = result.appliedOffers || result.offersApplied || [];
  const finalPayable = result.finalPrice || result.finalPayable || 0;
  const baseTotal = result.baseTotal || 0;
  const totalSavings = baseTotal - finalPayable;
  const freeItem = result.freeItem || null; // V1.0 Spec: Free item from YOPO
  const bonusProduct = result.bonusProduct || null; // V1.0 Spec: Bonus product

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

      {/* V1.0 Spec: Display free item from YOPO */}
      {freeItem && (
        <div className={styles.freeItemSection}>
          <h4 className={styles.freeItemTitle}>🎁 Free Item</h4>
          <div className={styles.freeItemBadge}>
            <CheckCircle className={styles.freeItemIcon} />
            <span>{freeItem.description}</span>
          </div>
        </div>
      )}

      {/* V1.0 Spec: Display bonus product */}
      {bonusProduct && (
        <div className={styles.bonusProductSection}>
          <h4 className={styles.bonusProductTitle}>🎁 Bonus Product</h4>
          <div className={styles.bonusProductBadge}>
            <CheckCircle className={styles.bonusProductIcon} />
            <div className={styles.bonusProductContent}>
              <div className={styles.bonusProductName}>
                {bonusProduct.name} {bonusProduct.type === 'SKU_BASED' ? `(SKU: ${bonusProduct.sku})` : ''}
              </div>
              {bonusProduct.free ? (
                <div className={styles.bonusProductValue}>
                  FREE - Worth ₹{bonusProduct.value.toLocaleString('en-IN')}
                </div>
              ) : (
                <div className={styles.bonusProductValue}>
                  Pay ₹{bonusProduct.difference.toLocaleString('en-IN')} (Free up to ₹{bonusProduct.limit.toLocaleString('en-IN')})
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

