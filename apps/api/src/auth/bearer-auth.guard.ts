import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './authenticated-request';
import { FirebaseIdTokenVerifier } from './firebase-id-token.verifier';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(@Inject(FirebaseIdTokenVerifier) private readonly verifier: FirebaseIdTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    if (!match?.[1]) {
      throw new UnauthorizedException('Bearer access token required');
    }

    request.principal = await this.verifier.verify(match[1]);
    return true;
  }
}
