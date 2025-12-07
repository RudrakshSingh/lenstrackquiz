// components/offer/LensComparison.js
// Displays lens features + YOPO eligibility + add-on price

import { CheckCircle, XCircle, Star, Shield, Eye, Zap } from 'lucide-react';
import styles from './LensComparison.module.css';

export default function LensComparison({ lens, className = '' }) {
  if (!lens) {
    return null;
  }

  const features = [
    lens.blueProtection && { label: 'Blue Light Protection', level: lens.blueProtection },
    lens.uvProtection && { label: 'UV Protection', level: lens.uvProtection },
    lens.arLevel && { label: 'Anti-Reflective', level: lens.arLevel },
    lens.drivingSupport && { label: 'Driving Support', level: lens.drivingSupport }
  ].filter(Boolean);

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{lens.name || lens.itCode}</h3>
        {lens.brandLine && (
          <span className={styles.brandLine}>{lens.brandLine}</span>
        )}
      </div>

      <div className={styles.content}>
        {/* YOPO Eligibility */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Zap className={styles.sectionIcon} />
            <span className={styles.sectionTitle}>YOPO Eligibility</span>
          </div>
          <div className={`${styles.badge} ${lens.yopoEligible ? styles.eligible : styles.notEligible}`}>
            {lens.yopoEligible ? (
              <>
                <CheckCircle className={styles.badgeIcon} />
                <span>YOPO Eligible</span>
              </>
            ) : (
              <>
                <XCircle className={styles.badgeIcon} />
                <span>Not YOPO Eligible</span>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Star className={styles.sectionIcon} />
              <span className={styles.sectionTitle}>Features</span>
            </div>
            <div className={styles.featuresList}>
              {features.map((feature, index) => (
                <div key={index} className={styles.feature}>
                  <div className={styles.featureLabel}>{feature.label}</div>
                  <div className={styles.featureLevel}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`${styles.star} ${i < feature.level ? styles.filled : styles.empty}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Eye className={styles.sectionIcon} />
            <span className={styles.sectionTitle}>Pricing</span>
          </div>
          <div className={styles.pricing}>
            {lens.price && (
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Lens Price:</span>
                <span className={styles.priceValue}>₹{lens.price.toLocaleString('en-IN')}</span>
              </div>
            )}
            {lens.addOnPrice && lens.addOnPrice > 0 && (
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>Add-on Price:</span>
                <span className={styles.addOnPrice}>+₹{lens.addOnPrice.toLocaleString('en-IN')}</span>
              </div>
            )}
            {lens.mrp && lens.mrp !== lens.price && (
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>MRP:</span>
                <span className={styles.mrp}>₹{lens.mrp.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(lens.visionType || lens.index) && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Shield className={styles.sectionIcon} />
              <span className={styles.sectionTitle}>Specifications</span>
            </div>
            <div className={styles.specs}>
              {lens.visionType && (
                <div className={styles.spec}>
                  <span className={styles.specLabel}>Vision Type:</span>
                  <span className={styles.specValue}>{lens.visionType}</span>
                </div>
              )}
              {lens.index && (
                <div className={styles.spec}>
                  <span className={styles.specLabel}>Index:</span>
                  <span className={styles.specValue}>{lens.index}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

