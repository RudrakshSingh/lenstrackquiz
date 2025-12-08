// pages/api/ocr.js
import formidable from "formidable";
import { runTesseract } from "@/lib/ocr/tesseractRunner";
import { parsePrescription } from "@/lib/prescriptionParser";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  let tempFilePath = null;

  try {
    // Disable default body parser
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      uploadDir: path.join(process.cwd(), 'tmp'), // Use tmp directory
      createDirs: true,
    });

    // Parse the form
    const [fields, files] = await form.parse(req);

    // Handle formidable v3 structure - files can be an array or single object
    let file;
    if (Array.isArray(files.file)) {
      file = files.file[0];
    } else if (files.file) {
      file = files.file;
    }

    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // Get file path - formidable v3 uses filepath
    const filePath = file.filepath || file.path;
    if (!filePath) {
      return res.status(400).json({ success: false, error: "Invalid file path" });
    }

    tempFilePath = filePath;

    // Read file buffer
    let imageBuffer;
    try {
      imageBuffer = fs.readFileSync(filePath);
      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({ success: false, error: "File is empty" });
      }
    } catch (readError) {
      console.error("Error reading file:", readError);
      return res.status(400).json({ 
        success: false, 
        error: "Failed to read uploaded file",
        details: readError.message 
      });
    }

    // Run OCR
    let ocrText;
    try {
      ocrText = await runTesseract(imageBuffer);
    } catch (ocrError) {
      console.error("OCR processing error:", ocrError);
      return res.status(500).json({ 
        success: false, 
        error: "OCR processing failed",
        details: ocrError.message 
      });
    }

    // Parse prescription
    const parsedPrescription = parsePrescription(ocrText);

    // Clean up temporary file
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (unlinkError) {
      // Ignore cleanup errors but log them
      console.warn("Failed to cleanup temp file:", unlinkError);
    }

    return res.status(200).json({
      success: true,
      text: ocrText,
      prescription: parsedPrescription,
    });
  } catch (error) {
    console.error("OCR API Error:", error);
    
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file on error:", cleanupError);
      }
    }

    return res.status(500).json({ 
      success: false, 
      error: error.message || "OCR processing failed",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
