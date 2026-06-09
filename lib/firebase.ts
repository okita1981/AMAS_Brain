import admin from 'firebase-admin';

// Vercel Functions warm-start: the module is reused between invocations, so
// initializeApp must be idempotent. `admin.apps.length` is `0` on cold start.
if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Paste the full service-account JSON into the Vercel project env var.'
    );
  }
  let serviceAccount: admin.ServiceAccount & { project_id?: string };
  try {
    serviceAccount = JSON.parse(raw);
  } catch (err: any) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ${err.message}`);
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || (serviceAccount as any).projectId,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      (serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined),
  });
}

export const db = admin.firestore();
export const storage = admin.storage();
export { admin };
