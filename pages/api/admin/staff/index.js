// pages/api/admin/staff/index.js
// Staff management endpoints (V1.0 Spec)

import { ObjectId } from 'mongodb';
import { withAuth, authorize } from '../../../../middleware/auth';
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff } from '../../../../models/Staff';
import { getStoreById } from '../../../../models/Store';
import { handleError } from '../../../../lib/errors';

// GET /api/admin/staff - List staff
async function listStaff(req, res) {
  try {
    const { storeId, status } = req.query;
    const user = req.user || {};

    const filter = {};
    if (storeId) {
      try {
        filter.storeId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid storeId format' }
        });
      }
    }
    if (status) filter.status = status;

    // Filter by organization if user is authenticated
    // For SUPER_ADMIN and ADMIN, show all staff (no organization filter)
    if (user.organizationId && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      // Get stores for this organization first
      const { getAllStores } = await import('../../../../models/Store');
      const stores = await getAllStores({ organizationId: user.organizationId });
      const storeIds = stores.map(s => s._id);
      console.log('Staff list - organization stores:', storeIds.length, storeIds.map(id => id.toString()));
      if (storeIds.length > 0) {
        if (filter.storeId) {
          // If storeId is already set, check if it's in the organization's stores
          if (!storeIds.some(id => id.toString() === filter.storeId.toString())) {
            return res.status(200).json({
              success: true,
              data: { staff: [] }
            });
          }
        } else {
          filter.storeId = { $in: storeIds };
        }
      } else {
        // No stores for this organization
        return res.status(200).json({
          success: true,
          data: { staff: [] }
        });
      }
    }
    
    console.log('Staff list filter:', JSON.stringify(filter, null, 2));
    console.log('Staff list - user:', { id: user._id?.toString(), role: user.role, organizationId: user.organizationId?.toString() });

    const staff = await getAllStaff(filter);
    console.log('Staff found:', staff.length, staff.map(s => ({ id: s._id?.toString(), name: s.name, storeId: s.storeId?.toString(), status: s.status })));

    // Enrich with store names
    const staffWithStores = await Promise.all(staff.map(async (member) => {
      const store = await getStoreById(member.storeId);
      return {
        id: member._id.toString(),
        storeId: member.storeId.toString(),
        storeName: store?.name || 'Unknown',
        name: member.name,
        phone: member.phone || null,
        role: member.role,
        status: member.status,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
      };
    }));

    return res.status(200).json({
      success: true,
      data: {
        staff: staffWithStores
      }
    });
  } catch (error) {
    console.error('List staff error:', error);
    return handleError(error, res);
  }
}

// POST /api/admin/staff - Create staff
async function createStaffHandler(req, res) {
  try {
    await authorize(req, ['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER']);
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
    });
  }

  try {
    const { storeId, name, phone, role, status } = req.body;

    if (!storeId || !name || !role) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'storeId, name, and role are required' }
      });
    }

    // Validate role
    const validRoles = ['STORE_MANAGER', 'NC', 'JR', 'OPTOMETRIST', 'SALES'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` }
      });
    }

    const staff = await createStaff({
      storeId,
      name,
      phone: phone || null,
      role,
      status: status || 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: staff._id.toString(),
        storeId: staff.storeId.toString(),
        name: staff.name,
        phone: staff.phone || null,
        role: staff.role,
        status: staff.status
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return listStaff(req, res);
  } else if (req.method === 'POST') {
    return createStaffHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default withAuth(handler);

