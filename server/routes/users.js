/**
 * User routes for LARK
 * Handles user profile retrieval and updates
 */

const express = require('express');
const router = express.Router();

// Import models
const User = require('../../src/database/models/User');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        departmentId: user.departmentId,
        badgeNumber: user.badgeNumber,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        features: user.features,
        apiQuota: user.apiQuota,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Only allow specific fields to be updated
    const allowedUpdates = {
      name: updates.name,
      departmentId: updates.departmentId,
      badgeNumber: updates.badgeNumber,
      settings: updates.settings
    };
    
    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      allowedUpdates,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        departmentId: user.departmentId,
        badgeNumber: user.badgeNumber,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        features: user.features
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
