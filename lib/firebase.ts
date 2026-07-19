import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

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

  // Fail fast if the service account was issued for a different Firebase
  // project than the one the client app (firebase-applet-config.json) talks
  // to. A silent mismatch here means server-side writes go to a project the
  // client never reads from. project_id is not a secret; safe to include in
  // the error message.
  const actualProjectId = serviceAccount.project_id || (serviceAccount as any).projectId;
  if (actualProjectId !== firebaseConfig.projectId) {
    throw new Error(
      `Firebase project mismatch: service account targets project "${actualProjectId}", ` +
        `but the app is configured for "${firebaseConfig.projectId}" (firebase-applet-config.json). Refusing to initialize.`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: actualProjectId,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      (actualProjectId ? `${actualProjectId}.appspot.com` : undefined),
  });
}

// firebase-applet-config.json is the single source of truth for the Firestore
// database id, shared with the client (src/firebase.ts). Never hardcode this
// value a second time, and never fall back to `(default)` if it's missing —
// that would silently point the Admin SDK at the wrong database.
if (!firebaseConfig.firestoreDatabaseId) {
  throw new Error(
    'firebase-applet-config.json is missing firestoreDatabaseId. Refusing to fall back to the (default) Firestore database.'
  );
}

export const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
export const storage = admin.storage();
export { admin };
