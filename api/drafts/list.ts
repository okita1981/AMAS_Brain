import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/firebase';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'GET')) return;

  const userId = req.query.userId;
  if (typeof userId !== 'string' || !userId) {
    return res.status(400).json({ error: 'userId query param is required.', code: 'BAD_REQUEST' });
  }
  try {
    const snap = await db
      .collection('drafts')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();
    const drafts = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        userId: d.userId,
        name: d.name,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });
    res.json({ drafts });
  } catch (error: any) {
    console.error('[/api/drafts/list] error:', error);
    const isIndexError = typeof error?.message === 'string' && error.message.includes('requires an index');
    res.status(500).json({
      error: error?.message || 'Failed to list drafts',
      code: 'DRAFT_LIST_ERROR',
      hint: isIndexError
        ? 'Firestoreで drafts(userId asc, updatedAt desc) の複合インデックスを作成してください。'
        : undefined,
    });
  }
}
