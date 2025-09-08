// pages/result.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/quiz.module.css";

export default function Result() {
  const router = useRouter();
  const { id } = router.query; // query param from /result?id=submissionId
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return; // wait until id is available

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

  if (loading) return <p className={styles.loading}>Loading your lens…</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;
  if (!submission) return <p className={styles.loading}>No data found</p>;

  const { user, recommendation } = submission;

  return (
    <div className={styles.resultContainer}>
      <div className={styles.resultHeader}>
        <div className={styles.successIcon}>✨</div>
        <h1 className={styles.resultTitle}>Your Perfect Lens Match</h1>
        <p className={styles.resultSubtitle}>
          Hi <strong>{user.name}</strong>, we've found the ideal lenses for your lifestyle
        </p>
      </div>

      {/* Top 3 Lens Recommendations */}
      <div className={styles.lensGrid}>
        {recommendation.lenses && recommendation.lenses.map((lens, index) => (
          <div key={lens.name} className={`${styles.lensCard} ${index === 0 ? styles.bestMatch : ''}`}>
            
            {/* Rank Badge */}
            <div className={styles.rankBadge}>
              {index === 0 ? 'Best Match' : `#${index + 1}`}
            </div>

            {/* Lens Details */}
            <div className={styles.lensHeader}>
              <h3 className={styles.lensName}>{lens.name}</h3>
              <div className={styles.lensType}>{lens.type}</div>
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              <div className={styles.mainPrice}>{lens.price}</div>
              <div className={styles.dailyPrice}>{lens.dailyCost} per day</div>
            </div>

            {/* Features */}
            <div className={styles.featuresSection}>
              <h4 className={styles.sectionTitle}>Key Features</h4>
              <div className={styles.featuresList}>
                {lens.features.map((feature, idx) => (
                  <span key={idx} className={styles.featureTag}>{feature}</span>
                ))}
              </div>
            </div>

            {/* Why This Lens */}
            <div className={styles.whySection}>
              <h4 className={styles.sectionTitle}>Why This Works</h4>
              <ul className={styles.notesList}>
                {lens.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>

          </div>
        ))}
      </div>

      {/* Primary Recommendation Summary */}
      <div className={styles.primarySection}>
        <div className={styles.primaryCard}>
          <div className={styles.primaryIcon}>🏆</div>
          <h2 className={styles.primaryTitle}>Our Top Recommendation</h2>
          <p className={styles.primaryText}>
            {recommendation.primary}
          </p>
        </div>
      </div>

      {/* Add-ons Section */}
      {recommendation.addons && recommendation.addons.length > 0 && (
        <div className={styles.addonsSection}>
          <h3 className={styles.sectionTitle}>Recommended Add-ons</h3>
          <div className={styles.addonsList}>
            {recommendation.addons.map((addon, index) => (
              <div key={index} className={styles.addonItem}>
                <div className={styles.addonIcon}>+</div>
                <span>{addon}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Notes */}
      {recommendation.notes && recommendation.notes.length > 0 && (
        <div className={styles.notesSection}>
          <h3 className={styles.sectionTitle}>Personalized Insights</h3>
          <div className={styles.notesList}>
            {recommendation.notes.map((note, index) => (
              <div key={index} className={styles.noteItem}>
                <div className={styles.noteIcon}>💡</div>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Section */}
      <div className={styles.actionSection}>
        <div className={styles.appointmentCard}>
          <div className={styles.appointmentHeader}>
            <h3 className={styles.appointmentTitle}>Ready to Get Started?</h3>
            <p className={styles.appointmentText}>
              Book your free eye test and consultation
            </p>
          </div>
          
          <a
            href="https://wa.me/918062177325?text=Hi%20I%20want%20to%20book%20a%20free%20eye%20test"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
          >
            <span className={styles.whatsappIcon}>📱</span>
            Book on WhatsApp
          </a>
          
          <button 
            onClick={() => router.push('/')}
            className={styles.retakeButton}
          >
            Take Quiz Again
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          Made with ❤️ at <strong>Lenstrack</strong>
        </p>
        <p className={styles.footerCopyright}>
          &copy; {new Date().getFullYear()} Lenstrack. All rights reserved.
        </p>
      </div>
    </div>
  );
}