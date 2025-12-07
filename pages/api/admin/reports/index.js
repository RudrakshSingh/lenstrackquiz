// pages/api/admin/reports/index.js
// Reporting and analytics endpoints

import { withAuth } from '../../../../middleware/auth';
import { getAllSessions } from '../../../../models/Session';
import { getSessionRecommendationsBySession } from '../../../../models/SessionRecommendation';
import { getAllStores } from '../../../../models/Store';
import { getAllUsers } from '../../../../models/User';
import { getAllProducts } from '../../../../models/Product';
import { getAllQuestions } from '../../../../models/Question';
import { getAllCustomers } from '../../../../models/Customer';
import { handleError } from '../../../../lib/errors';
import { ObjectId } from 'mongodb';

async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }

    const { type, startDate, endDate, storeId, userId } = req.query;
    const user = req.user;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Build session filter - sessions may not have organizationId, so we'll filter by storeId/userId
    const sessionFilter = {};
    if (storeId) sessionFilter.storeId = storeId;
    if (userId) sessionFilter.userId = userId;
    if (Object.keys(dateFilter).length > 0) {
      sessionFilter.startedAt = dateFilter;
    }

    // Role-based filtering
    if (user.role === 'STORE_MANAGER' && user.storeId) {
      sessionFilter.storeId = user.storeId;
    } else if (user.role === 'SALES_EXECUTIVE') {
      sessionFilter.userId = user._id;
    }

    // Get all sessions (both new sessions and old customers)
    const allSessions = await getAllSessions(sessionFilter);
    
    // Also get old customer data for backward compatibility
    const allCustomers = await getAllCustomers({});

    switch (type) {
      case 'overview':
        return getOverviewReport(allSessions, allCustomers, user, res);
      case 'store':
        return getStoreReport(allSessions, res);
      case 'conversion':
        return getConversionReport(allSessions, res);
      default:
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid report type' }
        });
    }
  } catch (error) {
    return handleError(error, res);
  }
}

async function getOverviewReport(sessions, customers, user, res) {
  // Combine sessions and customers for total count
  const totalSessionsCount = sessions.length + customers.length;
  const completed = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'CONVERTED');
  const converted = sessions.filter(s => s.status === 'CONVERTED');
  const abandoned = sessions.filter(s => s.status === 'ABANDONED');
  
  // Count customers with recommendations as completed
  // recommendation can be an object or array, so check both
  const customersWithRecommendations = customers.filter(c => {
    if (!c.recommendation) return false;
    if (Array.isArray(c.recommendation)) return c.recommendation.length > 0;
    return Object.keys(c.recommendation).length > 0;
  });
  const customersWithSelectedLens = customers.filter(c => c.selectedLensId);

  // Get counts for stores, users, products, questions
  const orgId = user.organizationId ? (typeof user.organizationId === 'string' ? new ObjectId(user.organizationId) : user.organizationId) : null;
  const storeFilter = orgId ? { organizationId: orgId } : {};
  const userFilter = orgId ? { organizationId: orgId } : {};
  const productFilter = orgId ? { organizationId: orgId } : {};
  const questionFilter = orgId ? { organizationId: orgId } : {};

  // Get lens products count (new API)
  const { getAllLensProducts } = await import('../../../../models/LensProduct');
  const { getAllQuestionsNew } = await import('../../../../models/QuestionNew');

  const [stores, users, products, questions, lensProducts, questionsNew] = await Promise.all([
    getAllStores(storeFilter),
    getAllUsers(userFilter),
    getAllProducts(productFilter),
    getAllQuestions(questionFilter),
    getAllLensProducts({}), // Get all lens products
    getAllQuestionsNew({}) // Get new questions
  ]);
  
  // Combine products count (old products + new lens products)
  const totalProductsCount = products.length + lensProducts.length;
  const totalQuestionsCount = questions.length + questionsNew.length;

  // Get recent sessions (last 10) with populated store and staff names
  const recentSessionsData = sessions.slice(0, 10);
  const recentSessions = await Promise.all(recentSessionsData.map(async (session) => {
    let storeName = 'Unknown Store';
    let staffName = 'Unknown Staff';
    
    if (session.storeId) {
      try {
        const { getStoreById } = await import('../../../../models/Store');
        const store = await getStoreById(session.storeId);
        if (store) storeName = store.name;
      } catch (e) {
        console.error('Error fetching store:', e);
      }
    }
    
    if (session.userId) {
      try {
        const { getUserById } = await import('../../../../models/User');
        const user = await getUserById(session.userId);
        if (user) staffName = user.name || user.email || 'Unknown';
      } catch (e) {
        console.error('Error fetching user:', e);
      }
    }
    
    return {
      _id: session._id,
      customerName: session.customerName || 'Unknown',
      storeName: storeName,
      staffName: staffName,
      status: session.status || 'IN_PROGRESS',
      createdAt: session.startedAt || session.createdAt || new Date()
    };
  }));
  
  // Also add recent customers to recent sessions
  const recentCustomers = customers.slice(0, 5).map(customer => ({
    _id: customer._id,
    customerName: customer.name || 'Unknown',
    storeName: 'Legacy Data',
    staffName: 'N/A',
    status: customer.selectedLensId ? 'CONVERTED' : (customer.recommendation && (Array.isArray(customer.recommendation) ? customer.recommendation.length > 0 : Object.keys(customer.recommendation).length > 0)) ? 'COMPLETED' : 'IN_PROGRESS',
    createdAt: customer.createdAt || new Date()
  }));
  
  // Combine and sort by date
  const allRecentSessions = [...recentSessions, ...recentCustomers]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // Calculate average duration
  let totalDuration = 0;
  let durationCount = 0;
  completed.forEach(s => {
    if (s.completedAt && s.startedAt) {
      const duration = (new Date(s.completedAt) - new Date(s.startedAt)) / 1000 / 60;
      totalDuration += duration;
      durationCount++;
    }
  });

  // Daily trend (simplified - would need proper aggregation in production)
  const dailyTrend = {};
  sessions.forEach(s => {
    const date = new Date(s.startedAt || s.createdAt).toISOString().split('T')[0];
    if (!dailyTrend[date]) {
      dailyTrend[date] = { sessions: 0, completed: 0, converted: 0 };
    }
    dailyTrend[date].sessions++;
    if (s.status === 'COMPLETED' || s.status === 'CONVERTED') {
      dailyTrend[date].completed++;
    }
    if (s.status === 'CONVERTED') {
      dailyTrend[date].converted++;
    }
  });

  // Add customer data to daily trend
  customers.forEach(c => {
    const date = new Date(c.createdAt).toISOString().split('T')[0];
    if (!dailyTrend[date]) {
      dailyTrend[date] = { sessions: 0, completed: 0, converted: 0 };
    }
    dailyTrend[date].sessions++;
    if (c.recommendation && (Array.isArray(c.recommendation) ? c.recommendation.length > 0 : Object.keys(c.recommendation).length > 0)) {
      dailyTrend[date].completed++;
    }
    if (c.selectedLensId) {
      dailyTrend[date].converted++;
    }
  });

  const totalCompleted = completed.length + customersWithRecommendations.length;
  const totalConverted = converted.length + customersWithSelectedLens.length;

  return res.status(200).json({
    success: true,
    data: {
      stats: {
        totalSessions: totalSessionsCount,
        completedSessions: totalCompleted,
        convertedSessions: totalConverted,
        abandonedSessions: abandoned.length,
        totalStores: stores.length,
        totalUsers: users.length,
        totalProducts: totalProductsCount,
        totalQuestions: totalQuestionsCount,
        completionRate: totalSessionsCount > 0 ? (totalCompleted / totalSessionsCount) * 100 : 0,
        conversionRate: totalCompleted > 0 ? (totalConverted / totalCompleted) * 100 : 0,
        averageDuration: durationCount > 0 ? Math.round((totalDuration / durationCount) * 10) / 10 : 0
      },
      recentSessions: allRecentSessions,
      dailyTrend: Object.entries(dailyTrend).map(([date, data]) => ({
        date,
        sessions: data.sessions,
        completed: data.completed,
        converted: data.converted
      }))
    }
  });
}

