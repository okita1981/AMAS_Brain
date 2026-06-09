import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../lib/firebase';
import { methodGuard } from '../../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'GET')) return;

  const { userId } = req.query;
  let clientId = process.env.GOOGLE_ADS_CLIENT_ID;

  if (!clientId && typeof userId === 'string' && userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        clientId = userDoc.data()?.google_ads_client_id;
      }
    } catch (error) {
      console.error('Error fetching google_ads_client_id from Firestore:', error);
    }
  }

  if (!clientId) {
    // Simulator mode: return a mock URL
    return res.json({ url: `${process.env.APP_URL}/auth/callback?provider=google&code=mock_code` });
  }

  const redirectUri = `${process.env.APP_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}
