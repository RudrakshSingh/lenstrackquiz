// pages/api/submit.js
import { adminDb } from "../../config/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getLensRecommendation } from "@/lib/lensRecommendation";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { user, answers } = req.body;

    // 🔎 Validate input
    if (!user || !user.name || !user.number || !answers) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid body" });
    }

    const submissionId = uuidv4();
    const recommendation = getLensRecommendation(answers);

    // 🔥 Save submission to Firestore
    await adminDb.collection("submissions").doc(submissionId).set({
      user,
      answers,
      recommendation,
      createdAt: new Date().toISOString(),
    });

    // ✅ Return consistent key `submissionId`
    return res.status(200).json({
      success: true,
      submissionId, // 👈 index.js uses this
    });
  } catch (err) {
    console.error("Submit API error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}
