import type { Request } from 'express';
import type { AuthenticatedPrincipal } from './auth.types';

export type AuthenticatedRequest = Request & {
  principal?: AuthenticatedPrincipal;
};
