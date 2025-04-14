const Stripe = require('stripe');
const { buffer } = require('micro');
const connectDB = require('../../src/database/connection');
const User = require('../../src/database/models/User');
const Org = require('../../src/database/models/Org');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

// Supabase client setup
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

module.exports.config = {
  api: {
    bodyParser: false
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const reqBuffer = await buffer(req);
    event = stripe.webhooks.constructEvent(
      reqBuffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  await connectDB();

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { orgId, userId } = session.metadata || {};
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Update user/org with Stripe customer/subscription IDs and set subscription as active
      if (orgId) {
        await Org.findByIdAndUpdate(orgId, {
          $set: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active'
          }
        });
      }
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          $set: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active'
          }
        });
        // Also update Supabase profile
        if (customerId) {
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active'
            })
            .eq('id', userId);
        }
      }
      break;
    }
    case 'invoice.payment_failed': {
      // Handle failed payment (optional: set subscriptionStatus to 'past_due' or 'canceled')
      break;
    }
    case 'customer.subscription.deleted': {
      // Handle subscription cancellation
      const subscription = event.data.object;
      const { orgId, userId } = subscription.metadata || {};
      if (orgId) {
        await Org.findByIdAndUpdate(orgId, {
          $set: { subscriptionStatus: 'canceled' }
        });
      }
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          $set: { subscriptionStatus: 'canceled' }
        });
        // Also update Supabase profile
        await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled' })
          .eq('id', userId);
      }
      break;
    }
    // Add more event types as needed
    default:
      // Unexpected event type
      break;
  }

  res.status(200).json({ received: true });
};