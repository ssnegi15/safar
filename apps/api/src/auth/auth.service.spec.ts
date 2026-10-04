import { AuthService } from './auth.service';
import type { AuthenticatedPrincipal, IdentityRepository } from './auth.types';

describe('AuthService', () => {
  it('resolves the personal tenant using only verified identity claims', async () => {
    const principal: AuthenticatedPrincipal = {
      subject: 'user-object-id',
      issuer: 'https://identity.example.test/tenant/v2.0',
      email: 'traveler@example.test',
      displayName: 'Asha Traveler',
    };
    const identityRepository: IdentityRepository = {
      getOrCreatePersonalIdentity: jest.fn().mockResolvedValue({
        id: principal.subject,
        email: principal.email,
        displayName: principal.displayName,
        tenant: {
          id: 'personal-server-assigned-id',
          name: "Asha Traveler's trips",
          type: 'personal',
          role: 'owner',
        },
      }),
    };
    const service = new AuthService(identityRepository);

    await expect(service.getCurrentUser(principal)).resolves.toMatchObject({
      id: 'user-object-id',
      tenant: {
        id: 'personal-server-assigned-id',
        role: 'owner',
      },
    });
    expect(identityRepository.getOrCreatePersonalIdentity).toHaveBeenCalledWith(principal);
  });
});
