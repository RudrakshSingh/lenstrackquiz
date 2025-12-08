// pages/order-success.js
// Screen ST-03: Order Success (V1.0 UI/UX Master Flow)

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import styles from '../styles/quiz.module.css';

const translations = {
  en: {
    header: "Your order has been created",
    orderId: "Order ID: {orderId}",
    storeName: "Store: {storeName}",
    summary: "Order Summary",
    frame: "Frame",
    lens: "Lens",
    amount: "Amount",
    nextSteps: "Next Steps",
    nextStepsSelfService: "Our staff will now print and process your order.",
    nextStepsPOS: "Click here to open this order in POS.",
    newCustomer: "New Customer",
    downloadSummary: "Download/Share Summary",
  },
  hi: {
    header: "आपका ऑर्डर बनाया गया है",
    orderId: "ऑर्डर ID: {orderId}",
    storeName: "स्टोर: {storeName}",
    summary: "ऑर्डर सारांश",
    frame: "फ्रेम",
    lens: "लेंस",
    amount: "राशि",
    nextSteps: "अगले कदम",
    nextStepsSelfService: "हमारा स्टाफ अब आपके ऑर्डर को प्रिंट और प्रोसेस करेगा।",
    nextStepsPOS: "इस ऑर्डर को POS में खोलने के लिए यहां क्लिक करें।",
    newCustomer: "नया ग्राहक",
    downloadSummary: "सारांश डाउनलोड/साझा करें",
  },
  hinglish: {
    header: "Aapka order create ho gaya hai",
    orderId: "Order ID: {orderId}",
    storeName: "Store: {storeName}",
    summary: "Order Summary",
    frame: "Frame",
    lens: "Lens",
    amount: "Amount",
    nextSteps: "Next Steps",
    nextStepsSelfService: "Hamara staff ab aapke order ko print aur process karega.",
    nextStepsPOS: "Is order ko POS mein open karne ke liye yahan click karein.",
    newCustomer: "New Customer",
    downloadSummary: "Summary download/share karein",
  },
};

export default function OrderSuccessPage() {
  const router = useRouter();
  const { language, orderData, storeContext, frameData, selectedLens, offerEngineResult, reset } = useLensAdvisor();

  const t = translations[language] || translations.en;
  const isPOS = storeContext.salesMode === 'STAFF_ASSISTED';

  // Redirect if no order data
  useEffect(() => {
    if (!orderData) {
      router.push('/start');
    }
  }, [orderData, router]);

  if (!orderData) {
    return null;
  }

  const handleNewCustomer = () => {
    reset();
    router.push('/start');
  };

  const handleOpenInPOS = () => {
    // Navigate to POS order view
    router.push(`/admin/orders/${orderData.id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.stepCard} style={{ maxWidth: '600px', margin: '2rem auto' }}>
        {/* Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: '3rem',
          }}>
            ✓
          </div>
        </div>

        {/* Header */}
        <div className={styles.stepHeader} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className={styles.stepTitle} style={{ color: '#166534' }}>
            {t.header}
          </h2>
        </div>

        {/* Order ID */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
            {t.orderId.replace('{orderId}', orderData.id || orderData.orderId || 'N/A')}
          </p>
          {storeContext.storeName && (
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem', margin: 0 }}>
              {t.storeName.replace('{storeName}', storeContext.storeName)}
            </p>
          )}
        </div>

        {/* Order Summary */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            {t.summary}
          </h3>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t.frame}:</span>
              <span style={{ fontWeight: '600' }}>
                {frameData.brand} - ₹{parseFloat(frameData.mrp || 0).toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t.lens}:</span>
              <span style={{ fontWeight: '600' }}>{selectedLens?.name || 'N/A'}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '1px solid #e5e7eb',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: '600' }}>{t.amount}:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
                ₹{offerEngineResult?.finalPrice?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #bfdbfe',
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e40af' }}>
            {t.nextSteps}:
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#1e3a8a', margin: 0 }}>
            {isPOS ? t.nextStepsPOS : t.nextStepsSelfService}
          </p>
          {isPOS && (
            <button
              onClick={handleOpenInPOS}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#1e40af',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              Open in POS
            </button>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleNewCustomer}
            className={styles.nextButton}
            style={{ width: '100%' }}
          >
            {t.newCustomer}
          </button>
          {/* Future: Download/Share Summary */}
          {/* <button
            onClick={() => {}}
            className={styles.backButton}
            style={{ width: '100%' }}
          >
            {t.downloadSummary}
          </button> */}
        </div>
      </div>
    </div>
  );
}

