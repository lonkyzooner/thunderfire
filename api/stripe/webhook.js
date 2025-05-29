// Optimized serverless function for Stripe webhooks
import Stripe from 'stripe';
import { MongoClient, ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

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

// Subscription tier mapping
const SUBSCRIPTION_TIERS = {
  [process.env.STRIPE_PRICE_STANDARD_MONTHLY]: {
    tier: 'standard',
    features: ['miranda_rights', 'advanced_statutes', 'voice_activation', 'threat_detection', 'multilingual', 'tactical_feedback'],
    apiQuota: 500
  },
  [process.env.STRIPE_PRICE_STANDARD_ANNUAL]: {
    tier: 'standard',
    features: ['miranda_rights', 'advanced_statutes', 'voice_activation', 'threat_detection', 'multilingual', 'tactical_feedback'],
    apiQuota: 500
  },
  [process.env.STRIPE_PRICE_PREMIUM_MONTHLY]: {
    tier: 'premium',
    features: ['miranda_rights', 'advanced_statutes', 'voice_activation', 'threat_detection', 'multilingual', 'tactical_feedback', 'training_mode', 'analytics', 'department_integrations'],
    apiQuota: 2000
  },
  [process.env.STRIPE_PRICE_PREMIUM_ANNUAL]: {
    tier: 'premium',
    features: ['miranda_rights', 'advanced_statutes', 'voice_activation', 'threat_detection', 'multilingual', 'tactical_feedback', 'training_mode', 'analytics', 'department_integrations'],
    apiQuota: 2000
  },
  [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY]: {
    tier: 'enterprise',
    features: ['miranda_rights', 'advanced_statutes', 'voice_activation', 'threat_detection', 'multilingual', 'tactical_feedback', 'training_mode', 'analytics', 'department_integrations', 'custom_solutions', 'dedicated_support'],
    apiQuota: -1 // Unlimited
  },
  [process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL]: {
    tier: 'enterprise',
    features: ['miranda_rights', 'advanced_statutes', 'voice_activation', 'threat_detection', 'multilingual', 'tactical_feedback', 'training_mode', 'analytics', 'department_integrations', 'custom_solutions', 'dedicated_support'],
    apiQuota: -1 // Unlimited
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return res.status(400).json({ error: 'Missing webhook configuration' });
  }

  let event;

  try {
    // Get raw body for Stripe signature verification
    const body = req.rawBody || req.body;
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Stripe webhook event:', event.type);

  try {
    const { db } = await connectToDatabase();
    const users = db.collection('users');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!subscriptionId) {
          console.log('No subscription ID in checkout session');
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;

        if (!priceId) {
          console.error('No price ID found in subscription');
          break;
        }

        // Get subscription configuration
        const subscriptionConfig = SUBSCRIPTION_TIERS[priceId] || {
          tier: 'basic',
          features: ['miranda_rights', 'basic_statutes', 'voice_activation'],
          apiQuota: 100
        };

        // Update user subscription
        const updateResult = await users.updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionTier: subscriptionConfig.tier,
              subscriptionStatus: 'active',
              stripeSubscriptionId: subscriptionId,
              features: subscriptionConfig.features,
              'apiQuota.total': subscriptionConfig.apiQuota,
              'apiQuota.reset': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            }
          }
        );

        console.log(`Updated subscription for customer ${customerId}:`, updateResult.modifiedCount > 0 ? 'success' : 'no changes');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;

        // Map Stripe status to our status
        const subscriptionStatus = 
          status === 'active' ? 'active' :
          status === 'trialing' ? 'trial' :
          status === 'past_due' ? 'past_due' :
          status === 'canceled' ? 'canceled' :
          'inactive';

        const updateResult = await users.updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionStatus,
              updatedAt: new Date()
            }
          }
        );

        console.log(`Updated subscription status for customer ${customerId} to ${subscriptionStatus}:`, updateResult.modifiedCount > 0 ? 'success' : 'no changes');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Downgrade to free tier
        const updateResult = await users.updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled',
              features: ['miranda_rights', 'basic_statutes'],
              'apiQuota.total': 10,
              'apiQuota.reset': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            },
            $unset: {
              stripeSubscriptionId: 1
            }
          }
        );

        console.log(`Downgraded subscription for customer ${customerId}:`, updateResult.modifiedCount > 0 ? 'success' : 'no changes');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Mark subscription as past due
        const updateResult = await users.updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscriptionStatus: 'past_due',
              updatedAt: new Date()
            }
          }
        );

        console.log(`Marked subscription as past due for customer ${customerId}:`, updateResult.modifiedCount > 0 ? 'success' : 'no changes');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Configure to receive raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
