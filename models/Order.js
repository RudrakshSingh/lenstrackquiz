// models/Order.js
// MongoDB model for Order (V1.0 Spec)

import { ObjectId } from 'mongodb';
import { getDatabase } from '../lib/mongodb';

export const SalesMode = {
  SELF_SERVICE: 'SELF_SERVICE',
  STAFF_ASSISTED: 'STAFF_ASSISTED'
};

export const OrderStatus = {
  DRAFT: 'DRAFT',
  CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED',
  STORE_ACCEPTED: 'STORE_ACCEPTED',
  PRINTED: 'PRINTED',
  PUSHED_TO_LAB: 'PUSHED_TO_LAB'
};

export async function getOrderCollection() {
  const db = await getDatabase('lensquiz');
  return db.collection('orders');
}

export async function createOrder(orderData) {
  try {
    // Validate required fields
    if (!orderData.storeId || !orderData.salesMode || orderData.finalPrice === undefined) {
      throw new Error('storeId, salesMode, and finalPrice are required');
    }
    
    // V1.0 Spec: Validation rules
    if (orderData.salesMode === SalesMode.STAFF_ASSISTED && !orderData.assistedByStaffId) {
      throw new Error('assistedByStaffId is required for STAFF_ASSISTED mode');
    }
    
    const collection = await getOrderCollection();
    const now = new Date();
    
    // Convert storeId to ObjectId
    let storeId;
    try {
      storeId = typeof orderData.storeId === 'string' 
        ? new ObjectId(orderData.storeId) 
        : orderData.storeId;
    } catch (error) {
      throw new Error(`Invalid storeId format: ${orderData.storeId}`);
    }
    
    // Convert assistedByStaffId to ObjectId if present
    let assistedByStaffId = null;
    if (orderData.assistedByStaffId) {
      try {
        assistedByStaffId = typeof orderData.assistedByStaffId === 'string' 
          ? new ObjectId(orderData.assistedByStaffId) 
          : orderData.assistedByStaffId;
      } catch (error) {
        throw new Error(`Invalid assistedByStaffId format: ${orderData.assistedByStaffId}`);
      }
    }
    
    const order = {
      storeId: storeId,
      salesMode: orderData.salesMode, // SELF_SERVICE | STAFF_ASSISTED
      assistedByStaffId: assistedByStaffId || null, // FK (optional)
      assistedByName: orderData.assistedByName || null, // free text (optional)
      customerName: orderData.customerName || null,
      customerPhone: orderData.customerPhone || null,
      frameData: orderData.frameData || {},
      lensData: orderData.lensData || {},
      offerData: orderData.offerData || {},
      finalPrice: typeof orderData.finalPrice === 'number' ? orderData.finalPrice : parseFloat(orderData.finalPrice),
      status: OrderStatus.DRAFT, // Initial status
      createdAt: now,
      updatedAt: now
    };
    
    const result = await collection.insertOne(order);
    return { ...order, _id: result.insertedId };
  } catch (error) {
    console.error('createOrder error:', error);
    throw error;
  }
}

export async function getOrderById(id) {
  try {
    if (!id) return null;
    const collection = await getOrderCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return await collection.findOne({ _id: objectId });
  } catch (error) {
    console.error('getOrderById error:', error);
    return null;
  }
}

export async function getOrdersByStore(storeId, filter = {}) {
  try {
    if (!storeId) return [];
    const collection = await getOrderCollection();
    const objectId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
    const query = { storeId: objectId, ...filter };
    return await collection.find(query).sort({ createdAt: -1 }).toArray();
  } catch (error) {
    console.error('getOrdersByStore error:', error);
    return [];
  }
}

export async function getAllOrders(filter = {}) {
  const collection = await getOrderCollection();
  // Convert storeId to ObjectId if present
  if (filter.storeId && typeof filter.storeId === 'string') {
    filter.storeId = new ObjectId(filter.storeId);
  }
  return await collection.find(filter).sort({ createdAt: -1 }).toArray();
}

export async function updateOrderStatus(id, newStatus) {
  try {
    if (!Object.values(OrderStatus).includes(newStatus)) {
      throw new Error(`Invalid order status: ${newStatus}`);
    }
    
    const collection = await getOrderCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $set: { 
          status: newStatus,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result.value;
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    throw error;
  }
}

export async function updateOrder(id, updateData) {
  try {
    const collection = await getOrderCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const update = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Don't allow updating storeId or _id
    delete update.storeId;
    delete update._id;
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: 'after' }
    );
    
    return result.value;
  } catch (error) {
    console.error('updateOrder error:', error);
    throw error;
  }
}

// V1.0 Spec: Order lifecycle methods
export async function confirmOrder(id) {
  return await updateOrderStatus(id, OrderStatus.CUSTOMER_CONFIRMED);
}

export async function acceptOrderByStore(id) {
  return await updateOrderStatus(id, OrderStatus.STORE_ACCEPTED);
}

export async function printOrder(id) {
  return await updateOrderStatus(id, OrderStatus.PRINTED);
}

export async function pushOrderToLab(id) {
  return await updateOrderStatus(id, OrderStatus.PUSHED_TO_LAB);
}

// V1.0 Spec: Dashboard statistics
export async function getOrderStatistics(storeId, dateRange = {}) {
  try {
    const collection = await getOrderCollection();
    const objectId = typeof storeId === 'string' ? new ObjectId(storeId) : storeId;
    
    const query = { storeId: objectId };
    
    // Add date range if provided
    if (dateRange.startDate || dateRange.endDate) {
      query.createdAt = {};
      if (dateRange.startDate) {
        query.createdAt.$gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        query.createdAt.$lte = new Date(dateRange.endDate);
      }
    }
    
    const orders = await collection.find(query).toArray();
    
    const stats = {
      total: orders.length,
      byStatus: {},
      bySalesMode: {
        SELF_SERVICE: 0,
        STAFF_ASSISTED: 0
      },
      totalRevenue: 0
    };
    
    orders.forEach(order => {
      // Count by status
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      
      // Count by sales mode
      if (order.salesMode) {
        stats.bySalesMode[order.salesMode] = (stats.bySalesMode[order.salesMode] || 0) + 1;
      }
      
      // Sum revenue
      stats.totalRevenue += order.finalPrice || 0;
    });
    
    return stats;
  } catch (error) {
    console.error('getOrderStatistics error:', error);
    return {
      total: 0,
      byStatus: {},
      bySalesMode: { SELF_SERVICE: 0, STAFF_ASSISTED: 0 },
      totalRevenue: 0
    };
  }
}

