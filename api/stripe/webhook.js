import Stripe from 'stripe';
import { buffer } from 'micro';
import connectDB from '../../src/database/connection';
import User from '../../src/database/models/User';
import Org from '../../src/database/models/Org';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
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
      }
      break;
    }
    // Add more event types as needed
    default:
      // Unexpected event type
      break;
  }

  res.status(200).json({ received: true });
}