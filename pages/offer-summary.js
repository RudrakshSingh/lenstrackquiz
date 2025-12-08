// pages/offer-summary.js
// Screen OF-01: Offer Summary (V1.0 UI/UX Master Flow)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import { CartProvider, useCart } from '../contexts/CartContext';
import UpsellBanner from '../components/offer/UpsellBanner';
import OrderSummary from '../components/offer/OrderSummary';
import Loader from '../components/Loader';
import styles from '../styles/quiz.module.css';

const translations = {
  en: {
    header: "Offer Summary",
    selectedLens: "Selected Lens",
    selectedFrame: "Selected Frame",
    priceBreakdown: "Price Breakdown",
    proceedToCheckout: "Proceed to Checkout",
    changeLens: "Change Lens",
    loading: "Calculating offers...",
  },
  hi: {
    header: "ऑफ़र सारांश",
    selectedLens: "चयनित लेंस",
    selectedFrame: "चयनित फ्रेम",
    priceBreakdown: "कीमत विवरण",
    proceedToCheckout: "चेकआउट पर जाएं",
    changeLens: "लेंस बदलें",
    loading: "ऑफ़र की गणना हो रही है...",
  },
  hinglish: {
    header: "Offer Summary",
    selectedLens: "Selected Lens",
    selectedFrame: "Selected Frame",
    priceBreakdown: "Price Breakdown",
    proceedToCheckout: "Checkout pe jayein",
    changeLens: "Lens change karein",
    loading: "Offers calculate ho rahe hain...",
  },
};

function OfferSummaryContent() {
  const router = useRouter();
  const { language, selectedLens, frameData, storeContext, setOfferSummaryData } = useLensAdvisor();
  const { offerEngineResult, loading: cartLoading, setFrame, setLens } = useCart();
  const [loading, setLoading] = useState(true);

  const t = translations[language] || translations.en;

  useEffect(() => {
    if (selectedLens && frameData.mrp) {
      // Set frame and lens in cart context to trigger offer calculation
      setFrame({
        mrp: parseFloat(frameData.mrp),
        brand: frameData.brand,
        subCategory: frameData.subCategory,
        material: frameData.material,
        type: frameData.type,
      });
      setLens({
        itCode: selectedLens.itCode,
        price: selectedLens.offerPrice || selectedLens.price_mrp || selectedLens.numericPrice || 0,
        brandLine: selectedLens.brandLine,
        index: selectedLens.index,
      });
    }
  }, [selectedLens, frameData, setFrame, setLens]);

  useEffect(() => {
    if (offerEngineResult) {
      setOfferSummaryData(offerEngineResult);
      setLoading(false);
    } else if (!cartLoading) {
      setLoading(false);
    }
  }, [offerEngineResult, cartLoading, setOfferSummaryData]);

  const handleProceed = () => {
    router.push('/checkout');
  };

  const handleChangeLens = () => {
    router.push('/recommendations');
  };

  if (loading || cartLoading) {
    return (
      <div className={styles.container}>
        <Loader message={t.loading} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.stepCard}>
        {/* Header */}
        <div className={styles.stepHeader}>
          <h2 className={styles.stepTitle}>{t.header}</h2>
        </div>

        {/* Selected Lens & Frame Summary */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t.selectedLens}: </span>
              <span style={{ fontWeight: '600' }}>{selectedLens?.name || 'N/A'}</span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t.selectedFrame}: </span>
              <span style={{ fontWeight: '600' }}>
                {frameData.brand} - ₹{parseFloat(frameData.mrp || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Upsell Banner */}
        {offerEngineResult?.upsellMessages && offerEngineResult.upsellMessages.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <UpsellBanner
              upsell={offerEngineResult.upsellMessages[0]}
              placement="top"
            />
          </div>
        )}

        {/* Price Breakdown */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            {t.priceBreakdown}
          </h3>
          <OrderSummary offerEngineResult={offerEngineResult} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={handleChangeLens}
            className={styles.backButton}
            style={{ flex: 1 }}
          >
            {t.changeLens}
          </button>
          <button
            onClick={handleProceed}
            className={styles.nextButton}
            style={{ flex: 2 }}
          >
            {t.proceedToCheckout} <span className={styles.buttonArrow}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OfferSummaryPage() {
  return (
    <CartProvider>
      <OfferSummaryContent />
    </CartProvider>
  );
}

