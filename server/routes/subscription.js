const express = require('express');
const router = express.Router();
const { auth } = require('express-oauth2-jwt-bearer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const NodeCache = require('node-cache');

// Cache for subscription plans (1 hour TTL)
const plansCache = new NodeCache({ stdTTL: 3600 });

// Configure Auth0 middleware
const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

// Helper to get Stripe customer ID for a user
const getStripeCustomerId = async (userId) => {
  // This would normally query your database to get the Stripe customer ID
  // For now, we'll create a new customer if one doesn't exist
  
  try {
    // Mock database lookup
    const mockCustomerId = `cus_mock_${userId.replace('|', '_')}`;
    
    // In a real implementation, you would check if the customer exists in your database
    // If not, create a new customer in Stripe and store the ID
    
    return mockCustomerId;
  } catch (error) {
    console.error('Error getting Stripe customer ID:', error);
    throw error;
  }
};

// Define subscription plans
const getSubscriptionPlans = async () => {
  // Check cache first
  const cachedPlans = plansCache.get('subscription_plans');
  if (cachedPlans) {
    return cachedPlans;
  }

  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    const plans = prices.data.map((price) => {
      const product = price.product;
      const metadata = product.metadata || {};

      return {
        id: price.id,
        name: product.name,
        description: product.description || '',
        features: metadata.features ? JSON.parse(metadata.features) : ['Feature details coming soon'],
        price: price.unit_amount ? price.unit_amount / 100 : 0,
        interval: price.recurring?.interval || 'month',
        tier: metadata.tier || price.nickname || 'standard',
        apiQuota: metadata.apiQuota ? parseInt(metadata.apiQuota, 10) : 1000,
        trialDays: metadata.trialDays ? parseInt(metadata.trialDays, 10) : 14,
        metadata
      };
    });

    plansCache.set('subscription_plans', plans);
    return plans;
  } catch (error) {
    console.error('Error fetching plans from Stripe:', error);
    // Fallback: return empty array or cached plans if any
    return cachedPlans || [];
  }
};

// Routes
// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
});

// Get current subscription
router.get('/current', jwtCheck, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const customerId = await getStripeCustomerId(userId);
    
    // In a real implementation, you would fetch the subscription from Stripe
    // For now, we'll use mock data
    const mockSubscription = {
      status: 'active',
      plan: (await getSubscriptionPlans())[1], // Standard plan
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false
    };
    
    res.json(mockSubscription);
  } catch (error) {
    console.error('Error getting current subscription:', error);
    res.status(500).json({ error: 'Failed to get current subscription' });
  }
});

// Create checkout session
const { body, validationResult } = require('express-validator');

router.post(
  '/create-checkout-session',
  jwtCheck,
  [
    body('planId').isString().notEmpty(),
    body('successUrl').isURL(),
    body('cancelUrl').isURL()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { planId, successUrl, cancelUrl } = req.body;
      const userId = req.auth.payload.sub;
      
      // Get customer ID
      const customerId = await getStripeCustomerId(userId);
      
      // In a real implementation, you would create a checkout session with Stripe
      // For now, we'll return a mock session ID
      const mockSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
      
      res.json({ sessionId: mockSessionId });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
);

// Create customer portal session
router.post('/create-portal-session', jwtCheck, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    const userId = req.auth.payload.sub;
    
    // Get customer ID
    const customerId = await getStripeCustomerId(userId);
    
    // In a real implementation, you would create a portal session with Stripe
    // For now, we'll return a mock URL
    const mockPortalUrl = `${returnUrl}?session_id=cs_test_${Math.random().toString(36).substring(2, 15)}`;
    
    res.json({ url: mockPortalUrl });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Cancel subscription
router.post('/cancel', jwtCheck, async (req, res) => {
  try {
    const { atPeriodEnd } = req.body;
    const userId = req.auth.payload.sub;
    
    // Get customer ID
    const customerId = await getStripeCustomerId(userId);
    
    // In a real implementation, you would cancel the subscription with Stripe
    // For now, we'll return success
    
    res.json({ success: true, canceledAt: atPeriodEnd ? 'period_end' : 'now' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Update subscription
router.post('/update', jwtCheck, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.auth.payload.sub;
    
    // Get customer ID
    const customerId = await getStripeCustomerId(userId);
    
    // In a real implementation, you would update the subscription with Stripe
    // For now, we'll return success
    
    res.json({ success: true, updatedPlanId: planId });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Get usage data
router.get('/usage', jwtCheck, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    
    // In a real implementation, you would fetch usage data from your database
    // For now, we'll use mock data
    const mockUsage = {
      used: 150,
      total: 1000,
      resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    res.json(mockUsage);
  } catch (error) {
    console.error('Error getting usage data:', error);
    res.status(500).json({ error: 'Failed to get usage data' });
  }
});

// Get invoice history
router.get('/invoices', jwtCheck, async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    
    // Get customer ID
    const customerId = await getStripeCustomerId(userId);
    
    // In a real implementation, you would fetch invoices from Stripe
    // For now, we'll use mock data
    const mockInvoices = [
      {
        id: 'in_mock_1',
        amount_paid: 1999,
        currency: 'usd',
        status: 'paid',
        created: Date.now() - 30 * 24 * 60 * 60 * 1000,
        period_start: Date.now() - 30 * 24 * 60 * 60 * 1000,
        period_end: Date.now(),
        lines: {
          data: [
            {
              description: 'Standard Plan',
              amount: 1999,
              period: {
                start: Date.now() - 30 * 24 * 60 * 60 * 1000,
                end: Date.now()
              }
            }
          ]
        }
      },
      {
        id: 'in_mock_2',
        amount_paid: 1999,
        currency: 'usd',
        status: 'paid',
        created: Date.now() - 60 * 24 * 60 * 60 * 1000,
        period_start: Date.now() - 60 * 24 * 60 * 60 * 1000,
        period_end: Date.now() - 30 * 24 * 60 * 60 * 1000,
        lines: {
          data: [
            {
              description: 'Standard Plan',
              amount: 1999,
              period: {
                start: Date.now() - 60 * 24 * 60 * 60 * 1000,
                end: Date.now() - 30 * 24 * 60 * 60 * 1000
              }
            }
          ]
        }
      }
    ];
    
    res.json(mockInvoices);
  } catch (error) {
    console.error('Error getting invoice history:', error);
    res.status(500).json({ error: 'Failed to get invoice history' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

// Create a Stripe Customer Portal session
router.post('/create-customer-portal-session', async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { customerId, returnUrl } = req.body;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({ error: 'Failed to create customer portal session' });
  }
});

  console.log('Verified Stripe webhook event:', event.type);

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Checkout session completed:', event.data.object.id);
      try {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const userId = `user_for_${customerId}`; // TODO: Map Stripe customer ID to your user ID
        await updateUserSubscription(userId, 'active', subscriptionId);
      } catch (err) {
        console.error('Error updating subscription after checkout:', err);
      }
      break;
    case 'invoice.payment_succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription canceled:', event.data.object.id);
      try {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const subscriptionId = subscription.id;
        const userId = `user_for_${customerId}`; // TODO: Map Stripe customer ID to your user ID
        await updateUserSubscription(userId, 'canceled', subscriptionId);
      } catch (err) {
        console.error('Error updating subscription after cancelation:', err);
      }
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).send();
});

module.exports = router;
