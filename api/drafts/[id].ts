import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id;
  if (typeof id !== 'string' || !id) {
    return res.status(400).json({ error: 'id is required.', code: 'BAD_REQUEST' });
  }

  if (req.method === 'GET') {
    try {
      const doc = await db.collection('drafts').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Draft not found', code: 'DRAFT_NOT_FOUND' });
      }
      const d = doc.data() || {};
      return res.json({
        id: doc.id,
        userId: d.userId,
        name: d.name,
        status: d.status,
        wizardData: d.wizardData,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      });
    } catch (error: any) {
      console.error('[/api/drafts/:id GET] error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to get draft', code: 'DRAFT_GET_ERROR' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await db.collection('drafts').doc(id).delete();
      return res.status(204).send('');
    } catch (error: any) {
      console.error('[/api/drafts/:id DELETE] error:', error);
      return res.status(500).json({ error: error?.message || 'Failed to delete draft', code: 'DRAFT_DELETE_ERROR' });
    }
  }

  res.setHeader('Allow', 'GET, DELETE');
  res.status(405).json({ error: `Method ${req.method} not allowed`, code: 'METHOD_NOT_ALLOWED' });
}
