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
    const originalText = text; // Keep original for better matching
  
    // Right eye - try to match SPH, CYL, and AXIS together
    // Pattern: "Right Eye: -2.00 -0.50 180" or "RE: -2.00 / -0.50 / 180" or "OD: SPH -2.00 CYL -0.50 AXIS 180"
    const rightEyePatterns = [
      // Full pattern with SPH, CYL, AXIS
      /(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*(?:sph[:\-]?\s*)?([+-]?\d+(?:\.\d+)?)\s*(?:cyl[:\-]?\s*)?([+-]?\d+(?:\.\d+)?)?\s*(?:axis[:\-]?\s*)?(\d+)?/i,
      // Pattern with separator: "RE: -2.00 / -0.50 / 180"
      /(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s*[\/\s]+\s*([+-]?\d+(?:\.\d+)?)?\s*[\/\s]+\s*(\d+)?/i,
      // Simple pattern: "RE: -2.00 -0.50 180"
      /(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)?\s+(\d+)?/i,
    ];
    
    for (const pattern of rightEyePatterns) {
      const match = originalText.match(pattern);
      if (match) {
        prescription.rightEye = {
          sph: match[1] || null,
          cyl: match[2] || null,
          axis: match[3] || null
        };
        // Only break if we got at least SPH
        if (prescription.rightEye.sph) break;
      }
    }
    
    // Fallback: if no structured match, try simple SPH only
    if (!prescription.rightEye || !prescription.rightEye.sph) {
      const rightMatch = originalText.match(/(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i);
      if (rightMatch) {
        prescription.rightEye = {
          sph: rightMatch[1],
          cyl: null,
          axis: null
        };
      }
    }
  
  // Left eye - try to match SPH, CYL, and AXIS together
  // Pattern: "Left Eye: -1.75 -0.25 90" or "LE: -1.75 / -0.25 / 90" or "OS: SPH -1.75 CYL -0.25 AXIS 90"
  const leftEyePatterns = [
    // Full pattern with SPH, CYL, AXIS
    /(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*(?:sph[:\-]?\s*)?([+-]?\d+(?:\.\d+)?)\s*(?:cyl[:\-]?\s*)?([+-]?\d+(?:\.\d+)?)?\s*(?:axis[:\-]?\s*)?(\d+)?/i,
    // Pattern with separator: "LE: -1.75 / -0.25 / 90"
    /(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s*[\/\s]+\s*([+-]?\d+(?:\.\d+)?)?\s*[\/\s]+\s*(\d+)?/i,
    // Simple pattern: "LE: -1.75 -0.25 90"
    /(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)?\s+(\d+)?/i,
  ];
  
  for (const pattern of leftEyePatterns) {
    const match = originalText.match(pattern);
    if (match) {
      prescription.leftEye = {
        sph: match[1] || null,
        cyl: match[2] || null,
        axis: match[3] || null
      };
      // Only break if we got at least SPH
      if (prescription.leftEye.sph) break;
    }
  }
  
  // Fallback: if no structured match, try simple SPH only
  if (!prescription.leftEye || !prescription.leftEye.sph) {
    const leftMatch = originalText.match(/(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i);
    if (leftMatch) {
      prescription.leftEye = {
        sph: leftMatch[1],
        cyl: null,
        axis: null
      };
    }
  }
  
  // Add / additional (optional) - try multiple patterns
  const addPatterns = [
    /add[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i,
    /addition[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i,
    /(?:near|reading)[:\-]?\s*add[:\-]?\s*([+-]?\d+(?:\.\d+)?)/i,
  ];
  for (const pattern of addPatterns) {
    const match = originalText.match(pattern);
    if (match) {
      prescription.add = match[1];
      break;
    }
  }
  
  // Axis for right eye (optional) - only if not already captured
  if (!prescription.rightEye?.axis) {
    const rightAxisPatterns = [
      /(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*(?:sph[:\-]?\s*[+-]?\d+(?:\.\d+)?\s*)?(?:cyl[:\-]?\s*[+-]?\d+(?:\.\d+)?\s*)?axis[:\-]?\s*(\d+)/i,
      /(?:r(?:ight)?\s*eye|re|od)[:\-]?\s*[+-]?\d+(?:\.\d+)?\s*[+-]?\d+(?:\.\d+)?\s*(\d+)/i,
    ];
    for (const pattern of rightAxisPatterns) {
      const match = originalText.match(pattern);
      if (match) {
        if (!prescription.rightEye) prescription.rightEye = {};
        prescription.rightEye.axis = match[1];
        break;
      }
    }
  }
  
  // Axis for left eye (optional) - only if not already captured
  if (!prescription.leftEye?.axis) {
    const leftAxisPatterns = [
      /(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*(?:sph[:\-]?\s*[+-]?\d+(?:\.\d+)?\s*)?(?:cyl[:\-]?\s*[+-]?\d+(?:\.\d+)?\s*)?axis[:\-]?\s*(\d+)/i,
      /(?:l(?:eft)?\s*eye|le|os)[:\-]?\s*[+-]?\d+(?:\.\d+)?\s*[+-]?\d+(?:\.\d+)?\s*(\d+)/i,
    ];
    for (const pattern of leftAxisPatterns) {
      const match = originalText.match(pattern);
      if (match) {
        if (!prescription.leftEye) prescription.leftEye = {};
        prescription.leftEye.axis = match[1];
        break;
      }
    }
  }
  
  // Try to parse table format: SPH | CYL | AXIS in separate columns
  // This handles prescriptions formatted as tables
  const tablePattern = /(?:sph|sphere)[:\s]*([+-]?\d+(?:\.\d+)?)[\s\S]*?(?:cyl|cylinder)[:\s]*([+-]?\d+(?:\.\d+)?)[\s\S]*?(?:axis|ax)[:\s]*(\d+)/gi;
  const tableMatches = [...originalText.matchAll(tablePattern)];
  if (tableMatches.length >= 2) {
    // If we have 2 matches, assume first is right eye, second is left eye
    if (!prescription.rightEye) prescription.rightEye = {};
    if (!prescription.leftEye) prescription.leftEye = {};
    
    prescription.rightEye.sph = prescription.rightEye.sph || tableMatches[0][1];
    prescription.rightEye.cyl = prescription.rightEye.cyl || tableMatches[0][2];
    prescription.rightEye.axis = prescription.rightEye.axis || tableMatches[0][3];
    
    if (tableMatches[1]) {
      prescription.leftEye.sph = prescription.leftEye.sph || tableMatches[1][1];
      prescription.leftEye.cyl = prescription.leftEye.cyl || tableMatches[1][2];
      prescription.leftEye.axis = prescription.leftEye.axis || tableMatches[1][3];
    }
  }
  
  // PD (Pupillary Distance) - optional
  const pdPatterns = [
    /pd[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /pupillary[:\-]?\s*distance[:\-]?\s*(\d+(?:\.\d+)?)/i,
    /p\.?d\.?[:\-]?\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const pattern of pdPatterns) {
    const match = lower.match(pattern);
    if (match) {
      prescription.pd = match[1];
      break;
    }
  }
  
  return prescription;
}