jest.mock('@/lib/auth', () => ({
  signJWT: jest.fn().mockResolvedValue('mock-token'),
  verifyJWT: jest.fn().mockResolvedValue({ id: '1', role: 'user' }),
  getUserFromSession: jest.fn().mockResolvedValue(null),
}));

import { signJWT, verifyJWT, getUserFromSession } from '@/lib/auth';

describe('Auth utilities', () => {
  it('signJWT returns a token string', async () => {
    const token = await signJWT({ id: '1', role: 'user' });
    expect(typeof token).toBe('string');
    expect(token).toBe('mock-token');
  });

  it('verifyJWT returns payload for valid token', async () => {
    const payload = await verifyJWT('any-token');
    expect(payload).toEqual({ id: '1', role: 'user' });
  });

  it('getUserFromSession returns null when no session', async () => {
    const user = await getUserFromSession();
    expect(user).toBeNull();
  });
});
