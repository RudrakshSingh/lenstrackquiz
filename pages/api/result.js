// pages/api/result.js
import { getCustomerById } from "../../models/Customer";
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Missing id" });
    }

    // Try to find customer by submissionId (UUID) or ObjectId (_id)
    let customer;
    try {
      const { getCustomerCollection } = await import('../../models/Customer');
      const collection = await getCustomerCollection();
      
      // First try finding by submissionId (UUID string)
      customer = await collection.findOne({ submissionId: id });
      
      // If not found by submissionId, try as ObjectId
      if (!customer) {
        try {
          const objectId = new ObjectId(id);
          customer = await getCustomerById(objectId);
        } catch (objectIdError) {
          // ObjectId conversion failed, customer not found
          customer = null;
        }
      }
    } catch (dbError) {
      console.error("Database error in result API:", dbError);
      // If MongoDB connection fails, return a helpful error
      return res.status(500).json({
        success: false,
        error: "Database connection error. Please check MongoDB configuration.",
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, error: "Submission not found. The ID may be invalid or the data may not have been saved." });
    }

    // Format response to match expected structure (V1.0 Spec - All Fields)
    const data = {
      user: {
        name: customer.name,
        number: customer.number,
        email: customer.email || '',
        sph: customer.power?.right?.sph || customer.power?.left?.sph || customer.sph || null,
        cyl: customer.power?.right?.cyl || customer.power?.left?.cyl || customer.cyl || null,
        rightSph: customer.power?.right?.sph || null,
        rightCyl: customer.power?.right?.cyl || null,
        rightAxis: customer.power?.right?.axis || null,
        leftSph: customer.power?.left?.sph || null,
        leftCyl: customer.power?.left?.cyl || null,
        leftAxis: customer.power?.left?.axis || null,
        add: customer.add || null,
        pd: customer.pd || null,
        frameType: customer.frame?.type || customer.frameType || null,
        frameBrand: customer.frame?.brand || null,
        frameSubCategory: customer.frame?.subCategory || null,
        frameMRP: customer.frame?.mrp || null,
        frameMaterial: customer.frame?.material || null,
        salesMode: customer.salesMode || 'SELF_SERVICE',
        salespersonName: customer.salespersonName || null
      },
      answers: customer.answers || {},
      recommendation: customer.recommendation || {}
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Result API error:", err);
    console.error("Error stack:", err.stack);
    return res
      .status(500)
      .json({ 
        success: false, 
        error: "Internal server error: " + (err.message || 'Unknown error'),
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
  }
}
