import type { VercelRequest } from '@vercel/node';
import { admin } from './firebase';

// Identity derived from a verified Firebase ID token. Never populated from
// client-supplied body/query values.
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role?: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const BEARER_PREFIX = 'Bearer ';

function extractBearerToken(req: VercelRequest): string {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') {
    throw new AuthError('Missing Authorization header');
  }
  if (!header.startsWith(BEARER_PREFIX)) {
    throw new AuthError('Authorization header must use the Bearer scheme');
  }
  const token = header.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    throw new AuthError('Missing bearer token');
  }
  return token;
}

// Verifies the request's Firebase ID token and returns the identity it
// carries. Throws AuthError on any missing/malformed/invalid/expired token.
// Callers must use the returned uid, not req.body.userId or req.query.userId.
export async function requireAuth(req: VercelRequest): Promise<AuthenticatedUser> {
  const token = extractBearerToken(req);

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err: any) {
    throw new AuthError(`Invalid or expired token: ${err?.message || 'verification failed'}`);
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    role: (decoded as Record<string, unknown>).role as string | undefined,
  };
}
