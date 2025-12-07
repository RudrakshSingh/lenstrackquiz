import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/quiz.module.css";
import Popup from "../components/Popup";
import PrescriptionUpload from "../components/PrescriptionUpload";
import { parsePrescription } from "@/lib/prescriptionParser";
import SeverityMeter from "../components/SeverityMeter";
import Loader from "../components/Loader";
import SkeletonLoader from "../components/SkeletonLoader";
import { 
  calculateDeviceSeverity, 
  calculateOutdoorSeverity, 
  calculateDrivingSeverity, 
  calculatePowerSeverity,
  getFinalRequiredIndex
} from "@/lib/lensAdvisorEngine";

// Language translations
const translations = {
  en: {
    title: "Lenstrack Lens Advisor",
    subtitle: "Find your perfect lens based on lifestyle",
    selectLanguage: "Select Language",
    name: "What should we call you?",
    contact: "Contact Information",
    contactDesc: "We'll send your results via WhatsApp",
    email: "Email (Optional)",
    emailDesc: "For additional updates and offers",
    prescription: "Your Prescription",
    prescriptionDesc: "Enter your power (SPH & CYL) or upload prescription",
    frameType: "Select Frame Type",
    frameTypeDesc: "What type of frame are you planning to use?",
    continue: "Continue",
    startQuiz: "Start Quiz",
    getRecommendations: "Get My Recommendations",
    analyzing: "Analyzing your responses...",
    phonePlaceholder: "Enter your phone number",
    emailPlaceholder: "Enter your email",
    sphPlaceholder: "SPH (e.g., -2.00)",
    cylPlaceholder: "CYL (e.g., -0.50)",
    axisPlaceholder: "AXIS (e.g., 90)",
    addPlaceholder: "ADD (optional, e.g., +1.00)",
    pdPlaceholder: "PD (Pupillary Distance, e.g., 62)",
    frameBrand: "Frame Brand",
    frameSubCategory: "Sub-category (for Lenstrack)",
    frameMRP: "Frame MRP (₹)",
    frameMaterial: "Frame Material",
    questions: {
      deviceHours: "How many hours do you spend on digital devices daily?",
      outdoorExposure: "How much time do you spend outdoors?",
      driving: "How often do you drive?",
      symptoms: "What symptoms do you experience?",
      preferences: "Any specific preferences for your lenses?"
    },
    options: {
      deviceHours: ["0-2 hrs", "2-4 hrs", "4-6 hrs", "6-8 hrs", "8-12 hrs", "12-24 hrs"],
      outdoorExposure: ["Minimal", "1-3 hrs", "3-6 hrs", "6+ hrs"],
      driving: ["None", "Day only", "Some night", "Daily night", "Professional"],
      symptoms: ["Eye strain", "Headaches", "Blurred vision", "Dry eyes", "None"],
      preferences: ["Blue light protection", "UV protection", "Anti-glare", "Photochromic", "No preference"]
    }
  },
  hi: {
    title: "लेंसट्रैक लेंस सलाहकार",
    subtitle: "जीवनशैली के आधार पर अपना सही लेंस खोजें",
    selectLanguage: "भाषा चुनें",
    name: "हम आपको क्या कहें?",
    contact: "संपर्क जानकारी",
    contactDesc: "हम आपके परिणाम WhatsApp पर भेजेंगे",
    email: "ईमेल (वैकल्पिक)",
    emailDesc: "अतिरिक्त अपडेट और ऑफ़र के लिए",
    prescription: "आपका नुस्खा",
    prescriptionDesc: "अपनी पावर (SPH & CYL) दर्ज करें या नुस्खा अपलोड करें",
    frameType: "फ्रेम प्रकार चुनें",
    frameTypeDesc: "आप किस प्रकार का फ्रेम उपयोग करने की योजना बना रहे हैं?",
    continue: "जारी रखें",
    startQuiz: "क्विज़ शुरू करें",
    getRecommendations: "मेरी सिफारिशें प्राप्त करें",
    analyzing: "आपकी प्रतिक्रियाओं का विश्लेषण...",
    phonePlaceholder: "अपना फोन नंबर दर्ज करें",
    emailPlaceholder: "अपना ईमेल दर्ज करें",
    sphPlaceholder: "SPH (उदाहरण: -2.00)",
    cylPlaceholder: "CYL (उदाहरण: -0.50)",
    axisPlaceholder: "AXIS (उदाहरण: 90)",
    addPlaceholder: "ADD (वैकल्पिक, उदाहरण: +1.00)",
    pdPlaceholder: "PD (पुतली दूरी, उदाहरण: 62)",
    frameBrand: "फ्रेम ब्रांड",
    frameSubCategory: "उप-श्रेणी (लेंसट्रैक के लिए)",
    frameMRP: "फ्रेम MRP (₹)",
    frameMaterial: "फ्रेम सामग्री",
    questions: {
      deviceHours: "आप दिन में कितने घंटे डिजिटल उपकरणों पर बिताते हैं?",
      outdoorExposure: "आप बाहर कितना समय बिताते हैं?",
      driving: "आप कितनी बार गाड़ी चलाते हैं?",
      symptoms: "आपको कौन से लक्षण अनुभव होते हैं?",
      preferences: "आपके लेंस के लिए कोई विशिष्ट प्राथमिकताएं?"
    },
    options: {
      deviceHours: ["0-2 घंटे", "2-4 घंटे", "4-6 घंटे", "6-8 घंटे", "8-12 घंटे", "12-24 घंटे"],
      outdoorExposure: ["न्यूनतम", "1-3 घंटे", "3-6 घंटे", "6+ घंटे"],
      driving: ["कभी नहीं", "केवल दिन", "कुछ रात", "रोज़ाना रात", "पेशेवर"],
      symptoms: ["आंखों में तनाव", "सिरदर्द", "धुंधली दृष्टि", "सूखी आंखें", "कोई नहीं"],
      preferences: ["ब्लू लाइट सुरक्षा", "UV सुरक्षा", "एंटी-ग्लेयर", "फोटोक्रोमिक", "कोई प्राथमिकता नहीं"]
    }
  },
  hinglish: {
    title: "Lenstrack Lens Advisor",
    subtitle: "Apni perfect lens lifestyle ke basis pe find karein",
    selectLanguage: "Language select karein",
    name: "Hum aapko kya kahein?",
    contact: "Contact Information",
    contactDesc: "Hum aapke results WhatsApp pe bhejenge",
    email: "Email (Optional)",
    emailDesc: "Additional updates aur offers ke liye",
    prescription: "Aapka Prescription",
    prescriptionDesc: "Apni power (SPH & CYL) enter karein ya prescription upload karein",
    frameType: "Frame Type select karein",
    frameTypeDesc: "Aap kaunsa frame use karne ki plan kar rahe hain?",
    continue: "Continue",
    startQuiz: "Quiz start karein",
    getRecommendations: "Meri Recommendations lein",
    analyzing: "Aapke responses analyze ho rahe hain...",
    phonePlaceholder: "Apna phone number enter karein",
    emailPlaceholder: "Apna email enter karein",
    sphPlaceholder: "SPH (e.g., -2.00)",
    cylPlaceholder: "CYL (e.g., -0.50)",
    axisPlaceholder: "AXIS (e.g., 90)",
    addPlaceholder: "ADD (optional, e.g., +1.00)",
    pdPlaceholder: "PD (Pupillary Distance, e.g., 62)",
    frameBrand: "Frame Brand",
    frameSubCategory: "Sub-category (for Lenstrack)",
    frameMRP: "Frame MRP (₹)",
    frameMaterial: "Frame Material",
    questions: {
      deviceHours: "Aap din mein kitne hours digital devices pe spend karte hain?",
      outdoorExposure: "Aap bahar kitna time spend karte hain?",
      driving: "Aap kitni baar gaadi chalate hain?",
      symptoms: "Aapko kaunse symptoms experience hote hain?",
      preferences: "Aapke lenses ke liye koi specific preferences?"
    },
    options: {
      deviceHours: ["0-2 hrs", "2-4 hrs", "4-6 hrs", "6-8 hrs", "8-12 hrs", "12-24 hrs"],
      outdoorExposure: ["Minimal", "1-3 hrs", "3-6 hrs", "6+ hrs"],
      driving: ["None", "Day only", "Some night", "Daily night", "Professional"],
      symptoms: ["Eye strain", "Headaches", "Blurred vision", "Dry eyes", "None"],
      preferences: ["Blue light protection", "UV protection", "Anti-glare", "Photochromic", "No preference"]
    }
  }
};

