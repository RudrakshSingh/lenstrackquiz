// pages/api/admin/products/index.js
// Product management endpoints

import { withAuth, authorize } from '../../../../middleware/auth';
import { CreateProductSchema } from '../../../../lib/validation';
import { createProduct, getAllProducts, getProductBySku } from '../../../../models/Product';
import { createProductFeature } from '../../../../models/ProductFeature';
import { handleError, ConflictError } from '../../../../lib/errors';

// GET /api/admin/products
async function listProducts(req, res) {
  try {
    const { search, category, storeId, isActive, page = 1, limit = 20 } = req.query;
    const user = req.user;

    const filter = {};
    if (user.organizationId) {
      filter.organizationId = user.organizationId;
    }
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await getAllProducts(filter);

    // Get features and store availability
    const productsWithDetails = await Promise.all(products.map(async (product) => {
      const { getProductFeaturesByProduct } = await import('../../../../models/ProductFeature');
      const features = await getProductFeaturesByProduct(product._id);

      let storeProduct = null;
      if (storeId) {
        const { getStoreProduct } = await import('../../../../models/StoreProduct');
        storeProduct = await getStoreProduct(storeId, product._id);
      }

      return {
        id: product._id.toString(),
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
        basePrice: product.basePrice,
        imageUrl: product.imageUrl,
        isActive: product.isActive,
        features,
        storeProduct: storeProduct ? {
          stockQuantity: storeProduct.stockQuantity,
          priceOverride: storeProduct.priceOverride,
          isAvailable: storeProduct.isAvailable
        } : null,
        createdAt: product.createdAt
      };
    }));

    return res.status(200).json({
      success: true,
      data: {
        products: productsWithDetails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: productsWithDetails.length
        }
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

// POST /api/admin/products
async function createProductHandler(req, res) {
  try {
    const user = req.user;
    authorize('SUPER_ADMIN', 'ADMIN')(user);

    // Check if user has organizationId
    if (!user.organizationId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'User must be associated with an organization' }
      });
    }

    // Validate input
    const validationResult = CreateProductSchema.safeParse(req.body);
    if (!validationResult.success) {
      const details = {};
      validationResult.error.errors.forEach(err => {
        const path = err.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(err.message);
      });
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details }
      });
    }

    // Check if SKU already exists
    const existing = await getProductBySku(user.organizationId, validationResult.data.sku);
    if (existing) {
      throw new ConflictError('Product SKU already exists');
    }

    // Create product
    const productData = {
      sku: validationResult.data.sku,
      name: validationResult.data.name,
      category: validationResult.data.category,
      basePrice: validationResult.data.basePrice,
      organizationId: user.organizationId
    };
    
    // Add optional fields only if they exist
    if (validationResult.data.description) {
      productData.description = validationResult.data.description;
    }
    if (validationResult.data.brand) {
      productData.brand = validationResult.data.brand;
    }
    if (validationResult.data.imageUrl) {
      productData.imageUrl = validationResult.data.imageUrl;
    }
    if (validationResult.data.isActive !== undefined) {
      productData.isActive = validationResult.data.isActive;
    }
    
    const product = await createProduct(productData);

    // Create product features
    if (validationResult.data.features && validationResult.data.features.length > 0) {
      for (const featureData of validationResult.data.features) {
        await createProductFeature({
          productId: product._id,
          featureId: featureData.featureId
        });
      }
    }

    // Get product with features
    const { getProductFeaturesByProduct } = await import('../../../../models/ProductFeature');
    const features = await getProductFeaturesByProduct(product._id);

    // Build response object safely
    const responseData = {
      id: product._id.toString(),
      sku: product.sku,
      name: product.name,
      category: product.category,
      basePrice: product.basePrice,
      isActive: product.isActive !== undefined ? product.isActive : true,
      organizationId: product.organizationId ? product.organizationId.toString() : null,
      features: features || []
    };
    
    // Add optional fields only if they exist
    if (product.description) responseData.description = product.description;
    if (product.brand) responseData.brand = product.brand;
    if (product.imageUrl) responseData.imageUrl = product.imageUrl;
    if (product.createdAt) responseData.createdAt = product.createdAt;
    if (product.updatedAt) responseData.updatedAt = product.updatedAt;
    
    return res.status(201).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error in createProductHandler:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Make sure we haven't already sent a response
    if (!res.headersSent) {
      return handleError(error, res);
    } else {
      console.error('Response already sent, cannot send error response');
    }
  }
}

export default withAuth(async function handler(req, res) {
  if (req.method === 'GET') {
    return listProducts(req, res);
  }
  if (req.method === 'POST') {
    return createProductHandler(req, res);
  }
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE');

