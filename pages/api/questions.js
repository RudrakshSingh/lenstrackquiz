// pages/api/questions.js
// API endpoint for fetching quiz questions (public, for frontend)

import { getAllQuestions } from "../../models/Question";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { visionType } = req.query;
    
    // Build filter
    const filter = { is_active: true };
    if (visionType) {
      filter.visionTypes = { $in: [visionType] };
    }

    const questions = await getAllQuestions(filter);

    // Sort by order
    questions.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Format for frontend
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      groupId: q.groupId,
      text: q.text,
      questionType: q.questionType,
      options: q.options || [],
      defaultNext: q.defaultNext,
      order: q.order || 0,
      isRequired: q.isRequired !== false
    }));

    return res.status(200).json({
      success: true,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch questions: ' + error.message
    });
  }
}