export default function Quiz() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState({
    name: "",
    number: "",
    email: "",
    sph: "",
    cyl: "",
    add: "",
    rightSph: "",
    rightCyl: "",
    rightAxis: "",
    leftSph: "",
    leftCyl: "",
    leftAxis: "",
    pd: "",
    frameType: "",
    frameBrand: "",
    frameSubCategory: "",
    frameMRP: "",
    frameMaterial: "",
    storeId: "",
    salespersonId: "",
    salespersonName: "", // For self-service mode text input
    salesMode: "SELF_SERVICE", // SELF_SERVICE or STAFF_ASSISTED
  });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [stores, setStores] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [apiQuestions, setApiQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const t = translations[language];

  // Fetch questions and stores from API
  useEffect(() => {
    fetchQuestionsFromAPI();
    fetchStores();
    
    // Detect salesMode from URL params or context
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || urlParams.get('salesMode');
    if (mode === 'STAFF_ASSISTED' || mode === 'POS') {
      setUser(prev => ({ ...prev, salesMode: 'STAFF_ASSISTED' }));
    } else if (urlParams.get('storeId')) {
      // If storeId in URL, likely self-service QR scan
      setUser(prev => ({ 
        ...prev, 
        salesMode: 'SELF_SERVICE',
        storeId: urlParams.get('storeId')
      }));
    }
  }, [language]); // Refetch questions when language changes

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/admin/stores?isActive=true');
      const data = await res.json();
      if (data.success && data.data?.stores) {
        setStores(data.data.stores);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const fetchSalespeople = async (storeId) => {
    if (!storeId) {
      setSalespeople([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/users?storeId=${storeId}&role=SALES_EXECUTIVE&isActive=true`);
      const data = await res.json();
      if (data.success && data.data?.users) {
        setSalespeople(data.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch salespeople:', err);
      setSalespeople([]);
    }
  };

  // Helper function to check if question should be shown based on showIf conditions
  const shouldShowQuestion = (question, currentAnswers) => {
    if (!question.showIf) return true; // No condition, always show
    
    const condition = question.showIf;
    
    // Support different condition formats
    if (typeof condition === 'object') {
      // Format: { questionKey: 'value' } or { questionKey: { $in: ['value1', 'value2'] } }
      for (const [key, value] of Object.entries(condition)) {
        const answer = currentAnswers[key];
        
        if (value && typeof value === 'object' && value.$in) {
          // Array check: answer must be in the array
          if (!value.$in.includes(answer)) return false;
        } else if (value && typeof value === 'object' && value.$ne) {
          // Not equal check
          if (answer === value.$ne) return false;
        } else {
          // Exact match
          if (answer !== value) return false;
        }
      }
      return true;
    }
    
    // Legacy format: simple string check
    if (typeof condition === 'string') {
      return currentAnswers[condition] !== undefined;
    }
    
    return true;
  };

  // Get next question based on adaptive flow
  const getNextQuestion = (currentQuestionIndex, currentAnswers) => {
    const availableQuestions = apiQuestions.length > 0 ? apiQuestions : questions;
    
    // Start from next question
    for (let i = currentQuestionIndex + 1; i < availableQuestions.length; i++) {
      const question = availableQuestions[i];
      if (shouldShowQuestion(question.questionData || question, currentAnswers)) {
        return i;
      }
    }
    
    // If no more questions match, return -1 to indicate completion
    return -1;
  };

  const fetchQuestionsFromAPI = async () => {
    try {
      setQuestionsLoading(true);
      const res = await fetch('/api/admin/questions?isActive=true');
      const data = await res.json();
      if (data.success && data.data?.questions) {
        // Map API questions to format expected by UI
        const formattedQuestions = data.data.questions.map((q, idx) => {
          // Get options for this question
          const options = (q.options || []).map(opt => {
            // Return text based on language
            if (language === 'hi' && opt.textHi) return opt.textHi;
            if (language === 'hinglish' && opt.textHiEn) return opt.textHiEn;
            return opt.textEn || opt.key || '';
          });
          
          // Get question text based on language
          let questionText = q.textEn || '';
          if (language === 'hi' && q.textHi) questionText = q.textHi;
          if (language === 'hinglish' && q.textHiEn) questionText = q.textHiEn;
          
          return {
            id: q.key || q.id || `q_${idx}`,
            label: questionText,
            options: options.length > 0 ? options : ['Yes', 'No'], // Fallback if no options
            questionData: q, // Store full question data including showIf
            showIf: q.showIf // Store conditional logic
          };
        });
        setApiQuestions(formattedQuestions);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      // Fallback to hardcoded questions
    } finally {
      setQuestionsLoading(false);
    }
  };

  const frameTypes = [
    { value: "full_rim_plastic", label: { en: "Full Rim (Plastic)", hi: "फुल रिम (प्लास्टिक)", hinglish: "Full Rim (Plastic)" } },
    { value: "full_rim_metal", label: { en: "Full Rim (Metal)", hi: "फुल रिम (मेटल)", hinglish: "Full Rim (Metal)" } },
    { value: "half_rim", label: { en: "Half Rim / Semi-Rimless", hi: "हाफ रिम / सेमी-रिमलेस", hinglish: "Half Rim / Semi-Rimless" } },
    { value: "rimless", label: { en: "Rimless (Drilled)", hi: "रिमलेस (ड्रिल्ड)", hinglish: "Rimless (Drilled)" } },
  ];

  // Use API questions if available, otherwise fallback to hardcoded
  const questions = apiQuestions.length > 0 ? apiQuestions : [
    { 
      id: "deviceHours", 
      label: t.questions.deviceHours, 
      options: t.options.deviceHours 
    },
    { 
      id: "outdoorExposure", 
      label: t.questions.outdoorExposure, 
      options: t.options.outdoorExposure 
    },
    { 
      id: "driving", 
      label: t.questions.driving, 
      options: t.options.driving 
    },
    { 
      id: "symptoms", 
      label: t.questions.symptoms, 
      options: t.options.symptoms 
    },
    { 
      id: "preferences", 
      label: t.questions.preferences, 
      options: t.options.preferences 
    },
  ];

  const totalSteps = 1 + 3 + 1 + 1 + 1 + 1 + 1 + questions.length + 1; // lang + user info + prescription + frame type + frame details + store + salesperson + questions + usage summary

  const nextStep = () => {
    setError(null);

    // Language selection (step 0)
    if (currentStep === 0) {
      if (!language) return setError("Please select a language.");
    }

    // Name (step 1)
    if (currentStep === 1) {
      if (!user.name.trim()) return setError("Please enter your name.");
      if (!/^[A-Za-z\s]{2,}$/.test(user.name)) return setError("Name should have at least 2 letters.");
    }

    // Phone (step 2)
    if (currentStep === 2) {
      if (!user.number.trim()) return setError("Please enter your phone number.");
      if (!/^[0-9]{10}$/.test(user.number)) return setError("Phone must be 10 digits.");
    }

    // Email (step 3)
    if (currentStep === 3 && user.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return setError("Please enter a valid email.");
    }

    // Prescription (step 4)
    if (currentStep === 4) {
      // SPH is required, CYL can be 0
      if (!user.sph || user.sph.trim() === "") {
        return setError("Please enter SPH value.");
      }
      const sphNum = parseFloat(user.sph);
      if (isNaN(sphNum)) return setError("SPH must be a valid number.");
    }

    // Frame type (step 5)
    if (currentStep === 5) {
      if (!user.frameType) return setError("Please select a frame type.");
    }

    // Frame details (step 6)
    if (currentStep === 6) {
      if (!user.frameBrand) return setError("Please select a frame brand.");
      if (!user.frameMRP || parseFloat(user.frameMRP) <= 0) return setError("Please enter a valid frame MRP.");
    }

    const next = currentStep + 1;
    setCurrentStep(next);
  };

  const handleAnswer = (qid, val) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [qid]: val };
      // Also map to legacy format for backward compatibility
      if (qid === 'deviceHours') {
        newAnswers.deviceHours = val;
      } else if (qid === 'outdoorExposure') {
        newAnswers.outdoorExposure = val;
      } else if (qid === 'driving') {
        newAnswers.driving = val;
      } else if (qid === 'symptoms') {
        newAnswers.symptoms = val;
      } else if (qid === 'preferences') {
        newAnswers.preferences = val;
      }
      return newAnswers;
    });
    // Don't auto-advance - let user click Next button
    // This gives them time to review their selection
  };

  // Track which questions have been shown (for adaptive flow)
  const [shownQuestionIndices, setShownQuestionIndices] = useState([]);

  const handlePrescriptionParsed = (data) => {
    if (data.prescription) {
      const parsed = typeof data.prescription === 'string' 
        ? JSON.parse(data.prescription) 
        : data.prescription;
      
      // Handle new format with separate SPH/CYL for each eye
      if (parsed.rightEye && typeof parsed.rightEye === 'object') {
        if (parsed.rightEye.sph) {
          const rightSph = parseFloat(parsed.rightEye.sph);
          if (!isNaN(rightSph)) {
            setUser((prev) => ({ 
              ...prev, 
              rightSph: parsed.rightEye.sph,
              // Also set main sph for backward compatibility (use max of both eyes)
              sph: prev.leftSph ? 
                (Math.max(Math.abs(parseFloat(parsed.rightEye.sph)), Math.abs(parseFloat(prev.leftSph || 0)))).toString() :
                parsed.rightEye.sph
            }));
          }
        }
        if (parsed.rightEye.cyl) {
          const rightCyl = parseFloat(parsed.rightEye.cyl);
          if (!isNaN(rightCyl)) {
            setUser((prev) => ({ 
              ...prev, 
              rightCyl: parsed.rightEye.cyl,
              // Also set main cyl for backward compatibility (use max of both eyes)
              cyl: prev.leftCyl ? 
                (Math.max(Math.abs(parseFloat(parsed.rightEye.cyl)), Math.abs(parseFloat(prev.leftCyl || 0)))).toString() :
                parsed.rightEye.cyl
            }));
          }
        }
      } 
      // Handle legacy format (just a string value)
      else if (parsed.rightEye) {
        const rightPower = parseFloat(parsed.rightEye);
        if (!isNaN(rightPower)) {
          setUser((prev) => ({ 
            ...prev, 
            rightSph: parsed.rightEye,
            sph: prev.leftSph ? 
              (Math.max(Math.abs(parseFloat(parsed.rightEye)), Math.abs(parseFloat(prev.leftSph || 0)))).toString() :
              parsed.rightEye
          }));
        }
      }
      
      // Handle left eye - store separately
      if (parsed.leftEye && typeof parsed.leftEye === 'object') {
        if (parsed.leftEye.sph) {
          const leftSph = parseFloat(parsed.leftEye.sph);
          if (!isNaN(leftSph)) {
            setUser((prev) => ({
              ...prev,
              leftSph: parsed.leftEye.sph,
              // Update main sph to be max of both eyes
              sph: prev.rightSph ? 
                (Math.max(Math.abs(parseFloat(prev.rightSph)), Math.abs(parseFloat(parsed.leftEye.sph)))).toString() :
                parsed.leftEye.sph
            }));
          }
        }
        if (parsed.leftEye.cyl) {
          const leftCyl = parseFloat(parsed.leftEye.cyl);
          if (!isNaN(leftCyl)) {
            setUser((prev) => ({
              ...prev,
              leftCyl: parsed.leftEye.cyl,
              // Update main cyl to be max of both eyes
              cyl: prev.rightCyl ? 
                (Math.max(Math.abs(parseFloat(prev.rightCyl)), Math.abs(parseFloat(parsed.leftEye.cyl)))).toString() :
                parsed.leftEye.cyl
            }));
          }
        }
      }
      // Handle legacy format for left eye
      else if (parsed.leftEye) {
        const leftPower = parseFloat(parsed.leftEye);
        if (!isNaN(leftPower)) {
          setUser((prev) => ({
            ...prev,
            leftSph: parsed.leftEye,
            // Update main sph to be max of both eyes
            sph: prev.rightSph ? 
              (Math.max(Math.abs(parseFloat(prev.rightSph)), Math.abs(parseFloat(parsed.leftEye)))).toString() :
              parsed.leftEye
          }));
        }
      }
      
      if (parsed.add) {
        setUser((prev) => ({ ...prev, add: parsed.add }));
      }
    }
  };

  const handlePrescriptionTextChange = (text) => {
    // Try to parse prescription text
    const parsed = parsePrescription(text);
    if (parsed.rightEye || parsed.leftEye) {
      handlePrescriptionParsed({ prescription: parsed });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Convert answers to the format expected by the engine
      // Support both separate right/left eye and combined format
      const userData = {
        ...user,
        sph: parseFloat(user.sph) || 0,
        cyl: parseFloat(user.cyl) || 0,
        add: parseFloat(user.add) || 0,
        pd: user.pd ? parseFloat(user.pd) : null,
        // Include separate right/left eye data if available
        rightSph: user.rightSph ? parseFloat(user.rightSph) : null,
        rightCyl: user.rightCyl ? parseFloat(user.rightCyl) : null,
        rightAxis: user.rightAxis ? parseFloat(user.rightAxis) : null,
        leftSph: user.leftSph ? parseFloat(user.leftSph) : null,
        leftCyl: user.leftCyl ? parseFloat(user.leftCyl) : null,
        leftAxis: user.leftAxis ? parseFloat(user.leftAxis) : null,
        // Frame details
        frameBrand: user.frameBrand || null,
        frameSubCategory: user.frameSubCategory || null,
        frameMRP: user.frameMRP ? parseFloat(user.frameMRP) : null,
        frameMaterial: user.frameMaterial || null,
        // Sales mode
        salesMode: user.salesMode || 'SELF_SERVICE',
        deviceHours: parseDeviceHours(answers.deviceHours),
        outdoorExposure: answers.outdoorExposure?.toLowerCase() || 'minimal',
        driving: answers.driving?.toLowerCase() || 'none',
        symptoms: { blur: answers.symptoms || 'none' },
        preferences: answers.preferences || 'none',
        language
      };
      
      // Format power for API - use new format with right/left if available
      if (userData.rightSph !== null || userData.leftSph !== null) {
        userData.power = {
          right: {
            sph: userData.rightSph !== null ? userData.rightSph : userData.sph,
            cyl: userData.rightCyl !== null ? userData.rightCyl : userData.cyl,
            axis: userData.rightAxis !== null ? userData.rightAxis : null
          },
          left: {
            sph: userData.leftSph !== null ? userData.leftSph : userData.sph,
            cyl: userData.leftCyl !== null ? userData.leftCyl : userData.cyl,
            axis: userData.leftAxis !== null ? userData.leftAxis : null
          }
        };
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userData, answers, language }),
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

  const parseDeviceHours = (answer) => {
    if (!answer) return 0;
    const match = answer.match(/(\d+)-(\d+)/);
    if (match) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
    if (answer.includes("12-24")) return 18;
    return 0;
  };

  const renderStep = () => {
    // Step 0: Language Selection
    if (currentStep === 0) {
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>🌐</div>
            <h2 className={styles.stepTitle}>{t.selectLanguage}</h2>
            <p className={styles.stepDescription}>Choose your preferred language</p>
          </div>
          <div className={styles.optionsContainer}>
            {[
              { value: "en", label: "English" },
              { value: "hi", label: "हिंदी (Hindi)" },
              { value: "hinglish", label: "Hinglish" },
            ].map((lang) => (
              <label key={lang.value} className={styles.optionLabel}>
                <input
                  type="radio"
                  name="language"
                  checked={language === lang.value}
                  onChange={() => setLanguage(lang.value)}
                />
                <span className={styles.optionText}>{lang.label}</span>
                <div className={styles.optionIndicator}></div>
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <button className={styles.nextButton} onClick={nextStep}>
              {t.continue} <span className={styles.buttonArrow}>→</span>
            </button>
          </div>
        </div>
      );
    }

    // Step 1: Name
    if (currentStep === 1) {
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>👋</div>
            <h2 className={styles.stepTitle}>{t.name}</h2>
          </div>
          <div className={styles.inputGroup}>
            <input
              className={styles.inputField}
              placeholder={t.name}
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button className={styles.nextButton} onClick={nextStep}>
                {t.continue} <span className={styles.buttonArrow}>→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Phone
    if (currentStep === 2) {
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>📱</div>
            <h2 className={styles.stepTitle}>{t.contact}</h2>
            <p className={styles.stepDescription}>{t.contactDesc}</p>
          </div>
          <div className={styles.inputGroup}>
            <input
              className={styles.inputField}
              placeholder={t.phonePlaceholder}
              value={user.number}
              maxLength={10}
              onChange={(e) => setUser({ ...user, number: e.target.value.replace(/\D/g, '') })}
            />
            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button className={styles.nextButton} onClick={nextStep}>
                {t.continue} <span className={styles.buttonArrow}>→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Email
    if (currentStep === 3) {
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>📧</div>
            <h2 className={styles.stepTitle}>{t.email}</h2>
            <p className={styles.stepDescription}>{t.emailDesc}</p>
          </div>
          <div className={styles.inputGroup}>
            <input
              className={styles.inputField}
              placeholder={t.emailPlaceholder}
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
            />
            <button className={styles.nextButton} onClick={nextStep}>
              {t.continue} <span className={styles.buttonArrow}>→</span>
            </button>
          </div>
        </div>
      );
    }

    // Step 4: Prescription
    if (currentStep === 4) {
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>👓</div>
            <h2 className={styles.stepTitle}>{t.prescription}</h2>
            <p className={styles.stepDescription}>{t.prescriptionDesc}</p>
          </div>
          <div className={styles.inputGroup}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Right Eye (OD)
              </label>
              <input
                className={styles.inputField}
                type="number"
                step="0.25"
                placeholder="SPH (e.g., -2.00)"
                value={user.rightSph || user.sph || ''}
                onChange={(e) => {
                  const rightSph = e.target.value;
                  const leftSph = parseFloat(user.leftSph) || 0;
                  const maxSph = rightSph ? Math.max(Math.abs(parseFloat(rightSph)), Math.abs(leftSph)) : leftSph;
                  setUser({ ...user, rightSph, sph: maxSph.toString() });
                }}
                style={{ marginBottom: '0.5rem' }}
              />
              <input
                className={styles.inputField}
                type="number"
                step="0.25"
                placeholder="CYL (e.g., -0.50)"
                value={user.rightCyl || user.cyl || ''}
                onChange={(e) => {
                  const rightCyl = e.target.value;
                  const leftCyl = parseFloat(user.leftCyl) || 0;
                  const maxCyl = rightCyl ? Math.max(Math.abs(parseFloat(rightCyl)), Math.abs(leftCyl)) : leftCyl;
                  setUser({ ...user, rightCyl, cyl: maxCyl.toString() });
                }}
                style={{ marginBottom: '0.5rem' }}
              />
              <input
                className={styles.inputField}
                type="number"
                step="1"
                min="0"
                max="180"
                placeholder={t.axisPlaceholder}
                value={user.rightAxis || ''}
                onChange={(e) => setUser({ ...user, rightAxis: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Left Eye (OS)
              </label>
              <input
                className={styles.inputField}
                type="number"
                step="0.25"
                placeholder="SPH (e.g., -1.75)"
                value={user.leftSph || ''}
                onChange={(e) => {
                  const leftSph = e.target.value;
                  const rightSph = parseFloat(user.rightSph || user.sph) || 0;
                  const maxSph = leftSph ? Math.max(Math.abs(parseFloat(leftSph)), Math.abs(rightSph)) : rightSph;
                  setUser({ ...user, leftSph, sph: maxSph.toString() });
                }}
                style={{ marginBottom: '0.5rem' }}
              />
              <input
                className={styles.inputField}
                type="number"
                step="0.25"
                placeholder="CYL (e.g., -0.25)"
                value={user.leftCyl || ''}
                onChange={(e) => {
                  const leftCyl = e.target.value;
                  const rightCyl = parseFloat(user.rightCyl || user.cyl) || 0;
                  const maxCyl = leftCyl ? Math.max(Math.abs(parseFloat(leftCyl)), Math.abs(rightCyl)) : rightCyl;
                  setUser({ ...user, leftCyl, cyl: maxCyl.toString() });
                }}
                style={{ marginBottom: '0.5rem' }}
              />
              <input
                className={styles.inputField}
                type="number"
                step="1"
                min="0"
                max="180"
                placeholder={t.axisPlaceholder}
                value={user.leftAxis || ''}
                onChange={(e) => setUser({ ...user, leftAxis: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                className={styles.inputField}
                type="number"
                step="0.25"
                placeholder={t.addPlaceholder}
                value={user.add}
                onChange={(e) => setUser({ ...user, add: e.target.value })}
                style={{ marginBottom: '0.5rem' }}
              />
              <input
                className={styles.inputField}
                type="number"
                step="0.5"
                min="50"
                max="80"
                placeholder={t.pdPlaceholder}
                value={user.pd}
                onChange={(e) => setUser({ ...user, pd: e.target.value })}
              />
            </div>
            <PrescriptionUpload onParsed={handlePrescriptionParsed} />
            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button className={styles.nextButton} onClick={nextStep}>
                {t.continue} <span className={styles.buttonArrow}>→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 5: Frame Type
    if (currentStep === 5) {
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>🖼️</div>
            <h2 className={styles.stepTitle}>{t.frameType}</h2>
            <p className={styles.stepDescription}>{t.frameTypeDesc}</p>
          </div>
          <div className={styles.optionsContainer}>
            {frameTypes.map((frame) => (
              <label key={frame.value} className={styles.optionLabel}>
                <input
                  type="radio"
                  name="frameType"
                  checked={user.frameType === frame.value}
                  onChange={() => setUser({ ...user, frameType: frame.value })}
                />
                <span className={styles.optionText}>{frame.label[language] || frame.label.en}</span>
                <div className={styles.optionIndicator}></div>
              </label>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <button className={styles.nextButton} onClick={nextStep}>
              {t.continue} <span className={styles.buttonArrow}>→</span>
            </button>
          </div>
        </div>
      );
    }

    // Step 6: Frame Details
    if (currentStep === 6) {
      const frameBrands = ['LENSTRACK', 'RAYBAN', 'TITAN', 'FASTTRACK', 'VINCENT CHASE', 'OTHER'];
      const lenstrackSubCategories = ['ESSENTIAL', 'ALFA', 'ADVANCED', 'PREMIUM'];
      const frameMaterials = ['PLASTIC', 'METAL', 'ACETATE', 'TR90', 'TITANIUM', 'MIXED'];
      
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>📋</div>
            <h2 className={styles.stepTitle}>
              {language === 'hi' ? 'फ्रेम विवरण' : language === 'hinglish' ? 'Frame Details' : 'Frame Details'}
            </h2>
            <p className={styles.stepDescription}>
              {language === 'hi' ? 'अपने फ्रेम की जानकारी दर्ज करें' : language === 'hinglish' ? 'Apne frame ki details enter karein' : 'Enter your frame details'}
            </p>
          </div>
          <div className={styles.inputGroup}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              {t.frameBrand} *
            </label>
            <select
              className={styles.inputField}
              value={user.frameBrand}
              onChange={(e) => setUser({ ...user, frameBrand: e.target.value, frameSubCategory: e.target.value !== 'LENSTRACK' ? '' : user.frameSubCategory })}
              style={{ padding: '1rem 1.25rem', fontSize: '1rem', marginBottom: '1rem' }}
            >
              <option value="">{language === 'hi' ? 'ब्रांड चुनें...' : language === 'hinglish' ? 'Brand select karein...' : 'Select brand...'}</option>
              {frameBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            {user.frameBrand === 'LENSTRACK' && (
              <>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  {t.frameSubCategory}
                </label>
                <select
                  className={styles.inputField}
                  value={user.frameSubCategory}
                  onChange={(e) => setUser({ ...user, frameSubCategory: e.target.value })}
                  style={{ padding: '1rem 1.25rem', fontSize: '1rem', marginBottom: '1rem' }}
                >
                  <option value="">{language === 'hi' ? 'उप-श्रेणी चुनें...' : language === 'hinglish' ? 'Sub-category select karein...' : 'Select sub-category...'}</option>
                  {lenstrackSubCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </>
            )}

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              {t.frameMaterial}
            </label>
            <select
              className={styles.inputField}
              value={user.frameMaterial}
              onChange={(e) => setUser({ ...user, frameMaterial: e.target.value })}
              style={{ padding: '1rem 1.25rem', fontSize: '1rem', marginBottom: '1rem' }}
            >
              <option value="">{language === 'hi' ? 'सामग्री चुनें...' : language === 'hinglish' ? 'Material select karein...' : 'Select material...'}</option>
              {frameMaterials.map(mat => (
                <option key={mat} value={mat}>{mat}</option>
              ))}
            </select>

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              {t.frameMRP} *
            </label>
            <input
              className={styles.inputField}
              type="number"
              step="1"
              min="0"
              placeholder={language === 'hi' ? 'फ्रेम MRP (₹)' : language === 'hinglish' ? 'Frame MRP (₹)' : 'Frame MRP (₹)'}
              value={user.frameMRP}
              onChange={(e) => setUser({ ...user, frameMRP: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />

            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button 
                className={styles.nextButton} 
                onClick={nextStep}
                disabled={!user.frameBrand || !user.frameMRP}
              >
                {t.continue} <span className={styles.buttonArrow}>→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 7: Store Selection
    if (currentStep === 7) {
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>🏪</div>
            <h2 className={styles.stepTitle}>
              {language === 'hi' ? 'कृपया अपना स्टोर चुनें' : language === 'hinglish' ? 'Apna store select karein' : 'Select Your Store'}
            </h2>
            <p className={styles.stepDescription}>
              {language === 'hi' ? 'आप किस स्टोर में हैं?' : language === 'hinglish' ? 'Aap kaunse store mein hain?' : 'Which store are you visiting?'}
            </p>
          </div>
          <div className={styles.inputGroup}>
            <select
              className={styles.inputField}
              value={user.storeId}
              onChange={(e) => {
                const storeId = e.target.value;
                setUser({ ...user, storeId, salespersonId: '' });
                if (storeId) {
                  fetchSalespeople(storeId);
                } else {
                  setSalespeople([]);
                }
              }}
              style={{ padding: '1rem 1.25rem', fontSize: '1rem' }}
            >
              <option value="">{language === 'hi' ? 'स्टोर चुनें...' : language === 'hinglish' ? 'Store select karein...' : 'Select a store...'}</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} {store.city ? `- ${store.city}` : ''}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button className={styles.nextButton} onClick={nextStep}>
                {t.continue} <span className={styles.buttonArrow}>→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 8: Salesperson Selection (Conditional based on salesMode)
    if (currentStep === 8) {
      const isStaffAssisted = user.salesMode === 'STAFF_ASSISTED';
      const isOptional = !isStaffAssisted; // Self-Service: Optional, POS: Mandatory
      
      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>👤</div>
            <h2 className={styles.stepTitle}>
              {isStaffAssisted 
                ? (language === 'hi' ? 'कौन सा सेल्सपर्सन आपकी सहायता कर रहा है?' : language === 'hinglish' ? 'Kaun sa salesperson aapki help kar raha hai?' : 'Which salesperson is assisting you?')
                : (language === 'hi' ? 'क्या कोई सेल्सपर्सन ने आपकी सहायता की?' : language === 'hinglish' ? 'Kya koi salesperson ne aapki help ki?' : 'Did a salesperson assist you? (Optional)')
              }
            </h2>
            <p className={styles.stepDescription}>
              {isStaffAssisted
                ? (language === 'hi' ? 'कृपया अपने सेल्सपर्सन का नाम चुनें' : language === 'hinglish' ? 'Apne salesperson ka naam select karein' : 'Please select your salesperson')
                : (language === 'hi' ? 'यदि कोई सेल्सपर्सन ने आपकी सहायता की है, तो कृपया उनका नाम चुनें' : language === 'hinglish' ? 'Agar koi salesperson ne help ki hai, to unka naam select karein' : 'If a salesperson assisted you, please select their name')
              }
            </p>
          </div>
          <div className={styles.inputGroup}>
            <select
              className={styles.inputField}
              value={user.salespersonId}
              onChange={(e) => setUser({ ...user, salespersonId: e.target.value })}
              style={{ padding: '1rem 1.25rem', fontSize: '1rem' }}
              disabled={!user.storeId || salespeople.length === 0}
            >
              <option value="">
                {!user.storeId 
                  ? (language === 'hi' ? 'पहले स्टोर चुनें' : language === 'hinglish' ? 'Pehle store select karein' : 'Please select a store first')
                  : salespeople.length === 0
                  ? (language === 'hi' ? 'कोई सेल्सपर्सन उपलब्ध नहीं' : language === 'hinglish' ? 'Koi salesperson available nahi' : 'No salesperson available')
                  : isOptional
                  ? (language === 'hi' ? 'सेल्सपर्सन चुनें (वैकल्पिक)...' : language === 'hinglish' ? 'Salesperson select karein (optional)...' : 'Select a salesperson (optional)...')
                  : (language === 'hi' ? 'सेल्सपर्सन चुनें...' : language === 'hinglish' ? 'Salesperson select karein...' : 'Select a salesperson...')
                }
              </option>
              {salespeople.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name || person.email}
                </option>
              ))}
            </select>
            
            {/* Text input option for self-service mode */}
            {isOptional && (
              <input
                className={styles.inputField}
                type="text"
                placeholder={language === 'hi' ? 'या सेल्सपर्सन का नाम टाइप करें' : language === 'hinglish' ? 'Ya salesperson ka naam type karein' : 'Or type salesperson name'}
                value={user.salespersonName || ''}
                onChange={(e) => setUser({ ...user, salespersonName: e.target.value })}
                style={{ marginTop: '1rem', padding: '1rem 1.25rem', fontSize: '1rem' }}
              />
            )}
            
            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button 
                className={styles.nextButton} 
                onClick={nextStep} 
                disabled={isStaffAssisted && !user.salespersonId}
              >
                {t.startQuiz} <span className={styles.buttonArrow}>→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Step 9 + questions.length: Usage Summary (after store, salesperson, and questions)
    const usageSummaryStep = 9 + questions.length;
    if (currentStep === usageSummaryStep) {
      // Calculate severities
      const deviceHours = parseDeviceHours(answers.deviceHours);
      const deviceSeverity = calculateDeviceSeverity(deviceHours);
      const outdoorSeverity = calculateOutdoorSeverity(answers.outdoorExposure?.toLowerCase() || 'minimal');
      const drivingSeverity = calculateDrivingSeverity(answers.driving?.toLowerCase() || 'none');
      const sph = parseFloat(user.sph) || 0;
      const cyl = parseFloat(user.cyl) || 0;
      const powerSeverity = calculatePowerSeverity(sph, cyl);
      const requiredIndex = getFinalRequiredIndex(user.frameType || 'full_rim_plastic', sph, cyl);

      const usageSummaryTranslations = {
        en: {
          title: "Usage Summary",
          subtitle: "Based on your responses, here's your usage profile",
          deviceSeverity: "Device Usage",
          outdoorSeverity: "Outdoor Exposure",
          drivingSeverity: "Driving Frequency",
          powerSeverity: "Power Level",
          requiredIndex: "Minimum Safe Index",
          requiredIndexDesc: "For your power and frame combination",
          continue: "Get Recommendations",
          warning: "Warning",
          frameNotSafe: "Your power requires a stronger frame. Rimless is not safe for your prescription."
        },
        hi: {
          title: "उपयोग सारांश",
          subtitle: "आपकी प्रतिक्रियाओं के आधार पर, यहां आपका उपयोग प्रोफ़ाइल है",
          deviceSeverity: "डिवाइस उपयोग",
          outdoorSeverity: "बाहरी एक्सपोज़र",
          drivingSeverity: "ड्राइविंग आवृत्ति",
          powerSeverity: "पावर स्तर",
          requiredIndex: "न्यूनतम सुरक्षित इंडेक्स",
          requiredIndexDesc: "आपकी पावर और फ्रेम संयोजन के लिए",
          continue: "सिफारिशें प्राप्त करें",
          warning: "चेतावनी",
          frameNotSafe: "आपकी पावर के लिए एक मजबूत फ्रेम की आवश्यकता है। रिमलेस आपके नुस्खे के लिए सुरक्षित नहीं है।"
        },
        hinglish: {
          title: "Usage Summary",
          subtitle: "Aapke responses ke basis pe, yahan aapka usage profile hai",
          deviceSeverity: "Device Usage",
          outdoorSeverity: "Outdoor Exposure",
          drivingSeverity: "Driving Frequency",
          powerSeverity: "Power Level",
          requiredIndex: "Minimum Safe Index",
          requiredIndexDesc: "Aapke power aur frame combination ke liye",
          continue: "Recommendations lein",
          warning: "Warning",
          frameNotSafe: "Aapke power ke liye stronger frame chahiye. Rimless aapke prescription ke liye safe nahi hai."
        }
      };

      const tSummary = usageSummaryTranslations[language] || usageSummaryTranslations.en;
      const showFrameWarning = (user.frameType === 'rimless' || user.frameType === 'drilled') && 
                               (Math.max(Math.abs(sph), Math.abs(cyl)) >= 7);

      return (
        <div className={styles.stepCard}>
          <div className={styles.stepHeader}>
            <div className={styles.stepIcon}>📊</div>
            <h2 className={styles.stepTitle}>{tSummary.title}</h2>
            <p className={styles.stepDescription}>{tSummary.subtitle}</p>
          </div>

          {showFrameWarning && (
            <div className={styles.warningBox} style={{ 
              background: '#fef2f2', 
              border: '2px solid #fecaca', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.5rem' }}>
                ⚠️ {tSummary.warning}
              </div>
              <div style={{ color: '#991b1b', fontSize: '0.875rem' }}>
                {tSummary.frameNotSafe}
              </div>
            </div>
          )}

          <div className={styles.usageSummary}>
            <SeverityMeter label={tSummary.deviceSeverity} value={deviceSeverity} />
            <SeverityMeter label={tSummary.outdoorSeverity} value={outdoorSeverity} />
            <SeverityMeter label={tSummary.drivingSeverity} value={drivingSeverity} />
            <SeverityMeter label={tSummary.powerSeverity} value={powerSeverity} />
            
            <div className={styles.requiredIndexBox}>
              <div className={styles.requiredIndexLabel}>{tSummary.requiredIndex}</div>
              <div className={styles.requiredIndexValue}>{requiredIndex || 'N/A'}</div>
              <div className={styles.requiredIndexDesc}>{tSummary.requiredIndexDesc}</div>
            </div>
          </div>

          <div className={styles.submitContainer}>
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  {t.analyzing}
                </>
              ) : (
                <>
                  {tSummary.continue} <span className={styles.buttonArrow}>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    // Steps 9+: Questions (after store and salesperson steps) - Adaptive Flow
    const availableQuestions = apiQuestions.length > 0 ? apiQuestions : questions;
    
    // Filter questions based on showIf conditions (adaptive flow)
    const filteredQuestions = availableQuestions.filter(q => 
      shouldShowQuestion(q.questionData || q, answers)
    );
    
    // Find current question index in filtered list
    let currentQIndex = currentStep - 9;
    if (currentQIndex < 0 || currentQIndex >= filteredQuestions.length) {
      return null; // Invalid step
    }
    
    const question = filteredQuestions[currentQIndex];
    if (!question) return null;

    // Check if this is the last question in the filtered list
    const isLast = currentQIndex === filteredQuestions.length - 1;
    const hasAnswer = answers[question.id];

    return (
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <div className={styles.questionNumber}>
            Question {currentQIndex + 1} of {filteredQuestions.length}
          </div>
          <h2 className={styles.stepTitle}>{question.label}</h2>
        </div>
        <div className={styles.optionsContainer}>
          {question.options.map((opt) => (
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
        {hasAnswer && (
          <button 
            className={styles.nextButton} 
            onClick={nextStep}
            style={{ marginTop: '1.5rem' }}
          >
            {isLast ? t.getRecommendations : t.continue} <span className={styles.buttonArrow}>→</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {currentStep + 1} of {totalSteps}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        {questionsLoading && currentStep >= 8 ? (
          <SkeletonLoader type="card" count={1} />
        ) : (
          renderStep()
        )}
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
