import connectDB from '../../src/database/connection';
import User from '../../src/database/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectDB();

  try {
    const { email, password, orgId } = req.body;
    if (!email || !password || !orgId) {
      return res.status(400).json({ error: 'Email, password, and orgId are required' });
    }

    const user = await User.findOne({ orgId, email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { orgId: user.orgId, userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(200).json({
      token,
      user: {
        orgId: user.orgId,
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        rank: user.rank,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
}