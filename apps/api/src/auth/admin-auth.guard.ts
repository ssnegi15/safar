import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { APP_CONFIG } from './auth.tokens';
import type { AuthenticatedRequest } from './authenticated-request';
import type { AuthenticatedPrincipal } from './auth.types';
import type { AppConfig } from '../config';

export function isAdminPrincipal(
  principal: AuthenticatedPrincipal,
  adminEmails: string[],
): boolean {
  return Boolean(
    principal.email &&
      principal.emailVerified &&
      adminEmails.includes(principal.email.trim().toLowerCase()),
  );
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.principal || !isAdminPrincipal(request.principal, this.config.adminEmails)) {
      throw new ForbiddenException('Admin access is required');
    }
    return true;
  }
}
