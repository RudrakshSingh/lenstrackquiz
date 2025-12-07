// pages/api/admin/stores/[id]/stats.js
// Get store statistics

import { withAuth } from '../../../../../middleware/auth';
import { getStoreById } from '../../../../../models/Store';
import { getAllSessions } from '../../../../../models/Session';
import { getAllUsers } from '../../../../../models/User';
import { handleError, NotFoundError } from '../../../../../lib/errors';
import { getSessionRecommendationsBySession } from '../../../../../models/SessionRecommendation';

async function handler(req, res) {
  try {
    const { id } = req.query;
    const user = req.user;

    const store = await getStoreById(id);
    if (!store) {
      throw new NotFoundError('Store not found');
    }

    // Get all sessions for this store
    const allSessions = await getAllSessions({ storeId: store._id });
    const completedSessions = allSessions.filter(s => s.status === 'COMPLETED' || s.status === 'CONVERTED');
    const convertedSessions = allSessions.filter(s => s.status === 'CONVERTED');
    const inProgressSessions = allSessions.filter(s => s.status === 'IN_PROGRESS');

    // Calculate average session duration
    let totalDuration = 0;
    let durationCount = 0;
    completedSessions.forEach(session => {
      if (session.completedAt && session.startedAt) {
        const duration = (new Date(session.completedAt) - new Date(session.startedAt)) / 1000 / 60; // minutes
        totalDuration += duration;
        durationCount++;
      }
    });
    const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    // Get top products
    const productCounts = {};
    for (const session of convertedSessions) {
      const recommendations = await getSessionRecommendationsBySession(session._id);
      const selected = recommendations.find(r => r.isSelected);
      if (selected) {
        const productId = selected.productId.toString();
        productCounts[productId] = (productCounts[productId] || 0) + 1;
      }
    }
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, count]) => ({ productId, count }));

    // Get staff performance
    const staff = await getAllUsers({ storeId: store._id, isActive: true });
    const staffPerformance = await Promise.all(staff.map(async (member) => {
      const memberSessions = await getAllSessions({ 
        storeId: store._id, 
        userId: member._id 
      });
      const memberCompleted = memberSessions.filter(s => s.status === 'COMPLETED' || s.status === 'CONVERTED');
      const memberConverted = memberSessions.filter(s => s.status === 'CONVERTED');
      
      return {
        userId: member._id.toString(),
        name: member.name,
        email: member.email,
        totalSessions: memberSessions.length,
        completedSessions: memberCompleted.length,
        convertedSessions: memberConverted.length,
        conversionRate: memberCompleted.length > 0 
          ? (memberConverted.length / memberCompleted.length) * 100 
          : 0
      };
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalSessions: allSessions.length,
        completedSessions: completedSessions.length,
        convertedSessions: convertedSessions.length,
        conversionRate: completedSessions.length > 0 
          ? (convertedSessions.length / completedSessions.length) * 100 
          : 0,
        averageSessionDuration: Math.round(averageDuration * 10) / 10,
        topProducts,
        staffPerformance
      }
    });
  } catch (error) {
    return handleError(error, res);
  }
}

export default withAuth(handler, 'SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER');

