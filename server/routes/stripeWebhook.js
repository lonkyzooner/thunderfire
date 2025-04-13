const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');

// Supabase client setup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);


const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
      console.log('Subscription updated or created:', event.data.object.id);
      // Update subscription status in Supabase
      (async () => {
        const customerId = event.data.object.customer;
        const status = event.data.object.status;
        const tier = event.data.object.items?.data[0]?.price?.nickname || null;
        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_tier: tier
          })
          .eq('stripe_customer_id', customerId);
      })();

      // TODO: Update subscription status in your database
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription canceled:', event.data.object.id);
      // Mark subscription as canceled in Supabase
      (async () => {
        const customerId = event.data.object.customer;
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            subscription_tier: null
          })
          .eq('stripe_customer_id', customerId);
      })();

      // TODO: Mark subscription as canceled in your database
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed for invoice:', event.data.object.id);
      // TODO: Notify user or flag account
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;