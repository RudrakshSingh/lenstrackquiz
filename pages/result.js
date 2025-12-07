// pages/result.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/quiz.module.css";

const translations = {
  en: {
    loading: "Loading your lens recommendations…",
    error: "Error",
    noData: "No data found",
    title: "Your Perfect Lens Match",
    subtitle: "Hi {name}, we've found the ideal lenses for your lifestyle",
    perfectMatch: "Perfect Match",
    recommended: "Recommended",
    safeValue: "Safe Value",
    whyPerfect: "Why it's perfect",
    index: "Index",
    features: "Key Features",
    price: "Price",
    mrp: "MRP",
    youSave: "You Save",
    offer: "Offer",
    bogo: "Buy 1 Get 1",
    bogo50: "Buy 1 Get 50% Off",
    yopo: "YOPO - You Only Pay for One",
    fixedDiscount: "{percentage}% Off",
    upsellTitle: "Add a Second Pair?",
    upsellMessage: "{message}",
    upsellBenefit: "Benefit: {benefit}",
    warnings: "Important Safety Information",
    priceListTitle: "Complete Price List",
    suitable: "Suitable",
    okNotBest: "Ok but not best",
    notSuitable: "Not suitable",
    notSafe: "Not safe for your prescription",
    ready: "Ready to Get Started?",
    bookText: "Book your free eye test and consultation",
    bookWhatsApp: "Book on WhatsApp",
    takeQuizAgain: "Take Quiz Again",
    madeWith: "Made with ❤️ at",
    allRights: "All rights reserved."
  },
  hi: {
    loading: "आपकी लेंस सिफारिशें लोड हो रही हैं…",
    error: "त्रुटि",
    noData: "कोई डेटा नहीं मिला",
    title: "आपका सही लेंस मैच",
    subtitle: "नमस्ते {name}, हमने आपकी जीवनशैली के लिए आदर्श लेंस पाए हैं",
    perfectMatch: "परफेक्ट मैच",
    recommended: "अनुशंसित",
    safeValue: "सुरक्षित विकल्प",
    whyPerfect: "यह क्यों परफेक्ट है",
    index: "इंडेक्स",
    features: "मुख्य विशेषताएं",
    price: "कीमत",
    mrp: "MRP",
    youSave: "आप बचाते हैं",
    offer: "ऑफ़र",
    bogo: "1 खरीदें 1 मुफ्त",
    bogo50: "1 खरीदें 50% छूट",
    yopo: "YOPO - आप केवल एक के लिए भुगतान करें",
    fixedDiscount: "{percentage}% छूट",
    upsellTitle: "दूसरी जोड़ी जोड़ें?",
    upsellMessage: "{message}",
    upsellBenefit: "लाभ: {benefit}",
    warnings: "महत्वपूर्ण सुरक्षा जानकारी",
    priceListTitle: "पूरी कीमत सूची",
    suitable: "उपयुक्त",
    okNotBest: "ठीक है लेकिन सबसे अच्छा नहीं",
    notSuitable: "उपयुक्त नहीं",
    notSafe: "आपके नुस्खे के लिए सुरक्षित नहीं",
    ready: "शुरू करने के लिए तैयार?",
    bookText: "अपना मुफ्त आंख परीक्षण और परामर्श बुक करें",
    bookWhatsApp: "WhatsApp पर बुक करें",
    takeQuizAgain: "क्विज़ फिर से लें",
    madeWith: "❤️ से बनाया गया",
    allRights: "सभी अधिकार सुरक्षित।"
  },
  hinglish: {
    loading: "Aapki lens recommendations load ho rahi hain…",
    error: "Error",
    noData: "Koi data nahi mila",
    title: "Aapka Perfect Lens Match",
    subtitle: "Hi {name}, humne aapki lifestyle ke liye ideal lenses find kiye hain",
    perfectMatch: "Perfect Match",
    recommended: "Recommended",
    safeValue: "Safe Value",
    whyPerfect: "Yeh kyun perfect hai",
    index: "Index",
    features: "Key Features",
    price: "Price",
    mrp: "MRP",
    youSave: "Aap bachate hain",
    offer: "Offer",
    bogo: "Buy 1 Get 1",
    bogo50: "Buy 1 Get 50% Off",
    yopo: "YOPO - Aap sirf ek ke liye pay karein",
    fixedDiscount: "{percentage}% Off",
    upsellTitle: "Dusri pair add karein?",
    upsellMessage: "{message}",
    upsellBenefit: "Benefit: {benefit}",
    warnings: "Important Safety Information",
    priceListTitle: "Complete Price List",
    suitable: "Suitable",
    okNotBest: "Ok but best nahi",
    notSuitable: "Suitable nahi",
    notSafe: "Aapke prescription ke liye safe nahi",
    ready: "Shuru karne ke liye ready?",
    bookText: "Apna free eye test aur consultation book karein",
    bookWhatsApp: "WhatsApp pe book karein",
    takeQuizAgain: "Quiz phir se lein",
    madeWith: "❤️ se banaya gaya",
    allRights: "Sabhi adhikar surakshit."
  }
};

