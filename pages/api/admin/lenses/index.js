// pages/api/admin/lenses/index.js
// API endpoint for creating and listing lenses

import { createLens, getAllLenses } from "../../../../models/Lens";
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '../../../../middleware/auth';
import { handleError } from '../../../../lib/errors';

async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Require authentication for POST/PUT/DELETE only
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    try {
      req.user = await getAuthenticatedUser(req);
    } catch (error) {
      return handleError(error, res);
    }
  }
  if (req.method === 'POST') {
    // Create new lens
    try {
      const lensData = req.body;

      // Validate required fields
      if (!lensData.name || !lensData.vision_type || !lensData.index) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, vision_type, index'
        });
      }

      // Set numericPrice from price_mrp if not provided
      if (!lensData.numericPrice && lensData.price_mrp) {
        lensData.numericPrice = lensData.price_mrp;
      }

      // Create lens in MongoDB
      const lens = await createLens(lensData);

      return res.status(201).json({
        success: true,
        data: { ...lens, id: lens._id.toString(), _id: lens._id.toString() }
      });
    } catch (error) {
      console.error('Error creating lens:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create lens: ' + error.message
      });
    }
  }

  if (req.method === 'GET') {
    // List all lenses
    try {
      const lenses = await getAllLenses();

      // Convert MongoDB _id to string id for frontend
      const formattedLenses = lenses.map(lens => ({
        id: lens._id.toString(),
        ...lens,
        _id: undefined // Remove MongoDB _id
      }));

      return res.status(200).json({
        success: true,
        data: formattedLenses
      });
    } catch (error) {
      console.error('Error fetching lenses:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch lenses: ' + error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

export default handler;

