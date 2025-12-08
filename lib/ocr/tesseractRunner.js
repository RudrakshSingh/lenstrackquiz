// lib/ocr/tesseractRunner.js
import Tesseract from "tesseract.js";

export async function runTesseract(imageBuffer) {
  try {
    // Validate input
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Image buffer is empty");
    }

    // Configure Tesseract for server-side use
    const { data } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => {
        // Only log important messages in production
        if (process.env.NODE_ENV === 'development') {
          if (m.status === 'recognizing text' || m.status === 'loading tesseract core') {
            console.log("Tesseract:", m.status, m.progress ? `${Math.round(m.progress * 100)}%` : '');
          }
        }
      },
    });

    const text = data.text || "";
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      console.warn("Tesseract returned empty text");
    }
    
    return trimmedText;
  } catch (error) {
    console.error("Tesseract OCR Error:", error);
    throw new Error(`Failed to process OCR: ${error.message || 'Unknown error'}`);
  }
}
