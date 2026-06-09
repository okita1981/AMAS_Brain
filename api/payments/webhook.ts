import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getStripe } from '../../lib/stripe';
import { db } from '../../lib/firebase';
import { readRawBody, methodGuard } from '../../lib/http';

// Stripe signature verification needs the raw request bytes, so disable the
// default body parser for this route only.
export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const sig = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured.');
    return res.status(500).send('Webhook Secret missing');
  }
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  const stripe = getStripe();
  const rawBody = await readRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    // Card-saving flow: Checkout Session in 'setup' mode.
    if (session.mode === 'setup' && userId) {
      try {
        const setupIntentId = typeof session.setup_intent === 'string'
          ? session.setup_intent
          : session.setup_intent?.id;

        if (setupIntentId) {
          const setupIntent = await stripe.setupIntents.retrieve(setupIntentId, {
            expand: ['payment_method'],
          });
          const pm = setupIntent.payment_method as Stripe.PaymentMethod | null;

          if (pm && pm.card) {
            const newPaymentMethod = {
              id: pm.id,
              type: 'card',
              last4: pm.card.last4,
              brand: pm.card.brand,
              expiryMonth: pm.card.exp_month,
              expiryYear: pm.card.exp_year,
              isDefault: true,
              cardHolder: pm.billing_details?.name || '',
              stripeCustomerId: typeof pm.customer === 'string' ? pm.customer : pm.customer?.id,
            };

            const walletRef = db.collection('wallets').doc(userId);
            const walletDoc = await walletRef.get();
            const walletData = walletDoc.data() || {};
            const currentMethods = walletData.paymentMethods || [];
            const updatedMethods = currentMethods
              .filter((m: any) => m.id !== newPaymentMethod.id)
              .map((m: any) => ({ ...m, isDefault: false }));
            updatedMethods.push(newPaymentMethod);

            await walletRef.set({ paymentMethods: updatedMethods }, { merge: true });
            console.log(`PaymentMethod ${pm.id} saved for user ${userId}`);
          }
        }
      } catch (err) {
        console.error('Error persisting saved card from setup session:', err);
      }

      return res.json({ received: true });
    }

    const amount = session.amount_total || 0;

    if (userId) {
      try {
        const walletRef = db.collection('wallets').doc(userId);
        const transactionRef = db.collection('transactions').doc();

        // 10% tax included in the amount (e.g. 55000 -> 50000 budget, 5000 tax)
        const tax = Math.floor(amount / 11);
        const net = amount - tax;

        await db.runTransaction(async (t) => {
          const walletDoc = await t.get(walletRef);
          const data = walletDoc.data() || {};

          const currentTotal = data.balance_total || 0;
          const currentBudget = data.balance_ad_budget || 0;
          const currentTax = data.tax_holding || 0;

          t.set(walletRef, {
            balance_total: currentTotal + amount,
            balance_ad_budget: currentBudget + net,
            tax_holding: currentTax + tax,
            status: 'active',
            lastResetAt: Date.now(),
            ...(walletDoc.exists ? {} : {
              autoChargeEnabled: false,
              autoChargeThreshold: 10000,
              autoChargeAmount: 55000,
            }),
          }, { merge: true });

          t.set(transactionRef, {
            id: transactionRef.id,
            userUid: userId,
            amount: amount,
            net_amount: net,
            tax_amount: tax,
            type: 'credit_card',
            status: 'completed',
            timestamp: Date.now(),
            stripeSessionId: session.id,
          });
        });

        console.log(`Wallet updated for user ${userId}: Total +${amount}, Budget +${net}, Tax +${tax}`);
      } catch (error) {
        console.error('Error updating wallet:', error);
      }
    }
  }

  res.json({ received: true });
}
