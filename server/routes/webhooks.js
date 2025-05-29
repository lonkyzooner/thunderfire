/**
 * Webhook routes for LARK
 * Handles Stripe webhook events for subscription management
 */

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import models
const User = require('../../src/database/models/User');
const Subscription = require('../../src/database/models/Subscription');

// Special handling for Stripe webhooks (needs raw body)
router.use(bodyParser.raw({ type: 'application/json' }));

// Stripe webhook handler
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log(`Subscription ${subscription.id} was ${event.type.split('.')[2]}`);
      
      try {
        // Find the user with this Stripe customer ID
        const user = await User.findOne({ stripeCustomerId: subscription.customer });
        
        if (user) {
          // Get product details to determine the tier
          const productId = subscription.items.data[0].price.product;
          const product = await stripe.products.retrieve(productId);
          const tier = product.metadata.tier || 'basic';
          
          // Update user subscription details
          user.subscriptionId = subscription.id;
          user.subscriptionStatus = subscription.status;
          user.subscriptionTier = tier;
          
          // Update available features based on tier
          if (tier === 'premium') {
            user.features = [
              'miranda_rights_premium',
              'statute_lookup_premium',
              'report_assistant_premium',
              'threat_detection_premium',
              'tactical_feedback_premium'
            ];
          } else if (tier === 'pro') {
            user.features = [
              'miranda_rights_pro',
              'statute_lookup_pro',
              'report_assistant_pro',
              'threat_detection_basic',
              'tactical_feedback_basic'
            ];
          } else {
            user.features = [
              'miranda_rights_basic',
              'statute_lookup_basic'
            ];
          }
          
          await user.save();
          
          // Create or update subscription record
          const existingSubscription = await Subscription.findOne({ 
            stripeSubscriptionId: subscription.id 
          });
          
          if (existingSubscription) {
            existingSubscription.status = subscription.status;
            existingSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
            existingSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            existingSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
            await existingSubscription.save();
          } else {
            await Subscription.create({
              userId: user._id,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer,
              status: subscription.status,
              plan: tier,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              features: user.features
            });
          }
          
          console.log(`Updated subscription for user ${user.email}`);
        } else {
          console.log(`No user found with customer ID: ${subscription.customer}`);
        }
      } catch (err) {
        console.error('Error processing subscription webhook:', err);
      }
      break;
      
    case 'customer.subscription.deleted':
      try {
        const subscription = event.data.object;
        const user = await User.findOne({ stripeCustomerId: subscription.customer });
        
        if (user) {
          user.subscriptionStatus = 'canceled';
          user.features = ['miranda_rights_basic', 'statute_lookup_basic'];
          await user.save();
          
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            { 
              status: 'canceled',
              canceledAt: new Date()
            }
          );
          
          console.log(`Subscription canceled for user ${user.email}`);
        }
      } catch (err) {
        console.error('Error processing subscription deletion webhook:', err);
      }
      break;
      
    case 'invoice.payment_failed':
      try {
        const invoice = event.data.object;
        const user = await User.findOne({ stripeCustomerId: invoice.customer });
        
        if (user) {
          user.subscriptionStatus = 'past_due';
          await user.save();
          
          console.log(`Payment failed for user ${user.email}`);
        }
      } catch (err) {
        console.error('Error processing payment failure webhook:', err);
      }
      break;
      
    case 'invoice.payment_succeeded':
      try {
        const invoice = event.data.object;
        const user = await User.findOne({ stripeCustomerId: invoice.customer });
        
        if (user) {
          user.subscriptionStatus = 'active';
          await user.save();
          
          console.log(`Payment succeeded for user ${user.email}`);
        }
      } catch (err) {
        console.error('Error processing payment success webhook:', err);
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

module.exports = router;
