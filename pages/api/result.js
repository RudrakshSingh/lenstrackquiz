import { adminDb } from "../../config/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ success: false, error: "Method Not Allowed" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, error: "Missing id" });

  const doc = await adminDb.collection("submissions").doc(id).get();
  if (!doc.exists) return res.status(404).json({ success: false, error: "Not found" });

  res.status(200).json({ success: true, data: doc.data() });
}
