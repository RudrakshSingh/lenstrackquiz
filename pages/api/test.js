import { db } from "../../config/firebaseAdmin";

export default async function handler(req, res) {
  try {
    // 🔍 Debugging ENV vars
    console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
    console.log(
      "PRIVATE_KEY starts with:",
      process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30)
    );

    const ref = db.collection("test").doc();
    await ref.set({
      message: "Hello Firestore 🚀",
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Firestore test error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
