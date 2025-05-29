// Optimized serverless function for magic link generation
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Cache MongoDB connection to avoid cold starts
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 1, // Optimize for serverless
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  const db = client.db('lark');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Optimized email transporter with connection pooling disabled
const getTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    pool: false, // Disable connection pooling for serverless
    maxConnections: 1,
  });
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
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    const { db } = await connectToDatabase();
    const users = db.collection('users');
    
    // Find or create user
    let user = await users.findOne({ email });
    
    if (!user) {
      // Create new user with free tier
      const newUser = {
        email,
        subscriptionTier: 'free',
        subscriptionStatus: 'inactive',
        features: ['miranda_rights', 'basic_statutes'],
        apiQuota: {
          total: 10,
          used: 0,
          reset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        createdAt: new Date(),
        lastLogin: null
      };
      
      const result = await users.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }
    
    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15); // 15 minutes expiry
    
    // Save token to user
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          magicLinkToken: token,
          magicLinkExpiry: expiry 
        }
      }
    );
    
    // Get origin from request headers
    const origin = req.headers.origin || 
                  req.headers.referer?.replace(/\/$/, '') || 
                  process.env.FRONTEND_URL || 
                  'https://lark-ai.vercel.app';
    
    // Send magic link email
    const magicLink = `${origin}/login?token=${token}`;
    
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@lark-ai.app',
      to: email,
      subject: 'Your LARK Login Link',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; border-radius: 12px; overflow: hidden;">
          <div style="padding: 40px 32px; text-align: center;">
            <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700;">LARK</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Law Enforcement Assistance and Response Kit</p>
          </div>
          <div style="background: white; color: #1f2937; padding: 32px;">
            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
              Click the button below to securely sign in to your LARK account:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);">
                Sign In to LARK
              </a>
            </div>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                🔒 This link will expire in 15 minutes and can only be used once for security.
              </p>
            </div>
            <p style="margin: 0; font-size: 14px; color: #9ca3af;">
              If you didn't request this link, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    });
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Magic link error:', error);
    
    // Return appropriate error without exposing internal details
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        success: false, 
        error: 'Email service temporarily unavailable' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send magic link' 
    });
  }
}
