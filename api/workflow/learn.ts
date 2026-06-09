import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/firebase';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { userId, insight } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required.' });
  if (typeof insight !== 'string' || insight.trim().length === 0) {
    return res.status(400).json({ error: 'insight is required and must be a non-empty string.' });
  }
  if (insight.length > 10000) {
    return res.status(400).json({ error: 'insight is too long (max 10000 chars).' });
  }

  try {
    const docRef = await db
      .collection('organizations')
      .doc(userId)
      .collection('knowledge')
      .add({
        insight: insight.trim(),
        createdAt: Date.now(),
        source: 'workflow.learn',
      });

    res.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('[workflow/learn] error:', error);
    res.status(500).json({ error: error.message });
  }
}