async function getStoreReport(sessions, res) {
  const { getAllStores } = await import('../../../../models/Store');
  const stores = await getAllStores({ organizationId: sessions[0]?.organizationId });

  const storeStats = await Promise.all(stores.map(async (store) => {
    const storeSessions = sessions.filter(s => s.storeId?.toString() === store._id.toString());
    const completed = storeSessions.filter(s => s.status === 'COMPLETED' || s.status === 'CONVERTED');
    const converted = storeSessions.filter(s => s.status === 'CONVERTED');

    return {
      storeId: store._id.toString(),
      storeName: store.name,
      totalSessions: storeSessions.length,
      completedSessions: completed.length,
      convertedSessions: converted.length,
      completionRate: storeSessions.length > 0 ? (completed.length / storeSessions.length) * 100 : 0,
      conversionRate: completed.length > 0 ? (converted.length / completed.length) * 100 : 0
    };
  }));

  return res.status(200).json({
    success: true,
    data: { stores: storeStats }
  });
}

async function getConversionReport(sessions, res) {
  const started = sessions.length;
  const completed = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'CONVERTED');
  const converted = sessions.filter(s => s.status === 'CONVERTED');

  // Get sessions that viewed recommendations
  let viewedRecommendations = 0;
  for (const session of completed) {
    const recommendations = await getSessionRecommendationsBySession(session._id);
    if (recommendations.length > 0) {
      viewedRecommendations++;
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      funnel: [
        { stage: 'Started', count: started, percentage: 100 },
        { stage: 'Completed', count: completed.length, percentage: started > 0 ? (completed.length / started) * 100 : 0 },
        { stage: 'Viewed Recommendations', count: viewedRecommendations, percentage: started > 0 ? (viewedRecommendations / started) * 100 : 0 },
        { stage: 'Selected Product', count: converted.length, percentage: started > 0 ? (converted.length / started) * 100 : 0 }
      ],
      abandonmentByQuestion: [] // Would need to track this separately
    }
  });
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER');

