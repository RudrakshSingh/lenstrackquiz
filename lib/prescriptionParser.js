/**
 * Parses OCR text and returns structured prescription.
 * Expected output example:
 * {
 *   rightEye: { sph: "-2.00", cyl: "-0.50" },
 *   leftEye: { sph: "-1.75", cyl: "-0.25" },
 *   add: "+1.00" // optional
 * }
 * 
 * Also supports legacy format:
 * {
 *   rightEye: "-2.00",
 *   leftEye: "-1.75",
 *   add: "+1.00"
 * }
 */
export function parsePrescription(text) {
    const prescription = {};
    const lower = text.toLowerCase();
  
    // Right eye - try to match SPH and CYL together
    // Pattern: "Right Eye: -2.00 -0.50" or "RE: -2.00 / -0.50" or "OD: -2.00 -0.50"
    const rightEyePatterns = [
      /(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:[\/\s]+([+-]?\d+(?:\.\d+)?))?/i,
      /(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*sph[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:cyl[:\-]?\s*([+-]?\d+(?:\.\d+)?))?/i
    ];
    
    for (const pattern of rightEyePatterns) {
      const match = lower.match(pattern);
      if (match) {
        prescription.rightEye = {
          sph: match[1] || null,
          cyl: match[2] || null
        };
        break;
      }
    }
    
    // Fallback: if no structured match, try simple SPH only
    if (!prescription.rightEye) {
      const rightMatch = lower.match(/r(?:ight)?\s*eye[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i);
      if (rightMatch) {
        prescription.rightEye = {
          sph: rightMatch[1],
          cyl: null
        };
      }
    }
  
    // Left eye - try to match SPH and CYL together
    // Pattern: "Left Eye: -1.75 -0.25" or "LE: -1.75 / -0.25" or "OS: -1.75 -0.25"
    const leftEyePatterns = [
      /(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:[\/\s]+([+-]?\d+(?:\.\d+)?))?/i,
      /(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*sph[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:cyl[:\-]?\s*([+-]?\d+(?:\.\d+)?))?/i
    ];
    
    for (const pattern of leftEyePatterns) {
      const match = lower.match(pattern);
      if (match) {
        prescription.leftEye = {
          sph: match[1] || null,
          cyl: match[2] || null
        };
        break;
      }
    }
    
    // Fallback: if no structured match, try simple SPH only
    if (!prescription.leftEye) {
      const leftMatch = lower.match(/l(?:eft)?\s*eye[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i);
      if (leftMatch) {
        prescription.leftEye = {
          sph: leftMatch[1],
          cyl: null
        };
      }
    }
  
    // Add / additional (optional)
    const addMatch = lower.match(/add[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (addMatch) prescription.add = addMatch[1];
  
    return prescription;
  }