// components/offer/AppliedOffersDisplay.js
// Shows each offer applied with savings

import { Tag, TrendingUp, Gift, Percent, DollarSign, Layers, Users, Ticket } from 'lucide-react';
import styles from './AppliedOffersDisplay.module.css';

export default function AppliedOffersDisplay({ offersApplied, className = '' }) {
  if (!offersApplied || offersApplied.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.noOffers}>
          <Tag className={styles.noOffersIcon} />
          <span>Standard Pricing</span>
        </div>
      </div>
    );
  }

  const getOfferIcon = (offerType) => {
    switch (offerType) {
      case 'YOPO':
        return <TrendingUp className={styles.icon} />;
      case 'FREE_LENS':
        return <Gift className={styles.icon} />;
      case 'BOGO_50':
        return <Layers className={styles.icon} />;
      case 'PERCENT_OFF':
        return <Percent className={styles.icon} />;
      case 'FLAT_OFF':
        return <DollarSign className={styles.icon} />;
      case 'CATEGORY_DISCOUNT':
        return <Users className={styles.icon} />;
      case 'COMBO_PRICE':
        return <Tag className={styles.icon} />;
      default:
        return <Ticket className={styles.icon} />;
    }
  };

  const formatOfferMessage = (offer) => {
    const { offerType, description, savings } = offer;
    
    switch (offerType) {
      case 'YOPO':
        // Extract price from description or calculate
        const yopoMatch = description.match(/₹(\d+)/);
        const yopoPrice = yopoMatch ? yopoMatch[1] : '';
        return `YOPO Applied: Paying higher value → ₹${yopoPrice}`;
      
      case 'FREE_LENS':
        if (description.includes('Free Lens')) {
          return `BlueXpert FREE (Saved ₹${savings.toLocaleString('en-IN')})`;
        }
        if (description.includes('Upgrade') || description.includes('difference')) {
          const diffMatch = description.match(/₹(\d+)/);
          const diff = diffMatch ? diffMatch[1] : savings;
          return `DIGI360 Upgrade: Pay difference ₹${diff}`;
        }
        return `Free Lens: ${description} (Saved ₹${savings.toLocaleString('en-IN')})`;
      
      case 'BOGO_50':
        return `BOG50 Applied: 50% OFF second frame (Saved ₹${savings.toLocaleString('en-IN')})`;
      
      case 'PERCENT_OFF':
        const percentMatch = description.match(/(\d+)%/);
        const percent = percentMatch ? percentMatch[1] : '';
        return `${percent}% OFF Applied (Saved ₹${savings.toLocaleString('en-IN')})`;
      
      case 'FLAT_OFF':
        return `Flat Discount: ₹${savings.toLocaleString('en-IN')} OFF`;
      
      case 'CATEGORY_DISCOUNT':
        const categoryMatch = description.match(/Category discount \((.+?)\)/);
        const category = categoryMatch ? categoryMatch[1] : '';
        return `${category} Discount: -₹${savings.toLocaleString('en-IN')} (ID verified)`;
      
      case 'COMBO_PRICE':
        return `Combo Price Applied (Saved ₹${savings.toLocaleString('en-IN')})`;
      
      default:
        return `${description} (Saved ₹${savings.toLocaleString('en-IN')})`;
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h3 className={styles.title}>Applied Offers</h3>
      <div className={styles.offersList}>
        {offersApplied.map((offer, index) => (
          <div key={index} className={styles.offerCard}>
            <div className={styles.offerHeader}>
              {getOfferIcon(offer.offerType)}
              <div className={styles.offerContent}>
                <div className={styles.offerMessage}>
                  {formatOfferMessage(offer)}
                </div>
                <div className={styles.offerSavings}>
                  -₹{offer.savings.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

