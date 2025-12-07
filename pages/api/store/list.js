// pages/api/store/list.js
// GET /api/store/list - Returns all active stores (V1.0 Spec)

import { getAllStores } from '../../../models/Store';
import { handleError } from '../../../lib/errors';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    // V1.0 Spec: Return all active stores
    const stores = await getAllStores({ 
      status: 'ACTIVE',
      isActive: true // Backward compatibility
    });
    
    // Format response
    const formattedStores = stores.map(store => ({
      id: store._id.toString(),
      code: store.code,
      name: store.name,
      city: store.city || null,
      address: store.address || null,
      qrCodeUrl: store.qrCodeUrl || null,
      status: store.status || (store.isActive ? 'ACTIVE' : 'INACTIVE')
    }));

    return res.status(200).json({
      success: true,
      stores: formattedStores
    });
  } catch (error) {
    console.error('Store list error:', error);
    return handleError(error, res);
  }
}

