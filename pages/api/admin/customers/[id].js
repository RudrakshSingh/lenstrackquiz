// pages/api/admin/customers/[id].js
// Get and update single customer

import { withAuth } from '../../../../middleware/auth';
import { ObjectId } from 'mongodb';
import { getCustomerCollection } from '../../../../models/Customer';
import { getAllStores } from '../../../../models/Store';
import { getAllUsers } from '../../../../models/User';

async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      const collection = await getCustomerCollection();
      
      // Try to find by ObjectId first
      let customer;
      try {
        const objectId = new ObjectId(id);
        customer = await collection.findOne({ _id: objectId });
      } catch (objectIdError) {
        // If ObjectId conversion fails, try finding by submissionId
        customer = await collection.findOne({ submissionId: id });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' }
        });
      }

      // Populate store and salesperson names
      const stores = await getAllStores({});
      const users = await getAllUsers({});
      const store = customer.storeId ? stores.find(s => s._id.toString() === customer.storeId.toString()) : null;
      const salesperson = customer.salespersonId ? users.find(u => u._id.toString() === customer.salespersonId.toString()) : null;

      return res.status(200).json({
        success: true,
        data: {
          id: customer._id?.toString(),
          _id: customer._id?.toString(),
          ...customer,
          storeName: store?.name || null,
          salespersonName: salesperson?.name || salesperson?.email || null,
        }
      });
    } catch (error) {
      console.error('Get customer error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch customer: ' + error.message }
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const collection = await getCustomerCollection();
      
      // Try to find by ObjectId first
      let customer;
      try {
        const objectId = new ObjectId(id);
        customer = await collection.findOne({ _id: objectId });
      } catch (objectIdError) {
        // If ObjectId conversion fails, try finding by submissionId
        customer = await collection.findOne({ submissionId: id });
      }

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' }
        });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };

      // Update customer
      const result = await collection.updateOne(
        { _id: customer._id },
        { $set: updateData }
      );

      if (result.modifiedCount === 0) {
        return res.status(200).json({
          success: true,
          message: 'No changes detected',
          data: customer
        });
      }

      // Fetch updated customer
      const updatedCustomer = await collection.findOne({ _id: customer._id });

      return res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: {
          id: updatedCustomer._id?.toString(),
          _id: updatedCustomer._id?.toString(),
          ...updatedCustomer,
        }
      });
    } catch (error) {
      console.error('Update customer error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update customer: ' + error.message }
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER');


