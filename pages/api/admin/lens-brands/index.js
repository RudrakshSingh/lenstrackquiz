// pages/api/admin/lens-brands/index.js
// Lens Brand CRUD endpoints (V2 Architecture)

import { withAuth } from '../../../../middleware/auth';
import { createLensBrand, getAllLensBrands, getLensBrandByName } from '../../../../models/LensBrand';
import { getAllLensProducts } from '../../../../models/LensProduct';
import { handleError } from '../../../../lib/errors';

// POST /api/admin/lens-brands
async function createLensBrandHandler(req, res) {
  try {
    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Lens brand name is required' }
      });
    }

    // Check if brand already exists
    const existing = await getLensBrandByName(name);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'RESOURCE_CONFLICT', message: 'Lens brand name already exists' }
      });
    }

    const brand = await createLensBrand({
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      data: {
        id: brand._id.toString(),
        name: brand.name,
        description: brand.description,
        isActive: brand.isActive
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// GET /api/admin/lens-brands
async function listLensBrandsHandler(req, res) {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const brands = await getAllLensBrands(filter);

    return res.status(200).json({
      success: true,
      data: {
        brands: brands.map(b => ({
          id: b._id.toString(),
          name: b.name,
          description: b.description,
          isActive: b.isActive
        }))
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

async function handler(req, res) {
  if (req.method === 'GET') {
    return withAuth(listLensBrandsHandler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER')(req, res);
  }
  if (req.method === 'POST') {
    return withAuth(createLensBrandHandler, 'SUPER_ADMIN', 'ADMIN')(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default handler;

