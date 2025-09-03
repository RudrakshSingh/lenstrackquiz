// pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/quiz.module.css";

export default function Quiz() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState({ name: "", number: "", email: "" });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const questions = [
    { id: "vibe", label: "What’s your vibe?", options: ["Blends in", "Total signature look", "Honestly, whatever"] },
    { id: "gender", label: "Gender matters only if you want it to", options: ["Male", "Female", "Other"] },
    { id: "glassesAttachment", label: "How attached are you to your glasses?", options: ["Occasionally fling them on", "Mostly glued", "Forget them all the time", "It’s literally my lifeline"] },
    { id: "blur", label: "Do things blur for you?", options: ["Near", "Distance", "Both", "I can’t tell anymore"] },
    { id: "blurScale", label: "On a blur scale, where are you?", options: ["Crystal clear", "Just a little fuzzy", "Pretty bad", "Close to blind-mode"] },
    { id: "screenTime", label: "How many hours do you battle screens?", options: ["<4", "4–8", "8–12", "Zero (I live in 1980s)"] },
    { id: "lifestyle", label: "What’s your lifestyle cocktail?", options: ["Screens", "Paperwork", "People-facing", "Lone wolf"] },
    { id: "workWith", label: "Do you wrestle more with?", options: ["Colors", "Text"] },
    { id: "environment", label: "Your environment is usually?", options: ["Dusty chaos", "Spotless clean", "Full sun", "Mix of all"] },
    { id: "movement", label: "Where do you live most?", options: ["Indoors", "Outdoors", "Balanced", "Everywhere at once"] },
    { id: "driving", label: "How often are you behind the wheel?", options: ["Day drives", "Night owl", "Both", "Never"] },
    { id: "breakFreq", label: "How often do you break or misplace your glasses?", options: ["Never", "Sometimes", "Always"] },
    { id: "smoke", label: "Cigarettes?", options: ["Nope", "Around 2 a day", "10-ish", "Chain-smoker vibes"] },
    { id: "drink", label: "Drinks?", options: ["Once a week ritual", "More than once a week"] },
    { id: "tint", label: "Should your lenses have superpowers?", options: ["Change with the sun", "Stay stylishly tinted", "Keep it simple clear"] }
  ];

  const handleAnswer = (qid, val) => setAnswers(prev => ({ ...prev, [qid]: val }));

  const nextStep = () => {
    setError(null);
    // Validation for user steps
    if (currentStep === 0 && !user.name) { setError("Please enter your name."); return; }
    if (currentStep === 1 && !user.number) { setError("Please enter your phone number."); return; }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      router.push(`/result?id=${data.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    // Step 0 → Name
    if (currentStep === 0)
      return (
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <h2>👤 Step 1: Your Name</h2>
          <input className={styles.inputField} placeholder="Your Name" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} />
          <div className={styles.nav}>
            <button className={styles.buttonPrimary} onClick={nextStep}>Next →</button>
          </div>
        </div>
      );

    // Step 1 → Number
    if (currentStep === 1)
      return (
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <h2>📞 Step 2: Your Number</h2>
          <input className={styles.inputField} placeholder="Phone / WhatsApp" value={user.number} onChange={e => setUser({ ...user, number: e.target.value })} />
          <div className={styles.nav}>
            <button className={styles.buttonBack} onClick={prevStep}>← Back</button>
            <button className={styles.buttonPrimary} onClick={nextStep}>Next →</button>
          </div>
        </div>
      );

    // Step 2 → Email
    if (currentStep === 2)
      return (
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <h2>✉️ Step 3: Your Email (Optional)</h2>
          <input className={styles.inputField} placeholder="Email" value={user.email} onChange={e => setUser({ ...user, email: e.target.value })} />
          <div className={styles.nav}>
            <button className={styles.buttonBack} onClick={prevStep}>← Back</button>
            <button className={styles.buttonPrimary} onClick={nextStep}>Next →</button>
          </div>
        </div>
      );

    // Questions
    const qIndex = currentStep - 3;
    const question = questions[qIndex];
    if (question) {
      const isLast = qIndex === questions.length - 1;
      return (
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <h2>🔎 Question {qIndex + 1}</h2>
          <p>{question.label}</p>
          <div className={styles.optionsContainer}>
            {question.options.map(opt => (
              <label key={opt} className={styles.optionLabel}>
                <input type="radio" name={question.id} checked={answers[question.id] === opt} onChange={() => handleAnswer(question.id, opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className={styles.nav}>
            {currentStep > 3 && <button className={styles.buttonBack} onClick={prevStep}>← Back</button>}
            {isLast ? (
              <button className={styles.buttonPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Reveal My Lens 🔍"}
              </button>
            ) : (
              <button className={styles.buttonPrimary} onClick={nextStep}>Next →</button>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🔮 Your Eye Story Quiz</h1>
      <p className={styles.sub}>Confess your habits. We’ll decode your eyes.</p>

      {renderStep()}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
