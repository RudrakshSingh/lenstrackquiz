// pages/checkout.js
// Screen ST-01: Checkout (Self-Service) / ST-02: Checkout (POS) (V1.0 UI/UX Master Flow)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import { useCart } from '../contexts/CartContext';
import OrderSummary from '../components/offer/OrderSummary';
import Loader from '../components/Loader';
import { api } from '../lib/api-client';
import styles from '../styles/quiz.module.css';

const CustomerBackground = dynamic(() => import('../components/three/CustomerBackground'), {
  ssr: false
});

const translations = {
  en: {
    header: "Checkout",
    summary: "Summary",
    customerDetails: "Customer Details",
    name: "Name (optional)",
    phone: "Mobile number (optional)",
    email: "Email (optional)",
    staffAssisted: "Staff Assisted (optional)",
    staffAssistedRequired: "Staff Assisted",
    selectStaff: "Select staff...",
    typeName: "Type Name",
    confirmOrder: "Confirm Order",
    createOrder: "Create Order",
    pleaseSelectStaff: "Please select the staff handling this order.",
    loading: "Creating order...",
    back: "Back",
  },
  hi: {
    header: "चेकआउट",
    summary: "सारांश",
    customerDetails: "ग्राहक विवरण",
    name: "नाम (वैकल्पिक)",
    phone: "मोबाइल नंबर (वैकल्पिक)",
    email: "ईमेल (वैकल्पिक)",
    staffAssisted: "स्टाफ सहायता (वैकल्पिक)",
    staffAssistedRequired: "स्टाफ सहायता",
    selectStaff: "स्टाफ चुनें...",
    typeName: "नाम टाइप करें",
    confirmOrder: "ऑर्डर की पुष्टि करें",
    createOrder: "ऑर्डर बनाएं",
    pleaseSelectStaff: "कृपया इस ऑर्डर को संभालने वाले स्टाफ का चयन करें।",
    loading: "ऑर्डर बनाया जा रहा है...",
    back: "वापस",
  },
  hinglish: {
    header: "Checkout",
    summary: "Summary",
    customerDetails: "Customer Details",
    name: "Name (optional)",
    phone: "Mobile number (optional)",
    email: "Email (optional)",
    staffAssisted: "Staff Assisted (optional)",
    staffAssistedRequired: "Staff Assisted",
    selectStaff: "Staff select karein...",
    typeName: "Name type karein",
    confirmOrder: "Order confirm karein",
    createOrder: "Order create karein",
    pleaseSelectStaff: "Kripya is order ko handle karne wale staff ka select karein.",
    loading: "Order create ho raha hai...",
    back: "Back",
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    language,
    storeContext,
    selectedLens,
    frameData,
    customerDetails,
    updateCustomerDetails,
    setOrderDataData,
  } = useLensAdvisor();
  const { offerEngineResult } = useCart();
  const [formData, setFormData] = useState(customerDetails);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const t = translations[language] || translations.en;
  const isPOS = storeContext.salesMode === 'STAFF_ASSISTED';
  const staffRequired = isPOS;

  // Fetch staff list
  useEffect(() => {
    if (storeContext.storeId) {
      fetchStaff();
    }
  }, [storeContext.storeId]);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await api.get(`/store/${storeContext.storeId}/staff`);
      const staff = response?.data?.staff || response?.staff || [];
      setStaffList(staff);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    updateCustomerDetails(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate staff selection for POS mode
    if (staffRequired && !formData.staffId && !formData.staffName) {
      setError(t.pleaseSelectStaff);
      return;
    }

    try {
      setLoading(true);

      // Prepare order data
      const orderData = {
        storeId: storeContext.storeId,
        salesMode: storeContext.salesMode,
        customer: {
          name: formData.name || null,
          phone: formData.phone || null,
          email: formData.email || null,
        },
        staff: {
          id: formData.staffId || null,
          name: formData.staffName || null,
        },
        frame: {
          brand: frameData.brand,
          subCategory: frameData.subCategory,
          mrp: parseFloat(frameData.mrp || 0),
          type: frameData.type,
          material: frameData.material,
        },
        lens: {
          itCode: selectedLens?.itCode,
          name: selectedLens?.name,
          price: selectedLens?.offerPrice || selectedLens?.price_mrp || selectedLens?.numericPrice || 0,
        },
        offerSummary: offerEngineResult,
      };

      // Create order
      const response = await api.post('/orders', orderData);
      const order = response?.data || response;

      setOrderDataData(order);
      router.push('/order-success');
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
      <CustomerBackground />
      <div className={styles.stepCard} style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div className={styles.stepHeader}>
          <h2 className={styles.stepTitle}>{t.header}</h2>
        </div>

        {/* Summary Card */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            {t.summary}
          </h3>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Frame: </span>
              <span style={{ fontWeight: '600' }}>
                {frameData.brand} - ₹{parseFloat(frameData.mrp || 0).toLocaleString()}
              </span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lens: </span>
              <span style={{ fontWeight: '600' }}>{selectedLens?.name || 'N/A'}</span>
            </div>
            {offerEngineResult && (
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Final Payable: </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
                  ₹{offerEngineResult.finalPrice?.toLocaleString() || '0'}
                </span>
              </div>
            )}
          </div>
          {offerEngineResult && (
            <OrderSummary offerEngineResult={offerEngineResult} />
          )}
        </div>

        {/* Customer Details Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
              {t.customerDetails}
            </h3>

            {/* Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {t.name}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {t.phone}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {t.email}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                }}
              />
            </div>

            {/* Staff Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                {isPOS ? t.staffAssistedRequired : t.staffAssisted}
                {staffRequired && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              {loadingStaff ? (
                <div style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                  Loading staff...
                </div>
              ) : (
                <>
                  <select
                    value={formData.staffId || ''}
                    onChange={(e) => handleChange('staffId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      marginBottom: '0.5rem',
                    }}
                    required={staffRequired}
                  >
                    <option value="">{t.selectStaff}</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                  {!isPOS && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {t.typeName}
                      </label>
                      <input
                        type="text"
                        value={formData.staffName}
                        onChange={(e) => handleChange('staffName', e.target.value)}
                        placeholder={t.typeName}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #fca5a5',
            }}>
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.backButton}
              style={{ flex: 1 }}
              disabled={loading}
            >
              ← {t.back}
            </button>
            <button
              type="submit"
              className={styles.nextButton}
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader message={t.loading} />
                </>
              ) : (
                <>
                  {isPOS ? t.createOrder : t.confirmOrder} <span className={styles.buttonArrow}>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

