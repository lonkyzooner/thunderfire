// Optimized serverless function for magic link token verification
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

// Cache MongoDB connection
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  const db = client.db('lark');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      sub: user._id.toString(),
      email: user.email,
      tier: user.subscriptionTier
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'lark-auth',
      audience: 'lark-users'
    }
  );
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const { db } = await connectToDatabase();
    const users = db.collection('users');
    
    // Find user with this token that hasn't expired
    const user = await users.findOne({ 
      magicLinkToken: token,
      magicLinkExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    // Clear the magic link token and update last login
    await users.updateOne(
      { _id: user._id },
      { 
        $unset: { 
          magicLinkToken: 1,
          magicLinkExpiry: 1 
        },
        $set: { 
          lastLogin: new Date() 
        }
      }
    );
    
    // Generate JWT
    const authToken = generateToken(user);
    
    // Return user info and token
    return res.status(200).json({
      success: true,
      token: authToken,
      user: {
        sub: user._id.toString(),
        email: user.email,
        name: user.name || null,
        departmentId: user.departmentId || null,
        badgeNumber: user.badgeNumber || null,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        features: user.features || [],
        apiQuota: user.apiQuota || { total: 10, used: 0 },
        lastLogin: new Date(),
        metadata: user.metadata || {}
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Handle specific error types
    if (error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        success: false, 
        error: 'Database temporarily unavailable' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to verify token' 
    });
  }
}
