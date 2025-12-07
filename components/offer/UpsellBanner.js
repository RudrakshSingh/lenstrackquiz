// components/offer/UpsellBanner.js
// Component to display upsell suggestions with placement variations

import { Sparkles, ArrowRight, Gift, X } from 'lucide-react';
import { useState } from 'react';
import styles from './UpsellBanner.module.css';

export default function UpsellBanner({ 
  upsell, 
  onAddToCart, 
  placement = 'top', // 'top', 'bottom', 'toast'
  className = '',
  onDismiss
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!upsell || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleShopMore = () => {
    if (onAddToCart) {
      onAddToCart();
    }
  };

  // Progress calculation
  const progressPercent = upsell.threshold 
    ? Math.min(100, ((upsell.threshold - upsell.remaining) / upsell.threshold) * 100)
    : 0;

  const content = (
    <div className={`${styles.banner} ${styles[placement]} ${className}`}>
      {placement === 'toast' && (
        <button className={styles.closeButton} onClick={handleDismiss}>
          <X className={styles.closeIcon} />
        </button>
      )}
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Sparkles className={styles.icon} />
        </div>
        <div className={styles.text}>
          <h4 className={styles.title}>Special Offer Available!</h4>
          <p className={styles.message}>{upsell.message}</p>
          <div className={styles.details}>
            <span className={styles.reward}>
              <Gift className={styles.rewardIcon} />
              {upsell.rewardText}
            </span>
            <span className={styles.remaining}>
              You are ₹{upsell.remaining.toLocaleString('en-IN')} away from unlocking this reward
            </span>
          </div>
          {upsell.threshold && (
            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={styles.progressText}>
                {Math.round(progressPercent)}% to goal
              </span>
            </div>
          )}
        </div>
        {onAddToCart && (
          <button className={styles.cta} onClick={handleShopMore}>
            Shop More
            <ArrowRight className={styles.ctaIcon} />
          </button>
        )}
      </div>
    </div>
  );

  // For toast placement, wrap in portal-ready container
  if (placement === 'toast') {
    return (
      <div className={styles.toastContainer}>
        {content}
      </div>
    );
  }

  return content;
}

