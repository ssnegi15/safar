import { isAdminPrincipal } from './admin-auth.guard';
import type { AuthenticatedPrincipal } from './auth.types';

describe('isAdminPrincipal', () => {
  const allowlist = ['admin@example.test'];
  const principal: AuthenticatedPrincipal = {
    subject: 'verified-user',
    issuer: 'https://issuer.example.test',
    email: 'ADMIN@example.test',
    emailVerified: true,
  };

  it('matches allowlisted emails case-insensitively after email verification', () => {
    expect(isAdminPrincipal(principal, allowlist)).toBe(true);
  });

  it('does not grant admin access for unverified or unlisted addresses', () => {
    expect(isAdminPrincipal({ ...principal, emailVerified: false }, allowlist)).toBe(false);
    expect(isAdminPrincipal({ ...principal, email: 'other@example.test' }, allowlist)).toBe(false);
    expect(isAdminPrincipal(principal, [])).toBe(false);
  });
});
