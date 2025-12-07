// components/offer/OrderSummary.js
// Shows total savings in order summary

import { ShoppingCart, Tag, CheckCircle } from 'lucide-react';
import AppliedOffersDisplay from './AppliedOffersDisplay';
import OfferBreakdownPanel from './OfferBreakdownPanel';
import styles from './OrderSummary.module.css';

export default function OrderSummary({ offerEngineResult, className = '' }) {
  if (!offerEngineResult) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.empty}>
          <ShoppingCart className={styles.emptyIcon} />
          <p>No order data available</p>
        </div>
      </div>
    );
  }

  const { 
    appliedOffers = [], 
    finalPrice, 
    baseTotal = 0,
    totalSavings = 0
  } = offerEngineResult;

  const savings = baseTotal - finalPrice;

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <ShoppingCart className={styles.headerIcon} />
        <h2 className={styles.title}>Order Summary</h2>
      </div>

      {/* Applied Offers */}
      {appliedOffers.length > 0 && (
        <div className={styles.section}>
          <AppliedOffersDisplay offersApplied={appliedOffers} />
        </div>
      )}

      {/* Price Breakdown */}
      <div className={styles.section}>
        <OfferBreakdownPanel result={offerEngineResult} />
      </div>

      {/* Total Savings Highlight */}
      {savings > 0 && (
        <div className={styles.savingsHighlight}>
          <CheckCircle className={styles.savingsIcon} />
          <div className={styles.savingsContent}>
            <span className={styles.savingsLabel}>Total Savings</span>
            <span className={styles.savingsAmount}>₹{savings.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Final Payable */}
      <div className={styles.finalPayable}>
        <span className={styles.finalLabel}>Amount to Pay</span>
        <span className={styles.finalAmount}>₹{finalPrice.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

