import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/firebase';
import { methodGuard } from '../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { userId, provider, accountId } = req.body || {};
  if (!userId) return res.status(400).send('User ID required');

  try {
    const userRef = db.collection('users').doc(userId);
    const tokenRef = db.collection('users').doc(userId).collection('tokens').doc(provider);

    console.log(`[OAuth] Connecting ${provider} account for user ${userId}...`);

    const updateData: any = {};
    if (provider === 'google') {
      updateData.google_ads_connected = true;
      updateData.google_ad_account_id = accountId || `G-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    } else if (provider === 'meta') {
      updateData.meta_ads_connected = true;
      updateData.meta_ad_account_id = accountId || `ACT_${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
    }

    await userRef.update(updateData);

    // Simulate saving tokens
    await tokenRef.set({
      access_token: `sim_access_${Math.random().toString(36).substr(2)}`,
      refresh_token: `sim_refresh_${Math.random().toString(36).substr(2)}`,
      expires_at: Date.now() + 3600000,
      updated_at: Date.now(),
    });

    res.json({
      success: true,
      ...updateData,
      mode: process.env.GOOGLE_ADS_CLIENT_ID ? 'production' : 'simulator',
    });
  } catch (error) {
    console.error('Error connecting accounts:', error);
    res.status(500).send('Connection failed');
  }
}
