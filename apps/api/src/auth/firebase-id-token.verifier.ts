import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AppConfig } from '../config';
import { AUTH_CONFIG } from './auth.tokens';
import type { AuthenticatedPrincipal } from './auth.types';

const FIREBASE_APP_NAME = 'safar-api';
const INVALID_TOKEN_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/invalid-id-token',
]);

@Injectable()
export class FirebaseIdTokenVerifier {
  private readonly auth: ReturnType<typeof getAuth>;

  constructor(@Inject(AUTH_CONFIG) config: AppConfig['firebase']) {
    const existingApp = getApps().find((app) => app.name === FIREBASE_APP_NAME);
    const app =
      existingApp ??
      initializeApp(
        {
          projectId: config.projectId,
          ...(config.authEmulatorHost ? {} : { credential: applicationDefault() }),
        },
        FIREBASE_APP_NAME,
      );
    this.auth = getAuth(app);
  }

  async verify(idToken: string): Promise<AuthenticatedPrincipal> {
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await this.auth.verifyIdToken(idToken);
    } catch (error) {
      const code = this.errorCode(error);
      if (code && INVALID_TOKEN_CODES.has(code)) {
        throw new UnauthorizedException('Access token is invalid or expired');
      }
      throw new ServiceUnavailableException('Identity provider is temporarily unavailable');
    }

    return this.toPrincipal(decodedToken);
  }

  private toPrincipal(token: DecodedIdToken): AuthenticatedPrincipal {
    if (!token.uid || !token.iss) {
      throw new UnauthorizedException('Access token is missing required identity claims');
    }
    return {
      subject: token.uid,
      issuer: token.iss,
      ...(token.email ? { email: token.email } : {}),
      emailVerified: token.email_verified === true,
      ...(token.name ? { displayName: token.name } : {}),
    };
  }

  private errorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
    return typeof error.code === 'string' ? error.code : undefined;
  }
}
