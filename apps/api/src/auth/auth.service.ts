import { Inject, Injectable } from '@nestjs/common';
import { IDENTITY_REPOSITORY } from './auth.tokens';
import type { AuthenticatedPrincipal, AuthenticatedUser, IdentityRepository } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
  ) {}

  getCurrentUser(principal: AuthenticatedPrincipal): Promise<AuthenticatedUser> {
    return this.identityRepository.getOrCreatePersonalIdentity(principal);
  }
}
