import { beforeEach, describe, expect, it, vi } from 'vitest';

const getIdToken = vi.fn();
let currentUser: { getIdToken: typeof getIdToken } | null = null;

// src/firebase.ts initializes a real Firebase app on import; mock it wholesale
// so tests never touch a real project or network.
vi.mock('../firebase', () => ({
  auth: {
    get currentUser() {
      return currentUser;
    },
  },
}));

import { apiFetch, ApiAuthError } from './apiClient';

describe('apiFetch', () => {
  beforeEach(() => {
    currentUser = null;
    getIdToken.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('throws ApiAuthError and never calls fetch when not logged in', async () => {
    await expect(apiFetch('/api/foo')).rejects.toThrow(ApiAuthError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls getIdToken when a user is signed in', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValue('id-token-abc');
    (fetch as any).mockResolvedValue(new Response('ok'));

    await apiFetch('/api/foo');

    expect(getIdToken).toHaveBeenCalledTimes(1);
  });

  it('attaches the Authorization header with the fetched token', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValue('id-token-abc');
    (fetch as any).mockResolvedValue(new Response('ok'));

    await apiFetch('/api/foo');

    const [, init] = (fetch as any).mock.calls[0];
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer id-token-abc');
  });

  it('preserves existing headers such as Content-Type', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValue('id-token-abc');
    (fetch as any).mockResolvedValue(new Response('ok'));

    await apiFetch('/api/foo', { headers: { 'Content-Type': 'application/json' } });

    const [, init] = (fetch as any).mock.calls[0];
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer id-token-abc');
  });

  it('passes method/body/other options through to fetch unchanged', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValue('id-token-abc');
    (fetch as any).mockResolvedValue(new Response('ok'));
    const body = JSON.stringify({ a: 1 });

    await apiFetch('/api/foo', { method: 'POST', body, credentials: 'include' });

    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('/api/foo');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(body);
    expect(init.credentials).toBe('include');
  });

  it('returns the fetch Response unchanged', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValue('id-token-abc');
    const fakeResponse = new Response('hello');
    (fetch as any).mockResolvedValue(fakeResponse);

    const result = await apiFetch('/api/foo');

    expect(result).toBe(fakeResponse);
  });
});
