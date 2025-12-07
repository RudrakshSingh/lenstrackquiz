// lib/ocr/tesseractRunner.js
import Tesseract from "tesseract.js";

export async function runTesseract(imageBuffer) {
  try {
    const { data } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => console.log("Tesseract:", m),
    });

    const text = data.text || "";
    return text.trim();
  } catch (error) {
    console.error("Tesseract OCR Error:", error);
    throw new Error("Failed to process OCR");
  }
}
