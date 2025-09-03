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
      <h1 className={styles.resultTitle}>Your Perfect Lens Match</h1>
      <p className={styles.resultItem}>
        <strong>{user.name}</strong>, here are your top 3 lens recommendations:
      </p>

      {/* Top 3 Lens Recommendations */}
      <div className={styles.lensGrid}>
        {recommendation.lenses && recommendation.lenses.map((lens, index) => (
          <div key={lens.name} className={`${styles.lensCard} ${index === 0 ? styles.bestMatch : ''}`}>
            
            {/* Rank Badge */}
            <div className={styles.rankBadge}>
              #{index + 1} {index === 0 ? 'BEST MATCH' : `${lens.score}% Match`}
            </div>

            {/* Lens Details */}
            <div className={styles.lensHeader}>
              <h3 className={styles.lensName}>{lens.name}</h3>
              <div className={styles.lensType}>{lens.type}</div>
            </div>

            {/* Price */}
            <div className={styles.priceSection}>
              <div className={styles.mainPrice}>{lens.price}</div>
              <div className={styles.dailyPrice}>Just {lens.dailyCost} per day</div>
            </div>

            {/* Features */}
            <div className={styles.featuresSection}>
              <h4>✨ Key Features:</h4>
              <div className={styles.featuresList}>
                {lens.features.map((feature, idx) => (
                  <span key={idx} className={styles.featureTag}>{feature}</span>
                ))}
              </div>
            </div>

            {/* Why This Lens */}
            <div className={styles.whySection}>
              <h4>🎯 Perfect Because:</h4>
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
        <h2 className={styles.primaryTitle}>🏆 Our #1 Recommendation</h2>
        <p className={styles.primaryText}>
          <strong>{recommendation.primary}</strong>
        </p>
      </div>

      {/* Add-ons Section */}
      {recommendation.addons && recommendation.addons.length > 0 && (
        <div className={styles.resultSection}>
          <h3>🔧 Recommended Add-ons:</h3>
          <ul className={styles.resultList}>
            {recommendation.addons.map((addon, index) => (
              <li key={index}>{addon}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Personal Notes */}
      {recommendation.notes && recommendation.notes.length > 0 && (
        <div className={styles.resultSection}>
          <h3>💡 Personal Notes:</h3>
          <ul className={styles.resultList}>
            {recommendation.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Appointment / WhatsApp section */}
      <div className={styles.appointmentBox}>
        <p className={styles.appointmentText}>
          📅 Book your appointment for a free eye test
        </p>
        <a
          href="https://wa.me/918062177325?text=Hi%20I%20want%20to%20book%20a%20free%20eye%20test"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappLink}
        >
          📲 WhatsApp: 8062177325
        </a>
        
        {/* Retake Quiz Button */}
        <div className={styles.retakeSection}>
          <button 
            onClick={() => router.push('/')}
            className={styles.buttonPrimary}
          >
            🔄 Retake Quiz
          </button>
        </div>
        {/* Easter Egg Footer */}
<div className={styles.footerNote}>
  Made with ❤️, peace ✌️ and happiness 😄 at <strong>Lenstrack</strong>. <br />
  &copy; {new Date().getFullYear()} Lenstrack. All rights reserved.
</div>

      </div>
    </div>
  );
}