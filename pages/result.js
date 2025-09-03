import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/quiz.module.css";

export default function Result() {
  const router = useRouter();
  const { id } = router.query;
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    // Production-safe fetch: absolute URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    fetch(`${baseUrl}/api/result?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "Failed");
        setSubmission(data.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading your lens…</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!submission) return <p className={styles.loading}>No data found</p>;

  const { user, recommendation } = submission;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎯 Your Perfect Lens</h1>
      <p><strong>{user.name}</strong>, here’s what suits you best:</p>
      <h2>Primary: {recommendation.primary}</h2>

      {recommendation.addons.length > 0 && (
        <div className={styles.addonsSection}>
          <h3 className={styles.sectionTitle}>Add-ons:</h3>
          <ul className={styles.list}>
            {recommendation.addons.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendation.notes.length > 0 && (
        <div className={styles.notesSection}>
          <h3 className={styles.sectionTitle}>Notes:</h3>
          <ul className={styles.list}>
            {recommendation.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
