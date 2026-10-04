export type AuthenticatedPrincipal = {
  subject: string;
  issuer: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
};

export type AuthenticatedUser = {
  id: string;
  email?: string;
  displayName: string;
  tenant: {
    id: string;
    name: string;
    type: 'personal';
    role: 'owner';
  };
};

export interface IdentityRepository {
  getOrCreatePersonalIdentity(principal: AuthenticatedPrincipal): Promise<AuthenticatedUser>;
}
