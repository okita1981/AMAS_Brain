import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../../lib/stripe';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { amount, userId, successUrl, cancelUrl } = req.body || {};

  let stripe;
  try {
    stripe = getStripe();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'AMAS 広告デポジット',
              description: '広告運用費用のデポジットチャージ',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.APP_URL}/wallet?success=true`,
      cancel_url: cancelUrl || `${process.env.APP_URL}/wallet?canceled=true`,
      metadata: {
        userId: userId,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: error.message });
  }
}
