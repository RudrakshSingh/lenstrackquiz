// pages/api/ocr.js
import formidable from "formidable";
import { runTesseract } from "@/lib/ocr/tesseractRunner";
import { parsePrescription } from "@/lib/prescriptionParser";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm();
  form.keepExtensions = true;

  try {
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ success: false, error: "File parsing failed" });

      const file = files.file;
      if (!file) return res.status(400).json({ success: false, error: "No file uploaded" });

      const filePath = file.filepath || file.path;
      const imageBuffer = fs.readFileSync(filePath);

      const ocrText = await runTesseract(imageBuffer);
      const parsedPrescription = parsePrescription(ocrText);

      return res.status(200).json({
        success: true,
        text: ocrText,
        prescription: parsedPrescription,
      });
    });
  } catch (error) {
    console.error("OCR API Error:", error);
    return res.status(500).json({ success: false, error: "OCR processing failed" });
  }
}
