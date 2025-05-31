import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan, orgId, userId, email } = req.body;

  if (!plan || !orgId || !userId || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Define your Stripe price IDs for each plan
    const priceIds = {
      basic: process.env.STRIPE_PRICE_ID_BASIC,
      pro: process.env.STRIPE_PRICE_ID_PRO,
      enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE
    };

    const priceId = priceIds[plan];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      metadata: {
        orgId,
        userId
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create Stripe Checkout session', details: err.message });
  }
}