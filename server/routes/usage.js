/**
 * Usage tracking routes for LARK
 * Handles logging feature usage and retrieving usage statistics
 */

const express = require('express');
const router = express.Router();

// Import models
const UsageLog = require('../../src/database/models/UsageLog');
const User = require('../../src/database/models/User');

// Track feature usage
router.post('/log', async (req, res) => {
  try {
    const { userId, featureType, details, status } = req.body;
    
    // Create usage log
    const usageLog = new UsageLog({
      userId,
      featureType,
      details,
      status,
      timestamp: new Date()
    });
    
    await usageLog.save();
    
    // Update user's API quota if applicable
    if (featureType === 'api_call') {
      await User.findByIdAndUpdate(userId, {
        $inc: { apiQuota: -1 }
      });
    }
    
    res.status(201).json({ success: true, id: usageLog._id });
  } catch (error) {
    console.error('Error logging usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get usage statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get usage logs for the user
    const usageLogs = await UsageLog.find({ userId }).sort({ createdAt: -1 }).limit(100);
    
    // Aggregate usage by feature type
    const usageByFeature = usageLogs.reduce((acc, log) => {
      const featureType = log.featureType;
      if (!acc[featureType]) {
        acc[featureType] = {
          total: 0,
          success: 0,
          failure: 0,
          partial: 0
        };
      }
      
      acc[featureType].total++;
      acc[featureType][log.status]++;
      
      return acc;
    }, {});
    
    // Get recent logs
    const recentLogs = usageLogs.slice(0, 10).map(log => ({
      id: log._id,
      featureType: log.featureType,
      status: log.status,
      createdAt: log.createdAt,
      details: log.details
    }));
    
    res.json({
      success: true,
      usageByFeature,
      recentLogs,
      totalUsage: usageLogs.length
    });
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
