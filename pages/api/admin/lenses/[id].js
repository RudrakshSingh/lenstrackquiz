// pages/api/admin/lenses/[id].js
// API endpoint for getting, updating, and deleting a specific lens

import { getLensById, updateLens, deleteLens } from "../../../../models/Lens";
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '../../../../middleware/auth';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Require authentication for PUT/DELETE only, GET is public
  if (['PUT', 'DELETE'].includes(req.method)) {
    try {
      req.user = await getAuthenticatedUser(req);
    } catch (error) {
      return handleError(error, res);
    }
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Lens ID is required'
    });
  }

  // Convert string id to MongoDB ObjectId
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid lens ID format'
    });
  }

  if (req.method === 'GET') {
    // Get single lens
    try {
      const lens = await getLensById(objectId);

      if (!lens) {
        return res.status(404).json({
          success: false,
          error: 'Lens not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: lens._id.toString(),
          ...lens,
          _id: lens._id.toString()
        }
      });
    } catch (error) {
      console.error('Error fetching lens:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch lens: ' + error.message
      });
    }
  }

  if (req.method === 'PUT') {
    // Update lens
    try {
      const lensData = req.body;
      const { id: _, ...updateData } = lensData; // Remove id if present

      // Set numericPrice from price_mrp if not provided
      if (!updateData.numericPrice && updateData.price_mrp) {
        updateData.numericPrice = updateData.price_mrp;
      }

      const updatedLens = await updateLens(objectId, updateData);

      if (!updatedLens) {
        return res.status(404).json({
          success: false,
          error: 'Lens not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: updatedLens._id.toString(),
          ...updatedLens,
          _id: updatedLens._id.toString()
        }
      });
    } catch (error) {
      console.error('Error updating lens:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update lens: ' + error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete lens
    try {
      const result = await deleteLens(objectId);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Lens not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lens deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting lens:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete lens: ' + error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

export default handler;

