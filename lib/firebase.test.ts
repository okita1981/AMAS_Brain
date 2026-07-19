import { beforeEach, describe, expect, it, vi } from 'vitest';

const initializeApp = vi.fn();
const certFn = vi.fn((sa: unknown) => sa);
const appFn = vi.fn(() => ({ name: '[DEFAULT]' }));
const storageFn = vi.fn(() => ({ __isStorage: true }));
const getFirestoreMock = vi.fn(() => ({ __isFirestore: true }));

let mockAppsLength = 0;

const EXPECTED_PROJECT_ID = 'gen-lang-client-0384277006';
const NAMED_DATABASE_ID = 'ai-studio-449e39ee-b303-411e-af3a-a74c5ccb0886';

function validServiceAccount(projectId: string = EXPECTED_PROJECT_ID) {
  return JSON.stringify({
    project_id: projectId,
    client_email: 'svc@example.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nFAKE-NOT-A-REAL-KEY\n-----END PRIVATE KEY-----\n',
  });
}

// firebase-admin is mocked wholesale: no real Firebase project, credential,
// or network call is ever touched by this test file.
vi.mock('firebase-admin', () => ({
  default: {
    get apps() {
      return { length: mockAppsLength };
    },
    initializeApp: (...args: unknown[]) => {
      mockAppsLength = 1;
      return initializeApp(...args);
    },
    credential: { cert: certFn },
    app: appFn,
    storage: storageFn,
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: getFirestoreMock,
}));

vi.mock('../firebase-applet-config.json', () => ({
  default: {
    projectId: EXPECTED_PROJECT_ID,
    firestoreDatabaseId: NAMED_DATABASE_ID,
  },
}));

async function loadFirebaseModule() {
  vi.resetModules();
  return import('./firebase');
}

describe('lib/firebase.ts', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockAppsLength = 0;
    initializeApp.mockReset();
    certFn.mockClear();
    appFn.mockReset();
    appFn.mockReturnValue({ name: '[DEFAULT]' });
    storageFn.mockReset();
    storageFn.mockReturnValue({ __isStorage: true });
    getFirestoreMock.mockReset();
    getFirestoreMock.mockReturnValue({ __isFirestore: true });
    process.env = { ...originalEnv };
  });

  it('1. initializes when the service account project_id matches the configured project', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = validServiceAccount();
    const mod = await loadFirebaseModule();
    expect(mod.db).toEqual({ __isFirestore: true });
    expect(initializeApp).toHaveBeenCalledTimes(1);
  });

  it('2. fails fast when the service account project_id does not match the client project', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = validServiceAccount('some-other-project');
    await expect(loadFirebaseModule()).rejects.toThrow(/mismatch/i);
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('3. connects to the named database id, not a hardcoded value', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = validServiceAccount();
    await loadFirebaseModule();
    expect(getFirestoreMock).toHaveBeenCalledWith({ name: '[DEFAULT]' }, NAMED_DATABASE_ID);
  });

  it('4. throws rather than silently falling back to (default) when firestoreDatabaseId is missing from config', async () => {
    vi.resetModules();
    vi.doMock('../firebase-applet-config.json', () => ({
      default: { projectId: EXPECTED_PROJECT_ID },
    }));
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = validServiceAccount();
    await expect(import('./firebase')).rejects.toThrow(/firestoreDatabaseId/i);
    expect(getFirestoreMock).not.toHaveBeenCalledWith(expect.anything(), '(default)');
    vi.doUnmock('../firebase-applet-config.json');
  });

  it('5. rejects when FIREBASE_SERVICE_ACCOUNT_KEY is not set', async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    await expect(loadFirebaseModule()).rejects.toThrow(/not set/i);
  });

  it('6. rejects an empty string value', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = '';
    await expect(loadFirebaseModule()).rejects.toThrow(/not set/i);
  });

  it('7. rejects invalid JSON', async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = '{not valid json';
    await expect(loadFirebaseModule()).rejects.toThrow(/not valid JSON/i);
  });

  it('8. never includes the service account body in a thrown error message', async () => {
    const secretMarker = 'THIS_IS_A_FAKE_PRIVATE_KEY_MARKER_NOT_A_REAL_SECRET';
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      project_id: 'some-other-project',
      private_key: secretMarker,
      client_email: 'svc@example.iam.gserviceaccount.com',
    });
    let caught: Error | undefined;
    try {
      await loadFirebaseModule();
    } catch (err) {
      caught = err as Error;
    }
    expect(caught).toBeDefined();
    expect(caught!.message).not.toContain(secretMarker);
  });
});
