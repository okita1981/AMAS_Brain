import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/firebase';
import { methodGuard } from '../../lib/http';

// Vercel Functions cannot write to a persistent filesystem, so banner images
// are uploaded directly to Firebase Storage. The bucket name is resolved from
// FIREBASE_STORAGE_BUCKET, falling back to `<project_id>.appspot.com`
// (initialized in lib/firebase.ts).
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb', // banners run ~3MB at high quality
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'POST')) return;

  const { base64, userId, fileName } = req.body || {};
  if (!base64 || !userId) return res.status(400).send('Data and User ID required');

  try {
    const cleanBase64 = String(base64).replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const name = fileName || `img_${Date.now()}.png`;
    const objectPath = `uploads/${userId}/${name}`;

    const bucket = storage.bucket();
    const file = bucket.file(objectPath);
    await file.save(buffer, {
      contentType: 'image/png',
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });
    // makePublic() sets the object's ACL to public-read so we can serve the
    // canonical https://storage.googleapis.com/<bucket>/<path> URL without
    // having to issue signed URLs for every request.
    await file.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${objectPath}`;
    console.log(`[Storage] Image uploaded: ${url}`);

    res.json({ url });
  } catch (error: any) {
    console.error('[Storage] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}
