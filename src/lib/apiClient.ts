import { auth } from '../firebase';

export class ApiAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

// Thin wrapper around fetch that attaches a Firebase ID token as a Bearer
// Authorization header. Does not alter method/body/other init options, and
// returns the fetch Response unchanged. Throws ApiAuthError instead of
// calling fetch when there is no signed-in user.
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new ApiAuthError('No authenticated user; cannot call API.');
  }

  const token = await user.getIdToken();

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
