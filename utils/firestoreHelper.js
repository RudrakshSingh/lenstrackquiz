// utils/firestoreHelper.js
import { adminDb } from "@/config/firebaseAdmin";

/**
 * Tracks basic source:
 * - Referer
 * - UTM from query/body
 * - User-Agent
 */
export function extractSource(req) {
  const referer = req.headers.referer || req.headers.referrer || null;
  const ua = req.headers["user-agent"] || null;
  const qp = req.query || {};
  return {
    referer,
    userAgent: ua,
    utm: {
      source: qp.utm_source || null,
      medium: qp.utm_medium || null,
      campaign: qp.utm_campaign || null,
      term: qp.utm_term || null,
      content: qp.utm_content || null
    }
  };
}

export async function saveQuizResponse({ user, answers, recommendation, source }) {
  const docRef = adminDb.collection("quizResponses").doc();
  const payload = {
    user,
    answers,
    recommendation,
    source,
    createdAt: new Date()
  };
  await docRef.set(payload);
  return docRef.id;
}

export async function getQuizById(id) {
  const snap = await adminDb.collection("quizResponses").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data();
  return { id: snap.id, ...data, createdAt: data.createdAt?.toDate?.() || data.createdAt };
}
