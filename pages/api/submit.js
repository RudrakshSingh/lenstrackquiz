import { adminDb } from "../../config/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import { getLensRecommendation } from "@/lib/lensRecommendation";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { user, answers } = req.body;
    if (!user || !user.name || !user.number || !answers) return res.status(400).json({ error: "Invalid body" });

    const submissionId = uuidv4();
    const recommendation = getLensRecommendation(answers);

    await adminDb.collection("submissions").doc(submissionId).set({ user, answers, recommendation, createdAt: new Date().toISOString() });
    res.status(200).json({ success: true, id: submissionId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
