/**
 * Checkout and payment routes for LARK
 * Handles creating checkout sessions and payment processing
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin}/dashboard?subscription=success`,
      cancel_url: cancelUrl || `${req.headers.origin}/pricing`,
    });
    
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.stripeCustomerId || !user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    // Cancel subscription in Stripe
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true
    });
    
    // Update subscription in MongoDB
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: user.subscriptionId },
      { cancelAtPeriodEnd: true }
    );
    
    res.json({ success: true, message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
