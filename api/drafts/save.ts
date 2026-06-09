import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/firebase';
import { methodGuard } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { userId, name, status, wizardData } = req.body || {};
  if (typeof userId !== 'string' || !userId) {
    return res.status(400).json({ error: 'userId is required.', code: 'BAD_REQUEST' });
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name is required.', code: 'BAD_REQUEST' });
  }
  if (typeof wizardData !== 'string') {
    return res.status(400).json({ error: 'wizardData must be a JSON string.', code: 'BAD_REQUEST' });
  }
  const normalizedStatus: 'draft' | 'completed' = status === 'completed' ? 'completed' : 'draft';
  const cleanName = name.trim();
  const now = Date.now();

  try {
    // upsert by (userId, name)
    const existingSnap = await db
      .collection('drafts')
      .where('userId', '==', userId)
      .where('name', '==', cleanName)
      .limit(1)
      .get();

    let docId: string;
    let createdAt: number;
    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0];
      docId = existing.id;
      createdAt = (existing.data().createdAt as number) || now;
      await existing.ref.update({ status: normalizedStatus, wizardData, updatedAt: now });
    } else {
      const newRef = await db.collection('drafts').add({
        userId,
        name: cleanName,
        status: normalizedStatus,
        wizardData,
        createdAt: now,
        updatedAt: now,
      });
      docId = newRef.id;
      createdAt = now;
    }

    res.json({
      id: docId,
      userId,
      name: cleanName,
      status: normalizedStatus,
      createdAt,
      updatedAt: now,
    });
  } catch (error: any) {
    console.error('[/api/drafts/save] error:', error);
    res.status(500).json({ error: error?.message || 'Failed to save draft', code: 'DRAFT_SAVE_ERROR' });
  }
}
