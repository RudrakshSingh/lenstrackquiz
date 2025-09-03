// lib/lensRecommendation.js
export function getLensRecommendation(answers = {}) {
    const addons = [];
    const notes = [];
  
    let primary = "Single Vision (Clear)";
    switch (answers.blur) {
      case "Distance": primary = "Single Vision Distance"; break;
      case "Near": primary = "Single Vision Near"; break;
      case "Both": primary = "Progressive (Multifocal)"; notes.push("Consider updated refraction for accurate add power."); break;
      case "I can’t tell anymore": notes.push("Book a quick refraction to clarify Distance vs Near."); break;
    }
  
    if (answers.blurScale === "Pretty bad" || answers.blurScale === "Close to blind-mode") {
      notes.push("High index lenses may improve thickness/weight.");
    }
  
    if (answers.screenTime === "4–8" || answers.screenTime === "8–12") {
      addons.push("Blue Light Protection");
      notes.push("Long screen-time → anti-fatigue or blue-cut helpful.");
    }
  
    if (answers.lifestyle === "Screens") addons.push("Anti-Fatigue Option");
    if (answers.workWith === "Text") notes.push("Ask about working distance for optimal near power.");
    if (answers.environment === "Dusty chaos") addons.push("Anti-Scratch / EasyClean");
    if (answers.environment === "Full sun") addons.push("UV Protection");
    if (answers.driving === "Night owl" || answers.driving === "Both") addons.push("Anti-Glare / Night Driving AR");
    if (answers.movement === "Outdoors" || answers.movement === "Everywhere at once") {
      if (answers.tint === "Change with the sun") addons.push("Photochromic");
    }
    if (answers.tint === "Stay stylishly tinted") addons.push("Fixed Tint");
    if (answers.breakFreq === "Always") notes.push("Consider impact-resistant material and spare pair.");
    if (answers.attachment === "It’s literally my lifeline") notes.push("Consider premium AR + oleophobic for daily comfort.");
  
    const uniq = (arr) => Array.from(new Set(arr));
  
    return { primary, addons: uniq(addons), notes: uniq(notes) };
  }
  