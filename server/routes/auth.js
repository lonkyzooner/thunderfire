/**
 * Auth API routes for multi-tenant LARK backend.
 * - Login (returns JWT with orgId, userId, role)
 * - Register (admin creates new users under their orgId)
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

const { requireAdmin } = require('../middleware/auth');

// TODO: Replace with your user model and secure password handling
const User = require('../src/database/models/User');
const Org = require('../src/database/models/Org');

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  // Require orgId in login request for multi-tenancy
  const { orgId } = req.body;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  const user = await User.findOne({ orgId, email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Issue JWT with orgId, userId, role
  const token = jwt.sign(
    { orgId: user.orgId, userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({ token, user: { orgId: user.orgId, userId: user._id, role: user.role, email: user.email } });
});

// Register endpoint (admin only)
router.post('/register', requireAdmin, async (req, res) => {
  // orgId is set by requireAdmin middleware from JWT
  const orgId = req.orgId;
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }
  // Check if user already exists
  const existing = await User.findOne({ orgId, email });
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ orgId, email, password: hashedPassword, role });
  await user.save();
  res.status(201).json({ user: { orgId, email, role } });
});
// Public registration endpoint for self-service signup
router.post('/register-public', async (req, res) => {
  try {
    const { name, email, password, department, rank, inviteCode, plan } = req.body;
    if (!name || !email || !password || !department || !rank) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Basic email format check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    let org;
    if (inviteCode) {
      org = await Org.findOne({ inviteCode });
      if (!org) {
        return res.status(400).json({ error: 'Invalid invite code' });
      }
    } else {
      // Generate a unique invite code
      function generateInviteCode(length = 8) {
        return Math.random().toString(36).substr(2, length).toUpperCase();
      }
      const newInviteCode = generateInviteCode();
      // Ensure org name is unique
      const existingOrg = await Org.findOne({ name: department });
      if (existingOrg) {
        return res.status(409).json({ error: 'Organization name already exists' });
      }
      org = new Org({ name: department, inviteCode: newInviteCode });
      await org.save();
    }

    // Check for existing user in org
    const existingUser = await User.findOne({ orgId: org._id.toString(), email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists in this organization' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      orgId: org._id.toString(),
      name,
      email,
      password: hashedPassword,
      rank,
      role: "officer", // Default role for self-signup
      // plan is not in User schema, but could be handled elsewhere
    });
    await user.save();

    // Issue JWT
    const token = jwt.sign(
      { orgId: org._id.toString(), userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(201).json({
      token,
      user: {
        orgId: org._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        rank: user.rank,
        role: user.role
      },
      org: {
        orgId: org._id.toString(),
        name: org.name,
        inviteCode: org.inviteCode
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

module.exports = router;
