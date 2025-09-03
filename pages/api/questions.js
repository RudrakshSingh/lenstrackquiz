// pages/api/questions.js
export default function handler(req, res) {
    const questions = [
      // Step 1
      { id: "vibe", label: "What’s your vibe?", options: ["Blends in", "Total signature look", "Honestly, whatever"] },
      { id: "gender", label: "Gender matters only if you want it to", options: ["Male", "Female", "Other"] },
      { id: "attachment", label: "How attached are you to your glasses?", options: ["Occasionally fling them on", "Mostly glued", "Forget them all the time", "It’s literally my lifeline"] },
  
      // Step 2
      { id: "blur", label: "Do things blur for you?", options: ["Near", "Distance", "Both", "I can’t tell anymore"] },
      { id: "blurScale", label: "On a blur scale, where are you?", options: ["Crystal clear", "Just a little fuzzy", "Pretty bad", "Close to blind-mode"] },
      { id: "tint", label: "Should your lenses have superpowers?", options: ["Change with the sun", "Stay stylishly tinted", "Keep it simple clear"] },
  
      // Step 3
      { id: "screenTime", label: "How many hours do you battle screens?", options: ["<4", "4–8", "8–12", "Zero (I live in 1980s)"] },
      { id: "lifestyle", label: "What’s your lifestyle cocktail?", options: ["Screens", "Paperwork", "People-facing", "Lone wolf"] },
      { id: "workWith", label: "Do you wrestle more with?", options: ["Colors", "Text"] },
  
      // Step 4
      { id: "environment", label: "Your environment is usually", options: ["Dusty chaos", "Spotless clean", "Full sun", "Mix of all"] },
      { id: "movement", label: "Where do you live most?", options: ["Indoors", "Outdoors", "Balanced", "Everywhere at once"] },
      { id: "driving", label: "How often are you behind the wheel?", options: ["Day drives", "Night owl", "Both", "Never"] },
  
      // Step 5
      { id: "breakFreq", label: "How often do you break or misplace your glasses?", options: ["Never", "Sometimes", "Always"] },
      { id: "smoking", label: "Cigarettes?", options: ["Nope", "Around 2 a day", "10-ish", "Chain-smoker vibes"] },
      { id: "drinks", label: "Drinks?", options: ["Once a week ritual", "More than once a week"] },
  
      // Step 6 - final reveal, no questions
    ];
  
    res.status(200).json({ success: true, questions });
  }
  