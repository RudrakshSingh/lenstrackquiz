// pages/api/result.js
import { adminDb } from "../../config/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Missing id" });
    }

    const doc = await adminDb.collection("submissions").doc(id).get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, error: "Not found" });
    }

    return res.status(200).json({
      success: true,
      data: doc.data(),
    });
  } catch (err) {
    console.error("Result API error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}
