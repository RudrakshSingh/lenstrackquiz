// pages/api/admin/customers.js
// API endpoint for listing customers

import { withAuth } from '../../../middleware/auth';
import { getAllCustomers } from "../../../models/Customer";
import { getAllStores } from '../../../models/Store';
import { getAllUsers } from '../../../models/User';

async function handler(req, res) {

  if (req.method === 'GET') {
    try {
      const customers = await getAllCustomers();
      
      // Get stores and users for populating names
      const stores = await getAllStores({});
      const users = await getAllUsers({});

      // Convert MongoDB _id to string id for frontend and populate store/salesperson names
      const formattedCustomers = customers.map(customer => {
        const store = customer.storeId ? stores.find(s => s._id.toString() === customer.storeId.toString()) : null;
        const salesperson = customer.salespersonId ? users.find(u => u._id.toString() === customer.salespersonId.toString()) : null;
        
        return {
          id: customer._id?.toString(),
          ...customer,
          _id: customer._id?.toString(),
          storeName: store?.name || 'N/A',
          salespersonName: salesperson?.name || salesperson?.email || 'N/A'
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          customers: formattedCustomers,
          count: formattedCustomers.length
        }
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch customers: ' + error.message }
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
  });
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER');

