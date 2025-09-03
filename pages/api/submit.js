import { adminDb } from "../../config/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getLensRecommendation } from "@/lib/lensRecommendation";

export default async function handler(req, res) {
  // Ensure only POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { user, answers } = req.body;

    // Validate body
    if (!user || !user.name || !user.number || !answers) {
      return res.status(400).json({ success: false, error: "Invalid body" });
    }

    const submissionId = uuidv4();
    const recommendation = getLensRecommendation(answers);

    // Save to Firestore
    await adminDb.collection("submissions").doc(submissionId).set({
      user,
      answers,
      recommendation,
      createdAt: new Date().toISOString(),
    });

    // Return submission ID
    res.status(200).json({ success: true, id: submissionId });
  } catch (err) {
    console.error("Submit API error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
