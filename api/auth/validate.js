// Optimized serverless function for JWT validation
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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'lark-auth',
        audience: 'lark-users'
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ valid: false, error: 'Token expired' });
      }
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
    
    const { db } = await connectToDatabase();
    const users = db.collection('users');
    
    // Get user from database
    const user = await users.findOne({ _id: decoded.sub });
    
    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }
    
    // Return validated user info
    return res.status(200).json({
      valid: true,
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
        lastLogin: user.lastLogin,
        metadata: user.metadata || {}
      }
    });
    
  } catch (error) {
    console.error('Token validation error:', error);
    
    // Handle specific error types
    if (error.name === 'MongoTimeoutError') {
      return res.status(503).json({ 
        valid: false, 
        error: 'Database temporarily unavailable' 
      });
    }
    
    return res.status(401).json({ 
      valid: false, 
      error: 'Token validation failed' 
    });
  }
}