export default function Result() {
  const router = useRouter();
  const { id } = router.query;
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLens, setSelectedLens] = useState(null);
  const [showSecondPair, setShowSecondPair] = useState(false);
  const [selectedSecondPair, setSelectedSecondPair] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/result?id=${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to fetch submission");

        setSubmission(data.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading your lens recommendations…</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;
  if (!submission) return <p className={styles.loading}>No data found</p>;

  const { user, recommendation } = submission;
  const language = recommendation?.language || user?.language || "en";
  const t = translations[language] || translations.en;

  const getBadgeLabel = (badge) => {
    switch (badge) {
      case 'perfect_match': return t.perfectMatch;
      case 'recommended': return t.recommended;
      case 'safe_value': return t.safeValue;
      case 'suitable': return t.suitable;
      case 'ok_not_best': return t.okNotBest;
      case 'not_suitable': return t.notSuitable;
      case 'not_safe': return t.notSafe;
      default: return '';
    }
  };

  const getBadgeClass = (badge) => {
    switch (badge) {
      case 'perfect_match': return styles.badgePerfect;
      case 'recommended': return styles.badgeRecommended;
      case 'safe_value': return styles.badgeSafe;
      case 'suitable': return styles.badgeSuitable;
      case 'ok_not_best': return styles.badgeOk;
      case 'not_suitable': return styles.badgeNotSuitable;
      case 'not_safe': return styles.badgeNotSafe;
      default: return '';
    }
  };

  const formatOfferType = (offerType) => {
    if (!offerType) return '';
    switch (offerType) {
      case 'bogo': return t.bogo;
      case 'bogo_50': return t.bogo50;
      case 'yopo': return t.yopo;
      case 'fixed_discount': return t.fixedDiscount.replace('{percentage}', '10');
      default: return t.offer;
    }
  };

  const renderLensCard = (lens, type) => {
    if (!lens) return null;

    const offer = lens.offer || {};
    const mrp = lens.price_mrp || lens.numericPrice || 0;
    const finalPrice = offer.finalPrice || mrp;
    const savings = offer.savings || 0;

    return (
      <div className={`${styles.lensCard} ${type === 'perfect' ? styles.bestMatch : ''}`}>
        <div className={styles.rankBadge}>
          {type === 'perfect' ? t.perfectMatch : type === 'recommended' ? t.recommended : t.safeValue}
        </div>

        <div className={styles.lensHeader}>
          <h3 className={styles.lensName}>{lens.name}</h3>
          <div className={styles.lensType}>Index: {lens.index}</div>
        </div>

        <div className={styles.priceSection}>
          <div className={styles.priceRow}>
            <span className={styles.priceLabel}>{t.mrp}:</span>
            <span className={styles.mrpPrice}>₹{mrp}</span>
          </div>
          {offer.offerApplied && (
            <>
              <div className={styles.priceRow}>
                <span className={styles.priceLabel}>{t.price}:</span>
                <span className={styles.finalPrice}>₹{finalPrice}</span>
              </div>
              <div className={styles.savingsRow}>
                <span className={styles.savingsLabel}>{t.youSave}:</span>
                <span className={styles.savingsAmount}>₹{savings} ({offer.savingsPercentage}%)</span>
              </div>
              <div className={styles.offerBadge}>{formatOfferType(offer.offerType)}</div>
            </>
          )}
          {!offer.offerApplied && (
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>{t.price}:</span>
              <span className={styles.finalPrice}>₹{finalPrice}</span>
            </div>
          )}
        </div>

        <div className={styles.featuresSection}>
          <h4 className={styles.sectionTitle}>{t.features}</h4>
          <div className={styles.featuresList}>
            {lens.features && lens.features.map((feature, idx) => (
              <span key={idx} className={styles.featureTag}>{feature}</span>
            ))}
          </div>
        </div>

        {type === 'perfect' && (
          <div className={styles.whySection}>
            <h4 className={styles.sectionTitle}>{t.whyPerfect}</h4>
            <p>This lens perfectly matches your lifestyle needs with optimal protection levels.</p>
          </div>
        )}

        <button 
          className={styles.selectLensButton}
          onClick={() => setSelectedLens({ ...lens, type })}
        >
          Select This Lens
        </button>
      </div>
    );
  };

  return (
    <div className={styles.resultContainer}>
      <div className={styles.resultHeader}>
        <div className={styles.successIcon}>✨</div>
        <h1 className={styles.resultTitle}>{t.title}</h1>
        <p className={styles.resultSubtitle}>
          {t.subtitle.replace('{name}', user.name || 'there')}
        </p>
      </div>

      {/* Safety Warnings */}
      {recommendation?.warnings && recommendation.warnings.length > 0 && (
        <div className={styles.warningsSection}>
          <h3 className={styles.warningsTitle}>{t.warnings}</h3>
          {recommendation.warnings.map((warning, idx) => (
            <div key={idx} className={`${styles.warningBox} ${warning.type === 'error' ? styles.warningError : styles.warningWarning}`}>
              <div className={styles.warningIcon}>{warning.type === 'error' ? '⚠️' : 'ℹ️'}</div>
              <p className={styles.warningText}>{warning.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Recommendations */}
      <div className={styles.lensGrid}>
        {renderLensCard(recommendation?.perfectMatch, 'perfect')}
        {renderLensCard(recommendation?.recommended, 'recommended')}
        {renderLensCard(recommendation?.safeValue, 'safe')}
      </div>

      {/* Selected Lens Offer Display */}
      {selectedLens && (
        <div className={styles.offerDisplaySection}>
          <div className={styles.offerBanner}>
            <h2 className={styles.offerBannerTitle}>🎉 Special Offer Available!</h2>
            <div className={styles.selectedLensInfo}>
              <h3>{selectedLens.name}</h3>
              <div className={styles.offerDetails}>
                <div className={styles.offerPriceRow}>
                  <span>MRP:</span>
                  <span className={styles.strikethrough}>₹{selectedLens.price_mrp || selectedLens.numericPrice || 0}</span>
                </div>
                {selectedLens.offer?.offerApplied && (
                  <>
                    <div className={styles.offerPriceRow}>
                      <span>Offer Price:</span>
                      <span className={styles.offerPrice}>₹{selectedLens.offer.finalPrice}</span>
                    </div>
                    <div className={styles.savingsHighlight}>
                      <span className={styles.savingsLabel}>YOU SAVE:</span>
                      <span className={styles.savingsValue}>₹{selectedLens.offer.savings} ({selectedLens.offer.savingsPercentage}%)</span>
                    </div>
                    <div className={styles.offerTypeBadge}>{formatOfferType(selectedLens.offer.offerType)}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upsell Section */}
      {recommendation?.upsell && selectedLens && !showSecondPair && (
        <div className={styles.upsellSection}>
          <div className={styles.upsellCard}>
            <div className={styles.upsellIcon}>💡</div>
            <h3 className={styles.upsellTitle}>{t.upsellTitle}</h3>
            <p className={styles.upsellMessage}>{recommendation.upsell.message}</p>
            <p className={styles.upsellBenefit}>{t.upsellBenefit.replace('{benefit}', recommendation.upsell.benefit)}</p>
            <button 
              className={styles.upsellButton}
              onClick={() => setShowSecondPair(true)}
            >
              Add Second Pair
            </button>
          </div>
        </div>
      )}

      {/* Second Pair Selection */}
      {showSecondPair && (
        <div className={styles.secondPairSection}>
          <h2 className={styles.secondPairTitle}>Select Your Second Pair</h2>
          <p className={styles.secondPairSubtitle}>Choose a lens optimized for your second pair needs</p>
          <div className={styles.lensGrid}>
            {recommendation?.allLenses?.filter(lens => 
              lens.isSafe && 
              lens.name !== selectedLens?.name &&
              (recommendation.upsell?.reason === 'office/computer' ? lens.blue_protection_level >= 3 : true) &&
              (recommendation.upsell?.reason === 'driving' ? lens.driving_support_level >= 3 : true)
            ).slice(0, 5).map((lens, idx) => (
              <div key={idx} className={styles.lensCard}>
                <h3 className={styles.lensName}>{lens.name}</h3>
                <div className={styles.lensType}>Index: {lens.index}</div>
                <div className={styles.priceSection}>
                  <div className={styles.finalPrice}>₹{lens.price_mrp || lens.numericPrice || 0}</div>
                </div>
                <div className={styles.featuresSection}>
                  <div className={styles.featuresList}>
                    {lens.features && lens.features.slice(0, 3).map((f, i) => (
                      <span key={i} className={styles.featureTag}>{f}</span>
                    ))}
                  </div>
                </div>
                <button 
                  className={styles.selectLensButton}
                  onClick={() => {
                    setSelectedSecondPair(lens);
                    setShowConfirmation(true);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Confirmation */}
      {showConfirmation && selectedLens && (
        <div className={styles.confirmationSection}>
          <h2 className={styles.confirmationTitle}>Order Summary</h2>
          <div className={styles.confirmationItems}>
            <div className={styles.confirmationItem}>
              <h4>Primary Lens</h4>
              <p>{selectedLens.name}</p>
              <p className={styles.confirmationPrice}>
                ₹{selectedLens.offer?.finalPrice || selectedLens.price_mrp || selectedLens.numericPrice || 0}
              </p>
            </div>
            {selectedSecondPair && (
              <div className={styles.confirmationItem}>
                <h4>Second Pair</h4>
                <p>{selectedSecondPair.name}</p>
                <p className={styles.confirmationPrice}>
                  ₹{selectedSecondPair.price_mrp || selectedSecondPair.numericPrice || 0}
                </p>
              </div>
            )}
          </div>
          <div className={styles.totalSection}>
            <div className={styles.totalRow}>
              <span>Total:</span>
              <span className={styles.totalAmount}>
                ₹{((selectedLens.offer?.finalPrice || selectedLens.price_mrp || selectedLens.numericPrice || 0) + 
                    (selectedSecondPair ? (selectedSecondPair.price_mrp || selectedSecondPair.numericPrice || 0) : 0))}
              </span>
            </div>
            {selectedLens.offer?.savings > 0 && (
              <div className={styles.totalSavings}>
                You Save: ₹{selectedLens.offer.savings}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Price List */}
      {recommendation?.allLenses && recommendation.allLenses.length > 0 && (
        <div className={styles.priceListSection}>
          <h2 className={styles.priceListTitle}>{t.priceListTitle}</h2>
          <div className={styles.priceListTable}>
            <div className={styles.priceListHeader}>
              <div className={styles.priceListCol}>Lens Name</div>
              <div className={styles.priceListCol}>Index</div>
              <div className={styles.priceListCol}>Features</div>
              <div className={styles.priceListCol}>MRP</div>
              <div className={styles.priceListCol}>Status</div>
            </div>
            {recommendation.allLenses.map((lens, idx) => (
              <div key={idx} className={styles.priceListRow}>
                <div className={styles.priceListCol} data-label="Lens Name">{lens.name}</div>
                <div className={styles.priceListCol} data-label="Index">{lens.index}</div>
                <div className={styles.priceListCol} data-label="Features">
                  <div className={styles.featuresList}>
                    {lens.features && lens.features.slice(0, 2).map((f, i) => (
                      <span key={i} className={styles.featureTagSmall}>{f}</span>
                    ))}
                  </div>
                </div>
                <div className={styles.priceListCol} data-label="MRP">₹{lens.price_mrp || lens.numericPrice || 0}</div>
                <div className={styles.priceListCol} data-label="Status">
                  <span className={`${styles.badge} ${getBadgeClass(lens.badge)}`}>
                    {getBadgeLabel(lens.badge)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Section */}
      <div className={styles.actionSection}>
        <div className={styles.appointmentCard}>
          <div className={styles.appointmentHeader}>
            <h3 className={styles.appointmentTitle}>{t.ready}</h3>
            <p className={styles.appointmentText}>{t.bookText}</p>
          </div>
          
          <a
            href="https://wa.me/918062177325?text=Hi%20I%20want%20to%20book%20a%20free%20eye%20test"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
          >
            <span className={styles.whatsappIcon}>📱</span>
            {t.bookWhatsApp}
          </a>
          
          <button 
            onClick={() => router.push('/')}
            className={styles.retakeButton}
          >
            {t.takeQuizAgain}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          {t.madeWith} <strong>Lenstrack</strong>
        </p>
        <p className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Lenstrack. {t.allRights}
        </p>
      </div>
    </div>
  );
}
