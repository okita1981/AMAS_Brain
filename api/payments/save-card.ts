import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../../lib/stripe';
import { db } from '../../lib/firebase';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { userId, successUrl, cancelUrl } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }

  try {
    // 1. Create or get Stripe Customer
    let customerId: string | undefined;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (userData?.stripeCustomerId) {
      customerId = userData.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: userData?.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await db.collection('users').doc(userId).update({ stripeCustomerId: customerId });
    }

    // 2. Create a Stripe Checkout Session in 'setup' mode (Intent-based flow)
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      payment_method_types: ['card'],
      customer: customerId,
      success_url: successUrl || `${process.env.APP_URL}/wallet?setup_success=true`,
      cancel_url: cancelUrl || `${process.env.APP_URL}/wallet?setup_canceled=true`,
      metadata: { userId },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Save Card Error:', error);
    res.status(500).json({ error: error.message });
  }
}
