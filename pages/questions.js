// pages/questions.js
// Screen LA-04: Questionnaire Wizard with Adaptive Logic (V1.0 UI/UX Master Flow)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLensAdvisor } from '../contexts/LensAdvisorContext';
import QuestionCard from '../components/QuestionCard';
import Loader from '../components/Loader';
import SkeletonLoader from '../components/SkeletonLoader';
// Using fetch directly for questions API
import styles from '../styles/quiz.module.css';
import dynamic from 'next/dynamic';

const CustomerBackground = dynamic(() => import('../components/three/CustomerBackground'), {
  ssr: false,
});

const translations = {
  en: {
    header: "Step 3 of 5 – Your Lifestyle",
    progress: "Question {current} of {total}",
    next: "Next",
    back: "Back",
    skip: "Skip",
    loading: "Loading questions...",
  },
  hi: {
    header: "चरण 3 of 5 – आपकी जीवनशैली",
    progress: "प्रश्न {current} of {total}",
    next: "अगला",
    back: "वापस",
    skip: "छोड़ें",
    loading: "प्रश्न लोड हो रहे हैं...",
  },
  hinglish: {
    header: "Step 3 of 5 – Aapki Lifestyle",
    progress: "Question {current} of {total}",
    next: "Next",
    back: "Back",
    skip: "Skip",
    loading: "Questions load ho rahe hain...",
  },
};

// Helper function to evaluate showIf conditions
function evaluateCondition(condition, answers) {
  if (!condition) return true;
  
  const { field, operator, value } = condition;
  const answerValue = answers[field];
  
  if (operator === 'equals') {
    return answerValue === value;
  } else if (operator === 'notEquals') {
    return answerValue !== value;
  } else if (operator === 'includes') {
    return Array.isArray(answerValue) && answerValue.includes(value);
  } else if (operator === 'greaterThan') {
    return parseFloat(answerValue) > parseFloat(value);
  } else if (operator === 'lessThan') {
    return parseFloat(answerValue) < parseFloat(value);
  }
  
  return true;
}

export default function QuestionsPage() {
  const router = useRouter();
  const { language, answers, updateAnswers, rxData, frameData } = useLensAdvisor();
  const [apiQuestions, setApiQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subQuestions, setSubQuestions] = useState([]);
  const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(-1);

  const t = translations[language] || translations.en;

  // Fetch questions from API
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questionnaire/questions?language=${language}`);
      const data = await response.json();
      const questions = data?.data?.questions || data?.questions || [];
      setApiQuestions(questions);
      
      // Filter questions based on showIf conditions
      const filtered = questions.filter(q => evaluateCondition(q.showIf, answers));
      setFilteredQuestions(filtered);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-filter questions when answers change
  useEffect(() => {
    const filtered = apiQuestions.filter(q => evaluateCondition(q.showIf, answers));
    setFilteredQuestions(filtered);
    
    // Reset to first question if current is out of bounds
    if (currentQuestionIndex >= filtered.length) {
      setCurrentQuestionIndex(0);
    }
  }, [answers, apiQuestions]);

  const handleAnswer = (questionId, answer) => {
    updateAnswers(questionId, answer);
    
    // Check if current question has sub-questions
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (currentQuestion?.subQuestions && currentQuestion.subQuestions.length > 0) {
      // Show sub-questions
      const relevantSubQuestions = currentQuestion.subQuestions.filter(sq => 
        evaluateCondition(sq.showIf, { ...answers, [questionId]: answer })
      );
      if (relevantSubQuestions.length > 0) {
        setSubQuestions(relevantSubQuestions);
        setCurrentSubQuestionIndex(0);
        return;
      }
    }
    
    // Move to next question or sub-question
    if (currentSubQuestionIndex >= 0 && currentSubQuestionIndex < subQuestions.length - 1) {
      setCurrentSubQuestionIndex(currentSubQuestionIndex + 1);
    } else {
      setCurrentSubQuestionIndex(-1);
      setSubQuestions([]);
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentSubQuestionIndex >= 0 && currentSubQuestionIndex < subQuestions.length - 1) {
      setCurrentSubQuestionIndex(currentSubQuestionIndex + 1);
    } else if (currentSubQuestionIndex >= 0) {
      // Finished sub-questions, move to next main question
      setCurrentSubQuestionIndex(-1);
      setSubQuestions([]);
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All questions answered, go to recommendations
        router.push('/recommendations');
      }
    } else {
      // Move to next main question
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // All questions answered, go to recommendations
        router.push('/recommendations');
      }
    }
  };

  const handleBack = () => {
    if (currentSubQuestionIndex > 0) {
      setCurrentSubQuestionIndex(currentSubQuestionIndex - 1);
    } else if (currentSubQuestionIndex === 0) {
      setCurrentSubQuestionIndex(-1);
      setSubQuestions([]);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
        <CustomerBackground />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <SkeletonLoader variant="card" />
        </div>
      </div>
    );
  }

  const currentQuestion = currentSubQuestionIndex >= 0 
    ? subQuestions[currentSubQuestionIndex]
    : filteredQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    // All questions answered
    router.push('/recommendations');
    return null;
  }

  const totalQuestions = filteredQuestions.length + subQuestions.length;
  const currentQuestionNumber = currentSubQuestionIndex >= 0
    ? filteredQuestions.length + currentSubQuestionIndex + 1
    : currentQuestionIndex + 1;

  return (
    <div className={styles.container} style={{ position: 'relative', minHeight: '100vh' }}>
      <CustomerBackground />
      <div className={styles.stepCard} style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
        {/* Header */}
        <div className={styles.stepHeader}>
          <h2 className={styles.stepTitle}>{t.header}</h2>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {t.progress.replace('{current}', currentQuestionNumber).replace('{total}', totalQuestions)}
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(currentQuestionNumber / totalQuestions) * 100}%`,
              height: '100%',
              backgroundColor: '#1e40af',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Question Card */}
        <QuestionCard
          questionKey={currentQuestion.key || currentQuestion.id}
          question={currentQuestion.question || currentQuestion.text}
          options={currentQuestion.options || []}
          selected={answers[currentQuestion.id || currentQuestion.key]}
          onSelect={(answer) => handleAnswer(currentQuestion.id || currentQuestion.key, answer)}
          isMultiSelect={currentQuestion.type === 'multi-select'}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={handleBack}
            className={styles.backButton}
            style={{ flex: 1 }}
          >
            ← {t.back}
          </button>
          <button
            onClick={handleNext}
            className={styles.nextButton}
            style={{ flex: 2 }}
            disabled={!answers[currentQuestion.id || currentQuestion.key]}
          >
            {t.next} <span className={styles.buttonArrow}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

