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
    { id: "vibe", label: "How do you want your glasses to feel on you?", options: ["Blends in", "Total signature look", "Honestly, whatever"] },
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
    { id: "drink", label: "Drinks?", options: ["Nope", "Once a week ritual", "More than once a week"] },
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
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>👋</div>
            <h2 className={styles.stepTitle}>Let\'s get started</h2>
            <p className={styles.stepDescription}>What should we call you?</p>
          </div>
          <div className={styles.inputGroup}>
            <input
              className={styles.inputField}
              placeholder="Enter your name"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
            <button className={styles.nextButton} onClick={nextStep}>
              Continue
              <span className={styles.buttonArrow}>→</span>
            </button>
          </div>
        </div>
      );

    if (currentStep === 1)
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>📱</div>
            <h2 className={styles.stepTitle}>Contact information</h2>
            <p className={styles.stepDescription}>We\'ll send your results via WhatsApp</p>
          </div>
          <div className={styles.inputGroup}>
            <input
              className={styles.inputField}
              placeholder="Enter your phone number"
              value={user.number}
              maxLength={10}
              onChange={(e) => setUser({ ...user, number: e.target.value.replace(/\D/g, '') })}
            />
            <button className={styles.nextButton} onClick={nextStep}>
              Continue
              <span className={styles.buttonArrow}>→</span>
            </button>
          </div>
        </div>
      );

    if (currentStep === 2)
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>📧</div>
            <h2 className={styles.stepTitle}>Email (Optional)</h2>
            <p className={styles.stepDescription}>For additional updates and offers</p>
          </div>
          <div className={styles.inputGroup}>
            <input
              className={styles.inputField}
              placeholder="Enter your email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
            />
            <button className={styles.nextButton} onClick={nextStep}>
              Start Quiz
              <span className={styles.buttonArrow}>→</span>
            </button>
          </div>
        </div>
      );

    const qIndex = currentStep - 3;
    const question = questions[qIndex];
    if (!question) return null;

    const isLast = qIndex === questions.length - 1;

    return (
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <div className={styles.questionNumber}>Question {qIndex + 1}</div>
          <h2 className={styles.stepTitle}>{question.label}</h2>
        </div>
        <div className={styles.optionsContainer}>
          {question.options.map((opt, index) => (
            <label key={opt} className={styles.optionLabel}>
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === opt}
                onChange={() => handleAnswer(question.id, opt)}
              />
              <span className={styles.optionText}>{opt}</span>
              <div className={styles.optionIndicator}></div>
            </label>
          ))}
        </div>
        {isLast && (
          <div className={styles.submitContainer}>
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Analyzing your responses...
                </>
              ) : (
                <>
                  Get My Recommendations
                  <span className={styles.buttonArrow}>→</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Find Your Perfect Lens</h1>
        <p className={styles.subtitle}>A personalized quiz to discover the ideal eyewear for your lifestyle</p>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progress} 
              style={{ width: `${((currentStep + 1) / (questions.length + 3)) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {currentStep + 1} of {questions.length + 3}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {renderStep()}
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.error}>{error}</p>
        </div>
      )}

      {popupData && (
        <Popup onClose={() => setPopupData(null)}>
          <div className={styles.popupContent}>
            <div className={styles.popupIcon}>💡</div>
            <p className={styles.popupText}>{popupData}</p>
          </div>
        </Popup>
      )}
    </div>
  );
}
