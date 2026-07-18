import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest } from '@vercel/node';

const verifyIdToken = vi.fn();

// Admin SDK is never hit in these tests; lib/firebase.ts is mocked wholesale
// so importing lib/auth.ts does not require FIREBASE_SERVICE_ACCOUNT_KEY.
vi.mock('./firebase', () => ({
  admin: {
    auth: () => ({ verifyIdToken }),
  },
}));

import { requireAuth, AuthError } from './auth';

function makeReq(
  headers: Record<string, string | string[] | undefined>,
  body: unknown = {},
  query: Record<string, unknown> = {}
): VercelRequest {
  return { headers, body, query } as unknown as VercelRequest;
}

describe('requireAuth', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it('rejects when the Authorization header is missing', async () => {
    await expect(requireAuth(makeReq({}))).rejects.toThrow(AuthError);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer scheme', async () => {
    await expect(requireAuth(makeReq({ authorization: 'Basic dXNlcjpwYXNz' }))).rejects.toThrow(AuthError);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects an empty bearer token', async () => {
    await expect(requireAuth(makeReq({ authorization: 'Bearer ' }))).rejects.toThrow(AuthError);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('returns the verified uid when verifyIdToken succeeds', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'user-123', email: 'user@example.com' });
    const result = await requireAuth(makeReq({ authorization: 'Bearer valid-token' }));
    expect(result.uid).toBe('user-123');
    expect(result.email).toBe('user@example.com');
    expect(verifyIdToken).toHaveBeenCalledWith('valid-token');
  });

  it('rejects when verifyIdToken throws (invalid/expired token)', async () => {
    verifyIdToken.mockRejectedValue(new Error('Firebase ID token has expired'));
    await expect(requireAuth(makeReq({ authorization: 'Bearer stale-token' }))).rejects.toThrow(AuthError);
  });

  it('never trusts body.userId or query.userId as identity', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'real-uid-from-token' });
    const req = makeReq(
      { authorization: 'Bearer valid-token' },
      { userId: 'attacker-supplied-uid' },
      { userId: 'attacker-supplied-uid-in-query' }
    );
    const result = await requireAuth(req);
    expect(result.uid).toBe('real-uid-from-token');
    expect(result.uid).not.toBe('attacker-supplied-uid');
    expect(result.uid).not.toBe('attacker-supplied-uid-in-query');
  });
});
