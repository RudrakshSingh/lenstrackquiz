// pages/api/admin/questions/[id].js
// API endpoint for getting, updating, and deleting a specific question

import { getQuestionById, updateQuestion, deleteQuestion } from "../../../../models/Question";

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple authentication check (only for PUT/DELETE, GET is public)
  if (req.method === 'PUT' || req.method === 'DELETE') {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY || 'admin123'}`) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Question ID is required'
    });
  }

  if (req.method === 'GET') {
    // Get single question
    try {
      const question = await getQuestionById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      return res.status(200).json({
        success: true,
        question: {
          id: question.id,
          ...question,
          _id: question._id?.toString()
        }
      });
    } catch (error) {
      console.error('Error fetching question:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch question: ' + error.message
      });
    }
  }

  if (req.method === 'PUT') {
    // Update question
    try {
      const questionData = req.body;
      const { id: _, _id: __, ...updateData } = questionData;

      const updatedQuestion = await updateQuestion(id, updateData);

      if (!updatedQuestion) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      return res.status(200).json({
        success: true,
        question: {
          id: updatedQuestion.id,
          ...updatedQuestion,
          _id: updatedQuestion._id?.toString()
        }
      });
    } catch (error) {
      console.error('Error updating question:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update question: ' + error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete question
    try {
      const result = await deleteQuestion(id);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete question: ' + error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
