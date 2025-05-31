import connectDB from '../../src/database/connection';
import Org from '../../src/database/models/Org';
import User from '../../src/database/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectDB();

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
}