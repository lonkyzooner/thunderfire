/**
 * Admin API routes for multi-tenant LARK backend.
 * - User management (CRUD for department users)
 * - Feature flag management
 * - Department-wide logs and analytics queries
 * All endpoints require JWT with orgId, userId, and role=admin.
 */

const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../middleware/auth');
const User = require('../../src/database/models/User');
const UsageLog = require('../../src/database/models/UsageLog');

// CRUD: List all users in department
router.get('/users', requireAdmin, (req, res) => {
  User.find({ orgId: req.orgId })
    .then(users => res.json({ users }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// CRUD: Create new user in department
router.post('/users', requireAdmin, (req, res) => {
  const userData = { ...req.body, orgId: req.orgId };
  User.create(userData)
    .then(user => res.status(201).json({ user }))
    .catch(err => res.status(400).json({ error: err.message }));
});

// CRUD: Update user in department
router.put('/users/:userId', requireAdmin, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.params.userId, orgId: req.orgId },
    req.body,
    { new: true }
  )
    .then(user => {
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    })
    .catch(err => res.status(400).json({ error: err.message }));
});

// CRUD: Delete user in department
router.delete('/users/:userId', requireAdmin, (req, res) => {
  User.findOneAndDelete({ _id: req.params.userId, orgId: req.orgId })
    .then(user => {
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(204).send();
    })
    .catch(err => res.status(400).json({ error: err.message }));
});

// Feature flag management
router.post('/features', requireAdmin, (req, res) => {
  // TODO: Set feature flags for department or user
  res.json({ success: true });
});

// Query logs for department
router.get('/logs', requireAdmin, (req, res) => {
  UsageLog.find({ orgId: req.orgId })
    .then(logs => res.json({ logs }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Query analytics for department
router.get('/analytics', requireAdmin, (req, res) => {
  // TODO: Query analytics partitioned by req.orgId
  res.json({ analytics: [] });
});

module.exports = router;