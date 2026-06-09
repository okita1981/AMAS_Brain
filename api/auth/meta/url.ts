import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../lib/firebase';
import { methodGuard } from '../../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'GET')) return;

  const { userId } = req.query;
  let appId = process.env.META_APP_ID;

  if (!appId && typeof userId === 'string' && userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        appId = userDoc.data()?.meta_app_id;
      }
    } catch (error) {
      console.error('Error fetching meta_app_id from Firestore:', error);
    }
  }

  if (!appId) {
    return res.json({ url: `${process.env.APP_URL}/auth/callback?provider=meta&code=mock_code` });
  }

  const redirectUri = `${process.env.APP_URL}/api/auth/meta/callback`;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'ads_management,ads_read,business_management',
  });

  res.json({ url: `https://www.facebook.com/v18.0/dialog/oauth?${params}` });
}
