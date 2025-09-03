// pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/quiz.module.css";
import Popup from "../components/Popup";

export default function Quiz() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState({ name: "", number: "", email: "" });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [popupData, setPopupData] = useState(null);

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
    { id: "tint", label: "Should your lenses have superpowers?", options: ["Change with the sun", "Stay stylishly tinted", "Keep it simple clear"] },
  ];

  const popupMessages = {
    3: "Glasses are like relationships – some people can’t live without them!",
    6: "Too much screen time? Even your eyes are like 'Bro chill!'",
    9: "Dust, Sun, or Chaos – your specs are doing more stunts than you!",
    12: "Breaking specs often? Bruh, you need insurance not lenses!",
  };

  const shouldShowPopup = (step) => {
    const qIndex = step - 3;
    return qIndex >= 0 && popupMessages[qIndex];
  };

  const nextStep = () => {
    setError(null);

    if (currentStep === 0) {
      if (!user.name.trim()) return setError("Please enter your name.");
      if (!/^[A-Za-z\s]{2,}$/.test(user.name)) return setError("Name should have at least 2 letters.");
    }

    if (currentStep === 1) {
      if (!user.number.trim()) return setError("Please enter your phone number.");
      if (!/^[0-9]{10}$/.test(user.number)) return setError("Phone must be 10 digits.");
    }

    if (currentStep === 2 && user.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return setError("Please enter a valid email.");
    }

    const next = currentStep + 1;
    setCurrentStep(next);

    if (shouldShowPopup(next)) setPopupData(popupMessages[next - 3]);
    else setPopupData(null);
  };

  const handleAnswer = (qid, val) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    const qIndex = currentStep - 3;
    const isLast = qIndex === questions.length - 1;
    if (!isLast) setTimeout(() => nextStep(), 300);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      if (!data.submissionId) throw new Error("Submission ID missing");
      router.push(`/result?id=${data.submissionId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 0)
      return (
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <p className={styles.questionText}>👤 Your Name?</p>
          <input
            className={styles.inputField}
            placeholder="Your Name"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
          <button className={styles.buttonPrimary} onClick={nextStep}>Next →</button>
        </div>
      );

    if (currentStep === 1)
      return (
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <p className={styles.questionText}>📞 Your Number?</p>
          <input
            className={styles.inputField}
            placeholder="Phone / WhatsApp"
            value={user.number}
            maxLength={10}
            onChange={(e) => setUser({ ...user, number: e.target.value.replace(/\D/g, '') })}
          />
          <button className={styles.buttonPrimary} onClick={nextStep}>Next →</button>
        </div>
      );

    if (currentStep === 2)
      return (
        <div className={`${styles.card} ${styles.fadeIn}`}>
          <p className={styles.questionText}>✉️ Your Email (Optional)</p>
          <input
            className={styles.inputField}
            placeholder="Email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
          <button className={styles.buttonPrimary} onClick={nextStep}>Next →</button>
        </div>
      );

    const qIndex = currentStep - 3;
    const question = questions[qIndex];
    if (!question) return null;

    const isLast = qIndex === questions.length - 1;

    return (
      <div className={`${styles.card} ${styles.fadeIn}`}>
        <p className={styles.questionText}>{question.label}</p>
        <div className={styles.optionsContainer}>
          {question.options.map((opt) => (
            <label key={opt} className={styles.optionLabel}>
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === opt}
                onChange={() => handleAnswer(question.id, opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {isLast && (
          <div className={styles.submitContainer}>
            <button
              className={styles.buttonPrimary}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Reveal My Lens 🔍"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Eye Story Quiz</h1>
      <p className={styles.sub}>Confess your habits. We’ll decode your eyes.</p>

      {renderStep()}

      {error && <p className={styles.error}>{error}</p>}

      {popupData && (
        <Popup onClose={() => setPopupData(null)}>
          <div className={`${styles.popupContent} ${styles.fadeIn}`}>
            <p className={styles.popupText}>{popupData}</p>
          </div>
        </Popup>
      )}
    </div>
  );
}
